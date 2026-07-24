
-- 1. Harden admin_notify_dispatch_log
ALTER TABLE public.admin_notify_dispatch_log
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS requester_fingerprint text;

-- Drop any check constraint then add current one (idempotent)
ALTER TABLE public.admin_notify_dispatch_log
  DROP CONSTRAINT IF EXISTS admin_notify_dispatch_log_status_check;
ALTER TABLE public.admin_notify_dispatch_log
  ADD CONSTRAINT admin_notify_dispatch_log_status_check
  CHECK (status IN ('pending','sent','failed'));

-- Purge any previously stored raw IPs
UPDATE public.admin_notify_dispatch_log
SET requester_ip = NULL
WHERE requester_ip IS NOT NULL;

CREATE INDEX IF NOT EXISTS admin_notify_dispatch_log_fp_created_idx
  ON public.admin_notify_dispatch_log (requester_fingerprint, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notify_dispatch_log_kind_created_idx
  ON public.admin_notify_dispatch_log (kind, created_at DESC);

-- Claim/retry helper
CREATE OR REPLACE FUNCTION public.claim_admin_dispatch(
  p_key text,
  p_kind text,
  p_subject_id text,
  p_fingerprint text
) RETURNS TABLE(claimed boolean, current_status text, attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.admin_notify_dispatch_log%ROWTYPE;
BEGIN
  INSERT INTO public.admin_notify_dispatch_log
    (idempotency_key, kind, subject_id, requester_fingerprint, status, attempt_count)
  VALUES (p_key, p_kind, p_subject_id, p_fingerprint, 'pending', 1)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_row.status, v_row.attempt_count;
    RETURN;
  END IF;

  UPDATE public.admin_notify_dispatch_log
  SET status = 'pending',
      attempt_count = attempt_count + 1,
      error_code = NULL,
      completed_at = NULL
  WHERE idempotency_key = p_key
    AND status = 'failed'
    AND attempt_count < 3
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_row.status, v_row.attempt_count;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM public.admin_notify_dispatch_log WHERE idempotency_key = p_key;
  RETURN QUERY SELECT false, COALESCE(v_row.status,'unknown'), COALESCE(v_row.attempt_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_dispatch(text,text,text,text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.finalize_admin_dispatch(
  p_key text,
  p_success boolean,
  p_error_code text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.admin_notify_dispatch_log
  SET status = CASE WHEN p_success THEN 'sent' ELSE 'failed' END,
      completed_at = now(),
      error_code = CASE WHEN p_success THEN NULL ELSE left(COALESCE(p_error_code,'unknown'), 64) END
  WHERE idempotency_key = p_key;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_admin_dispatch(text,boolean,text) FROM public, anon, authenticated;

-- 2. admin_messages
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_type text NOT NULL,
  recipient_id uuid NOT NULL,
  recipient_name text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL UNIQUE,
  provider_message_id text,
  sanitized_error_code text,
  sent_at timestamptz
);

ALTER TABLE public.admin_messages
  DROP CONSTRAINT IF EXISTS admin_messages_recipient_type_check;
ALTER TABLE public.admin_messages
  ADD CONSTRAINT admin_messages_recipient_type_check
  CHECK (recipient_type IN ('user','referral','demo','contact'));

ALTER TABLE public.admin_messages
  DROP CONSTRAINT IF EXISTS admin_messages_status_check;
ALTER TABLE public.admin_messages
  ADD CONSTRAINT admin_messages_status_check
  CHECK (status IN ('pending','queued','sent','failed','suppressed'));

GRANT SELECT ON public.admin_messages TO authenticated;
GRANT ALL ON public.admin_messages TO service_role;

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin messages" ON public.admin_messages;
CREATE POLICY "Admins can view admin messages" ON public.admin_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS admin_messages_created_at_idx ON public.admin_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_messages_status_idx ON public.admin_messages (status);
CREATE INDEX IF NOT EXISTS admin_messages_recipient_idx ON public.admin_messages (recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS admin_messages_created_by_idx ON public.admin_messages (created_by);

DROP TRIGGER IF EXISTS admin_messages_set_updated_at ON public.admin_messages;
CREATE TRIGGER admin_messages_set_updated_at
  BEFORE UPDATE ON public.admin_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. admin_email_activity RPC
CREATE OR REPLACE FUNCTION public.admin_email_activity(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL
) RETURNS TABLE(
  id uuid,
  created_at timestamptz,
  template_name text,
  recipient_email text,
  status text,
  has_error boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT l.id,
         l.created_at,
         l.template_name,
         l.recipient_email,
         l.status,
         (l.error_message IS NOT NULL AND btrim(l.error_message) <> '') AS has_error
  FROM public.email_send_log l
  WHERE (p_status IS NULL OR l.status = p_status)
  ORDER BY l.created_at DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_email_activity(integer,integer,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_email_activity(integer,integer,text) TO authenticated;


-- 1) admin_audit_log table (idempotent)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_desc_idx
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_created_idx
  ON public.admin_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_entity_created_idx
  ON public.admin_audit_log (entity_type, entity_id, created_at DESC);

-- Grants: admins read via RPC/select; no direct insert/update/delete from clients.
REVOKE ALL ON public.admin_audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT policy: admins only. No INSERT/UPDATE/DELETE policies -> immutable from clients.
DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) log_admin_action RPC
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action      text,
  p_entity_type text,
  p_entity_id   text DEFAULT NULL,
  p_summary     text DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  IF p_action IS NULL OR btrim(p_action) = '' THEN
    RAISE EXCEPTION 'action must be provided' USING ERRCODE = '22023';
  END IF;

  IF p_entity_type IS NULL OR btrim(p_entity_type) = '' THEN
    RAISE EXCEPTION 'entity_type must be provided' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, entity_type, entity_id, summary, metadata)
  VALUES (v_uid, btrim(p_action), btrim(p_entity_type), p_entity_id, p_summary, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, text, jsonb) TO authenticated;

-- 3) admin_system_health RPC
CREATE OR REPLACE FUNCTION public.admin_system_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_matching jsonb := jsonb_build_object('pending', 0, 'processing', 0, 'failed', 0, 'oldest_pending_at', NULL);
  v_outbox   jsonb := jsonb_build_object('pending', 0, 'failed', 0, 'oldest_pending_at', NULL);
  v_email    jsonb := jsonb_build_object('pending', 0, 'failed', 0, 'bounced', 0, 'complained', 0, 'dlq', 0, 'sent_last_24h', 0, 'last_issue_at', NULL);
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  -- matching queue (optional)
  IF to_regclass('public.match_job_queue') IS NOT NULL THEN
    BEGIN
      EXECUTE $q$
        SELECT jsonb_build_object(
          'pending',    COUNT(*) FILTER (WHERE status = 'pending'),
          'processing', COUNT(*) FILTER (WHERE status = 'processing'),
          'failed',     COUNT(*) FILTER (WHERE status = 'failed'),
          'oldest_pending_at', MIN(created_at) FILTER (WHERE status = 'pending')
        )
        FROM public.match_job_queue
      $q$ INTO v_matching;
    EXCEPTION WHEN OTHERS THEN
      v_matching := jsonb_build_object('pending', 0, 'processing', 0, 'failed', 0, 'oldest_pending_at', NULL);
    END;
  END IF;

  -- event outbox (optional)
  IF to_regclass('public.event_outbox') IS NOT NULL THEN
    BEGIN
      EXECUTE $q$
        SELECT jsonb_build_object(
          'pending', COUNT(*) FILTER (WHERE status = 'pending'),
          'failed',  COUNT(*) FILTER (WHERE status = 'failed'),
          'oldest_pending_at', MIN(created_at) FILTER (WHERE status = 'pending')
        )
        FROM public.event_outbox
      $q$ INTO v_outbox;
    EXCEPTION WHEN OTHERS THEN
      v_outbox := jsonb_build_object('pending', 0, 'failed', 0, 'oldest_pending_at', NULL);
    END;
  END IF;

  -- email send log (present)
  IF to_regclass('public.email_send_log') IS NOT NULL THEN
    BEGIN
      SELECT
        COUNT(*) FILTER (WHERE status IN ('pending','queued'))           AS pending,
        COUNT(*) FILTER (WHERE status IN ('failed','error'))             AS failed,
        COUNT(*) FILTER (WHERE status = 'bounced')                       AS bounced,
        COUNT(*) FILTER (WHERE status IN ('complained','complaint'))     AS complained,
        COUNT(*) FILTER (WHERE status = 'dlq')                           AS dlq,
        COUNT(*) FILTER (WHERE status IN ('sent','delivered') AND created_at > now() - interval '24 hours') AS sent_last_24h,
        MAX(created_at) FILTER (WHERE status IN ('failed','error','bounced','complained','complaint','dlq')) AS last_issue_at
      INTO r
      FROM public.email_send_log;

      v_email := jsonb_build_object(
        'pending',       COALESCE(r.pending, 0),
        'failed',        COALESCE(r.failed, 0),
        'bounced',       COALESCE(r.bounced, 0),
        'complained',    COALESCE(r.complained, 0),
        'dlq',           COALESCE(r.dlq, 0),
        'sent_last_24h', COALESCE(r.sent_last_24h, 0),
        'last_issue_at', r.last_issue_at
      );
    EXCEPTION WHEN OTHERS THEN
      v_email := jsonb_build_object('pending', 0, 'failed', 0, 'bounced', 0, 'complained', 0, 'dlq', 0, 'sent_last_24h', 0, 'last_issue_at', NULL);
    END;
  END IF;

  RETURN jsonb_build_object(
    'checked_at', now(),
    'matching',   v_matching,
    'outbox',     v_outbox,
    'email',      v_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_system_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_system_health() TO authenticated;

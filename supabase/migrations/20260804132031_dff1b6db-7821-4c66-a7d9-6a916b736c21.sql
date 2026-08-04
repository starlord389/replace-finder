CREATE TABLE IF NOT EXISTS public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_sid text UNIQUE,
  to_number text NOT NULL,
  from_number text,
  body text,
  purpose text,
  status text NOT NULL DEFAULT 'queued',
  error_code text,
  error_message text,
  delivered_at timestamptz,
  status_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sms_messages_message_sid_idx ON public.sms_messages (message_sid);
CREATE INDEX IF NOT EXISTS sms_messages_created_at_idx ON public.sms_messages (created_at DESC);

GRANT SELECT ON public.sms_messages TO authenticated;
GRANT ALL ON public.sms_messages TO service_role;

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sms messages" ON public.sms_messages;
CREATE POLICY "Admins can view sms messages"
ON public.sms_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_sms_messages_set_updated_at ON public.sms_messages;
CREATE TRIGGER trg_sms_messages_set_updated_at
BEFORE UPDATE ON public.sms_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
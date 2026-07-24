
CREATE TABLE IF NOT EXISTS public.admin_notify_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  kind text NOT NULL,
  subject_id text,
  requester_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notify_dispatch_log_created_at_idx
  ON public.admin_notify_dispatch_log (created_at);
CREATE INDEX IF NOT EXISTS admin_notify_dispatch_log_kind_ip_created_idx
  ON public.admin_notify_dispatch_log (kind, requester_ip, created_at);

REVOKE ALL ON public.admin_notify_dispatch_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_notify_dispatch_log TO service_role;

ALTER TABLE public.admin_notify_dispatch_log ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role bypasses RLS. anon/authenticated get zero access.

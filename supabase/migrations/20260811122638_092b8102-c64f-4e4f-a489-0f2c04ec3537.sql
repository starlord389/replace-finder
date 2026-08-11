ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS launchpad_client_requests_ack_at timestamptz;

COMMENT ON COLUMN public.profiles.launchpad_client_requests_ack_at IS
  'When the agent first opened the Client Requests education step in Launchpad.';
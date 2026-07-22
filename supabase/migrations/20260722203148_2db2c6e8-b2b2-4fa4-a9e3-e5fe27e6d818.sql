ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS launchpad_matching_ack_at timestamptz,
  ADD COLUMN IF NOT EXISTS launchpad_matches_ack_at timestamptz,
  ADD COLUMN IF NOT EXISTS launchpad_pipeline_ack_at timestamptz;
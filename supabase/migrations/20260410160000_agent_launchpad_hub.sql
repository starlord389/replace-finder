ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS launchpad_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS launchpad_version text;

-- Demo scheduling: give booked demos a real date/time, a meeting link, and
-- internal notes so the admin center can run a proper demo schedule.
ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Speeds up the "upcoming demos" ordering in the admin schedule view.
CREATE INDEX IF NOT EXISTS idx_demo_requests_scheduled_at
  ON public.demo_requests (scheduled_at);

-- Admin SELECT/UPDATE policies on demo_requests already exist; no RLS change needed.

-- Add missing launchpad tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS launchpad_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS launchpad_version text;

-- Create demo_requests table
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 200),
  work_email text NOT NULL CHECK (char_length(work_email) BETWEEN 1 AND 320),
  company text NOT NULL CHECK (char_length(company) BETWEEN 1 AND 200),
  role text NOT NULL CHECK (char_length(role) BETWEEN 1 AND 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  timeline text CHECK (timeline IS NULL OR char_length(timeline) <= 80),
  use_case text NOT NULL CHECK (char_length(use_case) BETWEEN 1 AND 5000),
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit demo request"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view demo requests"
ON public.demo_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update demo requests"
ON public.demo_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
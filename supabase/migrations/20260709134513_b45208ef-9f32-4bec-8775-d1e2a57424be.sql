CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('agent', 'investor')),
  event text NOT NULL DEFAULT '1031-exchange-summit'
);

CREATE UNIQUE INDEX event_registrations_email_event_key
  ON public.event_registrations (email, event);

GRANT INSERT ON public.event_registrations TO anon, authenticated;
GRANT ALL ON public.event_registrations TO service_role;

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register for events"
  ON public.event_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view registrations"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
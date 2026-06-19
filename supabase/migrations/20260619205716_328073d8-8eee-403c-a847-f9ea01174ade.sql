
CREATE TABLE public.team_waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.team_waitlist_signups TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.team_waitlist_signups TO authenticated;
GRANT ALL ON public.team_waitlist_signups TO service_role;

ALTER TABLE public.team_waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the team waitlist"
  ON public.team_waitlist_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view team waitlist"
  ON public.team_waitlist_signups FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update team waitlist"
  ON public.team_waitlist_signups FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete team waitlist"
  ON public.team_waitlist_signups FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_team_waitlist_signups_updated_at
  BEFORE UPDATE ON public.team_waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.brokerage_waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.brokerage_waitlist_signups TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.brokerage_waitlist_signups TO authenticated;
GRANT ALL ON public.brokerage_waitlist_signups TO service_role;

ALTER TABLE public.brokerage_waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the brokerage waitlist"
  ON public.brokerage_waitlist_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view brokerage waitlist"
  ON public.brokerage_waitlist_signups FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brokerage waitlist"
  ON public.brokerage_waitlist_signups FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brokerage waitlist"
  ON public.brokerage_waitlist_signups FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_brokerage_waitlist_signups_updated_at
  BEFORE UPDATE ON public.brokerage_waitlist_signups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

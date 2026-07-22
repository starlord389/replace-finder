ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS notes text;

GRANT INSERT ON public.referrals TO anon;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
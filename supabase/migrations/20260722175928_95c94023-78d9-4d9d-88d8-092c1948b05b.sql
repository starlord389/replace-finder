GRANT INSERT ON public.referrals TO anon;
GRANT INSERT, SELECT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
GRANT INSERT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
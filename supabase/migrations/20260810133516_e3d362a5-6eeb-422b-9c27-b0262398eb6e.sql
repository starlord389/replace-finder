GRANT INSERT ON TABLE public.event_registrations TO anon;
GRANT INSERT ON TABLE public.event_registrations TO authenticated;
GRANT SELECT ON TABLE public.event_registrations TO authenticated;
GRANT ALL ON TABLE public.event_registrations TO service_role;
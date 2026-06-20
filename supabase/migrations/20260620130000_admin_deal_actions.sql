-- Let admins intervene on deals from the admin center: update exchange and
-- connection status/stage, and log those actions to the exchange timeline.
-- (Admins already have read-all access to these tables.)

DROP POLICY IF EXISTS "Admins can update exchanges" ON public.exchanges;
CREATE POLICY "Admins can update exchanges"
  ON public.exchanges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update connections" ON public.exchange_connections;
CREATE POLICY "Admins can update connections"
  ON public.exchange_connections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert timeline events" ON public.exchange_timeline;
CREATE POLICY "Admins can insert timeline events"
  ON public.exchange_timeline FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

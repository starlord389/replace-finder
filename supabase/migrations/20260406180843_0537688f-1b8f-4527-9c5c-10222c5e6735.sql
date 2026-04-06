
CREATE POLICY "Buyer agents can read their matches"
ON public.matches FOR SELECT TO authenticated
USING (buyer_exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()));

CREATE POLICY "Seller agents can read their matches"
ON public.matches FOR SELECT TO authenticated
USING (seller_property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()));

CREATE POLICY "Buyer agents can update match views"
ON public.matches FOR UPDATE TO authenticated
USING (buyer_exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()));

CREATE POLICY "Seller agents can update match views"
ON public.matches FOR UPDATE TO authenticated
USING (seller_property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()));

CREATE POLICY "Clients can read their matches"
ON public.matches FOR SELECT TO authenticated
USING (
  buyer_exchange_id IN (
    SELECT e.id FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all matches"
ON public.matches FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert matches"
ON public.matches FOR INSERT TO authenticated
WITH CHECK (true);

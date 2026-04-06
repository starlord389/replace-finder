
-- identification_list
CREATE POLICY "Agents can manage own identification lists"
ON public.identification_list FOR ALL TO authenticated
USING (exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()))
WITH CHECK (exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()));

CREATE POLICY "Clients can read own identification lists"
ON public.identification_list FOR SELECT TO authenticated
USING (
  exchange_id IN (
    SELECT e.id FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all identification lists"
ON public.identification_list FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- dst_properties
CREATE POLICY "Auth users can read active DSTs"
ON public.dst_properties FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Admins can manage DSTs"
ON public.dst_properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

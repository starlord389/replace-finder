
CREATE POLICY "Agents can manage own criteria"
ON public.replacement_criteria FOR ALL TO authenticated
USING (exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()))
WITH CHECK (exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()));

CREATE POLICY "Clients can read own criteria"
ON public.replacement_criteria FOR SELECT TO authenticated
USING (
  exchange_id IN (
    SELECT e.id FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all criteria"
ON public.replacement_criteria FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

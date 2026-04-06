
CREATE POLICY "Agents can manage own properties"
ON public.pledged_properties FOR ALL TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Authenticated users can read active properties"
ON public.pledged_properties FOR SELECT TO authenticated
USING (status = 'active');

CREATE POLICY "Admins can manage all properties"
ON public.pledged_properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

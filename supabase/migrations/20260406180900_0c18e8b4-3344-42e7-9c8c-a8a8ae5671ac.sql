
CREATE POLICY "Agents can read own connections"
ON public.exchange_connections FOR SELECT TO authenticated
USING (buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid());

CREATE POLICY "Agents can create connections"
ON public.exchange_connections FOR INSERT TO authenticated
WITH CHECK (buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid());

CREATE POLICY "Agents can update own connections"
ON public.exchange_connections FOR UPDATE TO authenticated
USING (buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid());

CREATE POLICY "Admins can read all connections"
ON public.exchange_connections FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

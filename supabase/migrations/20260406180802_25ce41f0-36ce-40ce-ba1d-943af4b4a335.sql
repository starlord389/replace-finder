
CREATE POLICY "Agents can read own clients"
ON public.agent_clients FOR SELECT TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own clients"
ON public.agent_clients FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own clients"
ON public.agent_clients FOR UPDATE TO authenticated
USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can delete own clients"
ON public.agent_clients FOR DELETE TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Clients can read own client record"
ON public.agent_clients FOR SELECT TO authenticated
USING (client_user_id = auth.uid());

CREATE POLICY "Admins can read all agent clients"
ON public.agent_clients FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

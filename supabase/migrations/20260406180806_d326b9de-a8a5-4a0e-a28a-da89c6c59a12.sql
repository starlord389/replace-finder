
CREATE POLICY "Agents can read own exchanges"
ON public.exchanges FOR SELECT TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own exchanges"
ON public.exchanges FOR INSERT TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own exchanges"
ON public.exchanges FOR UPDATE TO authenticated
USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Clients can read own exchanges"
ON public.exchanges FOR SELECT TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.agent_clients WHERE client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all exchanges"
ON public.exchanges FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

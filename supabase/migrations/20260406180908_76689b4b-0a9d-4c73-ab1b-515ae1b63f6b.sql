
-- notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read all notifications"
ON public.notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- messages
CREATE POLICY "Connection members can read messages"
ON public.messages FOR SELECT TO authenticated
USING (
  connection_id IN (
    SELECT id FROM public.exchange_connections
    WHERE buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid()
  )
);

CREATE POLICY "Connection members can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  connection_id IN (
    SELECT id FROM public.exchange_connections
    WHERE buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all messages"
ON public.messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- exchange_timeline
CREATE POLICY "Agents can read own exchange timeline"
ON public.exchange_timeline FOR SELECT TO authenticated
USING (exchange_id IN (SELECT id FROM public.exchanges WHERE agent_id = auth.uid()));

CREATE POLICY "Service can insert timeline events"
ON public.exchange_timeline FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Clients can read own exchange timeline"
ON public.exchange_timeline FOR SELECT TO authenticated
USING (
  exchange_id IN (
    SELECT e.id FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can read all timelines"
ON public.exchange_timeline FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

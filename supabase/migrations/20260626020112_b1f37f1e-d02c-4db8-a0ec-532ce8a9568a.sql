DROP POLICY IF EXISTS "Agents can create connections" ON public.exchange_connections;

CREATE POLICY "Agents can create connections"
ON public.exchange_connections FOR INSERT TO authenticated
WITH CHECK (
  (exchange_connections.buyer_agent_id = auth.uid() OR exchange_connections.seller_agent_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.exchanges be ON be.id = m.buyer_exchange_id
    JOIN public.pledged_properties sp ON sp.id = m.seller_property_id
    WHERE m.id = exchange_connections.match_id
      AND exchange_connections.buyer_exchange_id = m.buyer_exchange_id
      AND exchange_connections.buyer_agent_id = be.agent_id
      AND exchange_connections.seller_agent_id = sp.agent_id
  )
);

NOTIFY pgrst, 'reload schema';
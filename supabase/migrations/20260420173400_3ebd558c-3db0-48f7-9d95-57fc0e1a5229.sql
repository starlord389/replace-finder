-- Enable realtime on messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Allow recipients (connection members who are not the sender) to mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_id <> auth.uid()
  AND connection_id IN (
    SELECT id FROM public.exchange_connections
    WHERE buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid()
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND connection_id IN (
    SELECT id FROM public.exchange_connections
    WHERE buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid()
  )
);
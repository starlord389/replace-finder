
-- 1) client_invites: replace anon "read all" policy with a token-scoped RPC
DROP POLICY IF EXISTS "Anyone can read invite by token (preview)" ON public.client_invites;

CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  agent_id uuid,
  client_id uuid,
  email text,
  status text,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_user_id uuid,
  agent_full_name text,
  agent_brokerage_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ci.id, ci.agent_id, ci.client_id, ci.email, ci.status,
         ci.expires_at, ci.accepted_at, ci.accepted_user_id,
         p.full_name, p.brokerage_name
  FROM public.client_invites ci
  LEFT JOIN public.profiles p ON p.id = ci.agent_id
  WHERE ci.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon, authenticated;

-- 2) exchange_connections: lock down UPDATE WITH CHECK to prevent agent_id / linkage tampering
DROP POLICY IF EXISTS "Agents can update own connections" ON public.exchange_connections;
CREATE POLICY "Agents can update own connections"
ON public.exchange_connections
FOR UPDATE
TO authenticated
USING ((buyer_agent_id = auth.uid()) OR (seller_agent_id = auth.uid()))
WITH CHECK (
  ((buyer_agent_id = auth.uid()) OR (seller_agent_id = auth.uid()))
  AND buyer_agent_id  = (SELECT buyer_agent_id  FROM public.exchange_connections WHERE id = exchange_connections.id)
  AND seller_agent_id = (SELECT seller_agent_id FROM public.exchange_connections WHERE id = exchange_connections.id)
  AND match_id        = (SELECT match_id        FROM public.exchange_connections WHERE id = exchange_connections.id)
  AND buyer_exchange_id  IS NOT DISTINCT FROM (SELECT buyer_exchange_id  FROM public.exchange_connections WHERE id = exchange_connections.id)
  AND seller_exchange_id IS NOT DISTINCT FROM (SELECT seller_exchange_id FROM public.exchange_connections WHERE id = exchange_connections.id)
);

-- 3) storage.objects: tighten property-images upload/delete to first-folder = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

CREATE POLICY "Users can upload own property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can update own property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

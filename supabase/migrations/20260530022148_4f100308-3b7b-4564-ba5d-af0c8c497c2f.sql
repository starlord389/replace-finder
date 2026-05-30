
-- 1. Add license_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;

-- 2. Security-definer function: do two users share an accepted/in-progress/completed connection?
CREATE OR REPLACE FUNCTION public.users_share_active_connection(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exchange_connections
    WHERE status IN ('accepted', 'in_progress', 'completed')
      AND (
        (buyer_agent_id = _user_a AND seller_agent_id = _user_b)
        OR (buyer_agent_id = _user_b AND seller_agent_id = _user_a)
      )
  );
$$;

-- 3. Add RLS policy: connected counterparts can read each other's profile
DROP POLICY IF EXISTS "Connected counterparts can view profile" ON public.profiles;
CREATE POLICY "Connected counterparts can view profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.users_share_active_connection(auth.uid(), id));

-- 4. client_invites table
CREATE TABLE IF NOT EXISTS public.client_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invites_token ON public.client_invites(token);
CREATE INDEX IF NOT EXISTS idx_client_invites_agent_id ON public.client_invites(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_invites_client_id ON public.client_invites(client_id);

-- Grants (agent-scoped + anon for accept-invite lookup by token)
GRANT SELECT ON public.client_invites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invites TO authenticated;
GRANT ALL ON public.client_invites TO service_role;

ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- Agents manage their own invites
CREATE POLICY "Agents can read own invites"
ON public.client_invites
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Agents can create own invites"
ON public.client_invites
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own invites"
ON public.client_invites
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can delete own invites"
ON public.client_invites
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

-- The invitee (authenticated user) may accept their own invite (matching email handled in app code)
CREATE POLICY "Invitee can accept invite"
ON public.client_invites
FOR UPDATE
TO authenticated
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status IN ('accepted', 'pending'));

-- Public/anon can look up a token to display invite preview on accept-invite page
CREATE POLICY "Anyone can read invite by token (preview)"
ON public.client_invites
FOR SELECT
TO anon
USING (true);

-- updated_at trigger
CREATE TRIGGER update_client_invites_updated_at
BEFORE UPDATE ON public.client_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Avatar storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-avatars');

CREATE POLICY "Agents can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Agents can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Agents can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agent-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

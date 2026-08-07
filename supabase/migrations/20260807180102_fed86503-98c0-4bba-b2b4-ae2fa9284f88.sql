-- Agent-mediated investor workflow.
--
-- Investors remain the permanent owners of investor exchanges. A separate,
-- auditable representation assignment grants a verified agent access and is
-- required before any counterparty connection or message can be created.

CREATE TABLE IF NOT EXISTS public.agent_representations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_email text NOT NULL,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_email text NOT NULL,
  agent_name text,
  status text NOT NULL DEFAULT 'pending_signup'
    CHECK (status IN (
      'pending_signup', 'pending_verification', 'awaiting_agent',
      'awaiting_acceptance', 'awaiting_investor_confirmation',
      'active', 'declined', 'expired', 'revoked'
    )),
  source text NOT NULL
    CHECK (source IN ('agent_invite', 'investor_invite', 'platform_referral', 'admin_assignment')),
  is_default boolean NOT NULL DEFAULT false,
  assign_future_exchanges boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  requested_exchange_id uuid REFERENCES public.exchanges(id) ON DELETE SET NULL,
  request_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.representation_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representation_id uuid NOT NULL REFERENCES public.agent_representations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('agent_to_investor', 'investor_to_agent')),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_agent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  representation_id uuid NOT NULL REFERENCES public.agent_representations(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  is_primary boolean NOT NULL DEFAULT true,
  can_manage_exchange boolean NOT NULL DEFAULT true,
  can_manage_listing boolean NOT NULL DEFAULT true,
  can_view_documents boolean NOT NULL DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  representing_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_id uuid REFERENCES public.exchange_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting_for_agent'
    CHECK (status IN ('waiting_for_agent', 'requested', 'accepted', 'awaiting_counterparty_agent', 'contacted', 'declined', 'closed')),
  investor_note text CHECK (investor_note IS NULL OR char_length(investor_note) <= 2000),
  agent_note text CHECK (agent_note IS NULL OR char_length(agent_note) <= 4000),
  requested_at timestamptz NOT NULL DEFAULT now(),
  acted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investor_id, match_id)
);

CREATE TABLE IF NOT EXISTS public.agent_match_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  response text NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'interested', 'passed', 'saved', 'question')),
  response_note text CHECK (response_note IS NULL OR char_length(response_note) <= 2000),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, investor_id, match_id)
);

CREATE TABLE IF NOT EXISTS public.client_agent_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representation_id uuid NOT NULL REFERENCES public.agent_representations(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.client_agent_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_investor_communications_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.exchange_connections(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status text NOT NULL,
  reason text NOT NULL DEFAULT 'Investor occupied an agent-only connection participant field',
  archived_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_representations_investor ON public.agent_representations(investor_id, is_demo, status);
CREATE INDEX IF NOT EXISTS idx_representations_agent ON public.agent_representations(agent_id, is_demo, status);
CREATE INDEX IF NOT EXISTS idx_representation_invites_email ON public.representation_invites(lower(email), status, expires_at);
CREATE INDEX IF NOT EXISTS idx_exchange_agent_assignments_agent ON public.exchange_agent_assignments(agent_id, status, exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_agent_assignments_investor ON public.exchange_agent_assignments(investor_id, status, exchange_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_agent_per_exchange
  ON public.exchange_agent_assignments(exchange_id) WHERE status = 'active' AND is_primary;
CREATE INDEX IF NOT EXISTS idx_agent_contact_requests_agent ON public.agent_contact_requests(representing_agent_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_contact_requests_investor ON public.agent_contact_requests(investor_id, status, requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_agent_thread_scope
  ON public.client_agent_threads(representation_id, COALESCE(exchange_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(match_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.agent_representations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representation_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_match_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_agent_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_investor_communications_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_verified_agent(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(p_user_id, 'agent'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = p_user_id AND p.verification_status = 'verified'
    );
$$;

CREATE OR REPLACE FUNCTION public.has_active_exchange_assignment(p_agent_id uuid, p_exchange_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exchange_agent_assignments a
    JOIN public.agent_representations r ON r.id = a.representation_id
    WHERE a.agent_id = p_agent_id
      AND a.exchange_id = p_exchange_id
      AND a.status = 'active'
      AND r.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_agent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_active_exchange_assignment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_agent(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_exchange_assignment(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Representation participants can read relationships"
ON public.agent_representations FOR SELECT TO authenticated
USING (
  investor_id = auth.uid() OR agent_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage representation relationships"
ON public.agent_representations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read legacy communication audit"
ON public.legacy_investor_communications_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Invite creators can read representation invites"
ON public.representation_invites FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR lower(email) = lower(auth.jwt() ->> 'email')
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Assignment participants can read assignments"
ON public.exchange_agent_assignments FOR SELECT TO authenticated
USING (
  investor_id = auth.uid() OR agent_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage exchange assignments"
ON public.exchange_agent_assignments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Contact request participants can read"
ON public.agent_contact_requests FOR SELECT TO authenticated
USING (
  investor_id = auth.uid() OR representing_agent_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Recommendation participants can read"
ON public.agent_match_recommendations FOR SELECT TO authenticated
USING (
  investor_id = auth.uid() OR agent_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Representation counterparts can view profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agent_representations r
    WHERE r.status IN ('awaiting_acceptance', 'awaiting_investor_confirmation', 'active')
      AND (
        (r.investor_id = profiles.id AND r.agent_id = auth.uid())
        OR (r.agent_id = profiles.id AND r.investor_id = auth.uid())
      )
  )
);

CREATE POLICY "Client and agent can read collaboration threads"
ON public.client_agent_threads FOR SELECT TO authenticated
USING (
  investor_id = auth.uid() OR agent_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Client and agent can create collaboration threads"
ON public.client_agent_threads FOR INSERT TO authenticated
WITH CHECK (
  (investor_id = auth.uid() OR agent_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.agent_representations r
    WHERE r.id = representation_id AND r.status = 'active'
      AND r.investor_id = client_agent_threads.investor_id
      AND r.agent_id = client_agent_threads.agent_id
  )
);

CREATE POLICY "Client and agent can read private collaboration messages"
ON public.client_agent_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_agent_threads t
    WHERE t.id = thread_id AND (t.investor_id = auth.uid() OR t.agent_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Client and agent can send private collaboration messages"
ON public.client_agent_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.client_agent_threads t
    JOIN public.agent_representations r ON r.id = t.representation_id
    WHERE t.id = thread_id AND r.status = 'active'
      AND (t.investor_id = auth.uid() OR t.agent_id = auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.notify_client_agent_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_thread public.client_agent_threads%ROWTYPE; v_recipient uuid;
BEGIN
  SELECT * INTO v_thread FROM public.client_agent_threads WHERE id = NEW.thread_id;
  v_recipient := CASE WHEN NEW.sender_id = v_thread.investor_id THEN v_thread.agent_id ELSE v_thread.investor_id END;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_recipient, 'client_agent_message',
    CASE WHEN v_recipient = v_thread.agent_id THEN 'New message from your client' ELSE 'New message from your agent' END,
    left(NEW.content, 180),
    CASE WHEN v_recipient = v_thread.agent_id THEN '/agent/representation' ELSE '/investor/representation' END,
    jsonb_build_object('thread_id', v_thread.id, 'representation_id', v_thread.representation_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_client_agent_message ON public.client_agent_messages;
CREATE TRIGGER trg_notify_client_agent_message
AFTER INSERT ON public.client_agent_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_client_agent_message();

-- Assigned agents can work in the investor's existing exchange without changing
-- the ownership recorded in exchanges.agent_id.
CREATE POLICY "Assigned agents can read investor exchanges"
ON public.exchanges FOR SELECT TO authenticated
USING (public.has_active_exchange_assignment(auth.uid(), id));

CREATE POLICY "Assigned agents can update investor exchanges"
ON public.exchanges FOR UPDATE TO authenticated
USING (
  public.has_active_exchange_assignment(auth.uid(), id)
  AND EXISTS (
    SELECT 1 FROM public.exchange_agent_assignments a
    WHERE a.exchange_id = exchanges.id AND a.agent_id = auth.uid()
      AND a.status = 'active' AND a.can_manage_exchange
  )
)
WITH CHECK (owner_type = 'investor');

-- A representing agent may manage workflow and listing details, but can never
-- transfer the investor's exchange (or its property) to another account. RLS
-- WITH CHECK alone is insufficient here because an agent could otherwise make
-- themselves the recorded owner and retain access after representation ends.
CREATE OR REPLACE FUNCTION public.guard_represented_exchange_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() IS DISTINCT FROM OLD.agent_id
     AND public.has_active_exchange_assignment(auth.uid(), OLD.id)
     AND (
       NEW.agent_id IS DISTINCT FROM OLD.agent_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.owner_type IS DISTINCT FROM OLD.owner_type
       OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
     )
  THEN
    RAISE EXCEPTION 'Representing agents cannot change exchange ownership fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_represented_exchange_ownership ON public.exchanges;
CREATE TRIGGER trg_guard_represented_exchange_ownership
BEFORE UPDATE ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION public.guard_represented_exchange_ownership();

CREATE POLICY "Assigned agents can read investor matches"
ON public.matches FOR SELECT TO authenticated
USING (public.has_active_exchange_assignment(auth.uid(), buyer_exchange_id));

CREATE POLICY "Assigned agents can update investor match workflow"
ON public.matches FOR UPDATE TO authenticated
USING (public.has_active_exchange_assignment(auth.uid(), buyer_exchange_id))
WITH CHECK (public.has_active_exchange_assignment(auth.uid(), buyer_exchange_id));

-- Safe public preview. It deliberately exposes no user ids or invite metadata.
CREATE OR REPLACE FUNCTION public.get_representation_invite(p_token text)
RETURNS TABLE (
  direction text,
  email text,
  status text,
  expires_at timestamptz,
  inviter_name text,
  inviter_company text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.direction, i.email, i.status, i.expires_at,
         p.full_name, COALESCE(p.brokerage_name, p.company)
  FROM public.representation_invites i
  LEFT JOIN public.profiles p ON p.id = i.created_by
  WHERE i.token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_representation_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_representation_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.invite_representing_agent(
  p_agent_email text,
  p_agent_name text DEFAULT NULL,
  p_exchange_ids uuid[] DEFAULT NULL,
  p_assign_future boolean DEFAULT true,
  p_is_demo boolean DEFAULT false
)
RETURNS TABLE(representation_id uuid, invite_token text, invite_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_agent_email));
  v_investor_email text;
  v_agent_id uuid;
  v_rep public.agent_representations%ROWTYPE;
  v_invite public.representation_invites%ROWTYPE;
  v_status text;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'investor'::public.app_role) THEN
    RAISE EXCEPTION 'Only an investor account can invite a representing agent.';
  END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Enter a valid agent email address.';
  END IF;

  SELECT lower(email) INTO v_investor_email FROM public.profiles WHERE id = v_uid;
  IF v_email = v_investor_email THEN
    RAISE EXCEPTION 'You cannot invite your own account as your agent.';
  END IF;

  SELECT u.id INTO v_agent_id FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_agent_id IS NOT NULL AND NOT public.has_role(v_agent_id, 'agent'::public.app_role) THEN
    RAISE EXCEPTION 'That email belongs to an account that is not registered as an agent.';
  END IF;

  v_status := CASE
    WHEN v_agent_id IS NULL THEN 'pending_signup'
    WHEN public.is_verified_agent(v_agent_id) THEN 'awaiting_acceptance'
    ELSE 'pending_verification'
  END;

  UPDATE public.agent_representations
  SET status = 'revoked', revoked_at = now(), revoked_by = v_uid,
      ended_reason = 'Superseded by a new invitation', updated_at = now()
  WHERE investor_id = v_uid AND lower(agent_email) = v_email
    AND status NOT IN ('active', 'revoked', 'declined', 'expired');

  INSERT INTO public.agent_representations (
    investor_id, investor_email, agent_id, agent_email, agent_name,
    status, source, assign_future_exchanges, is_demo, invited_by
  ) VALUES (
    v_uid, v_investor_email, v_agent_id, v_email, NULLIF(btrim(p_agent_name), ''),
    v_status, 'investor_invite', p_assign_future, p_is_demo, v_uid
  ) RETURNING * INTO v_rep;

  INSERT INTO public.representation_invites (
    representation_id, direction, email, metadata, created_by
  ) VALUES (
    v_rep.id, 'investor_to_agent', v_email,
    jsonb_build_object(
      'exchange_ids', COALESCE(to_jsonb(p_exchange_ids), '[]'::jsonb),
      'assign_future', p_assign_future,
      'is_demo', p_is_demo
    ),
    v_uid
  ) RETURNING * INTO v_invite;

  IF v_agent_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_agent_id, 'representation_invite', 'Investor invited you to represent them',
      'Review and accept the representation invitation.',
      '/representation-invite?token=' || v_invite.token,
      jsonb_build_object('representation_id', v_rep.id)
    );
  END IF;

  RETURN QUERY SELECT v_rep.id, v_invite.token, v_rep.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_investor_client(
  p_client_name text,
  p_client_email text,
  p_client_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_demo boolean DEFAULT false
)
RETURNS TABLE(representation_id uuid, invite_token text, invite_status text, client_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_client_email));
  v_agent_email text;
  v_investor_id uuid;
  v_rep public.agent_representations%ROWTYPE;
  v_invite public.representation_invites%ROWTYPE;
  v_client public.agent_clients%ROWTYPE;
  v_status text;
BEGIN
  IF NOT public.is_verified_agent(v_uid) THEN
    RAISE EXCEPTION 'Only a verified agent can invite an investor client.';
  END IF;
  IF btrim(COALESCE(p_client_name, '')) = '' THEN RAISE EXCEPTION 'Client name is required.'; END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Enter a valid client email.'; END IF;

  SELECT lower(email) INTO v_agent_email FROM public.profiles WHERE id = v_uid;
  IF v_email = v_agent_email THEN RAISE EXCEPTION 'You cannot invite your own account as a client.'; END IF;
  SELECT u.id INTO v_investor_id FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_investor_id IS NOT NULL AND NOT public.has_role(v_investor_id, 'investor'::public.app_role) THEN
    RAISE EXCEPTION 'That email belongs to an account that is not registered as an investor.';
  END IF;
  v_status := CASE WHEN v_investor_id IS NULL THEN 'pending_signup' ELSE 'awaiting_acceptance' END;

  INSERT INTO public.agent_clients(
    agent_id, client_user_id, client_name, client_email, client_phone, notes, status, is_demo
  ) VALUES (
    v_uid, v_investor_id, btrim(p_client_name), v_email, NULLIF(btrim(p_client_phone), ''),
    NULLIF(btrim(p_notes), ''), 'active', p_is_demo
  ) RETURNING * INTO v_client;

  INSERT INTO public.agent_representations(
    investor_id, investor_email, agent_id, agent_email, agent_name,
    status, source, is_default, is_demo, invited_by
  ) VALUES (
    v_investor_id, v_email, v_uid, v_agent_email,
    (SELECT full_name FROM public.profiles WHERE id = v_uid),
    v_status, 'agent_invite', true, p_is_demo, v_uid
  ) RETURNING * INTO v_rep;

  INSERT INTO public.representation_invites(representation_id, direction, email, metadata, created_by)
  VALUES (v_rep.id, 'agent_to_investor', v_email, jsonb_build_object('client_id', v_client.id), v_uid)
  RETURNING * INTO v_invite;

  IF v_investor_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_investor_id, 'representation_invite', 'An agent invited you to work together',
      'Review the invitation and choose whether to connect your exchange workspace.',
      '/representation-invite?token=' || v_invite.token,
      jsonb_build_object('representation_id', v_rep.id)
    );
  END IF;

  RETURN QUERY SELECT v_rep.id, v_invite.token, v_rep.status, v_client.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_representation_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_invite public.representation_invites%ROWTYPE;
  v_rep public.agent_representations%ROWTYPE;
  v_client_id uuid;
  v_exchange_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in before accepting this invitation.'; END IF;

  SELECT * INTO v_invite FROM public.representation_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This invitation is invalid.'; END IF;
  IF v_invite.status <> 'pending' THEN RAISE EXCEPTION 'This invitation has already been used.'; END IF;
  IF v_invite.expires_at <= now() THEN
    UPDATE public.representation_invites SET status = 'expired', updated_at = now() WHERE id = v_invite.id;
    UPDATE public.agent_representations SET status = 'expired', updated_at = now() WHERE id = v_invite.representation_id;
    RAISE EXCEPTION 'This invitation has expired.';
  END IF;
  IF lower(v_invite.email) <> v_email THEN RAISE EXCEPTION 'This invitation was sent to a different email address.'; END IF;

  SELECT * INTO v_rep FROM public.agent_representations WHERE id = v_invite.representation_id FOR UPDATE;
  IF v_invite.direction = 'investor_to_agent' THEN
    IF NOT public.is_verified_agent(v_uid) THEN
      RAISE EXCEPTION 'Complete agent verification before accepting representation.';
    END IF;
    UPDATE public.agent_representations
    SET agent_id = v_uid, agent_email = v_email, status = 'active', accepted_at = now(), updated_at = now()
    WHERE id = v_rep.id RETURNING * INTO v_rep;
  ELSE
    IF NOT public.has_role(v_uid, 'investor'::public.app_role) THEN
      RAISE EXCEPTION 'Accept this invitation from an investor/property-owner account.';
    END IF;
    UPDATE public.agent_representations
    SET investor_id = v_uid, investor_email = v_email, status = 'active', accepted_at = now(), updated_at = now()
    WHERE id = v_rep.id RETURNING * INTO v_rep;
  END IF;

  UPDATE public.agent_representations SET is_default = false, updated_at = now()
  WHERE investor_id = v_rep.investor_id AND is_demo = v_rep.is_demo AND id <> v_rep.id AND is_default;
  UPDATE public.agent_representations SET is_default = true WHERE id = v_rep.id;

  SELECT (v_invite.metadata->>'client_id')::uuid INTO v_client_id;
  IF v_client_id IS NOT NULL THEN
    UPDATE public.agent_clients SET client_user_id = v_rep.investor_id, status = 'active', updated_at = now()
    WHERE id = v_client_id AND agent_id = v_rep.agent_id;
  ELSE
    SELECT id INTO v_client_id FROM public.agent_clients
    WHERE agent_id = v_rep.agent_id AND client_user_id = v_rep.investor_id AND is_demo = v_rep.is_demo LIMIT 1;
    IF v_client_id IS NULL THEN
      INSERT INTO public.agent_clients(agent_id, client_user_id, client_name, client_email, status, referred_by_platform, is_demo)
      SELECT v_rep.agent_id, v_rep.investor_id, COALESCE(NULLIF(p.full_name, ''), v_rep.investor_email),
             v_rep.investor_email, 'active', v_rep.source = 'platform_referral', v_rep.is_demo
      FROM public.profiles p WHERE p.id = v_rep.investor_id
      RETURNING id INTO v_client_id;
    END IF;
  END IF;

  FOR v_exchange_id IN
    SELECT (value #>> '{}')::uuid FROM jsonb_array_elements(COALESCE(v_invite.metadata->'exchange_ids', '[]'::jsonb))
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.exchanges e
      WHERE e.id = v_exchange_id AND e.agent_id = v_rep.investor_id AND e.owner_type = 'investor'
    ) THEN
      INSERT INTO public.exchange_agent_assignments(
        exchange_id, representation_id, investor_id, agent_id, assigned_by
      ) VALUES (v_exchange_id, v_rep.id, v_rep.investor_id, v_rep.agent_id, v_rep.investor_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  UPDATE public.agent_contact_requests
  SET representing_agent_id = v_rep.agent_id, status = 'requested', updated_at = now()
  WHERE investor_id = v_rep.investor_id AND status = 'waiting_for_agent'
    AND EXISTS (
      SELECT 1 FROM public.exchange_agent_assignments a
      WHERE a.exchange_id = agent_contact_requests.exchange_id
        AND a.agent_id = v_rep.agent_id AND a.status = 'active'
    );

  UPDATE public.representation_invites
  SET status = 'accepted', accepted_at = now(), accepted_user_id = v_uid, updated_at = now()
  WHERE id = v_invite.id;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  SELECT participant, 'representation_active', 'Representation is active',
         'Your investor-agent workspace is now connected.',
         CASE WHEN participant = v_rep.investor_id THEN '/investor/representation' ELSE '/agent/representation' END,
         jsonb_build_object('representation_id', v_rep.id)
  FROM unnest(ARRAY[v_rep.investor_id, v_rep.agent_id]) AS participant;

  RETURN v_rep.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_agent_to_exchange(p_representation_id uuid, p_exchange_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rep public.agent_representations%ROWTYPE;
  v_assignment_id uuid;
BEGIN
  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'An active representation is required.'; END IF;
  IF auth.uid() <> v_rep.investor_id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the investor or an administrator can expand exchange access.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    WHERE e.id = p_exchange_id AND e.agent_id = v_rep.investor_id AND e.owner_type = 'investor'
  ) THEN RAISE EXCEPTION 'The exchange does not belong to this investor.'; END IF;

  UPDATE public.exchange_agent_assignments
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE exchange_id = p_exchange_id AND status = 'active';

  INSERT INTO public.exchange_agent_assignments(
    exchange_id, representation_id, investor_id, agent_id, assigned_by
  ) VALUES (p_exchange_id, v_rep.id, v_rep.investor_id, v_rep.agent_id, auth.uid())
  RETURNING id INTO v_assignment_id;

  UPDATE public.agent_contact_requests
  SET representing_agent_id = v_rep.agent_id, status = 'requested', updated_at = now()
  WHERE exchange_id = p_exchange_id AND status = 'waiting_for_agent';
  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_agent_referral(
  p_exchange_id uuid DEFAULT NULL,
  p_property_location text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_timing text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_demo boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_referral_id uuid;
  v_rep_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'investor'::public.app_role) THEN
    RAISE EXCEPTION 'Only investors can request representation.';
  END IF;
  IF p_exchange_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.exchanges WHERE id = p_exchange_id AND agent_id = v_uid AND owner_type = 'investor'
  ) THEN RAISE EXCEPTION 'Exchange not found.'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.referrals(owner_name, owner_email, owner_phone, property_location, property_type, status)
  VALUES (
    COALESCE(NULLIF(v_profile.full_name, ''), v_profile.email), v_profile.email, v_profile.phone,
    NULLIF(btrim(p_property_location), ''), NULLIF(btrim(p_property_type), ''), 'pending'
  ) RETURNING id INTO v_referral_id;

  INSERT INTO public.agent_representations(
    investor_id, investor_email, agent_email, status, source, is_demo, invited_by,
    referral_id, requested_exchange_id, request_context
  ) VALUES (
    v_uid, lower(v_profile.email), '', 'awaiting_agent', 'platform_referral', p_is_demo, v_uid,
    v_referral_id, p_exchange_id,
    jsonb_strip_nulls(jsonb_build_object(
      'location', NULLIF(btrim(p_property_location), ''),
      'property_type', NULLIF(btrim(p_property_type), ''),
      'timing', NULLIF(btrim(p_timing), ''),
      'notes', NULLIF(btrim(p_notes), '')
    ))
  ) RETURNING id INTO v_rep_id;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  SELECT ur.user_id, 'representation_referral', 'New investor needs an agent',
         'Review and assign the new representation request.', '/admin/representations?representation=' || v_rep_id,
         jsonb_build_object('representation_id', v_rep_id, 'referral_id', v_referral_id, 'exchange_id', p_exchange_id)
  FROM public.user_roles ur WHERE ur.role = 'admin'::public.app_role;

  RETURN v_rep_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_agent_contact(
  p_exchange_id uuid,
  p_match_id uuid,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_property_id uuid;
  v_agent_id uuid;
  v_request_id uuid;
  v_status text;
BEGIN
  IF NOT public.has_role(v_uid, 'investor'::public.app_role) THEN RAISE EXCEPTION 'Only investors use this request action.'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    WHERE e.id = p_exchange_id AND e.agent_id = v_uid AND e.owner_type = 'investor'
  ) THEN RAISE EXCEPTION 'Exchange not found.'; END IF;
  SELECT m.seller_property_id INTO v_property_id FROM public.matches m
  WHERE m.id = p_match_id AND m.buyer_exchange_id = p_exchange_id AND m.status = 'active';
  IF v_property_id IS NULL THEN RAISE EXCEPTION 'This active match was not found.'; END IF;

  SELECT a.agent_id INTO v_agent_id
  FROM public.exchange_agent_assignments a
  JOIN public.agent_representations r ON r.id = a.representation_id
  WHERE a.exchange_id = p_exchange_id AND a.status = 'active' AND a.is_primary AND r.status = 'active'
  LIMIT 1;
  v_status := CASE WHEN v_agent_id IS NULL THEN 'waiting_for_agent' ELSE 'requested' END;

  INSERT INTO public.agent_contact_requests(
    investor_id, exchange_id, match_id, property_id, representing_agent_id, status, investor_note
  ) VALUES (v_uid, p_exchange_id, p_match_id, v_property_id, v_agent_id, v_status, NULLIF(btrim(p_note), ''))
  ON CONFLICT (investor_id, match_id) DO UPDATE
  SET representing_agent_id = EXCLUDED.representing_agent_id,
      status = CASE WHEN agent_contact_requests.status IN ('closed', 'declined') THEN EXCLUDED.status ELSE agent_contact_requests.status END,
      investor_note = EXCLUDED.investor_note,
      updated_at = now()
  RETURNING id INTO v_request_id;

  IF v_agent_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_agent_id, 'client_contact_request', 'Client asked you to connect',
      'Review the match and contact the listing agent if it is a fit.',
      '/agent/representation?request=' || v_request_id,
      jsonb_build_object('request_id', v_request_id, 'match_id', p_match_id, 'exchange_id', p_exchange_id)
    );
  END IF;
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_representation(p_representation_id uuid, p_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rep public.agent_representations%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access is required.';
  END IF;
  IF NOT public.is_verified_agent(p_agent_id) THEN
    RAISE EXCEPTION 'Choose a verified agent.';
  END IF;
  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id;
  IF NOT FOUND OR v_rep.investor_id IS NULL THEN RAISE EXCEPTION 'Representation request not found.'; END IF;

  UPDATE public.agent_representations
  SET agent_id = p_agent_id,
      agent_email = (SELECT lower(email) FROM public.profiles WHERE id = p_agent_id),
      agent_name = (SELECT full_name FROM public.profiles WHERE id = p_agent_id),
      status = 'awaiting_acceptance', source = 'platform_referral', updated_at = now()
  WHERE id = p_representation_id;
  UPDATE public.referrals SET assigned_agent_id = p_agent_id, status = 'assigned', assigned_at = now()
  WHERE id = v_rep.referral_id;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    p_agent_id, 'representation_assignment', 'New investor referral',
    'Review this investor and accept or decline the representation request.',
    '/agent/representation?representation=' || p_representation_id,
    jsonb_build_object('representation_id', p_representation_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_agent_contact_request(p_request_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_request public.agent_contact_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.agent_contact_requests
  WHERE id = p_request_id AND representing_agent_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Client request not found.'; END IF;
  IF NOT public.is_verified_agent(auth.uid()) THEN RAISE EXCEPTION 'Only a verified agent can act on this request.'; END IF;
  UPDATE public.agent_contact_requests
  SET status = 'declined', agent_note = NULLIF(btrim(p_note), ''), acted_at = now(), updated_at = now()
  WHERE id = p_request_id;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_request.investor_id, 'contact_request_declined', 'Your agent reviewed the opportunity',
    COALESCE(NULLIF(btrim(p_note), ''), 'Your agent decided not to contact the other side for this match.'),
    '/investor/matches?match=' || v_request.match_id,
    jsonb_build_object('request_id', p_request_id, 'match_id', v_request.match_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_representation_assignment(
  p_representation_id uuid,
  p_accept boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rep public.agent_representations%ROWTYPE;
BEGIN
  SELECT * INTO v_rep FROM public.agent_representations
  WHERE id = p_representation_id AND agent_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Representation assignment not found.'; END IF;
  IF v_rep.status NOT IN ('awaiting_acceptance', 'pending_verification') THEN
    RAISE EXCEPTION 'This assignment is no longer awaiting your response.';
  END IF;
  IF p_accept AND NOT public.is_verified_agent(auth.uid()) THEN
    RAISE EXCEPTION 'Complete agent verification before accepting representation.';
  END IF;

  -- Investor-originated invites can also be accepted from the agent workspace.
  -- Reuse the token acceptance path so selected exchanges, invite status,
  -- default-agent state, client linking, and queued requests stay identical.
  IF v_rep.source = 'investor_invite' THEN
    IF p_accept THEN
      PERFORM public.accept_representation_invite((
        SELECT i.token
        FROM public.representation_invites i
        WHERE i.representation_id = v_rep.id AND i.status = 'pending'
        ORDER BY i.created_at DESC
        LIMIT 1
      ));
    ELSE
      UPDATE public.agent_representations
      SET status = 'declined', ended_reason = NULLIF(btrim(p_reason), ''), updated_at = now()
      WHERE id = p_representation_id;
      UPDATE public.representation_invites
      SET status = 'declined', updated_at = now()
      WHERE representation_id = p_representation_id AND status = 'pending';
      INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
      VALUES (
        v_rep.investor_id, 'representation_declined', 'Agent declined your invitation',
        COALESCE(NULLIF(btrim(p_reason), ''), 'You can invite another agent or request a platform referral.'),
        '/investor/representation', jsonb_build_object('representation_id', p_representation_id)
      );
    END IF;
    RETURN;
  END IF;

  IF v_rep.source <> 'platform_referral' THEN
    RAISE EXCEPTION 'This invitation is awaiting the investor, not an agent response.';
  END IF;

  IF p_accept THEN
    UPDATE public.agent_representations
    SET status = 'awaiting_investor_confirmation', accepted_at = NULL, updated_at = now()
    WHERE id = p_representation_id;
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_rep.investor_id, 'agent_accepted_referral', 'An agent accepted your request',
      'Review the assigned agent and confirm representation.', '/investor/representation',
      jsonb_build_object('representation_id', p_representation_id)
    );
  ELSE
    UPDATE public.agent_representations
    SET agent_id = NULL, agent_email = '', agent_name = NULL, status = 'awaiting_agent',
        ended_reason = NULLIF(btrim(p_reason), ''), updated_at = now()
    WHERE id = p_representation_id;
    UPDATE public.referrals SET assigned_agent_id = NULL, status = 'pending', assigned_at = NULL
    WHERE id = v_rep.referral_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_referred_agent(p_representation_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rep public.agent_representations%ROWTYPE;
  v_client_id uuid;
BEGIN
  SELECT * INTO v_rep FROM public.agent_representations
  WHERE id = p_representation_id AND investor_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR v_rep.status <> 'awaiting_investor_confirmation' THEN
    RAISE EXCEPTION 'Agent confirmation not found.';
  END IF;
  IF NOT p_accept THEN
    UPDATE public.agent_representations
    SET agent_id = NULL, agent_email = '', agent_name = NULL, status = 'awaiting_agent', updated_at = now()
    WHERE id = p_representation_id;
    UPDATE public.referrals SET assigned_agent_id = NULL, status = 'pending', assigned_at = NULL
    WHERE id = v_rep.referral_id;
    RETURN;
  END IF;

  UPDATE public.agent_representations SET status = 'active', is_default = true, accepted_at = now(), updated_at = now()
  WHERE id = p_representation_id;
  UPDATE public.agent_representations SET is_default = false, updated_at = now()
  WHERE investor_id = v_rep.investor_id AND id <> p_representation_id AND is_demo = v_rep.is_demo AND is_default;

  SELECT id INTO v_client_id FROM public.agent_clients
  WHERE agent_id = v_rep.agent_id AND client_user_id = v_rep.investor_id AND is_demo = v_rep.is_demo LIMIT 1;
  IF v_client_id IS NULL THEN
    INSERT INTO public.agent_clients(agent_id, client_user_id, client_name, client_email, status, referred_by_platform, referral_id, is_demo)
    SELECT v_rep.agent_id, v_rep.investor_id, COALESCE(NULLIF(p.full_name, ''), v_rep.investor_email),
           v_rep.investor_email, 'active', true, v_rep.referral_id, v_rep.is_demo
    FROM public.profiles p WHERE p.id = v_rep.investor_id;
  END IF;
  IF v_rep.requested_exchange_id IS NOT NULL THEN
    PERFORM public.assign_agent_to_exchange(v_rep.id, v_rep.requested_exchange_id);
  END IF;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_rep.agent_id, 'representation_active', 'Investor confirmed representation',
    'You can now collaborate on the assigned exchange.', '/agent/representation',
    jsonb_build_object('representation_id', p_representation_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_representation(p_representation_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rep public.agent_representations%ROWTYPE;
BEGIN
  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Representation not found.'; END IF;
  IF auth.uid() NOT IN (v_rep.investor_id, v_rep.agent_id)
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'You cannot end this representation.';
  END IF;
  UPDATE public.agent_representations
  SET status = 'revoked', is_default = false, revoked_at = now(), revoked_by = auth.uid(),
      ended_reason = NULLIF(btrim(p_reason), ''), updated_at = now()
  WHERE id = p_representation_id;

  -- Stop active counterparty work before revoking the assignments that identify
  -- which exchange access came from this representation. Historical rows and
  -- messages remain available for the audit trail, but no new messages can be
  -- sent on a cancelled connection.
  UPDATE public.exchange_connections c
  SET status = 'cancelled', closed_at = COALESCE(c.closed_at, now()), updated_at = now()
  WHERE c.status IN ('pending', 'accepted', 'in_progress')
    AND v_rep.agent_id IN (c.buyer_agent_id, c.seller_agent_id)
    AND (
      EXISTS (
        SELECT 1 FROM public.exchange_agent_assignments a
        WHERE a.representation_id = p_representation_id AND a.exchange_id = c.buyer_exchange_id
      )
      OR EXISTS (
        SELECT 1 FROM public.exchange_agent_assignments a
        WHERE a.representation_id = p_representation_id AND a.exchange_id = c.seller_exchange_id
      )
    );

  UPDATE public.exchange_agent_assignments
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE representation_id = p_representation_id AND status = 'active';
  UPDATE public.agent_contact_requests
  SET representing_agent_id = NULL,
      connection_id = CASE WHEN status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted') THEN NULL ELSE connection_id END,
      status = CASE WHEN status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted') THEN 'waiting_for_agent' ELSE status END,
      updated_at = now()
  WHERE representing_agent_id = v_rep.agent_id AND investor_id = v_rep.investor_id;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  SELECT participant, 'representation_ended', 'Representation ended',
         'This investor-agent relationship is no longer active.',
         CASE WHEN participant = v_rep.investor_id THEN '/investor/representation' ELSE '/agent/representation' END,
         jsonb_build_object('representation_id', p_representation_id)
  FROM unnest(ARRAY[v_rep.investor_id, v_rep.agent_id]) participant
  WHERE participant IS NOT NULL AND participant <> auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.start_agent_connection(p_match_id uuid, p_request_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match public.matches%ROWTYPE;
  v_buyer_exchange public.exchanges%ROWTYPE;
  v_seller_property public.pledged_properties%ROWTYPE;
  v_seller_exchange public.exchanges%ROWTYPE;
  v_buyer_agent uuid;
  v_seller_agent uuid;
  v_my_side text;
  v_connection_id uuid;
BEGIN
  IF NOT public.is_verified_agent(v_uid) THEN RAISE EXCEPTION 'Only a verified agent can contact the other side.'; END IF;
  -- Serialize connection creation for this match so simultaneous clicks from
  -- both agents cannot create duplicate conversation rows.
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active match not found.'; END IF;
  SELECT * INTO v_buyer_exchange FROM public.exchanges WHERE id = v_match.buyer_exchange_id;
  SELECT * INTO v_seller_property FROM public.pledged_properties WHERE id = v_match.seller_property_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Matched listing not found.'; END IF;
  IF v_seller_property.exchange_id IS NOT NULL THEN
    SELECT * INTO v_seller_exchange FROM public.exchanges WHERE id = v_seller_property.exchange_id;
  END IF;

  IF v_buyer_exchange.owner_type = 'agent' THEN v_buyer_agent := v_buyer_exchange.agent_id;
  ELSE
    SELECT a.agent_id INTO v_buyer_agent FROM public.exchange_agent_assignments a
    JOIN public.agent_representations r ON r.id = a.representation_id
    WHERE a.exchange_id = v_buyer_exchange.id AND a.status = 'active' AND a.is_primary AND r.status = 'active' LIMIT 1;
  END IF;
  -- Platform-sourced listings may not have a seller exchange; their
  -- pledged_properties.agent_id is still the verified listing agent.
  IF v_seller_property.exchange_id IS NULL THEN v_seller_agent := v_seller_property.agent_id;
  ELSIF v_seller_exchange.owner_type = 'agent' THEN v_seller_agent := v_seller_exchange.agent_id;
  ELSE
    SELECT a.agent_id INTO v_seller_agent FROM public.exchange_agent_assignments a
    JOIN public.agent_representations r ON r.id = a.representation_id
    WHERE a.exchange_id = v_seller_exchange.id AND a.status = 'active' AND a.is_primary AND r.status = 'active' LIMIT 1;
  END IF;

  IF v_uid = v_buyer_agent THEN v_my_side := 'buyer_agent';
  ELSIF v_uid = v_seller_agent THEN v_my_side := 'seller_agent';
  ELSE RAISE EXCEPTION 'You are not the assigned agent for either side of this match.';
  END IF;

  IF p_request_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agent_contact_requests r
    WHERE r.id = p_request_id
      AND r.match_id = p_match_id
      AND r.exchange_id = v_buyer_exchange.id
      AND r.representing_agent_id = v_uid
  ) THEN
    RAISE EXCEPTION 'The client contact request does not belong to this match.';
  END IF;

  IF v_buyer_agent IS NULL OR NOT public.is_verified_agent(v_buyer_agent) THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    SELECT
      v_buyer_exchange.agent_id, 'representation_required', 'An agent is interested in your exchange',
      'Assign a representing agent so the two agents can connect.', '/investor/representation',
      jsonb_build_object('match_id', p_match_id, 'exchange_id', v_buyer_exchange.id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = v_buyer_exchange.agent_id AND n.type = 'representation_required'
        AND n.metadata->>'match_id' = p_match_id::text
        AND n.created_at > now() - interval '24 hours'
    );
    RETURN NULL;
  END IF;
  IF v_seller_agent IS NULL OR NOT public.is_verified_agent(v_seller_agent) THEN
    IF p_request_id IS NOT NULL THEN
      UPDATE public.agent_contact_requests SET status = 'awaiting_counterparty_agent', acted_at = now(), updated_at = now()
      WHERE id = p_request_id AND representing_agent_id = v_uid;
    END IF;
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    SELECT
      COALESCE(v_seller_exchange.agent_id, v_seller_property.agent_id),
      'representation_required',
      CASE WHEN v_seller_exchange.owner_type = 'investor' THEN 'An agent is interested in your listing' ELSE 'Complete verification to receive agent connections' END,
      CASE WHEN v_seller_exchange.owner_type = 'investor' THEN 'Assign a representing agent so the two agents can connect.' ELSE 'Verify your agent profile before responding to matched opportunities.' END,
      CASE WHEN v_seller_exchange.owner_type = 'investor' THEN '/investor/representation' ELSE '/agent/launchpad' END,
      jsonb_build_object('match_id', p_match_id, 'exchange_id', v_seller_property.exchange_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = COALESCE(v_seller_exchange.agent_id, v_seller_property.agent_id)
        AND n.type = 'representation_required'
        AND n.metadata->>'match_id' = p_match_id::text
        AND n.created_at > now() - interval '24 hours'
    );
    RETURN NULL;
  END IF;
  IF v_buyer_agent = v_seller_agent THEN RAISE EXCEPTION 'The same agent cannot automatically represent both sides. Ask an administrator to review the conflict.'; END IF;

  SELECT id INTO v_connection_id
  FROM public.exchange_connections
  WHERE match_id = p_match_id AND status IN ('pending', 'accepted', 'in_progress', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_connection_id IS NULL THEN
    INSERT INTO public.exchange_connections(
      match_id, buyer_exchange_id, seller_exchange_id, buyer_agent_id, seller_agent_id,
      initiated_by, status
    ) VALUES (
      p_match_id, v_buyer_exchange.id, v_seller_property.exchange_id, v_buyer_agent, v_seller_agent,
      v_my_side, 'pending'
    ) RETURNING id INTO v_connection_id;
  END IF;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.agent_contact_requests
    SET connection_id = v_connection_id, status = 'contacted', acted_at = now(), updated_at = now()
    WHERE id = p_request_id AND representing_agent_id = v_uid;
  END IF;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    CASE WHEN v_uid = v_buyer_agent THEN v_seller_agent ELSE v_buyer_agent END,
    'connection_request', 'New agent connection request',
    'A verified agent would like to discuss a matched exchange opportunity.',
    '/agent/connections/' || v_connection_id,
    jsonb_build_object('connection_id', v_connection_id, 'match_id', p_match_id)
  );
  RETURN v_connection_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recommend_match_to_client(p_match_id uuid, p_note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exchange public.exchanges%ROWTYPE;
  v_investor_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.is_verified_agent(v_uid) THEN RAISE EXCEPTION 'Only a verified agent can recommend a match.'; END IF;
  SELECT e.* INTO v_exchange FROM public.matches m JOIN public.exchanges e ON e.id = m.buyer_exchange_id
  WHERE m.id = p_match_id AND m.status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active match not found.'; END IF;

  IF v_exchange.owner_type = 'investor' THEN
    IF NOT public.has_active_exchange_assignment(v_uid, v_exchange.id) THEN RAISE EXCEPTION 'You are not assigned to this exchange.'; END IF;
    v_investor_id := v_exchange.agent_id;
  ELSE
    IF v_exchange.agent_id <> v_uid THEN RAISE EXCEPTION 'You do not manage this exchange.'; END IF;
    SELECT client_user_id INTO v_investor_id FROM public.agent_clients WHERE id = v_exchange.client_id;
  END IF;
  IF v_investor_id IS NULL THEN RAISE EXCEPTION 'Invite the client to the platform before recommending a match.'; END IF;

  INSERT INTO public.agent_match_recommendations(agent_id, investor_id, exchange_id, match_id, note)
  VALUES (v_uid, v_investor_id, v_exchange.id, p_match_id, NULLIF(btrim(p_note), ''))
  ON CONFLICT (agent_id, investor_id, match_id) DO UPDATE SET note = EXCLUDED.note, response = 'pending', responded_at = NULL, updated_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_investor_id, 'agent_recommendation', 'Your agent recommended a match',
    'Review the opportunity and let your agent know what you think.',
    '/investor/matches?match=' || p_match_id,
    jsonb_build_object('recommendation_id', v_id, 'match_id', p_match_id)
  );
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_match_recommendation(p_recommendation_id uuid, p_response text, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rec public.agent_match_recommendations%ROWTYPE;
BEGIN
  IF p_response NOT IN ('interested', 'passed', 'saved', 'question') THEN RAISE EXCEPTION 'Invalid response.'; END IF;
  SELECT * INTO v_rec FROM public.agent_match_recommendations WHERE id = p_recommendation_id AND investor_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Recommendation not found.'; END IF;
  UPDATE public.agent_match_recommendations
  SET response = p_response, response_note = NULLIF(btrim(p_note), ''), responded_at = now(), updated_at = now()
  WHERE id = p_recommendation_id;
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_rec.agent_id, 'client_recommendation_response', 'Client responded to your recommendation',
    'Your client marked the opportunity as ' || p_response || '.',
    '/agent/matches?match=' || v_rec.match_id,
    jsonb_build_object('recommendation_id', v_rec.id, 'match_id', v_rec.match_id, 'response', p_response)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_agent_to_new_investor_exchange()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rep public.agent_representations%ROWTYPE;
BEGIN
  IF NEW.owner_type <> 'investor' THEN RETURN NEW; END IF;
  SELECT * INTO v_rep
  FROM public.agent_representations
  WHERE investor_id = NEW.agent_id AND status = 'active' AND is_default
    AND assign_future_exchanges AND is_demo = NEW.is_demo
  ORDER BY accepted_at DESC NULLS LAST LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.exchange_agent_assignments(
      exchange_id, representation_id, investor_id, agent_id, assigned_by
    ) VALUES (NEW.id, v_rep.id, NEW.agent_id, v_rep.agent_id, NEW.agent_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_default_agent_to_investor_exchange ON public.exchanges;
CREATE TRIGGER trg_assign_default_agent_to_investor_exchange
AFTER INSERT ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION public.assign_default_agent_to_new_investor_exchange();

-- Retire the direct investor -> listing-agent inquiry channel.
DROP POLICY IF EXISTS "Investors create inquiries" ON public.listing_inquiries;
REVOKE INSERT ON public.listing_inquiries FROM authenticated;
UPDATE public.listing_inquiries SET status = 'closed', updated_at = now()
WHERE status IN ('new', 'responded');

-- Preserve and audit legacy direct investor conversations, but close them so
-- future activity must resume through a verified representing agent.
INSERT INTO public.legacy_investor_communications_audit(connection_id, investor_id, previous_status)
SELECT c.id, participant.user_id, c.status
FROM public.exchange_connections c
CROSS JOIN LATERAL (VALUES (c.buyer_agent_id), (c.seller_agent_id)) participant(user_id)
WHERE public.has_role(participant.user_id, 'investor'::public.app_role)
  AND NOT public.has_role(participant.user_id, 'agent'::public.app_role)
ON CONFLICT (connection_id, investor_id) DO NOTHING;

UPDATE public.exchange_connections c
SET status = 'cancelled', closed_at = COALESCE(c.closed_at, now()), updated_at = now()
WHERE c.status IN ('pending', 'accepted', 'in_progress')
  AND EXISTS (
    SELECT 1 FROM public.legacy_investor_communications_audit a WHERE a.connection_id = c.id
  );

-- Counterparty connections and messages are agent-only at the database layer.
DROP POLICY IF EXISTS "Agents can create connections" ON public.exchange_connections;
CREATE POLICY "Verified assigned agents create connections"
ON public.exchange_connections FOR INSERT TO authenticated
WITH CHECK (
  public.is_verified_agent(auth.uid())
  AND auth.uid() IN (buyer_agent_id, seller_agent_id)
  AND public.is_verified_agent(buyer_agent_id)
  AND public.is_verified_agent(seller_agent_id)
  AND (
    EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = buyer_exchange_id AND e.owner_type = 'agent' AND e.agent_id = buyer_agent_id)
    OR public.has_active_exchange_assignment(buyer_agent_id, buyer_exchange_id)
  )
);

DROP POLICY IF EXISTS "Connection members can send messages" ON public.messages;
CREATE POLICY "Verified agents can send connection messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_verified_agent(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exchange_connections c
    WHERE c.id = connection_id
      AND c.status IN ('accepted', 'in_progress')
      AND auth.uid() IN (c.buyer_agent_id, c.seller_agent_id)
  )
);

DROP POLICY IF EXISTS "Connection members can read messages" ON public.messages;
CREATE POLICY "Verified connection agents can read messages"
ON public.messages FOR SELECT TO authenticated
USING (
  public.is_verified_agent(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exchange_connections c
    WHERE c.id = connection_id AND auth.uid() IN (c.buyer_agent_id, c.seller_agent_id)
  )
);

DROP POLICY IF EXISTS "Agents can read own connections" ON public.exchange_connections;
CREATE POLICY "Verified agents read own connections"
ON public.exchange_connections FOR SELECT TO authenticated
USING (
  public.is_verified_agent(auth.uid())
  AND auth.uid() IN (buyer_agent_id, seller_agent_id)
);

DROP POLICY IF EXISTS "Agents can update own connections" ON public.exchange_connections;
CREATE POLICY "Verified agents can update own connections"
ON public.exchange_connections FOR UPDATE TO authenticated
USING (public.is_verified_agent(auth.uid()) AND auth.uid() IN (buyer_agent_id, seller_agent_id))
WITH CHECK (
  public.is_verified_agent(auth.uid())
  AND auth.uid() IN (buyer_agent_id, seller_agent_id)
  AND public.is_verified_agent(buyer_agent_id)
  AND public.is_verified_agent(seller_agent_id)
);

-- Direct message content stays immutable, and investors in legacy connection
-- rows cannot send new content after this migration.
REVOKE INSERT ON public.exchange_connections FROM authenticated;
GRANT SELECT ON public.agent_representations, public.representation_invites,
  public.exchange_agent_assignments, public.agent_contact_requests,
  public.agent_match_recommendations, public.client_agent_threads,
  public.client_agent_messages TO authenticated;
GRANT INSERT ON public.client_agent_threads, public.client_agent_messages TO authenticated;
GRANT ALL ON public.agent_representations, public.representation_invites,
  public.exchange_agent_assignments, public.agent_contact_requests,
  public.agent_match_recommendations, public.client_agent_threads,
  public.client_agent_messages TO service_role;
GRANT SELECT ON public.legacy_investor_communications_audit TO authenticated;
GRANT ALL ON public.legacy_investor_communications_audit TO service_role;

REVOKE ALL ON FUNCTION public.invite_representing_agent(text, text, uuid[], boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_investor_client(text, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_representation_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_agent_to_exchange(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_agent_referral(uuid, text, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_agent_contact(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_agent_connection(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recommend_match_to_client(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_match_recommendation(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_assign_representation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_agent_contact_request(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_representation_assignment(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_referred_agent(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_representation(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.invite_representing_agent(text, text, uuid[], boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_investor_client(text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_representation_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_agent_to_exchange(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_agent_referral(uuid, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_agent_contact(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_agent_connection(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recommend_match_to_client(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_match_recommendation(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_representation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_agent_contact_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_representation_assignment(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_referred_agent(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_representation(uuid, text) TO authenticated;

DROP TRIGGER IF EXISTS trg_agent_representations_updated_at ON public.agent_representations;
CREATE TRIGGER trg_agent_representations_updated_at BEFORE UPDATE ON public.agent_representations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_representation_invites_updated_at ON public.representation_invites;
CREATE TRIGGER trg_representation_invites_updated_at BEFORE UPDATE ON public.representation_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_exchange_agent_assignments_updated_at ON public.exchange_agent_assignments;
CREATE TRIGGER trg_exchange_agent_assignments_updated_at BEFORE UPDATE ON public.exchange_agent_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_agent_contact_requests_updated_at ON public.agent_contact_requests;
CREATE TRIGGER trg_agent_contact_requests_updated_at BEFORE UPDATE ON public.agent_contact_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_agent_match_recommendations_updated_at ON public.agent_match_recommendations;
CREATE TRIGGER trg_agent_match_recommendations_updated_at BEFORE UPDATE ON public.agent_match_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_client_agent_threads_updated_at ON public.client_agent_threads;
CREATE TRIGGER trg_client_agent_threads_updated_at BEFORE UPDATE ON public.client_agent_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assigned agents see the same listing and financial records as the investor,
-- while the investor remains the owner. Exact addresses remain governed by the
-- existing publication rule, except that the assigned agent may see the address
-- for the exchange they represent.
CREATE OR REPLACE FUNCTION public.pledged_properties_secure_rows()
RETURNS TABLE (
  id uuid, agent_id uuid, exchange_id uuid, property_name text, address text,
  address_is_public boolean, owner_authorization_confirmed boolean, city text, state text,
  zip text, county text, unit_suite text, asset_type public.asset_type, asset_subtype text,
  strategy_type public.strategy_type, source public.property_source,
  status public.pledged_property_status, units integer, year_built integer,
  building_square_footage numeric, land_area_acres numeric, num_buildings integer,
  num_stories integer, parking_spaces integer, parking_type text, property_class text,
  property_condition text, construction_type text, roof_type text, hvac_type text,
  zoning text, amenities text[], description text, recent_renovations text, is_demo boolean,
  listed_at timestamptz, withdrawn_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.agent_id, p.exchange_id, p.property_name,
    CASE
      WHEN p.address_is_public OR p.agent_id = auth.uid()
        OR public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      THEN p.address ELSE NULL::text
    END,
    p.address_is_public, p.owner_authorization_confirmed, p.city, p.state, p.zip, p.county,
    p.unit_suite, p.asset_type, p.asset_subtype, p.strategy_type, p.source, p.status, p.units,
    p.year_built, p.building_square_footage, p.land_area_acres, p.num_buildings, p.num_stories,
    p.parking_spaces, p.parking_type, p.property_class, p.property_condition, p.construction_type,
    p.roof_type, p.hvac_type, p.zoning, p.amenities, p.description, p.recent_renovations,
    p.is_demo, p.listed_at, p.withdrawn_at, p.created_at, p.updated_at
  FROM public.pledged_properties p
  WHERE auth.uid() IS NOT NULL
    AND (NOT p.is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND (
      p.agent_id = auth.uid()
      OR public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (
        p.status = 'active'::public.pledged_property_status
        AND EXISTS (
          SELECT 1 FROM public.matches m
          JOIN public.exchanges e ON e.id = m.buyer_exchange_id
          WHERE m.seller_property_id = p.id AND m.status = 'active'
            AND (e.agent_id = auth.uid() OR public.has_active_exchange_assignment(auth.uid(), e.id))
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.exchange_connections c
        WHERE c.seller_exchange_id = p.exchange_id
          AND c.status IN ('accepted', 'in_progress', 'completed')
          AND auth.uid() IN (c.buyer_agent_id, c.seller_agent_id)
      )
    );
END;
$$;

CREATE POLICY "Assigned agents can read investor properties"
ON public.pledged_properties FOR SELECT TO authenticated
USING (public.has_active_exchange_assignment(auth.uid(), exchange_id));
CREATE POLICY "Assigned agents can update investor properties"
ON public.pledged_properties FOR UPDATE TO authenticated
USING (
  public.has_active_exchange_assignment(auth.uid(), exchange_id)
  AND EXISTS (
    SELECT 1 FROM public.exchange_agent_assignments a
    WHERE a.exchange_id = pledged_properties.exchange_id AND a.agent_id = auth.uid()
      AND a.status = 'active' AND a.can_manage_listing
  )
)
WITH CHECK (public.has_active_exchange_assignment(auth.uid(), exchange_id));

CREATE OR REPLACE FUNCTION public.guard_represented_property_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() IS DISTINCT FROM OLD.agent_id
     AND public.has_active_exchange_assignment(auth.uid(), OLD.exchange_id)
     AND (
       NEW.agent_id IS DISTINCT FROM OLD.agent_id
       OR NEW.exchange_id IS DISTINCT FROM OLD.exchange_id
       OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
     )
  THEN
    RAISE EXCEPTION 'Representing agents cannot change property ownership fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_represented_property_ownership ON public.pledged_properties;
CREATE TRIGGER trg_guard_represented_property_ownership
BEFORE UPDATE ON public.pledged_properties
FOR EACH ROW EXECUTE FUNCTION public.guard_represented_property_ownership();

CREATE POLICY "Assigned agents can read investor financials"
ON public.property_financials FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));
CREATE POLICY "Assigned agents can manage investor financials"
ON public.property_financials FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));

CREATE POLICY "Assigned agents can read investor property images"
ON public.property_images FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));
CREATE POLICY "Assigned agents can manage investor property images"
ON public.property_images FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));

CREATE POLICY "Assigned agents can read investor property documents"
ON public.property_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));
CREATE POLICY "Assigned agents can manage investor property documents"
ON public.property_documents FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pledged_properties p
  WHERE p.id = property_id AND public.has_active_exchange_assignment(auth.uid(), p.exchange_id)
));

CREATE POLICY "Assigned agents can manage investor criteria"
ON public.replacement_criteria FOR ALL TO authenticated
USING (public.has_active_exchange_assignment(auth.uid(), exchange_id))
WITH CHECK (public.has_active_exchange_assignment(auth.uid(), exchange_id));

NOTIFY pgrst, 'reload schema';
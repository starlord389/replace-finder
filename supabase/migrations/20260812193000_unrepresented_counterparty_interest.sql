-- Preserve agent interest when one side of a matched opportunity is a
-- self-managed investor who has not assigned an agent yet. Investors remain
-- able to publish and receive interest, while all counterparty communication
-- continues to occur only between verified agents.

CREATE TABLE IF NOT EXISTS public.agent_connection_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  buyer_exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  seller_exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  initiating_agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initiated_by text NOT NULL CHECK (initiated_by IN ('buyer_agent', 'seller_agent')),
  waiting_on_side text NOT NULL CHECK (waiting_on_side IN ('buyer', 'seller')),
  waiting_exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  waiting_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_request_id uuid REFERENCES public.agent_contact_requests(id) ON DELETE SET NULL,
  connection_id uuid REFERENCES public.exchange_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'awaiting_representation'
    CHECK (status IN ('awaiting_representation', 'connected', 'conflict', 'cancelled')),
  is_demo boolean NOT NULL DEFAULT false,
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_connection_intents_waiting_owner
  ON public.agent_connection_intents(waiting_owner_id, is_demo, status, last_requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_connection_intents_waiting_exchange
  ON public.agent_connection_intents(waiting_exchange_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_connection_intents_initiating_agent
  ON public.agent_connection_intents(initiating_agent_id, status, last_requested_at DESC);

ALTER TABLE public.agent_connection_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized participants can read connection intents" ON public.agent_connection_intents;
CREATE POLICY "Authorized participants can read connection intents"
ON public.agent_connection_intents FOR SELECT TO authenticated
USING (
  initiating_agent_id = auth.uid()
  OR waiting_owner_id = auth.uid()
  OR public.has_active_exchange_assignment(auth.uid(), waiting_exchange_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

REVOKE ALL ON public.agent_connection_intents FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.agent_connection_intents FROM authenticated;
GRANT SELECT ON public.agent_connection_intents TO authenticated;
GRANT ALL ON public.agent_connection_intents TO service_role;

DROP TRIGGER IF EXISTS trg_agent_connection_intents_updated_at ON public.agent_connection_intents;
CREATE TRIGGER trg_agent_connection_intents_updated_at
BEFORE UPDATE ON public.agent_connection_intents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.queue_agent_connection_intent(
  p_match_id uuid,
  p_request_id uuid,
  p_initiating_agent_id uuid,
  p_initiated_by text,
  p_waiting_side text,
  p_waiting_exchange_id uuid,
  p_waiting_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_property public.pledged_properties%ROWTYPE;
  v_waiting_exchange public.exchanges%ROWTYPE;
  v_intent_id uuid;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active match not found.'; END IF;
  SELECT * INTO v_property FROM public.pledged_properties WHERE id = v_match.seller_property_id;
  SELECT * INTO v_waiting_exchange FROM public.exchanges WHERE id = p_waiting_exchange_id;

  IF NOT FOUND
     OR v_waiting_exchange.owner_type <> 'investor'
     OR v_waiting_exchange.agent_id <> p_waiting_owner_id THEN
    RAISE EXCEPTION 'The unrepresented investor exchange was not found.';
  END IF;
  IF p_initiated_by NOT IN ('buyer_agent', 'seller_agent') THEN
    RAISE EXCEPTION 'Invalid initiating side.';
  END IF;
  IF p_waiting_side NOT IN ('buyer', 'seller') THEN
    RAISE EXCEPTION 'Invalid waiting side.';
  END IF;

  INSERT INTO public.agent_connection_intents(
    match_id, buyer_exchange_id, seller_exchange_id, property_id,
    initiating_agent_id, initiated_by, waiting_on_side, waiting_exchange_id,
    waiting_owner_id, contact_request_id, status, is_demo, last_requested_at,
    connection_id, resolved_at, resolution_note
  ) VALUES (
    v_match.id, v_match.buyer_exchange_id, v_property.exchange_id, v_property.id,
    p_initiating_agent_id, p_initiated_by, p_waiting_side, p_waiting_exchange_id,
    p_waiting_owner_id, p_request_id, 'awaiting_representation', v_property.is_demo, now(),
    NULL, NULL, NULL
  )
  ON CONFLICT (match_id) DO UPDATE SET
    buyer_exchange_id = EXCLUDED.buyer_exchange_id,
    seller_exchange_id = EXCLUDED.seller_exchange_id,
    property_id = EXCLUDED.property_id,
    initiating_agent_id = EXCLUDED.initiating_agent_id,
    initiated_by = EXCLUDED.initiated_by,
    waiting_on_side = EXCLUDED.waiting_on_side,
    waiting_exchange_id = EXCLUDED.waiting_exchange_id,
    waiting_owner_id = EXCLUDED.waiting_owner_id,
    contact_request_id = COALESCE(EXCLUDED.contact_request_id, agent_connection_intents.contact_request_id),
    status = 'awaiting_representation',
    is_demo = EXCLUDED.is_demo,
    last_requested_at = now(),
    connection_id = NULL,
    resolved_at = NULL,
    resolution_note = NULL,
    updated_at = now()
  RETURNING id INTO v_intent_id;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.agent_contact_requests
    SET status = 'awaiting_counterparty_agent', acted_at = now(), updated_at = now()
    WHERE id = p_request_id AND match_id = p_match_id;
  END IF;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  SELECT
    p_waiting_owner_id,
    'representation_required',
    CASE WHEN p_waiting_side = 'seller'
      THEN 'A buyer''s agent is interested in your listing'
      ELSE 'The listing agent wants to discuss your exchange'
    END,
    'Choose an agent for this exchange. Once assigned, the two verified agents will be connected automatically.',
    '/investor/representation?inquiry=' || v_intent_id,
    jsonb_build_object(
      'intent_id', v_intent_id,
      'match_id', p_match_id,
      'exchange_id', p_waiting_exchange_id,
      'property_id', v_property.id
    )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = p_waiting_owner_id
      AND n.type = 'representation_required'
      AND n.metadata->>'intent_id' = v_intent_id::text
      AND n.created_at > now() - interval '24 hours'
  );

  RETURN v_intent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_agent_connection_intent(uuid, uuid, uuid, text, text, uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.resolve_agent_connection_intent(p_intent_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent public.agent_connection_intents%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_buyer_exchange public.exchanges%ROWTYPE;
  v_seller_property public.pledged_properties%ROWTYPE;
  v_seller_exchange public.exchanges%ROWTYPE;
  v_buyer_agent uuid;
  v_seller_agent uuid;
  v_connection_id uuid;
  v_connection_status text;
BEGIN
  SELECT * INTO v_intent
  FROM public.agent_connection_intents
  WHERE id = p_intent_id AND status = 'awaiting_representation'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_match FROM public.matches WHERE id = v_intent.match_id AND status = 'active';
  IF NOT FOUND THEN
    UPDATE public.agent_connection_intents
    SET status = 'cancelled', resolved_at = now(), resolution_note = 'The match is no longer active.'
    WHERE id = v_intent.id;
    RETURN NULL;
  END IF;
  SELECT * INTO v_buyer_exchange FROM public.exchanges WHERE id = v_match.buyer_exchange_id;
  SELECT * INTO v_seller_property FROM public.pledged_properties WHERE id = v_match.seller_property_id;
  IF v_seller_property.exchange_id IS NOT NULL THEN
    SELECT * INTO v_seller_exchange FROM public.exchanges WHERE id = v_seller_property.exchange_id;
  END IF;

  IF v_buyer_exchange.owner_type = 'agent' THEN
    v_buyer_agent := v_buyer_exchange.agent_id;
  ELSE
    SELECT a.agent_id INTO v_buyer_agent
    FROM public.exchange_agent_assignments a
    JOIN public.agent_representations r ON r.id = a.representation_id
    WHERE a.exchange_id = v_buyer_exchange.id
      AND a.status = 'active' AND a.is_primary AND r.status = 'active'
    LIMIT 1;
  END IF;

  IF v_seller_property.exchange_id IS NULL THEN
    v_seller_agent := v_seller_property.agent_id;
  ELSIF v_seller_exchange.owner_type = 'agent' THEN
    v_seller_agent := v_seller_exchange.agent_id;
  ELSE
    SELECT a.agent_id INTO v_seller_agent
    FROM public.exchange_agent_assignments a
    JOIN public.agent_representations r ON r.id = a.representation_id
    WHERE a.exchange_id = v_seller_exchange.id
      AND a.status = 'active' AND a.is_primary AND r.status = 'active'
    LIMIT 1;
  END IF;

  IF v_buyer_agent IS NULL OR NOT public.is_verified_agent(v_buyer_agent)
     OR v_seller_agent IS NULL OR NOT public.is_verified_agent(v_seller_agent) THEN
    RETURN NULL;
  END IF;

  IF v_buyer_agent = v_seller_agent THEN
    UPDATE public.agent_connection_intents
    SET status = 'conflict', resolved_at = now(),
        resolution_note = 'The same agent is assigned to both sides; administrator review is required.'
    WHERE id = v_intent.id;
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_intent.waiting_owner_id, 'system', 'Agent conflict needs review',
      'The same agent is assigned to both sides of this opportunity. The platform team must review representation before a conversation can begin.',
      '/investor/representation?inquiry=' || v_intent.id,
      jsonb_build_object('intent_id', v_intent.id, 'match_id', v_intent.match_id)
    );
    RETURN NULL;
  END IF;

  SELECT id, status INTO v_connection_id, v_connection_status
  FROM public.exchange_connections
  WHERE match_id = v_intent.match_id
    AND buyer_agent_id = v_buyer_agent
    AND seller_agent_id = v_seller_agent
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_connection_id IS NULL THEN
    INSERT INTO public.exchange_connections(
      match_id, buyer_exchange_id, seller_exchange_id, buyer_agent_id, seller_agent_id,
      initiated_by, status, accepted_at
    ) VALUES (
      v_intent.match_id, v_buyer_exchange.id, v_seller_property.exchange_id,
      v_buyer_agent, v_seller_agent, v_intent.initiated_by, 'accepted', now()
    ) RETURNING id INTO v_connection_id;
  ELSIF v_connection_status IN ('pending', 'declined', 'cancelled') THEN
    UPDATE public.exchange_connections
    SET status = 'accepted', accepted_at = now(), declined_at = NULL,
        decline_reason = NULL, closed_at = NULL, failed_at = NULL,
        failure_reason = NULL, updated_at = now()
    WHERE id = v_connection_id;
  END IF;

  UPDATE public.agent_connection_intents
  SET status = 'connected', connection_id = v_connection_id, resolved_at = now(),
      resolution_note = 'Both verified agents were connected automatically.'
  WHERE id = v_intent.id;

  IF v_intent.contact_request_id IS NOT NULL THEN
    UPDATE public.agent_contact_requests
    SET representing_agent_id = v_buyer_agent, connection_id = v_connection_id,
        status = 'contacted', acted_at = now(), updated_at = now()
    WHERE id = v_intent.contact_request_id;
  END IF;

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES
    (v_buyer_agent, 'connection_request', 'Agent conversation ready',
      'Representation is in place and the agent-to-agent conversation is ready.',
      '/agent/connections/' || v_connection_id,
      jsonb_build_object('connection_id', v_connection_id, 'match_id', v_intent.match_id, 'intent_id', v_intent.id)),
    (v_seller_agent, 'connection_request', 'New agent conversation',
      'A verified agent representing a matched opportunity is ready to talk about this listing.',
      '/agent/connections/' || v_connection_id,
      jsonb_build_object('connection_id', v_connection_id, 'match_id', v_intent.match_id, 'intent_id', v_intent.id)),
    (v_intent.waiting_owner_id, 'system', 'Your agents are connected',
      'Your assigned agent can now communicate with the agent on the other side.',
      '/investor/representation?inquiry=' || v_intent.id,
      jsonb_build_object('connection_id', v_connection_id, 'match_id', v_intent.match_id, 'intent_id', v_intent.id));

  RETURN v_connection_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_agent_connection_intent(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.on_exchange_assignment_resolve_connection_intents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent record;
BEGIN
  IF NEW.status = 'active' AND NEW.is_primary THEN
    FOR v_intent IN
      SELECT id FROM public.agent_connection_intents
      WHERE waiting_exchange_id = NEW.exchange_id AND status = 'awaiting_representation'
      ORDER BY last_requested_at
    LOOP
      PERFORM public.resolve_agent_connection_intent(v_intent.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.on_exchange_assignment_resolve_connection_intents() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_resolve_connection_intents_on_assignment ON public.exchange_agent_assignments;
CREATE TRIGGER trg_resolve_connection_intents_on_assignment
AFTER INSERT OR UPDATE OF status, is_primary, agent_id ON public.exchange_agent_assignments
FOR EACH ROW EXECUTE FUNCTION public.on_exchange_assignment_resolve_connection_intents();

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
  v_connection_status text;
  v_conversation_started boolean := false;
BEGIN
  IF NOT public.is_verified_agent(v_uid) THEN RAISE EXCEPTION 'Only a verified agent can contact the other side.'; END IF;

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
    WHERE r.id = p_request_id AND r.match_id = p_match_id
      AND r.exchange_id = v_buyer_exchange.id AND r.representing_agent_id = v_uid
  ) THEN RAISE EXCEPTION 'The client contact request does not belong to this match.';
  END IF;

  IF v_buyer_agent IS NULL OR NOT public.is_verified_agent(v_buyer_agent) THEN
    IF v_buyer_exchange.owner_type = 'investor' AND v_my_side = 'seller_agent' THEN
      PERFORM public.queue_agent_connection_intent(
        p_match_id, p_request_id, v_uid, v_my_side, 'buyer',
        v_buyer_exchange.id, v_buyer_exchange.agent_id
      );
    ELSE
      INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
      SELECT v_buyer_exchange.agent_id, 'representation_required', 'An agent is interested in your exchange',
        'Assign a representing agent so the two agents can connect.', '/investor/representation',
        jsonb_build_object('match_id', p_match_id, 'exchange_id', v_buyer_exchange.id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications n WHERE n.user_id = v_buyer_exchange.agent_id
          AND n.type = 'representation_required' AND n.metadata->>'match_id' = p_match_id::text
          AND n.created_at > now() - interval '24 hours'
      );
    END IF;
    RETURN NULL;
  END IF;

  IF v_seller_agent IS NULL OR NOT public.is_verified_agent(v_seller_agent) THEN
    IF v_seller_property.exchange_id IS NOT NULL
       AND v_seller_exchange.owner_type = 'investor'
       AND v_my_side = 'buyer_agent' THEN
      PERFORM public.queue_agent_connection_intent(
        p_match_id, p_request_id, v_uid, v_my_side, 'seller',
        v_seller_exchange.id, v_seller_exchange.agent_id
      );
    ELSE
      INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
      SELECT COALESCE(v_seller_exchange.agent_id, v_seller_property.agent_id),
        'representation_required', 'Complete verification to receive agent conversations',
        'Verify your agent profile before responding to matched opportunities.', '/agent/launchpad',
        jsonb_build_object('match_id', p_match_id, 'exchange_id', v_seller_property.exchange_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = COALESCE(v_seller_exchange.agent_id, v_seller_property.agent_id)
          AND n.type = 'representation_required' AND n.metadata->>'match_id' = p_match_id::text
          AND n.created_at > now() - interval '24 hours'
      );
    END IF;
    RETURN NULL;
  END IF;

  IF v_buyer_agent = v_seller_agent THEN RAISE EXCEPTION 'The same agent cannot automatically represent both sides. Ask an administrator to review the conflict.'; END IF;

  SELECT id, status INTO v_connection_id, v_connection_status
  FROM public.exchange_connections
  WHERE match_id = p_match_id
    AND buyer_agent_id = v_buyer_agent
    AND seller_agent_id = v_seller_agent
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF v_connection_id IS NULL THEN
    INSERT INTO public.exchange_connections(
      match_id, buyer_exchange_id, seller_exchange_id, buyer_agent_id, seller_agent_id,
      initiated_by, status, accepted_at
    ) VALUES (
      p_match_id, v_buyer_exchange.id, v_seller_property.exchange_id,
      v_buyer_agent, v_seller_agent, v_my_side, 'accepted', now()
    ) RETURNING id INTO v_connection_id;
    v_conversation_started := true;
  ELSIF v_connection_status IN ('pending', 'declined', 'cancelled') THEN
    UPDATE public.exchange_connections
    SET status = 'accepted', accepted_at = CASE WHEN v_connection_status = 'pending' THEN COALESCE(accepted_at, now()) ELSE now() END,
        declined_at = NULL, closed_at = NULL, decline_reason = NULL,
        failed_at = NULL, failure_reason = NULL, updated_at = now()
    WHERE id = v_connection_id;
    v_conversation_started := FOUND;
  END IF;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.agent_contact_requests
    SET connection_id = v_connection_id, status = 'contacted', acted_at = now(), updated_at = now()
    WHERE id = p_request_id AND representing_agent_id = v_uid;
  END IF;

  UPDATE public.agent_connection_intents
  SET status = 'connected', connection_id = v_connection_id, resolved_at = now(),
      resolution_note = 'Both agents connected during a later request.'
  WHERE match_id = p_match_id AND status = 'awaiting_representation';

  IF v_conversation_started THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      CASE WHEN v_uid = v_buyer_agent THEN v_seller_agent ELSE v_buyer_agent END,
      'connection_request', 'New agent conversation',
      'A verified agent started a conversation about a matched exchange opportunity.',
      '/agent/connections/' || v_connection_id,
      jsonb_build_object('connection_id', v_connection_id, 'match_id', p_match_id)
    );
  END IF;

  RETURN v_connection_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_agent_connection(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_agent_connection(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

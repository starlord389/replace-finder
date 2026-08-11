-- Verified agents do not need a second approval step to begin a conversation.
-- The existing RPC remains the only creation path, so assignment, verification,
-- match ownership, and same-agent conflict checks continue to apply.

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

  -- Serialize creation for this match so simultaneous starts cannot create
  -- duplicate conversation rows.
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
      CASE WHEN v_seller_exchange.owner_type = 'investor' THEN 'An agent is interested in your listing' ELSE 'Complete verification to receive agent conversations' END,
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

  SELECT id, status INTO v_connection_id, v_connection_status
  FROM public.exchange_connections
  WHERE match_id = p_match_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_connection_id IS NULL THEN
    INSERT INTO public.exchange_connections(
      match_id, buyer_exchange_id, seller_exchange_id, buyer_agent_id, seller_agent_id,
      initiated_by, status, accepted_at
    ) VALUES (
      p_match_id, v_buyer_exchange.id, v_seller_property.exchange_id, v_buyer_agent, v_seller_agent,
      v_my_side, 'accepted', now()
    ) RETURNING id INTO v_connection_id;
    v_conversation_started := true;
  ELSIF v_connection_status IN ('pending', 'declined', 'cancelled') THEN
    UPDATE public.exchange_connections
    SET status = 'accepted',
        accepted_at = CASE WHEN v_connection_status = 'pending' THEN COALESCE(accepted_at, now()) ELSE now() END,
        declined_at = NULL,
        closed_at = NULL,
        decline_reason = NULL,
        failed_at = NULL,
        failure_reason = NULL,
        updated_at = now()
    WHERE id = v_connection_id;
    v_conversation_started := FOUND;
  END IF;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.agent_contact_requests
    SET connection_id = v_connection_id, status = 'contacted', acted_at = now(), updated_at = now()
    WHERE id = p_request_id AND representing_agent_id = v_uid;
  END IF;

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

-- Unstick conversations created under the former approval workflow. Only rows
-- whose two participants are still verified agents are activated.
UPDATE public.exchange_connections
SET status = 'accepted',
    accepted_at = COALESCE(accepted_at, now()),
    updated_at = now()
WHERE status = 'pending'
  AND public.is_verified_agent(buyer_agent_id)
  AND public.is_verified_agent(seller_agent_id);

NOTIFY pgrst, 'reload schema';
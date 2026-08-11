-- One durable opportunity workflow shared by Match Next Steps and Pipeline.
-- Browser-local lifecycle flags are retained only as a temporary frontend
-- fallback; this table is the canonical cross-device, cross-account state.

CREATE TABLE IF NOT EXISTS public.match_workflow_states (
  match_id uuid PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  current_stage text NOT NULL DEFAULT 'new'
    CHECK (current_stage IN (
      'new', 'sent_to_client', 'client_interested', 'in_conversation',
      'offer_sent', 'under_contract', 'closed', 'archived'
    )),
  sent_to_client_at timestamptz,
  client_interested_at timestamptz,
  conversation_started_at timestamptz,
  offer_sent_at timestamptz,
  under_contract_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  stage_source text NOT NULL DEFAULT 'system',
  stage_note text CHECK (stage_note IS NULL OR char_length(stage_note) <= 2000),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL CHECK (to_stage IN (
    'new', 'sent_to_client', 'client_interested', 'in_conversation',
    'offer_sent', 'under_contract', 'closed', 'archived'
  )),
  source text NOT NULL,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_workflow_states_stage
  ON public.match_workflow_states(current_stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_workflow_events_match
  ON public.match_workflow_events(match_id, created_at DESC);

ALTER TABLE public.match_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_workflow_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_match_workflow(p_match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.exchanges buyer_exchange ON buyer_exchange.id = m.buyer_exchange_id
    JOIN public.pledged_properties seller_property ON seller_property.id = m.seller_property_id
    LEFT JOIN public.exchanges seller_exchange ON seller_exchange.id = seller_property.exchange_id
    WHERE m.id = p_match_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR buyer_exchange.agent_id = auth.uid()
        OR public.has_active_exchange_assignment(auth.uid(), buyer_exchange.id)
        OR seller_property.agent_id = auth.uid()
        OR (
          seller_exchange.id IS NOT NULL
          AND public.has_active_exchange_assignment(auth.uid(), seller_exchange.id)
        )
        OR EXISTS (
          SELECT 1
          FROM public.exchange_connections c
          WHERE c.match_id = m.id
            AND auth.uid() IN (c.buyer_agent_id, c.seller_agent_id)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_match_workflow(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_match_workflow(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Workflow participants read current state" ON public.match_workflow_states;
CREATE POLICY "Workflow participants read current state"
ON public.match_workflow_states FOR SELECT TO authenticated
USING (public.can_access_match_workflow(match_id));

DROP POLICY IF EXISTS "Workflow participants read history" ON public.match_workflow_events;
CREATE POLICY "Workflow participants read history"
ON public.match_workflow_events FOR SELECT TO authenticated
USING (public.can_access_match_workflow(match_id));

-- Triggers and the guarded RPC are the only write paths.
REVOKE INSERT, UPDATE, DELETE ON public.match_workflow_states FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.match_workflow_events FROM authenticated;
GRANT SELECT ON public.match_workflow_states, public.match_workflow_events TO authenticated;
GRANT ALL ON public.match_workflow_states, public.match_workflow_events TO service_role;

CREATE OR REPLACE FUNCTION public.apply_match_workflow_stage(
  p_match_id uuid,
  p_stage text,
  p_source text,
  p_actor_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_allow_backward boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state public.match_workflow_states%ROWTYPE;
  v_from text;
  v_from_rank integer;
  v_to_rank integer;
  v_should_change boolean := false;
BEGIN
  IF p_stage NOT IN (
    'new', 'sent_to_client', 'client_interested', 'in_conversation',
    'offer_sent', 'under_contract', 'closed', 'archived'
  ) THEN
    RAISE EXCEPTION 'Invalid workflow stage.';
  END IF;

  INSERT INTO public.match_workflow_states(match_id)
  VALUES (p_match_id)
  ON CONFLICT (match_id) DO NOTHING;

  SELECT * INTO v_state
  FROM public.match_workflow_states
  WHERE match_id = p_match_id
  FOR UPDATE;

  v_from := v_state.current_stage;
  v_from_rank := CASE v_from
    WHEN 'new' THEN 0 WHEN 'sent_to_client' THEN 1 WHEN 'client_interested' THEN 2
    WHEN 'in_conversation' THEN 3 WHEN 'offer_sent' THEN 4 WHEN 'under_contract' THEN 5
    WHEN 'closed' THEN 6 WHEN 'archived' THEN 7 ELSE 0 END;
  v_to_rank := CASE p_stage
    WHEN 'new' THEN 0 WHEN 'sent_to_client' THEN 1 WHEN 'client_interested' THEN 2
    WHEN 'in_conversation' THEN 3 WHEN 'offer_sent' THEN 4 WHEN 'under_contract' THEN 5
    WHEN 'closed' THEN 6 WHEN 'archived' THEN 7 ELSE 0 END;

  v_should_change := v_from IS DISTINCT FROM p_stage AND (
    p_allow_backward
    OR p_stage = 'archived'
    OR (v_from = 'archived' AND p_stage IN ('in_conversation', 'offer_sent', 'under_contract', 'closed'))
    OR (v_from <> 'closed' AND v_to_rank > v_from_rank)
  );

  IF NOT v_should_change THEN
    RETURN v_from;
  END IF;

  UPDATE public.match_workflow_states
  SET current_stage = p_stage,
      sent_to_client_at = CASE WHEN p_stage = 'sent_to_client' THEN COALESCE(sent_to_client_at, now()) ELSE sent_to_client_at END,
      client_interested_at = CASE WHEN p_stage = 'client_interested' THEN COALESCE(client_interested_at, now()) ELSE client_interested_at END,
      conversation_started_at = CASE WHEN p_stage = 'in_conversation' THEN COALESCE(conversation_started_at, now()) ELSE conversation_started_at END,
      offer_sent_at = CASE WHEN p_stage = 'offer_sent' THEN COALESCE(offer_sent_at, now()) ELSE offer_sent_at END,
      under_contract_at = CASE WHEN p_stage = 'under_contract' THEN COALESCE(under_contract_at, now()) ELSE under_contract_at END,
      closed_at = CASE WHEN p_stage = 'closed' THEN COALESCE(closed_at, now()) ELSE closed_at END,
      archived_at = CASE WHEN p_stage = 'archived' THEN now() ELSE NULL END,
      stage_source = COALESCE(NULLIF(btrim(p_source), ''), 'system'),
      stage_note = NULLIF(btrim(p_note), ''),
      updated_by = p_actor_id,
      updated_at = now()
  WHERE match_id = p_match_id;

  INSERT INTO public.match_workflow_events(
    match_id, from_stage, to_stage, source, note, actor_id
  ) VALUES (
    p_match_id, v_from, p_stage,
    COALESCE(NULLIF(btrim(p_source), ''), 'system'),
    NULLIF(btrim(p_note), ''), p_actor_id
  );

  RETURN p_stage;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_match_workflow_stage(uuid, text, text, uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_match_workflow_stage(uuid, text, text, uuid, text, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.record_match_workflow_stage(
  p_match_id uuid,
  p_stage text,
  p_source text DEFAULT 'manual_next_step',
  p_note text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match public.matches%ROWTYPE;
  v_buyer_exchange public.exchanges%ROWTYPE;
  v_seller_property public.pledged_properties%ROWTYPE;
  v_buyer_authorized boolean := false;
  v_seller_authorized boolean := false;
  v_investor_owner boolean := false;
  v_connection_id uuid;
  v_connection_status text;
  v_allow_backward boolean := false;
  v_result text;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Match not found.'; END IF;
  SELECT * INTO v_buyer_exchange FROM public.exchanges WHERE id = v_match.buyer_exchange_id;
  SELECT * INTO v_seller_property FROM public.pledged_properties WHERE id = v_match.seller_property_id;

  v_buyer_authorized := public.has_role(v_uid, 'admin'::public.app_role)
    OR (v_buyer_exchange.owner_type = 'agent' AND v_buyer_exchange.agent_id = v_uid)
    OR public.has_active_exchange_assignment(v_uid, v_buyer_exchange.id);
  v_investor_owner := v_buyer_exchange.owner_type = 'investor'
    AND v_buyer_exchange.agent_id = v_uid;

  v_seller_authorized := public.has_role(v_uid, 'admin'::public.app_role)
    OR (v_seller_property.agent_id = v_uid AND public.is_verified_agent(v_uid))
    OR (
      v_seller_property.exchange_id IS NOT NULL
      AND public.has_active_exchange_assignment(v_uid, v_seller_property.exchange_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.exchange_connections c
      WHERE c.match_id = p_match_id AND v_uid IN (c.buyer_agent_id, c.seller_agent_id)
    );

  IF p_stage IN ('sent_to_client', 'client_interested') AND NOT v_buyer_authorized THEN
    RAISE EXCEPTION 'Only the buyer-side representing agent can record this client stage.';
  END IF;
  IF NOT public.is_verified_agent(v_uid)
     AND NOT public.has_role(v_uid, 'admin'::public.app_role)
     AND NOT (v_investor_owner AND p_stage IN ('new', 'archived')) THEN
    RAISE EXCEPTION 'Only a verified agent can update this opportunity stage.';
  END IF;
  IF NOT v_buyer_authorized AND NOT v_seller_authorized AND NOT v_investor_owner THEN
    RAISE EXCEPTION 'You are not authorized for this opportunity.';
  END IF;

  SELECT c.id, c.status INTO v_connection_id, v_connection_status
  FROM public.exchange_connections c
  WHERE c.match_id = p_match_id
    AND (
      v_uid IN (c.buyer_agent_id, c.seller_agent_id)
      OR v_investor_owner
      OR public.has_role(v_uid, 'admin'::public.app_role)
    )
  ORDER BY c.created_at DESC
  LIMIT 1;

  -- A stage that says the two sides are communicating (or further along)
  -- must be backed by a real agent-to-agent connection. This prevents a
  -- Pipeline drag from fabricating a conversation that has no secure thread.
  IF p_stage IN ('in_conversation', 'offer_sent', 'under_contract', 'closed')
     AND (
       v_connection_id IS NULL
       OR v_connection_status NOT IN ('accepted', 'in_progress', 'completed')
     ) THEN
    RAISE EXCEPTION 'Start the agent-to-agent conversation before moving this opportunity to that stage.';
  END IF;
  IF p_stage IN ('new', 'sent_to_client', 'client_interested')
     AND v_connection_status IN ('accepted', 'in_progress', 'completed') THEN
    RAISE EXCEPTION 'An active agent conversation cannot be moved to a pre-conversation stage. Archive it if the opportunity has ended.';
  END IF;

  v_allow_backward := p_source IN ('pipeline_drag', 'stage_correction', 'reactivate');
  v_result := public.apply_match_workflow_stage(
    p_match_id, p_stage, p_source, v_uid, p_note, v_allow_backward
  );

  IF p_stage IN ('in_conversation', 'offer_sent') AND v_connection_id IS NOT NULL THEN
    UPDATE public.exchange_connections
    SET status = 'accepted',
        accepted_at = COALESCE(accepted_at, now()),
        under_contract_at = NULL,
        inspection_complete_at = NULL,
        financing_approved_at = NULL,
        closed_at = NULL,
        failed_at = NULL,
        failure_reason = NULL,
        updated_at = now()
    WHERE id = v_connection_id;
  ELSIF p_stage = 'under_contract' AND v_connection_id IS NOT NULL THEN
    UPDATE public.exchange_connections
    SET status = 'in_progress',
        under_contract_at = COALESCE(under_contract_at, now()),
        closed_at = NULL,
        failed_at = NULL,
        failure_reason = NULL,
        updated_at = now()
    WHERE id = v_connection_id;
  ELSIF p_stage = 'closed' AND v_connection_id IS NOT NULL THEN
    UPDATE public.exchange_connections
    SET status = 'completed',
        closed_at = COALESCE(closed_at, now()),
        updated_at = now()
    WHERE id = v_connection_id;
  ELSIF p_stage = 'archived' AND v_connection_id IS NOT NULL THEN
    UPDATE public.exchange_connections
    SET status = CASE WHEN status IN ('accepted', 'in_progress') THEN 'cancelled' ELSE status END,
        closed_at = CASE WHEN status IN ('accepted', 'in_progress') THEN COALESCE(closed_at, now()) ELSE closed_at END,
        failure_reason = COALESCE(NULLIF(btrim(p_note), ''), failure_reason),
        updated_at = now()
    WHERE id = v_connection_id;
  END IF;

  IF p_stage = 'archived' THEN
    UPDATE public.agent_contact_requests
    SET status = 'closed',
        acted_at = COALESCE(acted_at, now()),
        updated_at = now()
    WHERE match_id = p_match_id
      AND status NOT IN ('closed', 'declined');
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.record_match_workflow_stage(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_match_workflow_stage(uuid, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_match_workflow_from_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.apply_match_workflow_stage(NEW.id, 'new', 'match_created', NULL, NULL, false);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'active' THEN
      PERFORM public.apply_match_workflow_stage(NEW.id, 'new', 'match_reactivated', NULL, NULL, true);
    ELSE
      PERFORM public.apply_match_workflow_stage(NEW.id, 'archived', 'match_status', NULL, NEW.status, false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_match_workflow_from_recommendation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.response = 'interested' THEN
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'client_interested', 'client_response', NEW.investor_id, NEW.response_note,
      EXISTS (SELECT 1 FROM public.match_workflow_states s WHERE s.match_id = NEW.match_id AND s.current_stage = 'archived')
    );
  ELSIF NEW.response = 'passed' THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'archived', 'client_passed', NEW.investor_id, NEW.response_note, false);
  ELSE
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'sent_to_client', 'agent_recommendation', NEW.agent_id, NEW.note,
      EXISTS (SELECT 1 FROM public.match_workflow_states s WHERE s.match_id = NEW.match_id AND s.current_stage = 'archived')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_match_workflow_from_contact_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'declined' THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'archived', 'agent_declined_client_request', NEW.representing_agent_id, NEW.agent_note, false);
  ELSIF NEW.status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted') THEN
    -- A renewed/transferred request can reactivate an archived opportunity,
    -- but must never move an active conversation or contract backward.
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'client_interested', 'client_contact_request', NEW.investor_id, NEW.investor_note,
      EXISTS (SELECT 1 FROM public.match_workflow_states s WHERE s.match_id = NEW.match_id AND s.current_stage = 'archived')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_match_workflow_from_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' OR NEW.closed_at IS NOT NULL THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'closed', 'connection_closed', auth.uid(), NULL, false);
  ELSIF NEW.status = 'in_progress' OR NEW.under_contract_at IS NOT NULL THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'under_contract', 'connection_under_contract', auth.uid(), NULL, false);
  ELSIF NEW.status = 'accepted' THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'in_conversation', 'agent_conversation_started', auth.uid(), NULL, false);
  ELSIF NEW.status IN ('declined', 'cancelled') THEN
    PERFORM public.apply_match_workflow_stage(NEW.match_id, 'archived', 'connection_ended', auth.uid(), COALESCE(NEW.decline_reason, NEW.failure_reason), false);
  END IF;
  RETURN NEW;
END;
$$;

-- Reopening a declined/cancelled conversation starts a fresh active deal pass.
-- Without this normalization, an old under-contract timestamp would make the
-- AFTER trigger jump the opportunity straight back to Under Contract.
CREATE OR REPLACE FUNCTION public.normalize_reopened_connection_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IN ('declined', 'cancelled') THEN
    NEW.under_contract_at := NULL;
    NEW.inspection_complete_at := NULL;
    NEW.financing_approved_at := NULL;
    NEW.closed_at := NULL;
    NEW.failed_at := NULL;
    NEW.failure_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_match_workflow_match ON public.matches;
CREATE TRIGGER trg_sync_match_workflow_match
AFTER INSERT OR UPDATE OF status ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.sync_match_workflow_from_match();

DROP TRIGGER IF EXISTS trg_sync_match_workflow_recommendation ON public.agent_match_recommendations;
CREATE TRIGGER trg_sync_match_workflow_recommendation
AFTER INSERT OR UPDATE OF response, response_note ON public.agent_match_recommendations
FOR EACH ROW EXECUTE FUNCTION public.sync_match_workflow_from_recommendation();

DROP TRIGGER IF EXISTS trg_sync_match_workflow_contact_request ON public.agent_contact_requests;
CREATE TRIGGER trg_sync_match_workflow_contact_request
AFTER INSERT OR UPDATE OF status, agent_note ON public.agent_contact_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_match_workflow_from_contact_request();

DROP TRIGGER IF EXISTS trg_sync_match_workflow_connection ON public.exchange_connections;
DROP TRIGGER IF EXISTS trg_normalize_reopened_connection_milestones ON public.exchange_connections;
CREATE TRIGGER trg_normalize_reopened_connection_milestones
BEFORE UPDATE OF status ON public.exchange_connections
FOR EACH ROW EXECUTE FUNCTION public.normalize_reopened_connection_milestones();

CREATE TRIGGER trg_sync_match_workflow_connection
AFTER INSERT OR UPDATE OF status, under_contract_at, closed_at ON public.exchange_connections
FOR EACH ROW EXECUTE FUNCTION public.sync_match_workflow_from_connection();

-- Backfill every existing match from durable business records. The furthest
-- real stage wins; browser-local flags are intentionally not imported.
INSERT INTO public.match_workflow_states(
  match_id, current_stage, sent_to_client_at, client_interested_at,
  conversation_started_at, under_contract_at, closed_at, archived_at,
  stage_source, created_at, updated_at
)
SELECT
  m.id,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.exchange_connections c WHERE c.match_id = m.id AND (c.status = 'completed' OR c.closed_at IS NOT NULL)) THEN 'closed'
    WHEN EXISTS (SELECT 1 FROM public.exchange_connections c WHERE c.match_id = m.id AND (c.status = 'in_progress' OR c.under_contract_at IS NOT NULL)) THEN 'under_contract'
    WHEN EXISTS (SELECT 1 FROM public.exchange_connections c WHERE c.match_id = m.id AND c.status = 'accepted') THEN 'in_conversation'
    WHEN EXISTS (SELECT 1 FROM public.agent_match_recommendations r WHERE r.match_id = m.id AND r.response = 'interested')
      OR EXISTS (SELECT 1 FROM public.agent_contact_requests r WHERE r.match_id = m.id AND r.status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted')) THEN 'client_interested'
    WHEN EXISTS (SELECT 1 FROM public.agent_match_recommendations r WHERE r.match_id = m.id) THEN 'sent_to_client'
    WHEN m.status <> 'active'
      OR EXISTS (SELECT 1 FROM public.exchange_connections c WHERE c.match_id = m.id AND c.status IN ('declined', 'cancelled'))
      OR EXISTS (SELECT 1 FROM public.agent_match_recommendations r WHERE r.match_id = m.id AND r.response = 'passed') THEN 'archived'
    ELSE 'new'
  END,
  (SELECT min(r.created_at) FROM public.agent_match_recommendations r WHERE r.match_id = m.id),
  LEAST(
    (SELECT min(r.responded_at) FROM public.agent_match_recommendations r WHERE r.match_id = m.id AND r.response = 'interested'),
    (SELECT min(r.requested_at) FROM public.agent_contact_requests r WHERE r.match_id = m.id AND r.status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted'))
  ),
  (SELECT min(COALESCE(c.accepted_at, c.initiated_at)) FROM public.exchange_connections c WHERE c.match_id = m.id AND c.status IN ('accepted', 'in_progress', 'completed')),
  (SELECT min(c.under_contract_at) FROM public.exchange_connections c WHERE c.match_id = m.id AND c.under_contract_at IS NOT NULL),
  (SELECT min(c.closed_at) FROM public.exchange_connections c WHERE c.match_id = m.id AND c.closed_at IS NOT NULL),
  CASE WHEN m.status <> 'active' THEN COALESCE(m.updated_at, now()) ELSE NULL END,
  'backfill', m.created_at, now()
FROM public.matches m
ON CONFLICT (match_id) DO NOTHING;

INSERT INTO public.match_workflow_events(match_id, from_stage, to_stage, source, created_at)
SELECT s.match_id, NULL, s.current_stage, 'backfill', s.updated_at
FROM public.match_workflow_states s
WHERE NOT EXISTS (
  SELECT 1 FROM public.match_workflow_events e WHERE e.match_id = s.match_id
);

DROP TRIGGER IF EXISTS trg_match_workflow_states_updated_at ON public.match_workflow_states;
CREATE TRIGGER trg_match_workflow_states_updated_at
BEFORE UPDATE ON public.match_workflow_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'match_workflow_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_workflow_states;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';

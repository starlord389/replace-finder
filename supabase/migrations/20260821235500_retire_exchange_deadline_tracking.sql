-- ExchangeUp finds and coordinates replacement opportunities, but it does not
-- track or administer statutory 1031 identification or closing deadlines.
-- Keep the legacy columns so historical rows and older clients remain readable,
-- while retiring every active database behavior built around those columns.

DROP TRIGGER IF EXISTS trigger_auto_deadlines ON public.exchanges;
DROP TRIGGER IF EXISTS trg_exchanges_auto_deadlines ON public.exchanges;
DROP FUNCTION IF EXISTS public.auto_calculate_deadlines();

COMMENT ON COLUMN public.exchanges.identification_deadline IS
  'Legacy field retained for backward compatibility; ExchangeUp does not calculate, monitor, or notify on identification deadlines.';
COMMENT ON COLUMN public.exchanges.closing_deadline IS
  'Legacy field retained for backward compatibility; ExchangeUp does not calculate, monitor, or notify on exchange closing deadlines.';

CREATE OR REPLACE FUNCTION public.admin_get_command_center(p_data_scope text)
RETURNS TABLE (snapshot jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_demo boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000'; END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be live or demo' USING ERRCODE = '22023';
  END IF;
  v_demo := p_data_scope = 'demo';

  RETURN QUERY
  WITH scoped_matches AS (
    SELECT m.* FROM public.matches m
    JOIN public.exchanges e ON e.id = m.buyer_exchange_id AND e.is_demo = v_demo
    JOIN public.pledged_properties p ON p.id = m.seller_property_id AND p.is_demo = v_demo
  ), scoped_connections AS (
    SELECT c.* FROM public.exchange_connections c
    JOIN public.exchanges be ON be.id = c.buyer_exchange_id AND be.is_demo = v_demo
    LEFT JOIN public.exchanges se ON se.id = c.seller_exchange_id
    WHERE se.id IS NULL OR se.is_demo = v_demo
  ), attention_source AS (
    SELECT concat('support-', st.id) AS id,
      CASE WHEN st.status = 'open' AND st.created_at < now() - interval '2 days' THEN 0 ELSE 1 END AS priority_order,
      CASE WHEN st.status = 'open' AND st.created_at < now() - interval '2 days' THEN 'critical' ELSE 'high' END AS priority,
      'support'::text AS category,
      st.subject AS title,
      concat(replace(st.category, '_', ' '), ' support ticket · ', replace(st.status::text, '_', ' ')) AS detail,
      st.created_at AS occurred_at,
      concat('/admin/support?ticket=', st.id) AS href
    FROM public.support_tickets st
    WHERE st.is_demo = v_demo AND st.status IN ('open', 'in_progress')
    UNION ALL
    SELECT concat('connection-', c.id), 2, 'medium', 'connection', 'Connection awaiting response',
      concat(COALESCE(bp.full_name, bp.email, 'Buyer agent'), ' → ', COALESCE(sp.full_name, sp.email, 'Seller agent')),
      c.created_at, concat('/admin/opportunities/connections/', c.id)
    FROM scoped_connections c
    LEFT JOIN public.profiles bp ON bp.id = c.buyer_agent_id
    LEFT JOIN public.profiles sp ON sp.id = c.seller_agent_id
    WHERE c.status = 'pending'
    UNION ALL
    SELECT concat('representation-', ar.id), 2, 'medium', 'representation',
      CASE ar.status WHEN 'awaiting_agent' THEN 'Property owner is waiting for an agent'
        WHEN 'pending_verification' THEN 'Representation is waiting on email confirmation'
        ELSE 'Representation is waiting on owner confirmation' END,
      concat(ar.investor_email, ' · ', COALESCE(ar.agent_email, 'No agent assigned')),
      ar.updated_at, concat('/admin/representation-requests?q=', ar.investor_email)
    FROM public.agent_representations ar
    WHERE ar.is_demo = v_demo AND ar.status IN ('awaiting_agent', 'pending_verification', 'awaiting_investor_confirmation')
    UNION ALL
    SELECT concat('representation-invite-', ri.id), 1, 'high', 'representation',
      'Representation invitation failed to deliver',
      concat(ri.email, ' · ', COALESCE(ri.delivery_error_code, 'delivery error')),
      ri.updated_at, concat('/admin/representation-requests?q=', ri.email)
    FROM public.representation_invites ri
    JOIN public.agent_representations ar ON ar.id = ri.representation_id AND ar.is_demo = v_demo
    WHERE ri.delivery_status = 'failed' AND ri.status = 'pending'
    UNION ALL
    SELECT concat('contact-request-', acr.id), 2, 'medium', 'representation',
      CASE WHEN acr.status = 'requested' THEN 'Client request needs an agent response' ELSE 'Contact request is waiting on the other side' END,
      COALESCE(p.full_name, p.email, 'Property owner'), acr.updated_at,
      concat('/admin/users/', acr.investor_id, '?tab=relationships')
    FROM public.agent_contact_requests acr
    JOIN public.exchanges e ON e.id = acr.exchange_id AND e.is_demo = v_demo
    LEFT JOIN public.profiles p ON p.id = acr.investor_id
    WHERE acr.status IN ('requested', 'awaiting_counterparty_agent')
    UNION ALL
    SELECT concat('intent-', aci.id), CASE WHEN aci.status = 'conflict' THEN 1 ELSE 2 END,
      CASE WHEN aci.status = 'conflict' THEN 'high' ELSE 'medium' END, 'representation',
      CASE WHEN aci.status = 'conflict' THEN 'Agent connection conflict needs review' ELSE 'Listing interest is waiting on representation' END,
      concat(COALESCE(p.full_name, p.email, 'Property owner'), ' · ', replace(aci.waiting_on_side, '_', ' ')),
      aci.updated_at, concat('/admin/users/', aci.waiting_owner_id, '?tab=relationships')
    FROM public.agent_connection_intents aci
    LEFT JOIN public.profiles p ON p.id = aci.waiting_owner_id
    WHERE aci.is_demo = v_demo AND aci.status IN ('awaiting_representation', 'conflict')
    UNION ALL
    SELECT concat('contact-', cs.id), 2, 'medium', 'lead', concat('New message from ', cs.name), cs.email,
      cs.created_at, concat('/admin/intake?tab=contact&q=', cs.email)
    FROM public.contact_submissions cs WHERE NOT v_demo AND cs.status = 'new'
    UNION ALL
    SELECT concat('referral-', r.id), 2, 'medium', 'lead', concat('Unassigned referral: ', r.owner_name),
      COALESCE(r.property_location, r.owner_email), r.created_at, concat('/admin/intake?tab=referrals&q=', r.owner_email)
    FROM public.referrals r WHERE NOT v_demo AND r.status = 'pending'
    UNION ALL
    SELECT concat('demo-', dr.id), 2, 'medium', 'demo', concat('Demo request from ', dr.full_name),
      concat(dr.company, ' · ', CASE WHEN dr.scheduled_at IS NULL THEN 'not scheduled' ELSE 'scheduled' END),
      dr.created_at, concat('/admin/demos?q=', dr.work_email)
    FROM public.demo_requests dr WHERE NOT v_demo AND dr.status = 'new'
    UNION ALL
    SELECT concat('account-', aas.user_id), 2, 'medium', 'account',
      concat(COALESCE(p.full_name, p.email, 'Account'), ' is suspended'),
      'Review whether this account should remain restricted.', aas.updated_at,
      concat('/admin/users/', aas.user_id)
    FROM public.admin_account_states aas
    LEFT JOIN public.profiles p ON p.id = aas.user_id
    WHERE NOT v_demo AND aas.account_status = 'suspended'
  ), attention_page AS (
    SELECT * FROM attention_source ORDER BY priority_order, occurred_at LIMIT 100
  ), pipeline AS (
    SELECT COALESCE(jsonb_object_agg(status::text, amount), '{}'::jsonb) AS value
    FROM (SELECT e.status, count(*) AS amount FROM public.exchanges e WHERE e.is_demo = v_demo GROUP BY e.status) counts
  ), recent_activity AS (
    SELECT COALESCE(jsonb_agg(to_jsonb(rows) ORDER BY rows.created_at DESC), '[]'::jsonb) AS value
    FROM (
      SELECT et.* FROM public.exchange_timeline et
      JOIN public.exchanges e ON e.id = et.exchange_id AND e.is_demo = v_demo
      ORDER BY et.created_at DESC LIMIT 10
    ) rows
  ), upcoming_demos AS (
    SELECT CASE WHEN v_demo THEN '[]'::jsonb ELSE COALESCE(jsonb_agg(to_jsonb(rows) ORDER BY rows.scheduled_at), '[]'::jsonb) END AS value
    FROM (
      SELECT dr.* FROM public.demo_requests dr
      WHERE NOT v_demo AND dr.scheduled_at >= now() AND dr.status NOT IN ('unqualified', 'closed')
      ORDER BY dr.scheduled_at LIMIT 5
    ) rows
  ), metrics AS (
    SELECT jsonb_build_object(
      'activeExchanges', (SELECT count(*) FROM public.exchanges e WHERE e.is_demo = v_demo AND e.status IN ('active', 'in_identification', 'in_closing')),
      'activeMatches', (SELECT count(*) FROM scoped_matches sm WHERE sm.status = 'active'),
      'readyToAdvance', (SELECT count(*) FROM scoped_matches sm WHERE sm.status = 'active' AND NOT EXISTS (
        SELECT 1 FROM public.exchange_connections c WHERE c.match_id = sm.id
      )),
      'openConnections', (SELECT count(*) FROM scoped_connections sc WHERE sc.status IN ('pending', 'accepted', 'in_progress')),
      'properties', (SELECT count(*) FROM public.pledged_properties p WHERE p.is_demo = v_demo),
      'activeRepresentations', (SELECT count(*) FROM public.agent_representations ar WHERE ar.is_demo = v_demo AND ar.status = 'active'),
      'openContactRequests', (SELECT count(*) FROM public.agent_contact_requests acr JOIN public.exchanges e ON e.id = acr.exchange_id AND e.is_demo = v_demo WHERE acr.status IN ('requested', 'awaiting_counterparty_agent')),
      'awaitingRepresentation', (SELECT count(*) FROM public.agent_connection_intents aci WHERE aci.is_demo = v_demo AND aci.status = 'awaiting_representation'),
      'openTickets', (SELECT count(*) FROM public.support_tickets st WHERE st.is_demo = v_demo AND st.status IN ('open', 'in_progress')),
      'newLeads', CASE WHEN v_demo THEN 0 ELSE
        (SELECT count(*) FROM public.contact_submissions cs WHERE cs.status = 'new') +
        (SELECT count(*) FROM public.referrals r WHERE r.status = 'pending') +
        (SELECT count(*) FROM public.demo_requests dr WHERE dr.status = 'new') END
    ) AS value
  ), growth AS (
    SELECT jsonb_build_object(
      'users', 0,
      'exchanges', (SELECT count(*) FROM public.exchanges e WHERE e.is_demo = v_demo AND e.created_at >= now() - interval '7 days'),
      'demos', CASE WHEN v_demo THEN 0 ELSE (SELECT count(*) FROM public.demo_requests dr WHERE dr.created_at >= now() - interval '7 days') END,
      'events', CASE WHEN v_demo THEN 0 ELSE (SELECT count(*) FROM public.event_registrations er WHERE er.created_at >= now() - interval '7 days') END
    ) AS value
  )
  SELECT jsonb_build_object(
    'attentionItems', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', ap.id, 'priority', ap.priority, 'category', ap.category, 'title', ap.title,
      'detail', ap.detail, 'timestamp', ap.occurred_at, 'href', ap.href
    ) ORDER BY ap.priority_order, ap.occurred_at) FROM attention_page ap), '[]'::jsonb),
    'attentionTotal', (SELECT count(*) FROM attention_source),
    'attentionTruncated', (SELECT count(*) FROM attention_source) > 100,
    'pipeline', (SELECT value FROM pipeline),
    'upcomingDemos', (SELECT value FROM upcoming_demos),
    'recentActivity', (SELECT value FROM recent_activity),
    'eventRegistrations', '[]'::jsonb,
    'lastUpdatedAt', now(),
    'kpis', (SELECT value FROM metrics),
    'growth', (SELECT value FROM growth)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_command_center(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_command_center(text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

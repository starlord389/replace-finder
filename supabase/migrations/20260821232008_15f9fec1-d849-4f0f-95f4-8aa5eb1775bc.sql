-- Production-safe admin CRM directories and command center.
-- Large record sets stay in Postgres; the browser receives one bounded page.

CREATE INDEX IF NOT EXISTS pledged_properties_admin_directory_idx
  ON public.pledged_properties (is_demo, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS exchanges_admin_directory_idx
  ON public.exchanges (is_demo, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS matches_admin_buyer_directory_idx
  ON public.matches (buyer_exchange_id, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS matches_admin_seller_directory_idx
  ON public.matches (seller_property_id, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS exchange_connections_admin_buyer_directory_idx
  ON public.exchange_connections (buyer_exchange_id, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS exchange_connections_admin_seller_directory_idx
  ON public.exchange_connections (seller_exchange_id, status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS messages_admin_connection_created_idx
  ON public.messages (connection_id, created_at DESC, id);

CREATE OR REPLACE FUNCTION public.admin_list_crm_records(
  p_record_type text,
  p_data_scope text,
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  records jsonb,
  total_count bigint,
  summary jsonb,
  available_statuses text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_demo boolean;
  v_search text := NULLIF(btrim(p_search), '');
  v_status text := NULLIF(btrim(p_status), '');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be live or demo' USING ERRCODE = '22023';
  END IF;
  IF p_record_type NOT IN ('property', 'exchange', 'match', 'connection') THEN
    RAISE EXCEPTION 'unsupported CRM record type' USING ERRCODE = '22023';
  END IF;
  v_demo := p_data_scope = 'demo';

  IF p_record_type = 'property' THEN
    RETURN QUERY
    WITH scoped AS (
      SELECT p.id
      FROM public.pledged_properties p
      LEFT JOIN public.exchanges e ON e.id = p.exchange_id AND e.is_demo = p.is_demo
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = p.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      WHERE p.is_demo = v_demo
        AND (v_status IS NULL OR p.status::text = v_status)
        AND (
          v_search IS NULL OR concat_ws(' ', p.id::text, p.property_name, p.address, p.city, p.state, p.zip,
            p.asset_type::text, p.asset_subtype, p.status::text, owner_profile.full_name,
            owner_profile.email, client.client_name, e.owner_type) ILIKE '%' || v_search || '%'
        )
    ), page_ids AS (
      SELECT p.id
      FROM public.pledged_properties p
      JOIN scoped s ON s.id = p.id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT v_limit OFFSET v_offset
    ), page_rows AS (
      SELECT
        p.created_at,
        p.id,
        jsonb_build_object(
          'record', to_jsonb(p),
          'context', jsonb_build_object(
            'exchange', CASE WHEN e.id IS NULL THEN NULL ELSE to_jsonb(e) END,
            'financials', CASE WHEN pf.id IS NULL THEN NULL ELSE to_jsonb(pf) END,
            'image', CASE WHEN image_row.id IS NULL THEN NULL ELSE to_jsonb(image_row) END,
            'owner_name', COALESCE(owner_profile.full_name, owner_profile.email, 'Unknown'),
            'client_name', client.client_name,
            'match_count', COALESCE(match_stats.match_count, 0),
            'relationship', CASE
              WHEN e.relinquished_property_id = p.id OR (e.id IS NOT NULL AND p.exchange_id = e.id) THEN 'Current property'
              ELSE 'Available listing'
            END
          )
        ) AS payload
      FROM page_ids page
      JOIN public.pledged_properties p ON p.id = page.id
      LEFT JOIN public.exchanges e ON e.id = p.exchange_id AND e.is_demo = p.is_demo
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = p.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      LEFT JOIN public.property_financials pf ON pf.property_id = p.id
      LEFT JOIN LATERAL (
        SELECT pi.* FROM public.property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.sort_order NULLS LAST, pi.created_at, pi.id
        LIMIT 1
      ) image_row ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::bigint AS match_count
        FROM public.matches m
        WHERE m.seller_property_id = p.id
           OR (p.exchange_id IS NOT NULL AND m.buyer_exchange_id = p.exchange_id)
      ) match_stats ON true
    ), scope_summary AS (
      SELECT jsonb_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE p.status = 'active' OR p.listed_at IS NOT NULL),
        'draft', count(*) FILTER (WHERE p.status = 'draft'),
        'missing_photos', count(*) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM public.property_images pi WHERE pi.property_id = p.id
        ))
      ) AS value
      FROM public.pledged_properties p
      WHERE p.is_demo = v_demo
    )
    SELECT
      COALESCE((SELECT jsonb_agg(pr.payload ORDER BY pr.created_at DESC, pr.id DESC) FROM page_rows pr), '[]'::jsonb),
      (SELECT count(*) FROM scoped),
      (SELECT value FROM scope_summary),
      COALESCE((SELECT array_agg(DISTINCT p.status::text ORDER BY p.status::text)
        FROM public.pledged_properties p WHERE p.is_demo = v_demo), ARRAY[]::text[]);
    RETURN;
  END IF;

  IF p_record_type = 'exchange' THEN
    RETURN QUERY
    WITH exchange_context AS (
      SELECT e.*, owner_profile.full_name AS owner_full_name, owner_profile.email AS owner_email,
        client.client_name,
        current_property.id AS current_property_id,
        current_property.property_name AS current_property_name,
        current_property.address AS current_property_address,
        current_property.city AS current_property_city,
        current_property.state AS current_property_state
      FROM public.exchanges e
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = e.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      LEFT JOIN LATERAL (
        SELECT p.* FROM public.pledged_properties p
        WHERE p.is_demo = e.is_demo
          AND (p.id = e.relinquished_property_id OR p.exchange_id = e.id)
        ORDER BY CASE WHEN p.id = e.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC
        LIMIT 1
      ) current_property ON true
      WHERE e.is_demo = v_demo
    ), scoped AS (
      SELECT ec.id FROM exchange_context ec
      WHERE (v_status IS NULL OR ec.status::text = v_status)
        AND (v_search IS NULL OR concat_ws(' ', ec.status::text, ec.owner_type, ec.owner_full_name,
          ec.owner_email, ec.client_name, ec.current_property_name, ec.current_property_address,
          ec.current_property_city, ec.current_property_state) ILIKE '%' || v_search || '%')
    ), page_ids AS (
      SELECT e.id FROM public.exchanges e JOIN scoped s ON s.id = e.id
      ORDER BY e.created_at DESC, e.id DESC LIMIT v_limit OFFSET v_offset
    ), page_rows AS (
      SELECT e.created_at, e.id,
        jsonb_build_object(
          'record', to_jsonb(e),
          'context', jsonb_build_object(
            'current_property', CASE WHEN current_property.id IS NULL THEN NULL ELSE to_jsonb(current_property) END,
            'owner_name', COALESCE(owner_profile.full_name, owner_profile.email, 'Unknown'),
            'client_name', client.client_name,
            'match_count', COALESCE(match_stats.match_count, 0)
          )
        ) AS payload
      FROM page_ids page
      JOIN public.exchanges e ON e.id = page.id
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = e.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      LEFT JOIN LATERAL (
        SELECT p.* FROM public.pledged_properties p
        WHERE p.is_demo = e.is_demo
          AND (p.id = e.relinquished_property_id OR p.exchange_id = e.id)
        ORDER BY CASE WHEN p.id = e.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC
        LIMIT 1
      ) current_property ON true
      LEFT JOIN LATERAL (
        SELECT count(*)::bigint AS match_count FROM public.matches m WHERE m.buyer_exchange_id = e.id
      ) match_stats ON true
    ), scope_summary AS (
      SELECT jsonb_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE e.status IN ('active', 'in_identification', 'in_closing'))
      ) AS value FROM public.exchanges e WHERE e.is_demo = v_demo
    )
    SELECT
      COALESCE((SELECT jsonb_agg(pr.payload ORDER BY pr.created_at DESC, pr.id DESC) FROM page_rows pr), '[]'::jsonb),
      (SELECT count(*) FROM scoped),
      (SELECT value FROM scope_summary),
      COALESCE((SELECT array_agg(DISTINCT e.status::text ORDER BY e.status::text)
        FROM public.exchanges e WHERE e.is_demo = v_demo), ARRAY[]::text[]);
    RETURN;
  END IF;

  IF p_record_type = 'match' THEN
    RETURN QUERY
    WITH match_context AS (
      SELECT m.id, m.status, m.created_at, e.owner_type, e.agent_id,
        COALESCE(owner_profile.full_name, owner_profile.email) AS owner_name,
        client.client_name,
        concat_ws(' ', current_property.property_name, current_property.address, current_property.city, current_property.state) AS current_label,
        concat_ws(' ', candidate.property_name, candidate.address, candidate.city, candidate.state) AS candidate_label,
        m.boot_status::text, m.match_classification
      FROM public.matches m
      JOIN public.exchanges e ON e.id = m.buyer_exchange_id AND e.is_demo = v_demo
      JOIN public.pledged_properties candidate ON candidate.id = m.seller_property_id AND candidate.is_demo = v_demo
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = e.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      LEFT JOIN LATERAL (
        SELECT p.* FROM public.pledged_properties p
        WHERE p.is_demo = e.is_demo AND (p.id = e.relinquished_property_id OR p.exchange_id = e.id)
        ORDER BY CASE WHEN p.id = e.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC LIMIT 1
      ) current_property ON true
    ), scoped AS (
      SELECT mc.id FROM match_context mc
      WHERE (v_status IS NULL OR mc.status = v_status)
        AND (v_search IS NULL OR concat_ws(' ', mc.status, mc.owner_type, mc.owner_name, mc.client_name,
          mc.current_label, mc.candidate_label, mc.boot_status, mc.match_classification) ILIKE '%' || v_search || '%')
    ), page_ids AS (
      SELECT m.id FROM public.matches m JOIN scoped s ON s.id = m.id
      ORDER BY m.created_at DESC, m.id DESC LIMIT v_limit OFFSET v_offset
    ), page_rows AS (
      SELECT m.created_at, m.id,
        jsonb_build_object(
          'record', to_jsonb(m),
          'context', jsonb_build_object(
            'exchange', to_jsonb(e),
            'current_property', CASE WHEN current_property.id IS NULL THEN NULL ELSE to_jsonb(current_property) END,
            'candidate_property', to_jsonb(candidate),
            'candidate_financials', CASE WHEN candidate_financials.id IS NULL THEN NULL ELSE to_jsonb(candidate_financials) END,
            'candidate_image', CASE WHEN candidate_image.id IS NULL THEN NULL ELSE to_jsonb(candidate_image) END,
            'owner_name', COALESCE(owner_profile.full_name, owner_profile.email, 'Unknown'),
            'client_name', client.client_name,
            'connection', CASE WHEN connection_row.id IS NULL THEN NULL ELSE to_jsonb(connection_row) END
          )
        ) AS payload
      FROM page_ids page
      JOIN public.matches m ON m.id = page.id
      JOIN public.exchanges e ON e.id = m.buyer_exchange_id AND e.is_demo = v_demo
      JOIN public.pledged_properties candidate ON candidate.id = m.seller_property_id AND candidate.is_demo = v_demo
      LEFT JOIN public.profiles owner_profile ON owner_profile.id = e.agent_id
      LEFT JOIN public.agent_clients client ON client.id = e.client_id
      LEFT JOIN LATERAL (
        SELECT p.* FROM public.pledged_properties p
        WHERE p.is_demo = e.is_demo AND (p.id = e.relinquished_property_id OR p.exchange_id = e.id)
        ORDER BY CASE WHEN p.id = e.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC LIMIT 1
      ) current_property ON true
      LEFT JOIN public.property_financials candidate_financials ON candidate_financials.property_id = candidate.id
      LEFT JOIN LATERAL (
        SELECT pi.* FROM public.property_images pi WHERE pi.property_id = candidate.id
        ORDER BY pi.sort_order NULLS LAST, pi.created_at, pi.id LIMIT 1
      ) candidate_image ON true
      LEFT JOIN LATERAL (
        SELECT c.* FROM public.exchange_connections c WHERE c.match_id = m.id
        ORDER BY c.created_at DESC, c.id DESC LIMIT 1
      ) connection_row ON true
    ), scope_matches AS (
      SELECT m.* FROM public.matches m
      JOIN public.exchanges e ON e.id = m.buyer_exchange_id AND e.is_demo = v_demo
      JOIN public.pledged_properties p ON p.id = m.seller_property_id AND p.is_demo = v_demo
    ), scope_summary AS (
      SELECT jsonb_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE sm.status = 'active'),
        'ready_to_advance', count(*) FILTER (WHERE sm.status = 'active' AND NOT EXISTS (
          SELECT 1 FROM public.exchange_connections c WHERE c.match_id = sm.id
        ))
      ) AS value FROM scope_matches sm
    )
    SELECT
      COALESCE((SELECT jsonb_agg(pr.payload ORDER BY pr.created_at DESC, pr.id DESC) FROM page_rows pr), '[]'::jsonb),
      (SELECT count(*) FROM scoped),
      (SELECT value FROM scope_summary),
      COALESCE((SELECT array_agg(DISTINCT sm.status ORDER BY sm.status) FROM scope_matches sm), ARRAY[]::text[]);
    RETURN;
  END IF;

  RETURN QUERY
  WITH connection_context AS (
    SELECT c.id, c.status, c.created_at,
      COALESCE(bp.full_name, bp.email) AS buyer_name,
      COALESCE(sp.full_name, sp.email) AS seller_name,
      concat_ws(' ', current_property.property_name, current_property.address, current_property.city, current_property.state) AS current_label,
      concat_ws(' ', candidate.property_name, candidate.address, candidate.city, candidate.state) AS candidate_label
    FROM public.exchange_connections c
    JOIN public.exchanges buyer_exchange ON buyer_exchange.id = c.buyer_exchange_id AND buyer_exchange.is_demo = v_demo
    LEFT JOIN public.exchanges seller_exchange ON seller_exchange.id = c.seller_exchange_id
    JOIN public.matches m ON m.id = c.match_id
    JOIN public.pledged_properties candidate ON candidate.id = m.seller_property_id AND candidate.is_demo = v_demo
    LEFT JOIN public.profiles bp ON bp.id = c.buyer_agent_id
    LEFT JOIN public.profiles sp ON sp.id = c.seller_agent_id
    LEFT JOIN LATERAL (
      SELECT p.* FROM public.pledged_properties p
      WHERE p.is_demo = buyer_exchange.is_demo
        AND (p.id = buyer_exchange.relinquished_property_id OR p.exchange_id = buyer_exchange.id)
      ORDER BY CASE WHEN p.id = buyer_exchange.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC LIMIT 1
    ) current_property ON true
    WHERE (seller_exchange.id IS NULL OR seller_exchange.is_demo = v_demo)
  ), scoped AS (
    SELECT cc.id FROM connection_context cc
    WHERE (v_status IS NULL OR cc.status = v_status)
      AND (v_search IS NULL OR concat_ws(' ', cc.status, cc.buyer_name, cc.seller_name,
        cc.current_label, cc.candidate_label) ILIKE '%' || v_search || '%'
        OR EXISTS (SELECT 1 FROM public.messages msg WHERE msg.connection_id = cc.id AND msg.content ILIKE '%' || v_search || '%'))
  ), page_ids AS (
    SELECT c.id FROM public.exchange_connections c JOIN scoped s ON s.id = c.id
    ORDER BY c.created_at DESC, c.id DESC LIMIT v_limit OFFSET v_offset
  ), page_rows AS (
    SELECT c.created_at, c.id,
      jsonb_build_object(
        'record', to_jsonb(c),
        'context', jsonb_build_object(
          'match', to_jsonb(m),
          'current_property', CASE WHEN current_property.id IS NULL THEN NULL ELSE to_jsonb(current_property) END,
          'candidate_property', to_jsonb(candidate),
          'buyer_name', COALESCE(bp.full_name, bp.email, 'Unknown'),
          'seller_name', COALESCE(sp.full_name, sp.email, 'Unknown'),
          'latest_message', CASE WHEN latest_message.id IS NULL THEN NULL ELSE to_jsonb(latest_message) END,
          'message_count', COALESCE(message_stats.message_count, 0)
        )
      ) AS payload
    FROM page_ids page
    JOIN public.exchange_connections c ON c.id = page.id
    JOIN public.exchanges buyer_exchange ON buyer_exchange.id = c.buyer_exchange_id AND buyer_exchange.is_demo = v_demo
    JOIN public.matches m ON m.id = c.match_id
    JOIN public.pledged_properties candidate ON candidate.id = m.seller_property_id AND candidate.is_demo = v_demo
    LEFT JOIN public.profiles bp ON bp.id = c.buyer_agent_id
    LEFT JOIN public.profiles sp ON sp.id = c.seller_agent_id
    LEFT JOIN LATERAL (
      SELECT p.* FROM public.pledged_properties p
      WHERE p.is_demo = buyer_exchange.is_demo
        AND (p.id = buyer_exchange.relinquished_property_id OR p.exchange_id = buyer_exchange.id)
      ORDER BY CASE WHEN p.id = buyer_exchange.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC LIMIT 1
    ) current_property ON true
    LEFT JOIN LATERAL (
      SELECT msg.* FROM public.messages msg WHERE msg.connection_id = c.id
      ORDER BY msg.created_at DESC, msg.id DESC LIMIT 1
    ) latest_message ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::bigint AS message_count FROM public.messages msg WHERE msg.connection_id = c.id
    ) message_stats ON true
  ), scope_connections AS (
    SELECT c.* FROM public.exchange_connections c
    JOIN public.exchanges buyer_exchange ON buyer_exchange.id = c.buyer_exchange_id AND buyer_exchange.is_demo = v_demo
    LEFT JOIN public.exchanges seller_exchange ON seller_exchange.id = c.seller_exchange_id
    WHERE seller_exchange.id IS NULL OR seller_exchange.is_demo = v_demo
  ), scope_summary AS (
    SELECT jsonb_build_object(
      'total', count(*),
      'open', count(*) FILTER (WHERE sc.status IN ('pending', 'accepted', 'in_progress'))
    ) AS value FROM scope_connections sc
  )
  SELECT
    COALESCE((SELECT jsonb_agg(pr.payload ORDER BY pr.created_at DESC, pr.id DESC) FROM page_rows pr), '[]'::jsonb),
    (SELECT count(*) FROM scoped),
    (SELECT value FROM scope_summary),
    COALESCE((SELECT array_agg(DISTINCT sc.status ORDER BY sc.status) FROM scope_connections sc), ARRAY[]::text[]);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_crm_records(text, text, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_crm_records(text, text, text, text, integer, integer) TO authenticated, service_role;

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
    SELECT concat('deadline-', e.id, '-identification') AS id,
      CASE WHEN e.identification_deadline < current_date THEN 0 WHEN e.identification_deadline <= current_date + 2 THEN 0 ELSE 1 END AS priority_order,
      CASE WHEN e.identification_deadline < current_date THEN 'critical' ELSE 'high' END AS priority,
      'deadline'::text AS category,
      CASE WHEN e.identification_deadline < current_date
        THEN concat('Identification deadline overdue by ', current_date - e.identification_deadline, ' days')
        ELSE concat('Identification deadline in ', e.identification_deadline - current_date, ' days') END AS title,
      concat(COALESCE(p.full_name, p.email, 'Account owner'), ' · ', replace(e.owner_type, '_', ' ')) AS detail,
      e.identification_deadline::timestamptz AS occurred_at,
      concat('/admin/opportunities/exchanges/', e.id) AS href
    FROM public.exchanges e LEFT JOIN public.profiles p ON p.id = e.agent_id
    WHERE e.is_demo = v_demo AND e.status IN ('active', 'in_identification', 'in_closing')
      AND e.identification_deadline IS NOT NULL AND e.identification_deadline <= current_date + 14
    UNION ALL
    SELECT concat('deadline-', e.id, '-closing'),
      CASE WHEN e.closing_deadline < current_date THEN 0 WHEN e.closing_deadline <= current_date + 2 THEN 0 ELSE 1 END,
      CASE WHEN e.closing_deadline < current_date THEN 'critical' ELSE 'high' END,
      'deadline',
      CASE WHEN e.closing_deadline < current_date
        THEN concat('Closing deadline overdue by ', current_date - e.closing_deadline, ' days')
        ELSE concat('Closing deadline in ', e.closing_deadline - current_date, ' days') END,
      concat(COALESCE(p.full_name, p.email, 'Account owner'), ' · ', replace(e.owner_type, '_', ' ')),
      e.closing_deadline::timestamptz, concat('/admin/opportunities/exchanges/', e.id)
    FROM public.exchanges e LEFT JOIN public.profiles p ON p.id = e.agent_id
    WHERE e.is_demo = v_demo AND e.status IN ('active', 'in_identification', 'in_closing')
      AND e.closing_deadline IS NOT NULL AND e.closing_deadline <= current_date + 14
    UNION ALL
    SELECT concat('support-', st.id), CASE WHEN st.status = 'open' AND st.created_at < now() - interval '2 days' THEN 0 ELSE 1 END,
      CASE WHEN st.status = 'open' AND st.created_at < now() - interval '2 days' THEN 'critical' ELSE 'high' END,
      'support', st.subject, concat(replace(st.category, '_', ' '), ' support ticket · ', replace(st.status, '_', ' ')),
      st.created_at, concat('/admin/support?ticket=', st.id)
    FROM public.support_tickets st WHERE st.is_demo = v_demo AND st.status IN ('open', 'in_progress')
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
    FROM public.agent_connection_intents aci LEFT JOIN public.profiles p ON p.id = aci.waiting_owner_id
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
    'overdueDeadlineCount', (SELECT count(*) FROM attention_source a WHERE a.category = 'deadline' AND a.title LIKE '%overdue%'),
    'kpis', (SELECT value FROM metrics),
    'growth', (SELECT value FROM growth)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_command_center(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_command_center(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_search_crm(
  p_data_scope text,
  p_search text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  id text,
  result_type text,
  title text,
  subtitle text,
  href text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_demo boolean;
  v_search text := NULLIF(btrim(p_search), '');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 50);
  v_scope_suffix text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000'; END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be live or demo' USING ERRCODE = '22023';
  END IF;
  IF v_search IS NULL OR length(v_search) < 2 THEN RETURN; END IF;
  v_demo := p_data_scope = 'demo';
  v_scope_suffix := CASE WHEN v_demo THEN '?scope=demo' ELSE '' END;

  RETURN QUERY
  WITH results AS (
    SELECT concat('user-', u.user_id) AS id, 'User'::text AS result_type,
      COALESCE(u.full_name, u.email, 'Unnamed user') AS title,
      concat_ws(' · ', u.email, array_to_string(u.roles::text[], ', ')) AS subtitle,
      concat('/admin/users/', u.user_id, v_scope_suffix) AS href,
      0 AS rank
    FROM public.admin_list_users(
      p_search => v_search, p_data_scope => p_data_scope, p_limit => 10, p_offset => 0
    ) u
    UNION ALL
    SELECT concat('property-', p.id), 'Property',
      COALESCE(NULLIF(p.address, ''), NULLIF(p.property_name, ''), concat_ws(', ', p.city, p.state), 'Property'),
      concat_ws(' · ', concat_ws(', ', p.city, p.state), p.asset_type::text, COALESCE(op.full_name, op.email)),
      concat('/admin/properties/', p.id, v_scope_suffix), 1
    FROM public.pledged_properties p LEFT JOIN public.profiles op ON op.id = p.agent_id
    WHERE p.is_demo = v_demo AND concat_ws(' ', p.property_name, p.address, p.city, p.state, p.zip,
      p.asset_type::text, p.status::text, op.full_name, op.email) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('exchange-', e.id), 'Exchange',
      concat(COALESCE(client.client_name, op.full_name, op.email, 'Account'), ' exchange'),
      concat_ws(' · ', replace(e.status::text, '_', ' '), replace(e.owner_type, '_', ' '),
        COALESCE(current_property.address, current_property.property_name, concat_ws(', ', current_property.city, current_property.state))),
      concat('/admin/opportunities/exchanges/', e.id, v_scope_suffix), 2
    FROM public.exchanges e
    LEFT JOIN public.profiles op ON op.id = e.agent_id
    LEFT JOIN public.agent_clients client ON client.id = e.client_id
    LEFT JOIN LATERAL (
      SELECT p.* FROM public.pledged_properties p
      WHERE p.is_demo = e.is_demo AND (p.id = e.relinquished_property_id OR p.exchange_id = e.id)
      ORDER BY CASE WHEN p.id = e.relinquished_property_id THEN 0 ELSE 1 END, p.created_at DESC LIMIT 1
    ) current_property ON true
    WHERE e.is_demo = v_demo AND concat_ws(' ', e.status::text, e.owner_type, op.full_name, op.email,
      client.client_name, current_property.property_name, current_property.address,
      current_property.city, current_property.state) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('connection-', c.id), 'Connection',
      concat(COALESCE(bp.full_name, bp.email, 'Buyer agent'), ' ↔ ', COALESCE(sp.full_name, sp.email, 'Seller agent')),
      replace(c.status, '_', ' '), concat('/admin/opportunities/connections/', c.id, v_scope_suffix), 3
    FROM public.exchange_connections c
    JOIN public.exchanges be ON be.id = c.buyer_exchange_id AND be.is_demo = v_demo
    LEFT JOIN public.exchanges se ON se.id = c.seller_exchange_id
    LEFT JOIN public.profiles bp ON bp.id = c.buyer_agent_id
    LEFT JOIN public.profiles sp ON sp.id = c.seller_agent_id
    WHERE (se.id IS NULL OR se.is_demo = v_demo)
      AND concat_ws(' ', c.status, bp.full_name, bp.email, sp.full_name, sp.email) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('ticket-', st.id), 'Ticket', st.subject,
      concat_ws(' · ', replace(st.category, '_', ' '), replace(st.status, '_', ' ')),
      concat('/admin/support?ticket=', st.id), 4
    FROM public.support_tickets st
    LEFT JOIN public.profiles p ON p.id = st.user_id
    WHERE st.is_demo = v_demo AND concat_ws(' ', st.subject, st.message, st.admin_notes,
      st.category, st.status, p.full_name, p.email) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('demo-', dr.id), 'Demo', dr.full_name,
      concat_ws(' · ', dr.company, dr.work_email, dr.status),
      concat('/admin/demos?q=', dr.work_email), 5
    FROM public.demo_requests dr
    WHERE NOT v_demo AND concat_ws(' ', dr.full_name, dr.company, dr.work_email, dr.phone,
      dr.role, dr.status) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('lead-contact-', cs.id), 'Lead', cs.name,
      concat_ws(' · ', cs.email, cs.status, 'Contact submission'),
      concat('/admin/intake?tab=contact&q=', cs.email), 6
    FROM public.contact_submissions cs
    WHERE NOT v_demo AND concat_ws(' ', cs.name, cs.email, cs.message,
      cs.status) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('lead-referral-', r.id), 'Lead', r.owner_name,
      concat_ws(' · ', r.owner_email, r.property_location, 'Referral'),
      concat('/admin/intake?tab=referrals&q=', r.owner_email), 6
    FROM public.referrals r
    WHERE NOT v_demo AND concat_ws(' ', r.owner_name, r.owner_email, r.property_location,
      r.status) ILIKE '%' || v_search || '%'
    UNION ALL
    SELECT concat('event-', er.id), 'Event', er.full_name,
      concat_ws(' · ', er.email, er.event, er.role),
      concat('/admin/intake?tab=events&q=', er.email), 7
    FROM public.event_registrations er
    WHERE NOT v_demo AND concat_ws(' ', er.full_name, er.email, er.event, er.role)
      ILIKE '%' || v_search || '%'
  )
  SELECT r.id, r.result_type, r.title, r.subtitle, r.href
  FROM results r
  ORDER BY r.rank, r.title, r.id
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_crm(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_crm(text, text, integer) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
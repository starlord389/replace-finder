-- Phase 1 of the administrator CRM: one read-only communications center.
--
-- The list RPC intentionally returns only a short preview. Full message bodies
-- are loaded only when an administrator opens a record, and that access is
-- written to admin_audit_log. Invitation bearer tokens are never selected.

CREATE INDEX IF NOT EXISTS messages_connection_created_idx
  ON public.messages (connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS client_agent_messages_thread_created_idx
  ON public.client_agent_messages (thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_messages_recipient_created_idx
  ON public.admin_messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_recipient_lower_created_idx
  ON public.email_send_log (lower(recipient_email), created_at DESC);
CREATE INDEX IF NOT EXISTS sms_messages_to_created_idx
  ON public.sms_messages (to_number, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
  ON public.support_tickets (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_list_communications(
  p_user_id uuid DEFAULT NULL,
  p_data_scope text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  record_type text,
  record_id uuid,
  channel text,
  title text,
  preview text,
  status text,
  message_count bigint,
  unread_count bigint,
  occurred_at timestamptz,
  participant_summary text,
  primary_user_id uuid,
  secondary_user_id uuid,
  is_demo boolean,
  context jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_search text := lower(NULLIF(btrim(p_search), ''));
  v_channel text := lower(NULLIF(btrim(p_channel), ''));
  v_status text := lower(NULLIF(btrim(p_status), ''));
  v_data_scope text := lower(NULLIF(btrim(p_data_scope), ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'limit must be between 1 and 100' USING ERRCODE = '22023';
  END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN
    RAISE EXCEPTION 'offset must be zero or greater' USING ERRCODE = '22023';
  END IF;
  IF p_search IS NOT NULL AND char_length(p_search) > 200 THEN
    RAISE EXCEPTION 'search is too long' USING ERRCODE = '22023';
  END IF;
  IF v_channel IS NOT NULL AND v_channel NOT IN (
    'agent_agent', 'client_agent', 'notification', 'email', 'sms', 'invitation', 'support'
  ) THEN
    RAISE EXCEPTION 'unsupported communication channel' USING ERRCODE = '22023';
  END IF;
  IF v_data_scope = 'all' THEN v_data_scope := NULL; END IF;
  IF v_data_scope IS NOT NULL AND v_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be all, live, or demo' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH communication_rows AS (
    SELECT
      'agent_conversation'::text AS record_type,
      c.id AS record_id,
      'agent_agent'::text AS channel,
      concat_ws(' with ',
        COALESCE(NULLIF(bp.full_name, ''), bp.email, 'Buyer agent'),
        COALESCE(NULLIF(sp.full_name, ''), sp.email, 'Listing agent')
      ) AS title,
      COALESCE(left(latest.content, 280), 'No messages have been sent yet.') AS preview,
      c.status::text AS status,
      COALESCE(stats.message_count, 0)::bigint AS message_count,
      COALESCE(stats.unread_count, 0)::bigint AS unread_count,
      COALESCE(latest.created_at, c.updated_at, c.created_at) AS occurred_at,
      concat_ws(' ↔ ',
        COALESCE(NULLIF(bp.full_name, ''), bp.email, 'Buyer agent'),
        COALESCE(NULLIF(sp.full_name, ''), sp.email, 'Listing agent')
      ) AS participant_summary,
      c.buyer_agent_id AS primary_user_id,
      c.seller_agent_id AS secondary_user_id,
      COALESCE(bx.is_demo, sx.is_demo, false) AS is_demo,
      jsonb_build_object(
        'connection_id', c.id,
        'match_id', c.match_id,
        'buyer_exchange_id', c.buyer_exchange_id,
        'seller_exchange_id', c.seller_exchange_id,
        'current_property', NULLIF(concat_ws(', ', NULLIF(cp.address, ''), NULLIF(cp.city, ''), NULLIF(cp.state, '')), ''),
        'matched_property', NULLIF(concat_ws(', ', NULLIF(mp.address, ''), NULLIF(mp.city, ''), NULLIF(mp.state, '')), '')
      ) AS context,
      ARRAY[c.buyer_agent_id, c.seller_agent_id]::uuid[] AS account_ids
    FROM public.exchange_connections c
    LEFT JOIN public.profiles bp ON bp.id = c.buyer_agent_id
    LEFT JOIN public.profiles sp ON sp.id = c.seller_agent_id
    LEFT JOIN public.exchanges bx ON bx.id = c.buyer_exchange_id
    LEFT JOIN public.exchanges sx ON sx.id = c.seller_exchange_id
    LEFT JOIN public.matches mt ON mt.id = c.match_id
    LEFT JOIN public.pledged_properties cp ON cp.id = mt.relinquished_property_id
    LEFT JOIN public.pledged_properties mp ON mp.id = mt.seller_property_id
    LEFT JOIN LATERAL (
      SELECT m.content, m.created_at
      FROM public.messages m
      WHERE m.connection_id = c.id
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::bigint AS message_count,
             count(*) FILTER (WHERE m.read_at IS NULL)::bigint AS unread_count
      FROM public.messages m
      WHERE m.connection_id = c.id
    ) stats ON true

    UNION ALL

    SELECT
      'client_agent_thread'::text,
      t.id,
      'client_agent'::text,
      concat_ws(' with ',
        COALESCE(NULLIF(ip.full_name, ''), ip.email, 'Property owner'),
        COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Agent')
      ),
      COALESCE(left(latest.content, 280), 'No messages have been sent yet.'),
      'active'::text,
      COALESCE(stats.message_count, 0)::bigint,
      COALESCE(stats.unread_count, 0)::bigint,
      COALESCE(latest.created_at, t.updated_at, t.created_at),
      concat_ws(' ↔ ',
        COALESCE(NULLIF(ip.full_name, ''), ip.email, 'Property owner'),
        COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Agent')
      ),
      t.investor_id,
      t.agent_id,
      COALESCE(ex.is_demo, rep.is_demo, false),
      jsonb_build_object(
        'thread_id', t.id,
        'representation_id', t.representation_id,
        'exchange_id', t.exchange_id,
        'match_id', t.match_id
      ),
      ARRAY[t.investor_id, t.agent_id]::uuid[]
    FROM public.client_agent_threads t
    LEFT JOIN public.profiles ip ON ip.id = t.investor_id
    LEFT JOIN public.profiles ap ON ap.id = t.agent_id
    LEFT JOIN public.exchanges ex ON ex.id = t.exchange_id
    LEFT JOIN public.agent_representations rep ON rep.id = t.representation_id
    LEFT JOIN LATERAL (
      SELECT m.content, m.created_at
      FROM public.client_agent_messages m
      WHERE m.thread_id = t.id
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::bigint AS message_count,
             count(*) FILTER (WHERE m.read_at IS NULL)::bigint AS unread_count
      FROM public.client_agent_messages m
      WHERE m.thread_id = t.id
    ) stats ON true

    UNION ALL

    SELECT
      'notification'::text,
      n.id,
      'notification'::text,
      n.title,
      n.message,
      CASE WHEN n.read THEN 'read' ELSE 'unread' END,
      1::bigint,
      CASE WHEN n.read THEN 0 ELSE 1 END::bigint,
      n.created_at,
      COALESCE(NULLIF(p.full_name, ''), p.email, 'Account notification'),
      n.user_id,
      NULL::uuid,
      COALESCE(lower(n.metadata ->> 'demo') = 'true', false),
      jsonb_build_object(
        'notification_type', n.type,
        'link_to', n.link_to,
        'emailed_at', n.emailed_at,
        'email_status', n.email_status
      ),
      ARRAY[n.user_id]::uuid[]
    FROM public.notifications n
    LEFT JOIN public.profiles p ON p.id = n.user_id

    UNION ALL

    SELECT
      'admin_message'::text,
      am.id,
      'email'::text,
      am.subject,
      left(am.message_text, 280),
      am.status,
      1::bigint,
      0::bigint,
      COALESCE(am.sent_at, am.updated_at, am.created_at),
      COALESCE(NULLIF(am.recipient_name, ''), am.recipient_email),
      COALESCE(rp.id, ru.id),
      NULL::uuid,
      lower(am.recipient_email) LIKE '%@replacefinder.test',
      jsonb_build_object(
        'source', 'administrator',
        'recipient_email', am.recipient_email,
        'provider_message_id', am.provider_message_id,
        'error_code', am.sanitized_error_code
      ),
      array_remove(ARRAY[COALESCE(rp.id, ru.id)]::uuid[], NULL)
    FROM public.admin_messages am
    LEFT JOIN public.profiles rp ON rp.id::text = am.recipient_id
    LEFT JOIN auth.users ru ON lower(ru.email) = lower(am.recipient_email)

    UNION ALL

    SELECT
      'email_delivery'::text,
      el.id,
      'email'::text,
      initcap(replace(el.template_name, '_', ' ')),
      COALESCE(NULLIF(el.error_message, ''), 'Transactional email delivery event'),
      el.status,
      1::bigint,
      0::bigint,
      el.created_at,
      el.recipient_email,
      eu.id,
      NULL::uuid,
      lower(el.recipient_email) LIKE '%@replacefinder.test',
      jsonb_build_object(
        'source', 'delivery_log',
        'recipient_email', el.recipient_email,
        'template_name', el.template_name,
        'message_id', el.message_id
      ),
      array_remove(ARRAY[eu.id]::uuid[], NULL)
    FROM public.email_send_log el
    LEFT JOIN auth.users eu ON lower(eu.email) = lower(el.recipient_email)

    UNION ALL

    SELECT
      'sms_message'::text,
      sm.id,
      'sms'::text,
      COALESCE(initcap(replace(sm.purpose, '_', ' ')), 'Text message'),
      COALESCE(NULLIF(sm.body, ''), NULLIF(sm.error_message, ''), 'SMS delivery event'),
      sm.status,
      1::bigint,
      0::bigint,
      COALESCE(sm.status_updated_at, sm.updated_at, sm.created_at),
      COALESCE(NULLIF(sp.full_name, ''), sp.email, sm.to_number),
      sp.id,
      NULL::uuid,
      lower(COALESCE(sp.email, '')) LIKE '%@replacefinder.test',
      jsonb_build_object(
        'to_number', sm.to_number,
        'from_number', sm.from_number,
        'purpose', sm.purpose,
        'delivered_at', sm.delivered_at,
        'error_code', sm.error_code
      ),
      array_remove(ARRAY[sp.id]::uuid[], NULL)
    FROM public.sms_messages sm
    LEFT JOIN LATERAL (
      SELECT p.id, p.full_name, p.email
      FROM public.profiles p
      WHERE right(regexp_replace(COALESCE(p.phone, ''), '[^0-9]', '', 'g'), 10)
          = right(regexp_replace(sm.to_number, '[^0-9]', '', 'g'), 10)
        AND length(regexp_replace(sm.to_number, '[^0-9]', '', 'g')) >= 10
      ORDER BY p.created_at ASC
      LIMIT 1
    ) sp ON true

    UNION ALL

    SELECT
      'representation_invite'::text,
      ri.id,
      'invitation'::text,
      CASE WHEN ri.direction = 'agent_to_investor' THEN 'Client workspace invitation' ELSE 'Agent representation invitation' END,
      concat('Sent to ', ri.email, ' · ', replace(ri.delivery_status, '_', ' ')),
      ri.status,
      ri.send_count::bigint,
      0::bigint,
      COALESCE(ri.last_sent_at, ri.updated_at, ri.created_at),
      concat_ws(' → ',
        COALESCE(NULLIF(cp.full_name, ''), cp.email, 'Inviting account'),
        ri.email
      ),
      ri.created_by,
      COALESCE(ri.accepted_user_id, iu.id),
      COALESCE(rep.is_demo, false),
      jsonb_build_object(
        'representation_id', ri.representation_id,
        'direction', ri.direction,
        'delivery_status', ri.delivery_status,
        'delivery_error_code', ri.delivery_error_code,
        'expires_at', ri.expires_at,
        'accepted_at', ri.accepted_at,
        'cancelled_at', ri.cancelled_at
      ),
      array_remove(ARRAY[ri.created_by, ri.accepted_user_id, iu.id]::uuid[], NULL)
    FROM public.representation_invites ri
    LEFT JOIN public.agent_representations rep ON rep.id = ri.representation_id
    LEFT JOIN public.profiles cp ON cp.id = ri.created_by
    LEFT JOIN auth.users iu ON lower(iu.email) = lower(ri.email)

    UNION ALL

    SELECT
      'client_invite'::text,
      ci.id,
      'invitation'::text,
      'Client workspace invitation'::text,
      concat('Sent to ', ci.email),
      ci.status,
      1::bigint,
      0::bigint,
      COALESCE(ci.updated_at, ci.created_at),
      concat_ws(' → ',
        COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Agent'),
        ci.email
      ),
      ci.agent_id,
      COALESCE(ci.accepted_user_id, iu.id),
      COALESCE(ac.is_demo, false),
      jsonb_build_object(
        'client_id', ci.client_id,
        'expires_at', ci.expires_at,
        'accepted_at', ci.accepted_at
      ),
      array_remove(ARRAY[ci.agent_id, ci.accepted_user_id, iu.id]::uuid[], NULL)
    FROM public.client_invites ci
    LEFT JOIN public.agent_clients ac ON ac.id = ci.client_id
    LEFT JOIN public.profiles ap ON ap.id = ci.agent_id
    LEFT JOIN auth.users iu ON lower(iu.email) = lower(ci.email)

    UNION ALL

    SELECT
      'support_ticket'::text,
      st.id,
      'support'::text,
      st.subject,
      left(st.message, 280),
      st.status::text,
      CASE WHEN NULLIF(btrim(st.admin_notes), '') IS NULL THEN 1 ELSE 2 END::bigint,
      CASE WHEN st.status IN ('open', 'in_progress') THEN 1 ELSE 0 END::bigint,
      st.updated_at,
      COALESCE(NULLIF(up.full_name, ''), up.email, 'Support requester'),
      st.user_id,
      st.resolved_by,
      lower(COALESCE(up.email, '')) LIKE '%@replacefinder.test',
      jsonb_build_object('category', st.category, 'resolved_by', st.resolved_by),
      array_remove(ARRAY[st.user_id, st.resolved_by]::uuid[], NULL)
    FROM public.support_tickets st
    LEFT JOIN public.profiles up ON up.id = st.user_id
  ), filtered AS (
    SELECT cr.*
    FROM communication_rows cr
    WHERE (p_user_id IS NULL OR p_user_id = ANY(cr.account_ids))
      AND (v_data_scope IS NULL OR (v_data_scope = 'demo' AND cr.is_demo) OR (v_data_scope = 'live' AND NOT cr.is_demo))
      AND (v_channel IS NULL OR cr.channel = v_channel)
      AND (v_status IS NULL OR lower(cr.status) = v_status)
      AND (
        v_search IS NULL
        OR lower(COALESCE(cr.title, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(cr.preview, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(cr.participant_summary, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(cr.status, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(cr.context::text, '')) LIKE '%' || v_search || '%'
      )
  )
  SELECT
    f.record_type,
    f.record_id,
    f.channel,
    f.title,
    f.preview,
    f.status,
    f.message_count,
    f.unread_count,
    f.occurred_at,
    f.participant_summary,
    f.primary_user_id,
    f.secondary_user_id,
    f.is_demo,
    f.context,
    count(*) OVER()::bigint AS total_count
  FROM filtered f
  ORDER BY f.occurred_at DESC, f.record_type, f.record_id
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_communications(uuid, text, text, text, text, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_communications(uuid, text, text, text, text, integer, integer)
  TO authenticated;

COMMENT ON FUNCTION public.admin_list_communications(uuid, text, text, text, text, integer, integer) IS
  'Admin-only paginated communication directory. Returns previews and sanitized context; never invitation tokens.';

CREATE OR REPLACE FUNCTION public.admin_get_communication_items(
  p_record_type text,
  p_record_id uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  item_key text,
  sender_id uuid,
  sender_name text,
  sender_role text,
  body text,
  subject text,
  status text,
  created_at timestamptz,
  read_at timestamptz,
  metadata jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_type text := lower(NULLIF(btrim(p_record_type), ''));
  v_exists boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_record_id IS NULL OR v_type IS NULL THEN
    RAISE EXCEPTION 'record type and id are required' USING ERRCODE = '22023';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 250 THEN
    RAISE EXCEPTION 'limit must be between 1 and 250' USING ERRCODE = '22023';
  END IF;
  IF p_offset IS NULL OR p_offset < 0 THEN
    RAISE EXCEPTION 'offset must be zero or greater' USING ERRCODE = '22023';
  END IF;

  CASE v_type
    WHEN 'agent_conversation' THEN SELECT EXISTS (SELECT 1 FROM public.exchange_connections WHERE id = p_record_id) INTO v_exists;
    WHEN 'client_agent_thread' THEN SELECT EXISTS (SELECT 1 FROM public.client_agent_threads WHERE id = p_record_id) INTO v_exists;
    WHEN 'notification' THEN SELECT EXISTS (SELECT 1 FROM public.notifications WHERE id = p_record_id) INTO v_exists;
    WHEN 'admin_message' THEN SELECT EXISTS (SELECT 1 FROM public.admin_messages WHERE id = p_record_id) INTO v_exists;
    WHEN 'email_delivery' THEN SELECT EXISTS (SELECT 1 FROM public.email_send_log WHERE id = p_record_id) INTO v_exists;
    WHEN 'sms_message' THEN SELECT EXISTS (SELECT 1 FROM public.sms_messages WHERE id = p_record_id) INTO v_exists;
    WHEN 'representation_invite' THEN SELECT EXISTS (SELECT 1 FROM public.representation_invites WHERE id = p_record_id) INTO v_exists;
    WHEN 'client_invite' THEN SELECT EXISTS (SELECT 1 FROM public.client_invites WHERE id = p_record_id) INTO v_exists;
    WHEN 'support_ticket' THEN SELECT EXISTS (SELECT 1 FROM public.support_tickets WHERE id = p_record_id) INTO v_exists;
    ELSE RAISE EXCEPTION 'unsupported communication record type' USING ERRCODE = '22023';
  END CASE;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'communication record not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id, summary, metadata)
  VALUES (
    v_uid,
    'communications.viewed',
    'communication',
    p_record_id::text,
    'Opened communication content',
    jsonb_build_object('record_type', v_type)
  );

  IF v_type = 'agent_conversation' THEN
    RETURN QUERY
    SELECT
      m.id::text,
      m.sender_id,
      COALESCE(NULLIF(p.full_name, ''), p.email, 'Agent'),
      'agent'::text,
      m.content,
      NULL::text,
      CASE WHEN m.read_at IS NULL THEN 'unread' ELSE 'read' END,
      m.created_at,
      m.read_at,
      jsonb_build_object('connection_id', m.connection_id),
      count(*) OVER()::bigint
    FROM public.messages m
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.connection_id = p_record_id
    ORDER BY m.created_at ASC, m.id ASC
    LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;

  IF v_type = 'client_agent_thread' THEN
    RETURN QUERY
    SELECT
      m.id::text,
      m.sender_id,
      COALESCE(NULLIF(p.full_name, ''), p.email, 'Participant'),
      CASE WHEN m.sender_id = t.agent_id THEN 'agent' ELSE 'property_owner' END,
      m.content,
      NULL::text,
      CASE WHEN m.read_at IS NULL THEN 'unread' ELSE 'read' END,
      m.created_at,
      m.read_at,
      jsonb_build_object('thread_id', m.thread_id, 'representation_id', t.representation_id),
      count(*) OVER()::bigint
    FROM public.client_agent_messages m
    JOIN public.client_agent_threads t ON t.id = m.thread_id
    LEFT JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.thread_id = p_record_id
    ORDER BY m.created_at ASC, m.id ASC
    LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;

  IF v_type = 'notification' THEN
    RETURN QUERY
    SELECT
      n.id::text,
      NULL::uuid,
      'ExchangeUp'::text,
      'system'::text,
      n.message,
      n.title,
      CASE WHEN n.read THEN 'read' ELSE 'unread' END,
      n.created_at,
      NULL::timestamptz,
      jsonb_build_object(
        'type', n.type, 'link_to', n.link_to, 'emailed_at', n.emailed_at,
        'email_status', n.email_status, 'notification_metadata', n.metadata
      ),
      1::bigint
    FROM public.notifications n
    WHERE n.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'admin_message' THEN
    RETURN QUERY
    SELECT
      am.id::text,
      am.created_by,
      COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Administrator'),
      'administrator'::text,
      am.message_text,
      am.subject,
      am.status,
      am.created_at,
      am.sent_at,
      jsonb_build_object(
        'recipient_email', am.recipient_email,
        'recipient_name', am.recipient_name,
        'provider_message_id', am.provider_message_id,
        'error_code', am.sanitized_error_code
      ),
      1::bigint
    FROM public.admin_messages am
    LEFT JOIN public.profiles ap ON ap.id = am.created_by
    WHERE am.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'email_delivery' THEN
    RETURN QUERY
    SELECT
      el.id::text,
      NULL::uuid,
      'ExchangeUp email service'::text,
      'system'::text,
      COALESCE(NULLIF(el.error_message, ''), 'Transactional email delivery event'),
      initcap(replace(el.template_name, '_', ' ')),
      el.status,
      el.created_at,
      NULL::timestamptz,
      jsonb_build_object(
        'recipient_email', el.recipient_email,
        'template_name', el.template_name,
        'message_id', el.message_id
      ),
      1::bigint
    FROM public.email_send_log el
    WHERE el.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'sms_message' THEN
    RETURN QUERY
    SELECT
      sm.id::text,
      NULL::uuid,
      'ExchangeUp SMS service'::text,
      'system'::text,
      COALESCE(NULLIF(sm.body, ''), NULLIF(sm.error_message, ''), 'SMS delivery event'),
      COALESCE(initcap(replace(sm.purpose, '_', ' ')), 'Text message'),
      sm.status,
      sm.created_at,
      sm.delivered_at,
      jsonb_build_object(
        'to_number', sm.to_number,
        'from_number', sm.from_number,
        'message_sid', sm.message_sid,
        'error_code', sm.error_code,
        'error_message', sm.error_message,
        'status_updated_at', sm.status_updated_at
      ),
      1::bigint
    FROM public.sms_messages sm
    WHERE sm.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'representation_invite' THEN
    RETURN QUERY
    SELECT
      ri.id::text,
      ri.created_by,
      COALESCE(NULLIF(cp.full_name, ''), cp.email, 'Inviting account'),
      'invitation'::text,
      concat('Invitation sent to ', ri.email, '. Delivery is ', replace(ri.delivery_status, '_', ' '), '.'),
      CASE WHEN ri.direction = 'agent_to_investor' THEN 'Client workspace invitation' ELSE 'Agent representation invitation' END,
      ri.status,
      ri.created_at,
      ri.accepted_at,
      jsonb_build_object(
        'representation_id', ri.representation_id,
        'direction', ri.direction,
        'recipient_email', ri.email,
        'delivery_status', ri.delivery_status,
        'delivery_error_code', ri.delivery_error_code,
        'send_count', ri.send_count,
        'last_sent_at', ri.last_sent_at,
        'expires_at', ri.expires_at,
        'cancelled_at', ri.cancelled_at
      ),
      1::bigint
    FROM public.representation_invites ri
    LEFT JOIN public.profiles cp ON cp.id = ri.created_by
    WHERE ri.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'client_invite' THEN
    RETURN QUERY
    SELECT
      ci.id::text,
      ci.agent_id,
      COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Agent'),
      'invitation'::text,
      concat('Client workspace invitation sent to ', ci.email, '.'),
      'Client workspace invitation'::text,
      ci.status,
      ci.created_at,
      ci.accepted_at,
      jsonb_build_object(
        'client_id', ci.client_id,
        'recipient_email', ci.email,
        'expires_at', ci.expires_at
      ),
      1::bigint
    FROM public.client_invites ci
    LEFT JOIN public.profiles ap ON ap.id = ci.agent_id
    WHERE ci.id = p_record_id;
    RETURN;
  END IF;

  IF v_type = 'support_ticket' THEN
    RETURN QUERY
    WITH ticket_items AS (
      SELECT
        st.id::text || ':request' AS item_key,
        st.user_id AS sender_id,
        COALESCE(NULLIF(up.full_name, ''), up.email, 'Support requester') AS sender_name,
        'user'::text AS sender_role,
        st.message AS body,
        st.subject AS subject,
        st.status::text AS status,
        st.created_at AS created_at,
        NULL::timestamptz AS read_at,
        jsonb_build_object('category', st.category) AS metadata
      FROM public.support_tickets st
      LEFT JOIN public.profiles up ON up.id = st.user_id
      WHERE st.id = p_record_id

      UNION ALL

      SELECT
        st.id::text || ':admin-note',
        st.resolved_by,
        COALESCE(NULLIF(ap.full_name, ''), ap.email, 'Administrator'),
        'administrator'::text,
        st.admin_notes,
        'Internal admin note'::text,
        st.status::text,
        st.updated_at,
        NULL::timestamptz,
        jsonb_build_object('internal', true)
      FROM public.support_tickets st
      LEFT JOIN public.profiles ap ON ap.id = st.resolved_by
      WHERE st.id = p_record_id AND NULLIF(btrim(st.admin_notes), '') IS NOT NULL
    )
    SELECT
      ti.item_key,
      ti.sender_id,
      ti.sender_name,
      ti.sender_role,
      ti.body,
      ti.subject,
      ti.status,
      ti.created_at,
      ti.read_at,
      ti.metadata,
      count(*) OVER()::bigint
    FROM ticket_items ti
    ORDER BY ti.created_at ASC, ti.item_key
    LIMIT p_limit OFFSET p_offset;
    RETURN;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_communication_items(text, uuid, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_communication_items(text, uuid, integer, integer)
  TO authenticated;

COMMENT ON FUNCTION public.admin_get_communication_items(text, uuid, integer, integer) IS
  'Admin-only full communication reader. Every successful record open is appended to admin_audit_log.';

NOTIFY pgrst, 'reload schema';

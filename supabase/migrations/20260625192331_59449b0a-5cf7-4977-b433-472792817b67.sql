CREATE OR REPLACE FUNCTION public.notify_connection_counterparty(
  p_connection_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link_to text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer uuid;
  v_seller uuid;
  v_recipient uuid;
BEGIN
  SELECT buyer_agent_id, seller_agent_id INTO v_buyer, v_seller
  FROM public.exchange_connections
  WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection % not found', p_connection_id USING ERRCODE = 'no_data_found';
  END IF;

  IF auth.uid() <> v_buyer AND auth.uid() <> v_seller THEN
    RAISE EXCEPTION 'Not a member of this connection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_recipient := CASE WHEN auth.uid() = v_buyer THEN v_seller ELSE v_buyer END;

  INSERT INTO public.notifications (user_id, type, title, message, link_to)
  VALUES (v_recipient, p_type, p_title, p_message, p_link_to);
END;
$$;

REVOKE ALL ON FUNCTION public.notify_connection_counterparty(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_connection_counterparty(uuid, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_connection_event(
  p_connection_id uuid,
  p_event_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer uuid;
  v_seller uuid;
  v_buyer_ex uuid;
  v_seller_ex uuid;
BEGIN
  SELECT buyer_agent_id, seller_agent_id, buyer_exchange_id, seller_exchange_id
    INTO v_buyer, v_seller, v_buyer_ex, v_seller_ex
  FROM public.exchange_connections
  WHERE id = p_connection_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection % not found', p_connection_id USING ERRCODE = 'no_data_found';
  END IF;

  IF auth.uid() <> v_buyer AND auth.uid() <> v_seller THEN
    RAISE EXCEPTION 'Not a member of this connection' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_buyer_ex IS NOT NULL THEN
    INSERT INTO public.exchange_timeline (exchange_id, event_type, description, actor_id, metadata)
    VALUES (v_buyer_ex, p_event_type, p_description, auth.uid(), p_metadata);
  END IF;

  IF v_seller_ex IS NOT NULL THEN
    INSERT INTO public.exchange_timeline (exchange_id, event_type, description, actor_id, metadata)
    VALUES (v_seller_ex, p_event_type, p_description, auth.uid(), p_metadata);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_connection_event(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_connection_event(uuid, text, text, jsonb) TO authenticated;
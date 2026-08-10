CREATE OR REPLACE FUNCTION public.submit_listing_inquiry(p_property_id uuid, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_msg text := btrim(coalesce(p_message, ''));
  v_prop public.pledged_properties%ROWTYPE;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to contact the listing agent';
  END IF;
  IF length(v_msg) = 0 OR length(v_msg) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;

  SELECT * INTO v_prop
  FROM public.pledged_properties
  WHERE id = p_property_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inquiries can only be created for active properties';
  END IF;

  IF v_prop.agent_id = v_uid THEN
    RAISE EXCEPTION 'You cannot inquire about your own listing';
  END IF;

  INSERT INTO public.listing_inquiries (investor_id, property_id, listing_agent_id, initial_message, is_demo)
  VALUES (v_uid, p_property_id, v_prop.agent_id, v_msg, v_prop.is_demo)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_listing_inquiry(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_listing_inquiry(uuid, text) TO authenticated;
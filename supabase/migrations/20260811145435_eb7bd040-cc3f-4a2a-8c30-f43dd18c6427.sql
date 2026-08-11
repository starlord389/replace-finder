DO $$
DECLARE ids uuid[];
BEGIN
  SELECT array_agg(id) INTO ids FROM public.pledged_properties WHERE is_demo AND state <> 'MA';
  IF ids IS NULL THEN RETURN; END IF;
  DELETE FROM public.identification_list WHERE property_id = ANY(ids);
  DELETE FROM public.investor_saved_properties WHERE property_id = ANY(ids);
  DELETE FROM public.listing_inquiries WHERE property_id = ANY(ids);
  DELETE FROM public.agent_contact_requests WHERE property_id = ANY(ids);
  DELETE FROM public.messages WHERE connection_id IN (
    SELECT c.id FROM public.exchange_connections c JOIN public.matches m ON m.id = c.match_id WHERE m.seller_property_id = ANY(ids));
  DELETE FROM public.exchange_connections WHERE match_id IN (SELECT id FROM public.matches WHERE seller_property_id = ANY(ids));
  DELETE FROM public.agent_match_recommendations WHERE match_id IN (SELECT id FROM public.matches WHERE seller_property_id = ANY(ids));
  DELETE FROM public.matches WHERE seller_property_id = ANY(ids);
  DELETE FROM public.property_financials WHERE property_id = ANY(ids);
  DELETE FROM public.property_images WHERE property_id = ANY(ids);
  DELETE FROM public.property_documents WHERE property_id = ANY(ids);
  DELETE FROM public.pledged_properties WHERE id = ANY(ids);
END $$;
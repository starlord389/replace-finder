DROP POLICY IF EXISTS "Authenticated users can read active properties" ON public.pledged_properties;

CREATE OR REPLACE VIEW public.pledged_properties_secure
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id, agent_id, exchange_id, property_name,
  CASE
    WHEN address_is_public
      OR agent_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    THEN address
    ELSE NULL
  END AS address,
  address_is_public, owner_authorization_confirmed, city, state, zip, county,
  unit_suite, asset_type, asset_subtype, strategy_type, source, status, units,
  year_built, building_square_footage, land_area_acres, num_buildings, num_stories,
  parking_spaces, parking_type, property_class, property_condition, construction_type,
  roof_type, hvac_type, zoning, amenities, description, recent_renovations,
  is_demo, listed_at, withdrawn_at, created_at, updated_at
FROM public.pledged_properties
WHERE status = 'active'
   OR agent_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

REVOKE ALL ON public.pledged_properties_secure FROM PUBLIC, anon;
GRANT SELECT ON public.pledged_properties_secure TO authenticated;

NOTIFY pgrst, 'reload schema';
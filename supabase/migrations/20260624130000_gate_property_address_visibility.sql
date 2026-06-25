-- Gate the raw street `address` of pledged_properties at the database layer.
--
-- BACKGROUND / BUG
-- The policy "Authenticated users can read active properties" let ANY logged-in
-- agent SELECT *every* column of *every* active listing -- including the raw
-- `address` -- regardless of `address_is_public` and regardless of whether a
-- connection exists. The app hid the street client-side (resolveListingName /
-- sanitizeListingForViewer), but a direct Supabase REST call
--   GET /rest/v1/pledged_properties?select=address&status=eq.active
-- bypassed that entirely. The address-visibility toggle was therefore cosmetic.
--
-- FIX
-- 1. Drop the over-broad SELECT policy so the base table no longer exposes any
--    active row to non-owners. Owners (Agents can manage own properties) and
--    admins (Admins can manage all properties) keep full base-table access via
--    their existing FOR ALL policies.
-- 2. Serve cross-agent reads through a security-definer view that returns the
--    same columns but masks `address` to NULL unless the viewer owns the listing,
--    is an admin, or the owner published it (address_is_public). This mirrors the
--    client reveal rule exactly (canSeeExactAddress || address_is_public) -- it
--    does NOT reveal on connection, because the UI never does either.
--
-- The view's WHERE clause reproduces the row visibility the dropped policy used
-- to provide (active listings to everyone, plus your own rows and -- for admins --
-- all rows), so repointed reads return the same ROWS as before; only the address
-- COLUMN is now correctly gated.
--
-- property_financials / property_images stay broadly readable on purpose (asking
-- price, cap rate and photos are meant to be shown on active listings). Only the
-- street address needed gating.

-- 1. Remove the leaky policy.
DROP POLICY IF EXISTS "Authenticated users can read active properties"
  ON public.pledged_properties;

-- 2. Masked, security-definer view. security_invoker = false (the default) means
-- the view runs with its owner's rights and bypasses the base table's RLS, so the
-- WHERE clause below is the only row gate. auth.uid() / has_role() still resolve
-- to the CALLING user (they read the per-request JWT), so the masking is per-user.
CREATE OR REPLACE VIEW public.pledged_properties_secure
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  agent_id,
  exchange_id,
  property_name,
  -- The only gated column: real street only for owner / admin / published.
  CASE
    WHEN address_is_public
      OR agent_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    THEN address
    ELSE NULL
  END AS address,
  address_is_public,
  owner_authorization_confirmed,
  city,
  state,
  zip,
  county,
  unit_suite,
  asset_type,
  asset_subtype,
  strategy_type,
  source,
  status,
  units,
  year_built,
  building_square_footage,
  land_area_acres,
  num_buildings,
  num_stories,
  parking_spaces,
  parking_type,
  property_class,
  property_condition,
  construction_type,
  roof_type,
  hvac_type,
  zoning,
  amenities,
  description,
  recent_renovations,
  is_demo,
  listed_at,
  withdrawn_at,
  created_at,
  updated_at
FROM public.pledged_properties
WHERE status = 'active'
   OR agent_id = auth.uid()
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

COMMENT ON VIEW public.pledged_properties_secure IS
  'Read-only, address-masked view of pledged_properties for cross-agent reads. '
  'address is NULL unless the viewer owns the listing, is an admin, or the owner '
  'set address_is_public. Direct base-table SELECT is reserved for owners/admins.';

-- Only authenticated users may read it (the dropped policy was authenticated-only;
-- anon never had access and still does not).
REVOKE ALL ON public.pledged_properties_secure FROM PUBLIC, anon;
GRANT SELECT ON public.pledged_properties_secure TO authenticated;

-- Make PostgREST pick up the new view immediately.
NOTIFY pgrst, 'reload schema';

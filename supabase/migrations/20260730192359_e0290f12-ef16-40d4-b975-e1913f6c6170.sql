
-- 1. Fix mutable search_path on email queue functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- 2. Replace SECURITY DEFINER views with security_invoker views over definer functions
CREATE OR REPLACE FUNCTION public.pledged_properties_secure_rows()
RETURNS TABLE (
  id uuid, agent_id uuid, exchange_id uuid, property_name text, address text,
  address_is_public boolean, owner_authorization_confirmed boolean, city text, state text,
  zip text, county text, unit_suite text, asset_type public.asset_type, asset_subtype text,
  strategy_type public.strategy_type, source public.property_source,
  status public.pledged_property_status, units integer, year_built integer,
  building_square_footage numeric, land_area_acres numeric, num_buildings integer,
  num_stories integer, parking_spaces integer, parking_type text, property_class text,
  property_condition text, construction_type text, roof_type text, hvac_type text,
  zoning text, amenities text[], description text, recent_renovations text, is_demo boolean,
  listed_at timestamptz, withdrawn_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.agent_id, p.exchange_id, p.property_name,
    CASE WHEN p.address_is_public OR p.agent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)
      THEN p.address ELSE NULL::text END,
    p.address_is_public, p.owner_authorization_confirmed, p.city, p.state, p.zip, p.county,
    p.unit_suite, p.asset_type, p.asset_subtype, p.strategy_type, p.source, p.status, p.units,
    p.year_built, p.building_square_footage, p.land_area_acres, p.num_buildings, p.num_stories,
    p.parking_spaces, p.parking_type, p.property_class, p.property_condition, p.construction_type,
    p.roof_type, p.hvac_type, p.zoning, p.amenities, p.description, p.recent_renovations,
    p.is_demo, p.listed_at, p.withdrawn_at, p.created_at, p.updated_at
  FROM public.pledged_properties p
  WHERE auth.uid() IS NOT NULL
    AND (p.status = 'active'::public.pledged_property_status
         OR p.agent_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'::public.app_role));
END;
$$;

CREATE OR REPLACE FUNCTION public.matches_secure_rows()
RETURNS TABLE (
  id uuid, buyer_exchange_id uuid, seller_property_id uuid, status text, total_score numeric,
  price_score numeric, geo_score numeric, asset_score numeric, strategy_score numeric,
  timing_score numeric, scale_fit_score numeric, buyer_agent_viewed boolean,
  buyer_agent_viewed_at timestamptz, seller_agent_viewed boolean, seller_agent_viewed_at timestamptz,
  created_at timestamptz, updated_at timestamptz, buyer_current_roe numeric, candidate_roe numeric,
  roe_improvement_pp numeric, roe_improvement_rel numeric, candidate_annual_debt_service numeric,
  estimated_cash_boot numeric, estimated_mortgage_boot numeric, estimated_total_boot numeric,
  estimated_boot_tax numeric, financial_score numeric, debt_fit_score numeric,
  boot_status public.boot_status
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.buyer_exchange_id, b.seller_property_id, b.status, b.total_score, b.price_score,
    b.geo_score, b.asset_score, b.strategy_score, b.timing_score, b.scale_fit_score,
    b.buyer_agent_viewed, b.buyer_agent_viewed_at, b.seller_agent_viewed, b.seller_agent_viewed_at,
    b.created_at, b.updated_at,
    CASE WHEN b.can_see THEN b.buyer_current_roe END,
    CASE WHEN b.can_see THEN b.candidate_roe END,
    CASE WHEN b.can_see THEN b.roe_improvement_pp END,
    CASE WHEN b.can_see THEN b.roe_improvement_rel END,
    CASE WHEN b.can_see THEN b.candidate_annual_debt_service END,
    CASE WHEN b.can_see THEN b.estimated_cash_boot END,
    CASE WHEN b.can_see THEN b.estimated_mortgage_boot END,
    CASE WHEN b.can_see THEN b.estimated_total_boot END,
    CASE WHEN b.can_see THEN b.estimated_boot_tax END,
    CASE WHEN b.can_see THEN b.financial_score END,
    CASE WHEN b.can_see THEN b.debt_fit_score END,
    CASE WHEN b.can_see THEN b.boot_status END
  FROM (
    SELECT m.*,
      (EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = m.buyer_exchange_id AND e.agent_id = auth.uid())
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR EXISTS (SELECT 1 FROM public.exchange_connections c
                   WHERE c.match_id = m.id AND c.status = ANY (ARRAY['accepted','in_progress','completed']))
      ) AS can_see
    FROM public.matches m
  ) b
  WHERE auth.uid() IS NOT NULL
    AND (EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = b.buyer_exchange_id AND e.agent_id = auth.uid())
         OR EXISTS (SELECT 1 FROM public.pledged_properties p WHERE p.id = b.seller_property_id AND p.agent_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'::public.app_role));
END;
$$;

REVOKE ALL ON FUNCTION public.pledged_properties_secure_rows() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.matches_secure_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pledged_properties_secure_rows() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.matches_secure_rows() TO authenticated, service_role;

DROP VIEW IF EXISTS public.pledged_properties_secure;
DROP VIEW IF EXISTS public.matches_secure;

CREATE VIEW public.pledged_properties_secure
WITH (security_invoker = true, security_barrier = true)
AS SELECT * FROM public.pledged_properties_secure_rows();

CREATE VIEW public.matches_secure
WITH (security_invoker = true, security_barrier = true)
AS SELECT * FROM public.matches_secure_rows();

GRANT SELECT ON public.pledged_properties_secure TO authenticated, service_role;
GRANT SELECT ON public.matches_secure TO authenticated, service_role;

-- 3. Fix tautological WITH CHECK on exchange_connections UPDATE
DROP POLICY IF EXISTS "Agents can update own connections" ON public.exchange_connections;
CREATE POLICY "Agents can update own connections"
ON public.exchange_connections
FOR UPDATE
TO authenticated
USING (buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid())
WITH CHECK (buyer_agent_id = auth.uid() OR seller_agent_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prevent_connection_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.match_id IS DISTINCT FROM OLD.match_id
     OR NEW.buyer_agent_id IS DISTINCT FROM OLD.buyer_agent_id
     OR NEW.seller_agent_id IS DISTINCT FROM OLD.seller_agent_id
     OR NEW.buyer_exchange_id IS DISTINCT FROM OLD.buyer_exchange_id
     OR NEW.seller_exchange_id IS DISTINCT FROM OLD.seller_exchange_id THEN
    RAISE EXCEPTION 'Connection participants cannot be reassigned';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_connection_reassignment ON public.exchange_connections;
CREATE TRIGGER trg_prevent_connection_reassignment
BEFORE UPDATE ON public.exchange_connections
FOR EACH ROW EXECUTE FUNCTION public.prevent_connection_reassignment();

-- 4. Remove open INSERT policies (service role bypasses RLS)
DROP POLICY IF EXISTS "Service can insert timeline events" ON public.exchange_timeline;
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

ALTER TABLE public.exchanges
  ADD COLUMN IF NOT EXISTS owner_type text NOT NULL DEFAULT 'agent';

ALTER TABLE public.exchanges
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.exchanges
  DROP CONSTRAINT IF EXISTS exchanges_owner_type_check;

ALTER TABLE public.exchanges
  ADD CONSTRAINT exchanges_owner_type_check
  CHECK (
    (owner_type = 'agent' AND client_id IS NOT NULL)
    OR (owner_type = 'investor' AND client_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_exchanges_owner_workspace
  ON public.exchanges(agent_id, owner_type, is_demo, created_at DESC);

DROP POLICY IF EXISTS "Agents can read own exchanges" ON public.exchanges;
CREATE POLICY "Account owners can read own exchanges"
ON public.exchanges FOR SELECT TO authenticated
USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Agents can insert own exchanges" ON public.exchanges;
CREATE POLICY "Account owners can insert exchanges"
ON public.exchanges FOR INSERT TO authenticated
WITH CHECK (
  agent_id = auth.uid()
  AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  AND (
    (owner_type = 'agent' AND client_id IS NOT NULL AND public.has_role(auth.uid(), 'agent'::public.app_role))
    OR
    (owner_type = 'investor' AND client_id IS NULL AND public.has_role(auth.uid(), 'investor'::public.app_role))
  )
);

DROP POLICY IF EXISTS "Agents can update own exchanges" ON public.exchanges;
CREATE POLICY "Account owners can update own exchanges"
ON public.exchanges FOR UPDATE TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (
  agent_id = auth.uid()
  AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  AND (
    (owner_type = 'agent' AND client_id IS NOT NULL AND public.has_role(auth.uid(), 'agent'::public.app_role))
    OR
    (owner_type = 'investor' AND client_id IS NULL AND public.has_role(auth.uid(), 'investor'::public.app_role))
  )
);

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
    CASE
      WHEN p.address_is_public
        OR p.agent_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      THEN p.address
      ELSE NULL::text
    END,
    p.address_is_public, p.owner_authorization_confirmed, p.city, p.state, p.zip, p.county,
    p.unit_suite, p.asset_type, p.asset_subtype, p.strategy_type, p.source, p.status, p.units,
    p.year_built, p.building_square_footage, p.land_area_acres, p.num_buildings, p.num_stories,
    p.parking_spaces, p.parking_type, p.property_class, p.property_condition, p.construction_type,
    p.roof_type, p.hvac_type, p.zoning, p.amenities, p.description, p.recent_renovations,
    p.is_demo, p.listed_at, p.withdrawn_at, p.created_at, p.updated_at
  FROM public.pledged_properties p
  WHERE auth.uid() IS NOT NULL
    AND (NOT p.is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND (
      p.agent_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (
        p.status = 'active'::public.pledged_property_status
        AND EXISTS (
          SELECT 1
          FROM public.matches m
          JOIN public.exchanges e ON e.id = m.buyer_exchange_id
          WHERE m.seller_property_id = p.id
            AND m.status = 'active'
            AND e.agent_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1
        FROM public.exchange_connections c
        JOIN public.exchanges e ON e.id = c.buyer_exchange_id
        WHERE e.relinquished_property_id = p.id
          AND c.status IN ('accepted', 'in_progress', 'completed')
          AND (c.buyer_agent_id = auth.uid() OR c.seller_agent_id = auth.uid())
      )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.pledged_properties_secure_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pledged_properties_secure_rows() TO authenticated, service_role;

DROP VIEW IF EXISTS public.pledged_properties_secure;
CREATE VIEW public.pledged_properties_secure
WITH (security_invoker = true, security_barrier = true)
AS SELECT * FROM public.pledged_properties_secure_rows();
REVOKE ALL ON public.pledged_properties_secure FROM PUBLIC, anon;
GRANT SELECT ON public.pledged_properties_secure TO authenticated, service_role;

DROP POLICY IF EXISTS "Auth users can read active property financials" ON public.property_financials;
CREATE POLICY "Participants read matched property financials"
ON public.property_financials FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pledged_properties p
    WHERE p.id = public.property_financials.property_id AND p.agent_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.exchanges e ON e.id = m.buyer_exchange_id
    JOIN public.pledged_properties p ON p.id = m.seller_property_id
    WHERE m.seller_property_id = public.property_financials.property_id
      AND m.status = 'active'
      AND p.status = 'active'
      AND e.agent_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.exchange_connections c
    JOIN public.exchanges e ON e.id = c.buyer_exchange_id
    WHERE e.relinquished_property_id = public.property_financials.property_id
      AND c.status IN ('accepted', 'in_progress', 'completed')
      AND (c.buyer_agent_id = auth.uid() OR c.seller_agent_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Auth users can read active property images" ON public.property_images;
CREATE POLICY "Participants read matched property images"
ON public.property_images FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pledged_properties p WHERE p.id = public.property_images.property_id AND p.agent_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.exchanges e ON e.id = m.buyer_exchange_id
    JOIN public.pledged_properties p ON p.id = m.seller_property_id
    WHERE m.seller_property_id = public.property_images.property_id AND m.status = 'active'
      AND p.status = 'active' AND e.agent_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.exchange_connections c
    JOIN public.exchanges e ON e.id = c.buyer_exchange_id
    WHERE e.relinquished_property_id = public.property_images.property_id
      AND c.status IN ('accepted', 'in_progress', 'completed')
      AND (c.buyer_agent_id = auth.uid() OR c.seller_agent_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Auth users can read active property documents" ON public.property_documents;
CREATE POLICY "Participants read matched property documents"
ON public.property_documents FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pledged_properties p WHERE p.id = public.property_documents.property_id AND p.agent_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.exchanges e ON e.id = m.buyer_exchange_id
    JOIN public.pledged_properties p ON p.id = m.seller_property_id
    WHERE m.seller_property_id = public.property_documents.property_id AND m.status = 'active'
      AND p.status = 'active' AND e.agent_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.exchange_connections c
    JOIN public.exchanges e ON e.id = c.buyer_exchange_id
    WHERE e.relinquished_property_id = public.property_documents.property_id
      AND c.status IN ('accepted', 'in_progress', 'completed')
      AND (c.buyer_agent_id = auth.uid() OR c.seller_agent_id = auth.uid())
  )
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'investor'::public.app_role
FROM auth.users
WHERE lower(email) = 'starlord389@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

NOTIFY pgrst, 'reload schema';
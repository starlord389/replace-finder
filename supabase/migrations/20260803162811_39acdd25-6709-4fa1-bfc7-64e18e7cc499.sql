CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, company, mls_number, license_state, brokerage_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'company', ''),
    NULLIF(NEW.raw_user_meta_data->>'mls_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'license_state', ''),
    NULLIF(NEW.raw_user_meta_data->>'brokerage_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('agent', 'client', 'investor')
        THEN (NEW.raw_user_meta_data->>'role')::public.app_role
      ELSE 'agent'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.investor_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company text,
  experience_level text CHECK (experience_level IS NULL OR experience_level IN ('new', 'intermediate', 'experienced', 'professional')),
  preferred_states text[] NOT NULL DEFAULT '{}',
  preferred_asset_types public.asset_type[] NOT NULL DEFAULT '{}',
  investment_strategies public.strategy_type[] NOT NULL DEFAULT '{}',
  budget_min numeric CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max numeric CHECK (budget_max IS NULL OR budget_max >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
);

CREATE TABLE IF NOT EXISTS public.investor_saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investor_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.listing_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  listing_agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_message text NOT NULL CHECK (char_length(btrim(initial_message)) BETWEEN 1 AND 2000),
  agent_response text CHECK (agent_response IS NULL OR char_length(btrim(agent_response)) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'responded', 'closed')),
  is_demo boolean NOT NULL DEFAULT false,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.investor_saved_properties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.listing_inquiries TO authenticated;
GRANT ALL ON public.investor_preferences TO service_role;
GRANT ALL ON public.investor_saved_properties TO service_role;
GRANT ALL ON public.listing_inquiries TO service_role;

CREATE INDEX IF NOT EXISTS idx_investor_saved_properties_investor
  ON public.investor_saved_properties(investor_id, is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_investor
  ON public.listing_inquiries(investor_id, is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_agent
  ON public.listing_inquiries(listing_agent_id, is_demo, created_at DESC);

ALTER TABLE public.investor_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Investors manage own preferences" ON public.investor_preferences;
CREATE POLICY "Investors manage own preferences"
ON public.investor_preferences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'investor'::public.app_role));

DROP POLICY IF EXISTS "Admins manage investor preferences" ON public.investor_preferences;
CREATE POLICY "Admins manage investor preferences"
ON public.investor_preferences FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Investors read own saved properties" ON public.investor_saved_properties;
CREATE POLICY "Investors read own saved properties"
ON public.investor_saved_properties FOR SELECT TO authenticated
USING (investor_id = auth.uid() AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Investors save active properties" ON public.investor_saved_properties;
CREATE POLICY "Investors save active properties"
ON public.investor_saved_properties FOR INSERT TO authenticated
WITH CHECK (
  investor_id = auth.uid()
  AND public.has_role(auth.uid(), 'investor'::public.app_role)
  AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  AND EXISTS (
    SELECT 1 FROM public.pledged_properties p
    WHERE p.id = property_id
      AND p.status = 'active'
      AND p.is_demo = is_demo
      AND (NOT p.is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

DROP POLICY IF EXISTS "Investors remove own saved properties" ON public.investor_saved_properties;
CREATE POLICY "Investors remove own saved properties"
ON public.investor_saved_properties FOR DELETE TO authenticated
USING (investor_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage saved properties" ON public.investor_saved_properties;
CREATE POLICY "Admins manage saved properties"
ON public.investor_saved_properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.prepare_listing_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  property_row public.pledged_properties%ROWTYPE;
BEGIN
  SELECT * INTO property_row
  FROM public.pledged_properties
  WHERE id = NEW.property_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inquiries can only be created for active properties';
  END IF;

  NEW.listing_agent_id := property_row.agent_id;
  NEW.is_demo := property_row.is_demo;
  NEW.status := 'new';
  NEW.agent_response := NULL;
  NEW.responded_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_listing_inquiry ON public.listing_inquiries;
CREATE TRIGGER trg_prepare_listing_inquiry
  BEFORE INSERT ON public.listing_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.prepare_listing_inquiry();

CREATE OR REPLACE FUNCTION public.guard_listing_inquiry_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF auth.uid() IS DISTINCT FROM OLD.listing_agent_id THEN
      RAISE EXCEPTION 'Only the listing agent may respond to this inquiry';
    END IF;
    IF NEW.investor_id IS DISTINCT FROM OLD.investor_id
       OR NEW.property_id IS DISTINCT FROM OLD.property_id
       OR NEW.listing_agent_id IS DISTINCT FROM OLD.listing_agent_id
       OR NEW.initial_message IS DISTINCT FROM OLD.initial_message
       OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Inquiry identity and initial message are immutable';
    END IF;
  END IF;

  IF NEW.agent_response IS DISTINCT FROM OLD.agent_response AND NEW.agent_response IS NOT NULL THEN
    NEW.status := 'responded';
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_listing_inquiry_update ON public.listing_inquiries;
CREATE TRIGGER trg_guard_listing_inquiry_update
  BEFORE UPDATE ON public.listing_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.guard_listing_inquiry_update();

DROP TRIGGER IF EXISTS trg_investor_preferences_updated_at ON public.investor_preferences;
CREATE TRIGGER trg_investor_preferences_updated_at
  BEFORE UPDATE ON public.investor_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_listing_inquiries_updated_at ON public.listing_inquiries;
CREATE TRIGGER trg_listing_inquiries_updated_at
  BEFORE UPDATE ON public.listing_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_listing_inquiry_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  property_label text;
BEGIN
  SELECT COALESCE(property_name, city || ', ' || state, 'Investment property')
  INTO property_label
  FROM public.pledged_properties
  WHERE id = NEW.property_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link_to, metadata)
    VALUES (
      NEW.listing_agent_id,
      'investor_inquiry',
      'New investor inquiry',
      'An investor asked about ' || property_label || '.',
      '/agent/investor-inquiries',
      jsonb_build_object('inquiry_id', NEW.id, 'demo', NEW.is_demo, 'investor_id', NEW.investor_id)
    );
  ELSIF NEW.agent_response IS DISTINCT FROM OLD.agent_response AND NEW.agent_response IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link_to, metadata)
    VALUES (
      NEW.investor_id,
      'investor_inquiry_response',
      'Listing agent responded',
      'You received a response about ' || property_label || '.',
      '/investor/inquiries',
      jsonb_build_object('inquiry_id', NEW.id, 'demo', NEW.is_demo, 'investor_id', NEW.investor_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_listing_inquiry_participants ON public.listing_inquiries;
CREATE TRIGGER trg_notify_listing_inquiry_participants
  AFTER INSERT OR UPDATE OF agent_response ON public.listing_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_listing_inquiry_participants();

DROP POLICY IF EXISTS "Investors read own inquiries" ON public.listing_inquiries;
CREATE POLICY "Investors read own inquiries"
ON public.listing_inquiries FOR SELECT TO authenticated
USING (investor_id = auth.uid() AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Investors create inquiries" ON public.listing_inquiries;
CREATE POLICY "Investors create inquiries"
ON public.listing_inquiries FOR INSERT TO authenticated
WITH CHECK (
  investor_id = auth.uid()
  AND public.has_role(auth.uid(), 'investor'::public.app_role)
  AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
);

DROP POLICY IF EXISTS "Listing agents read property inquiries" ON public.listing_inquiries;
CREATE POLICY "Listing agents read property inquiries"
ON public.listing_inquiries FOR SELECT TO authenticated
USING (listing_agent_id = auth.uid());

DROP POLICY IF EXISTS "Listing agents respond to property inquiries" ON public.listing_inquiries;
CREATE POLICY "Listing agents respond to property inquiries"
ON public.listing_inquiries FOR UPDATE TO authenticated
USING (listing_agent_id = auth.uid())
WITH CHECK (listing_agent_id = auth.uid() AND status IN ('responded', 'closed'));

DROP POLICY IF EXISTS "Admins manage listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Admins manage listing inquiries"
ON public.listing_inquiries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Inquiry counterparts can view profile" ON public.profiles;
CREATE POLICY "Inquiry counterparts can view profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listing_inquiries i
    WHERE (i.investor_id = profiles.id AND i.listing_agent_id = auth.uid())
       OR (i.listing_agent_id = profiles.id AND i.investor_id = auth.uid())
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
    AND (NOT p.is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND (p.status = 'active'::public.pledged_property_status
         OR p.agent_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'::public.app_role));
END;
$$;

REVOKE ALL ON FUNCTION public.pledged_properties_secure_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pledged_properties_secure_rows() TO authenticated, service_role;

CREATE OR REPLACE VIEW public.pledged_properties_secure
WITH (security_invoker = true, security_barrier = true)
AS SELECT * FROM public.pledged_properties_secure_rows();

REVOKE ALL ON public.pledged_properties_secure FROM PUBLIC, anon;
GRANT SELECT ON public.pledged_properties_secure TO authenticated, service_role;

DROP POLICY IF EXISTS "Auth users can read active property financials" ON public.property_financials;
CREATE POLICY "Auth users can read active property financials"
ON public.property_financials FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.pledged_properties
    WHERE status = 'active'
      AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

DROP POLICY IF EXISTS "Auth users can read active property images" ON public.property_images;
CREATE POLICY "Auth users can read active property images"
ON public.property_images FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.pledged_properties
    WHERE status = 'active'
      AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

DROP POLICY IF EXISTS "Auth users can read active property documents" ON public.property_documents;
CREATE POLICY "Auth users can read active property documents"
ON public.property_documents FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.pledged_properties
    WHERE status = 'active'
      AND (NOT is_demo OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'investor'::public.app_role
FROM auth.users
WHERE lower(email) = lower('starlord389@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- Match run status enum
CREATE TYPE public.match_run_status AS ENUM ('pending', 'completed', 'failed');

-- Match result status enum
CREATE TYPE public.match_result_status AS ENUM ('pending', 'approved', 'rejected');

-- Match runs table
CREATE TABLE public.match_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  status public.match_run_status NOT NULL DEFAULT 'pending',
  total_properties_scored INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all match runs" ON public.match_runs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert match runs" ON public.match_runs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update match runs" ON public.match_runs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage match runs" ON public.match_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Match results table
CREATE TABLE public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id UUID NOT NULL REFERENCES public.match_runs(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  total_score NUMERIC NOT NULL DEFAULT 0,
  price_score NUMERIC NOT NULL DEFAULT 0,
  geo_score NUMERIC NOT NULL DEFAULT 0,
  asset_score NUMERIC NOT NULL DEFAULT 0,
  strategy_score NUMERIC NOT NULL DEFAULT 0,
  financial_score NUMERIC NOT NULL DEFAULT 0,
  timing_score NUMERIC NOT NULL DEFAULT 0,
  status public.match_result_status NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all match results" ON public.match_results FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert match results" ON public.match_results FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update match results" ON public.match_results FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage match results" ON public.match_results FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Matched property access (granted when admin approves a match)
CREATE TABLE public.matched_property_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  match_result_id UUID NOT NULL REFERENCES public.match_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, property_id)
);

ALTER TABLE public.matched_property_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access" ON public.matched_property_access FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert access" ON public.matched_property_access FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete access" ON public.matched_property_access FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own access" ON public.matched_property_access FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage access" ON public.matched_property_access FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Let clients see inventory properties they have been granted access to
CREATE POLICY "Users can view matched properties" ON public.inventory_properties FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.property_id = inventory_properties.id AND mpa.user_id = auth.uid()
  )
);

-- Let clients see financials for matched properties
CREATE POLICY "Users can view matched financials" ON public.inventory_financials FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.property_id = inventory_financials.property_id AND mpa.user_id = auth.uid()
  )
);

-- Let clients see images for matched properties
CREATE POLICY "Users can view matched images" ON public.inventory_images FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.property_id = inventory_images.property_id AND mpa.user_id = auth.uid()
  )
);

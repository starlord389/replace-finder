
-- Migration 1: Expand exchange_requests with MLS-level fields
ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS property_name text,
  ADD COLUMN IF NOT EXISTS unit_suite text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS asset_subtype text,
  ADD COLUMN IF NOT EXISTS property_class text,
  ADD COLUMN IF NOT EXISTS building_square_footage numeric,
  ADD COLUMN IF NOT EXISTS land_area_acres numeric,
  ADD COLUMN IF NOT EXISTS num_buildings integer,
  ADD COLUMN IF NOT EXISTS num_stories integer,
  ADD COLUMN IF NOT EXISTS parking_spaces integer,
  ADD COLUMN IF NOT EXISTS parking_type text,
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS construction_type text,
  ADD COLUMN IF NOT EXISTS roof_type text,
  ADD COLUMN IF NOT EXISTS hvac_type text,
  ADD COLUMN IF NOT EXISTS property_condition text,
  ADD COLUMN IF NOT EXISTS recent_renovations text,
  ADD COLUMN IF NOT EXISTS amenities text[],
  ADD COLUMN IF NOT EXISTS gross_scheduled_income numeric,
  ADD COLUMN IF NOT EXISTS effective_gross_income numeric,
  ADD COLUMN IF NOT EXISTS real_estate_taxes numeric,
  ADD COLUMN IF NOT EXISTS insurance numeric,
  ADD COLUMN IF NOT EXISTS utilities numeric,
  ADD COLUMN IF NOT EXISTS management_fee numeric,
  ADD COLUMN IF NOT EXISTS maintenance_repairs numeric,
  ADD COLUMN IF NOT EXISTS capex_reserves numeric,
  ADD COLUMN IF NOT EXISTS other_expenses numeric,
  ADD COLUMN IF NOT EXISTS average_rent_per_unit numeric,
  ADD COLUMN IF NOT EXISTS current_noi numeric,
  ADD COLUMN IF NOT EXISTS current_occupancy_rate numeric,
  ADD COLUMN IF NOT EXISTS current_cap_rate numeric,
  ADD COLUMN IF NOT EXISTS current_loan_balance numeric,
  ADD COLUMN IF NOT EXISTS current_interest_rate numeric,
  ADD COLUMN IF NOT EXISTS annual_debt_service numeric,
  ADD COLUMN IF NOT EXISTS loan_type text,
  ADD COLUMN IF NOT EXISTS loan_maturity_date date,
  ADD COLUMN IF NOT EXISTS has_prepayment_penalty boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepayment_penalty_details text;

-- Migration 2: Expand exchange_request_preferences
ALTER TABLE public.exchange_request_preferences
  ADD COLUMN IF NOT EXISTS target_occupancy_min numeric,
  ADD COLUMN IF NOT EXISTS target_year_built_min integer,
  ADD COLUMN IF NOT EXISTS target_property_classes text[],
  ADD COLUMN IF NOT EXISTS open_to_dsts boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS open_to_tics boolean DEFAULT false;

-- Migration 3: Create request_images table + storage bucket
CREATE TABLE IF NOT EXISTS public.request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.request_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own request images
CREATE POLICY "Users can view own request images"
  ON public.request_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own request images
CREATE POLICY "Users can insert own request images"
  ON public.request_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own request images
CREATE POLICY "Users can update own request images"
  ON public.request_images FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete own request images
CREATE POLICY "Users can delete own request images"
  ON public.request_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all request images
CREATE POLICY "Admins can view all request images"
  ON public.request_images FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for request images
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users can upload request images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'request-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own request images in storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'request-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own request images in storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'request-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view request images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'request-images');

-- Migration 4: Expand inventory tables for Part 3
ALTER TABLE public.inventory_properties
  ADD COLUMN IF NOT EXISTS asset_subtype text,
  ADD COLUMN IF NOT EXISTS property_class text,
  ADD COLUMN IF NOT EXISTS land_area_acres numeric,
  ADD COLUMN IF NOT EXISTS num_buildings integer,
  ADD COLUMN IF NOT EXISTS num_stories integer,
  ADD COLUMN IF NOT EXISTS parking_spaces integer,
  ADD COLUMN IF NOT EXISTS parking_type text,
  ADD COLUMN IF NOT EXISTS zoning text,
  ADD COLUMN IF NOT EXISTS construction_type text,
  ADD COLUMN IF NOT EXISTS roof_type text,
  ADD COLUMN IF NOT EXISTS hvac_type text,
  ADD COLUMN IF NOT EXISTS property_condition text,
  ADD COLUMN IF NOT EXISTS recent_renovations text,
  ADD COLUMN IF NOT EXISTS amenities text[];

ALTER TABLE public.inventory_financials
  ADD COLUMN IF NOT EXISTS gross_scheduled_income numeric,
  ADD COLUMN IF NOT EXISTS effective_gross_income numeric,
  ADD COLUMN IF NOT EXISTS vacancy_rate numeric,
  ADD COLUMN IF NOT EXISTS real_estate_taxes numeric,
  ADD COLUMN IF NOT EXISTS insurance numeric,
  ADD COLUMN IF NOT EXISTS utilities numeric,
  ADD COLUMN IF NOT EXISTS management_fee numeric,
  ADD COLUMN IF NOT EXISTS maintenance_repairs numeric,
  ADD COLUMN IF NOT EXISTS capex_reserves numeric,
  ADD COLUMN IF NOT EXISTS other_expenses numeric,
  ADD COLUMN IF NOT EXISTS other_income numeric,
  ADD COLUMN IF NOT EXISTS loan_amount numeric,
  ADD COLUMN IF NOT EXISTS loan_rate numeric,
  ADD COLUMN IF NOT EXISTS annual_debt_service numeric,
  ADD COLUMN IF NOT EXISTS average_rent_per_unit numeric;


-- Inventory property status
CREATE TYPE public.inventory_status AS ENUM ('draft', 'active', 'under_contract', 'closed', 'archived');

-- Inventory properties
CREATE TABLE public.inventory_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  asset_type asset_type,
  strategy_type strategy_type,
  status inventory_status NOT NULL DEFAULT 'draft',
  description TEXT,
  units INTEGER,
  square_footage INTEGER,
  year_built INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all inventory"
  ON public.inventory_properties FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert inventory"
  ON public.inventory_properties FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inventory"
  ON public.inventory_properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inventory"
  ON public.inventory_properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_inventory_properties_updated_at
  BEFORE UPDATE ON public.inventory_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inventory financials
CREATE TABLE public.inventory_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  asking_price NUMERIC,
  cap_rate NUMERIC,
  noi NUMERIC,
  cash_on_cash NUMERIC,
  occupancy_rate NUMERIC,
  debt_amount NUMERIC,
  debt_rate NUMERIC,
  annual_revenue NUMERIC,
  annual_expenses NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.inventory_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all financials"
  ON public.inventory_financials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert financials"
  ON public.inventory_financials FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update financials"
  ON public.inventory_financials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete financials"
  ON public.inventory_financials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_inventory_financials_updated_at
  BEFORE UPDATE ON public.inventory_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inventory images
CREATE TABLE public.inventory_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all images"
  ON public.inventory_images FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert images"
  ON public.inventory_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete images"
  ON public.inventory_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inventory documents
CREATE TABLE public.inventory_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  document_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all documents"
  ON public.inventory_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert documents"
  ON public.inventory_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents"
  ON public.inventory_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inventory source metadata
CREATE TABLE public.inventory_source_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.inventory_properties(id) ON DELETE CASCADE,
  source_type TEXT,
  source_contact TEXT,
  source_email TEXT,
  source_phone TEXT,
  date_sourced DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.inventory_source_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all source metadata"
  ON public.inventory_source_metadata FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert source metadata"
  ON public.inventory_source_metadata FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update source metadata"
  ON public.inventory_source_metadata FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete source metadata"
  ON public.inventory_source_metadata FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_inventory_source_metadata_updated_at
  BEFORE UPDATE ON public.inventory_source_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets for inventory media
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-images', 'inventory-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('inventory-documents', 'inventory-documents', false);

-- Storage policies
CREATE POLICY "Admins can upload inventory images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view inventory images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inventory-images');

CREATE POLICY "Admins can delete inventory images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventory-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload inventory documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventory-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view inventory documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inventory-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inventory documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventory-documents' AND public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_inventory_properties_status ON public.inventory_properties(status);
CREATE INDEX idx_inventory_properties_asset_type ON public.inventory_properties(asset_type);
CREATE INDEX idx_inventory_properties_state ON public.inventory_properties(state);
CREATE INDEX idx_inventory_financials_property_id ON public.inventory_financials(property_id);
CREATE INDEX idx_inventory_images_property_id ON public.inventory_images(property_id);
CREATE INDEX idx_inventory_documents_property_id ON public.inventory_documents(property_id);

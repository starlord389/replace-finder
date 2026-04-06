
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);

CREATE TABLE public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  document_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_property_documents_property_id ON public.property_documents(property_id);


CREATE TABLE public.dst_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  sponsor_name text NOT NULL,
  address text,
  city text,
  state text,
  zip text,
  asset_type public.asset_type,
  strategy_type public.strategy_type,
  units integer,
  square_footage numeric,
  asking_price numeric,
  noi numeric,
  cap_rate numeric,
  occupancy_rate numeric,
  minimum_investment numeric,
  target_return numeric,
  debt_ratio numeric,
  offering_status text NOT NULL DEFAULT 'open',
  description text,
  documents_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dst_offering_status_check CHECK (offering_status IN ('open', 'closing_soon', 'closed')),
  CONSTRAINT dst_status_check CHECK (status IN ('active', 'archived'))
);

ALTER TABLE public.dst_properties ENABLE ROW LEVEL SECURITY;

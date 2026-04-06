
CREATE TYPE public.property_source AS ENUM ('agent_pledge', 'platform_sourced', 'dst');
CREATE TYPE public.pledged_property_status AS ENUM ('draft', 'active', 'under_contract', 'exchanged', 'withdrawn');

CREATE TABLE public.pledged_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id),
  source public.property_source NOT NULL DEFAULT 'agent_pledge',
  property_name text,
  address text,
  unit_suite text,
  city text,
  state text,
  zip text,
  county text,
  asset_type public.asset_type,
  asset_subtype text,
  strategy_type public.strategy_type,
  property_class text,
  units integer,
  building_square_footage numeric,
  land_area_acres numeric,
  year_built integer,
  num_buildings integer,
  num_stories integer,
  parking_spaces integer,
  parking_type text,
  construction_type text,
  roof_type text,
  hvac_type text,
  property_condition text,
  zoning text,
  amenities text[],
  recent_renovations text,
  description text,
  status public.pledged_property_status NOT NULL DEFAULT 'draft',
  listed_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pledged_properties ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pledged_properties_exchange_id ON public.pledged_properties(exchange_id);
CREATE INDEX idx_pledged_properties_agent_id ON public.pledged_properties(agent_id);
CREATE INDEX idx_pledged_properties_status ON public.pledged_properties(status);
CREATE INDEX idx_pledged_properties_state ON public.pledged_properties(state);
CREATE INDEX idx_pledged_properties_asset_type ON public.pledged_properties(asset_type);

ALTER TABLE public.exchanges
  ADD CONSTRAINT exchanges_relinquished_property_fkey
  FOREIGN KEY (relinquished_property_id) REFERENCES public.pledged_properties(id);

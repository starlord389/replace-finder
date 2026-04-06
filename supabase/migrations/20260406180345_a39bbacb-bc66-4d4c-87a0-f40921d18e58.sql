
CREATE TABLE public.replacement_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  target_asset_types public.asset_type[] NOT NULL,
  target_strategies public.strategy_type[],
  target_states text[] NOT NULL,
  target_metros text[],
  target_property_classes text[],
  target_price_min numeric NOT NULL,
  target_price_max numeric NOT NULL,
  target_cap_rate_min numeric,
  target_cap_rate_max numeric,
  target_occupancy_min numeric,
  target_year_built_min integer,
  target_units_min integer,
  target_units_max integer,
  target_sf_min numeric,
  target_sf_max numeric,
  open_to_dsts boolean DEFAULT false,
  open_to_tics boolean DEFAULT false,
  must_replace_debt boolean DEFAULT true,
  min_debt_replacement numeric,
  urgency text DEFAULT 'standard',
  additional_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT replacement_criteria_urgency_check CHECK (urgency IN ('immediate', 'standard', 'flexible'))
);

ALTER TABLE public.replacement_criteria ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_replacement_criteria_exchange_id ON public.replacement_criteria(exchange_id);

ALTER TABLE public.exchanges
  ADD CONSTRAINT exchanges_criteria_fkey
  FOREIGN KEY (criteria_id) REFERENCES public.replacement_criteria(id);

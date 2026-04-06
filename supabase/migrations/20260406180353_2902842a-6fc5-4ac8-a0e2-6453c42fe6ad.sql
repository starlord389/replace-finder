
CREATE TYPE public.boot_status AS ENUM ('no_boot', 'minor_boot', 'significant_boot', 'insufficient_data');

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  seller_property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  total_score numeric NOT NULL DEFAULT 0,
  price_score numeric NOT NULL DEFAULT 0,
  geo_score numeric NOT NULL DEFAULT 0,
  asset_score numeric NOT NULL DEFAULT 0,
  strategy_score numeric NOT NULL DEFAULT 0,
  financial_score numeric NOT NULL DEFAULT 0,
  timing_score numeric NOT NULL DEFAULT 0,
  debt_fit_score numeric NOT NULL DEFAULT 0,
  scale_fit_score numeric NOT NULL DEFAULT 0,
  estimated_cash_boot numeric,
  estimated_mortgage_boot numeric,
  estimated_total_boot numeric,
  estimated_boot_tax numeric,
  boot_status public.boot_status NOT NULL DEFAULT 'insufficient_data',
  status text NOT NULL DEFAULT 'active',
  buyer_agent_viewed boolean NOT NULL DEFAULT false,
  buyer_agent_viewed_at timestamptz,
  seller_agent_viewed boolean NOT NULL DEFAULT false,
  seller_agent_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_unique_pair UNIQUE (buyer_exchange_id, seller_property_id),
  CONSTRAINT matches_status_check CHECK (status IN ('active', 'archived'))
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_matches_buyer_exchange ON public.matches(buyer_exchange_id);
CREATE INDEX idx_matches_seller_property ON public.matches(seller_property_id);
CREATE INDEX idx_matches_total_score ON public.matches(total_score DESC);
CREATE INDEX idx_matches_status ON public.matches(status);

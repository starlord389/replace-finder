
CREATE TYPE public.exchange_status AS ENUM (
  'draft', 'active', 'in_identification', 'in_closing', 'completed', 'failed', 'cancelled'
);

CREATE TABLE public.exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id),
  client_id uuid NOT NULL REFERENCES public.agent_clients(id) ON DELETE CASCADE,
  status public.exchange_status NOT NULL DEFAULT 'draft',
  sale_close_date date,
  identification_deadline date,
  closing_deadline date,
  actual_close_date date,
  relinquished_property_id uuid,
  criteria_id uuid,
  exchange_proceeds numeric,
  estimated_equity numeric,
  estimated_basis numeric,
  estimated_gain numeric,
  estimated_tax_liability numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_exchanges_agent_id ON public.exchanges(agent_id);
CREATE INDEX idx_exchanges_client_id ON public.exchanges(client_id);
CREATE INDEX idx_exchanges_status ON public.exchanges(status);

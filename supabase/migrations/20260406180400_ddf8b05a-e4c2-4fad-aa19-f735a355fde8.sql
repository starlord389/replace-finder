
CREATE TABLE public.exchange_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id),
  buyer_exchange_id uuid NOT NULL REFERENCES public.exchanges(id),
  seller_exchange_id uuid REFERENCES public.exchanges(id),
  buyer_agent_id uuid NOT NULL REFERENCES auth.users(id),
  seller_agent_id uuid NOT NULL REFERENCES auth.users(id),
  initiated_by text NOT NULL,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  status text NOT NULL DEFAULT 'pending',
  facilitation_fee_agreed boolean NOT NULL DEFAULT false,
  facilitation_fee_amount numeric,
  facilitation_fee_status text NOT NULL DEFAULT 'pending',
  under_contract_at timestamptz,
  inspection_complete_at timestamptz,
  financing_approved_at timestamptz,
  closed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exchange_connections_initiated_by_check CHECK (initiated_by IN ('buyer_agent', 'seller_agent')),
  CONSTRAINT exchange_connections_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
  CONSTRAINT exchange_connections_fee_status_check CHECK (facilitation_fee_status IN ('pending', 'invoiced', 'paid', 'waived'))
);

ALTER TABLE public.exchange_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_connections_buyer_agent ON public.exchange_connections(buyer_agent_id);
CREATE INDEX idx_connections_seller_agent ON public.exchange_connections(seller_agent_id);
CREATE INDEX idx_connections_status ON public.exchange_connections(status);

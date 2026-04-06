
CREATE TABLE public.identification_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id),
  match_id uuid REFERENCES public.matches(id),
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'identified',
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  CONSTRAINT identification_list_position_check CHECK (position BETWEEN 1 AND 3),
  CONSTRAINT identification_list_status_check CHECK (status IN ('identified', 'under_contract', 'closed', 'removed')),
  CONSTRAINT identification_list_unique_position UNIQUE (exchange_id, position)
);

ALTER TABLE public.identification_list ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_identification_list_exchange ON public.identification_list(exchange_id);

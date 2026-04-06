
CREATE TABLE public.exchange_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exchange_timeline_event_check CHECK (event_type IN (
    'created', 'property_pledged', 'criteria_set', 'status_change',
    'match_found', 'connection_initiated', 'connection_accepted',
    'identification_added', 'identification_finalized',
    'under_contract', 'closed', 'failed', 'cancelled'
  ))
);

ALTER TABLE public.exchange_timeline ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_exchange_timeline_exchange ON public.exchange_timeline(exchange_id, created_at);

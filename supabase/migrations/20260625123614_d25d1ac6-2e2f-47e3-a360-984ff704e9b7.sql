ALTER TABLE public.exchange_connections
  DROP CONSTRAINT IF EXISTS exchange_connections_status_check;

ALTER TABLE public.exchange_connections
  ADD CONSTRAINT exchange_connections_status_check
  CHECK (status IN ('pending', 'accepted', 'in_progress', 'declined', 'cancelled', 'completed'));

ALTER TABLE public.exchange_timeline
  DROP CONSTRAINT IF EXISTS exchange_timeline_event_check;

ALTER TABLE public.exchange_timeline
  ADD CONSTRAINT exchange_timeline_event_check CHECK (event_type IN (
    'created', 'property_pledged', 'criteria_set', 'status_change',
    'match_found', 'connection_initiated', 'connection_accepted', 'connection_milestone',
    'identification_added', 'identification_finalized',
    'under_contract', 'closed', 'failed', 'cancelled',
    'exchange_updated', 'exchange_published', 'exchange_moved_to_draft'
  ));
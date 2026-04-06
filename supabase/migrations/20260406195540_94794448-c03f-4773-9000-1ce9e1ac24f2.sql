ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'new_match', 'match_score_update', 'connection_request', 'connection_accepted',
  'connection_declined', 'connection_milestone', 'connection_failed',
  'deadline_warning', 'deadline_critical',
  'exchange_status_change', 'new_referral', 'property_status_change', 'system'
));

ALTER TABLE public.exchange_timeline DROP CONSTRAINT IF EXISTS exchange_timeline_event_check;

ALTER TABLE public.exchange_timeline ADD CONSTRAINT exchange_timeline_event_check CHECK (event_type IN (
  'created', 'property_pledged', 'criteria_set', 'status_change',
  'match_found', 'connection_initiated', 'connection_accepted', 'connection_milestone',
  'identification_added', 'identification_finalized',
  'under_contract', 'closed', 'failed', 'cancelled'
));
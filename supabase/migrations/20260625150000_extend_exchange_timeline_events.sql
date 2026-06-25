-- The update-exchange edge function logs three lifecycle events that the
-- original exchange_timeline_event_check (latest definition 20260406201013)
-- never allowed:
--   exchange_updated        — a plain save of an existing exchange
--   exchange_published      — draft -> active (matching runs)
--   exchange_moved_to_draft — active -> draft (matching paused)
-- Each insert violated the CHECK constraint and failed silently (bare await in
-- the edge function), so the agent's exchange timeline was missing every
-- edit / publish / unpublish entry.
--
-- No code reads event_type to drive display (AdminDashboard and
-- AdminExchangeDetail render the `description` text only), so extending the
-- allowed set to match the app's intended vocabulary needs no client change
-- and lets update-exchange's existing inserts succeed without a redeploy.

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

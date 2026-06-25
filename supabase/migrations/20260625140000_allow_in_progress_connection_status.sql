-- The exchange_connections deal lifecycle uses 'in_progress' (under contract)
-- as the stage between 'accepted' and 'completed'. This is the intended
-- vocabulary across the app and the data layer:
--   * src/pages/agent/AgentConnectionDetail.tsx writes status='in_progress'
--     when the under_contract_at milestone is reached, and again when the
--     closed_at milestone is cleared.
--   * the users_share_active_connection RLS predicate (20260530022148) treats
--     'in_progress' as an active, message-revealing status.
--   * useConversations / useUnifiedRelationships read 'in_progress' as active.
--
-- The original CHECK constraint (20260406180400) omitted 'in_progress', so
-- advancing an accepted deal to "under contract" violated the constraint and
-- the UPDATE failed — stranding every deal at 'accepted'. Add the value.

ALTER TABLE public.exchange_connections
  DROP CONSTRAINT IF EXISTS exchange_connections_status_check;

ALTER TABLE public.exchange_connections
  ADD CONSTRAINT exchange_connections_status_check
  CHECK (status IN ('pending', 'accepted', 'in_progress', 'declined', 'cancelled', 'completed'));

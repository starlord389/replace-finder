-- A cancelled or declined agent connection records closed_at as the time the
-- conversation ended. That timestamp is not evidence that the deal closed.
-- Give terminal connection statuses precedence, while preserving another
-- active connection for the same match when one exists.

CREATE OR REPLACE FUNCTION public.sync_match_workflow_from_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IN ('declined', 'cancelled') THEN
    IF EXISTS (
      SELECT 1
      FROM public.exchange_connections AS c
      WHERE c.match_id = NEW.match_id
        AND c.status = 'completed'
    ) THEN
      PERFORM public.apply_match_workflow_stage(
        NEW.match_id, 'closed', 'connection_closed', auth.uid(), NULL, false
      );
    ELSIF EXISTS (
      SELECT 1
      FROM public.exchange_connections AS c
      WHERE c.match_id = NEW.match_id
        AND c.status = 'in_progress'
    ) THEN
      PERFORM public.apply_match_workflow_stage(
        NEW.match_id, 'under_contract', 'connection_under_contract', auth.uid(), NULL, true
      );
    ELSIF EXISTS (
      SELECT 1
      FROM public.exchange_connections AS c
      WHERE c.match_id = NEW.match_id
        AND c.status = 'accepted'
    ) THEN
      PERFORM public.apply_match_workflow_stage(
        NEW.match_id, 'in_conversation', 'agent_conversation_started', auth.uid(), NULL, true
      );
    ELSE
      PERFORM public.apply_match_workflow_stage(
        NEW.match_id,
        'archived',
        'connection_ended',
        auth.uid(),
        COALESCE(NEW.decline_reason, NEW.failure_reason),
        false
      );
    END IF;
  ELSIF NEW.status = 'completed' OR NEW.closed_at IS NOT NULL THEN
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'closed', 'connection_closed', auth.uid(), NULL, false
    );
  ELSIF NEW.status = 'in_progress' OR NEW.under_contract_at IS NOT NULL THEN
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'under_contract', 'connection_under_contract', auth.uid(), NULL, false
    );
  ELSIF NEW.status = 'accepted' THEN
    PERFORM public.apply_match_workflow_stage(
      NEW.match_id, 'in_conversation', 'agent_conversation_started', auth.uid(), NULL, false
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_match_workflow_from_connection() IS
  'Synchronizes opportunity stages from durable agent connections. Cancelled and declined conversations never count as completed deals merely because closed_at records when the conversation ended.';

-- Repair only rows whose most recent durable workflow source falsely treated
-- a non-completed connection as a closed deal. Genuine completed connections
-- are explicitly excluded. apply_match_workflow_stage records the correction
-- in the append-only event history.
DO $repair_false_closed_workflows$
DECLARE
  v_workflow record;
BEGIN
  FOR v_workflow IN
    SELECT
      s.match_id,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.exchange_connections AS c
          WHERE c.match_id = s.match_id AND c.status = 'in_progress'
        ) THEN 'under_contract'
        WHEN EXISTS (
          SELECT 1 FROM public.exchange_connections AS c
          WHERE c.match_id = s.match_id AND c.status = 'accepted'
        ) THEN 'in_conversation'
        WHEN EXISTS (
          SELECT 1 FROM public.agent_match_recommendations AS r
          WHERE r.match_id = s.match_id AND r.response = 'interested'
        ) OR EXISTS (
          SELECT 1 FROM public.agent_contact_requests AS r
          WHERE r.match_id = s.match_id
            AND r.status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted')
        ) THEN 'client_interested'
        WHEN EXISTS (
          SELECT 1 FROM public.agent_match_recommendations AS r
          WHERE r.match_id = s.match_id
        ) THEN 'sent_to_client'
        ELSE 'archived'
      END AS repaired_stage
    FROM public.match_workflow_states AS s
    WHERE s.current_stage = 'closed'
      AND s.stage_source = 'connection_closed'
      AND NOT EXISTS (
        SELECT 1 FROM public.exchange_connections AS c
        WHERE c.match_id = s.match_id AND c.status = 'completed'
      )
      AND EXISTS (
        SELECT 1 FROM public.exchange_connections AS c
        WHERE c.match_id = s.match_id
          AND c.status IN ('declined', 'cancelled')
          AND c.closed_at IS NOT NULL
      )
  LOOP
    PERFORM public.apply_match_workflow_stage(
      v_workflow.match_id,
      v_workflow.repaired_stage,
      'connection_status_repair',
      NULL,
      'Corrected a cancelled or declined conversation that was previously classified as a closed deal.',
      true
    );

    UPDATE public.match_workflow_states
    SET closed_at = NULL,
        updated_at = now()
    WHERE match_id = v_workflow.match_id;
  END LOOP;
END;
$repair_false_closed_workflows$;

NOTIFY pgrst, 'reload schema';
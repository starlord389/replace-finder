-- Remove the final user-facing remnants of the retired manual agent approval
-- concept. This migration changes wording and policy names only; authorization
-- continues to flow through is_verified_agent(), whose current implementation
-- is the compatibility alias for is_active_agent().

DO $rewrite_function_wording$
DECLARE
  v_function record;
  v_definition text;
BEGIN
  FOR v_function IN
    SELECT p.oid
    FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosrc ILIKE '%verified agent%'
  LOOP
    v_definition := pg_catalog.pg_get_functiondef(v_function.oid);
    v_definition := replace(v_definition, 'Only a verified agent', 'Only an agent');
    v_definition := replace(v_definition, 'Choose a verified agent', 'Choose an agent');
    v_definition := replace(v_definition, 'A verified agent', 'An agent');
    v_definition := replace(v_definition, 'a verified agent', 'an agent');
    v_definition := replace(v_definition, 'Verified agents', 'Agents');
    v_definition := replace(v_definition, 'verified agents', 'agents');
    v_definition := replace(v_definition, 'Verified listing agent', 'Listing agent');
    v_definition := replace(v_definition, 'verified listing agent', 'listing agent');
    EXECUTE v_definition;
  END LOOP;
END;
$rewrite_function_wording$;

DO $rename_legacy_policies$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT *
    FROM (VALUES
      ('exchange_connections', 'Verified assigned agents create connections', 'Active assigned agents create connections'),
      ('messages', 'Verified agents can send connection messages', 'Active agents can send connection messages'),
      ('messages', 'Verified connection agents can read messages', 'Active connection agents can read messages'),
      ('exchange_connections', 'Verified agents read own connections', 'Active agents read own connections'),
      ('exchange_connections', 'Verified agents can update own connections', 'Active agents can update own connections')
    ) AS policies(table_name, old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies AS p
      WHERE p.schemaname = 'public'
        AND p.tablename = v_policy.table_name
        AND p.policyname = v_policy.old_name
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_policies AS p
      WHERE p.schemaname = 'public'
        AND p.tablename = v_policy.table_name
        AND p.policyname = v_policy.new_name
    ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I RENAME TO %I',
        v_policy.old_name,
        v_policy.table_name,
        v_policy.new_name
      );
    END IF;
  END LOOP;
END;
$rename_legacy_policies$;

-- Existing marketplace notifications should use the same current terminology.
UPDATE public.notifications
SET
  title = replace(
    replace(replace(replace(title, 'A verified agent', 'An agent'), 'a verified agent', 'an agent'), 'Verified agents', 'Agents'),
    'verified agents', 'agents'
  ),
  message = replace(
    replace(replace(replace(message, 'A verified agent', 'An agent'), 'a verified agent', 'an agent'), 'Verified agents', 'Agents'),
    'verified agents', 'agents'
  )
WHERE title ILIKE '%verified agent%'
   OR message ILIKE '%verified agent%';

UPDATE public.agent_connection_intents
SET resolution_note = replace(
  replace(replace(replace(resolution_note, 'A verified agent', 'An agent'), 'a verified agent', 'an agent'), 'Verified agents', 'Agents'),
  'verified agents', 'agents'
)
WHERE resolution_note ILIKE '%verified agent%';

NOTIFY pgrst, 'reload schema';


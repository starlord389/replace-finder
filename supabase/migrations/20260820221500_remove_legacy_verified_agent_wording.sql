-- Remove the final remnants of the retired manual agent approval concept.
-- Existing authorization dependencies are migrated to is_active_agent(), the
-- obsolete compatibility alias is dropped, and user-facing wording and policy
-- names are brought in line with automatic admission after email confirmation.

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
      AND p.proname <> 'is_verified_agent'
      AND (
        p.prosrc ILIKE '%verified agent%'
        OR p.prosrc ILIKE '%is_verified_agent%'
      )
  LOOP
    v_definition := pg_catalog.pg_get_functiondef(v_function.oid);
    v_definition := replace(v_definition, 'public.is_verified_agent', 'public.is_active_agent');
    v_definition := replace(v_definition, 'is_verified_agent', 'is_active_agent');
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

-- Policies are stored separately from function definitions, so migrate their
-- authorization predicates before removing the deprecated helper.
DO $rewrite_policy_predicates$
DECLARE
  v_policy record;
  v_statement text;
BEGIN
  FOR v_policy IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS using_expression,
      pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS check_expression
    FROM pg_catalog.pg_policy AS p
    JOIN pg_catalog.pg_class AS c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
        COALESCE(pg_catalog.pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%is_verified_agent%'
        OR COALESCE(pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%is_verified_agent%'
      )
  LOOP
    v_statement := format(
      'ALTER POLICY %I ON %I.%I',
      v_policy.policy_name,
      v_policy.schema_name,
      v_policy.table_name
    );

    IF v_policy.using_expression IS NOT NULL THEN
      v_statement := v_statement || format(
        ' USING (%s)',
        replace(v_policy.using_expression, 'is_verified_agent', 'is_active_agent')
      );
    END IF;

    IF v_policy.check_expression IS NOT NULL THEN
      v_statement := v_statement || format(
        ' WITH CHECK (%s)',
        replace(v_policy.check_expression, 'is_verified_agent', 'is_active_agent')
      );
    END IF;

    EXECUTE v_statement;
  END LOOP;
END;
$rewrite_policy_predicates$;

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

-- Deliberately omit CASCADE: if an unexpected dependency remains, the entire
-- migration rolls back instead of silently deleting dependent authorization.
REVOKE ALL ON FUNCTION public.is_verified_agent(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.is_verified_agent(uuid);

NOTIFY pgrst, 'reload schema';


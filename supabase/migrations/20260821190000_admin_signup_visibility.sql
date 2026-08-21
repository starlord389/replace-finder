-- Keep every real signup visible in the Live admin CRM, including accounts
-- that have not yet created a client, exchange, property, or match.
--
-- The canonical admin_list_users definition lives in the earlier additive
-- admin migration. This follow-up updates the already-deployed function while
-- preserving its signature, grants, security mode, and complete return shape.

DO $$
DECLARE
  v_function regprocedure := to_regprocedure(
    'public.admin_list_users(text,public.app_role,text,text,text,text,integer,integer)'
  );
  v_definition text;
  v_old_clause text := 'OR (p_data_scope = ''live'' AND e.has_live_data)';
  v_new_clause text := 'OR (p_data_scope = ''live'' AND NOT e.test_account)';
  v_old_fast_path text := 'v_fast_path boolean := p_data_scope IS NULL';
  v_new_fast_path text := 'v_fast_path boolean := (p_data_scope IS NULL OR p_data_scope = ''live'')';
  v_account_filter text := 'OR e.effective_account_status = p_account_status' || E'\n      )';
  v_scoped_account_filter text := 'OR e.effective_account_status = p_account_status' || E'\n      )\n      AND (\n        p_data_scope IS DISTINCT FROM ''live''\n        OR NOT e.test_account\n      )';
BEGIN
  IF v_function IS NULL THEN
    RAISE EXCEPTION 'admin_list_users is required before applying signup visibility';
  END IF;

  SELECT pg_get_functiondef(v_function)
  INTO v_definition;

  IF position(v_new_clause IN v_definition) > 0
     AND position(v_new_fast_path IN v_definition) > 0
     AND position('p_data_scope IS DISTINCT FROM ''live''' IN v_definition) > 0 THEN
    RETURN;
  END IF;

  IF position(v_old_clause IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_users live-scope clause was not recognized';
  END IF;
  IF position(v_old_fast_path IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_users fast-path clause was not recognized';
  END IF;
  IF position(v_account_filter IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_users account filter was not recognized';
  END IF;

  v_definition := replace(v_definition, v_old_clause, v_new_clause);
  v_definition := replace(v_definition, v_old_fast_path, v_new_fast_path);
  v_definition := replace(v_definition, v_account_filter, v_scoped_account_filter);
  EXECUTE v_definition;
END;
$$;

NOTIFY pgrst, 'reload schema';

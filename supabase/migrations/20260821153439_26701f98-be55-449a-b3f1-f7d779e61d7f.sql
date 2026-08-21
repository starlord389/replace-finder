-- Repair the admin communication directory after the original migration was
-- deployed. Keep the original migration immutable because it is already in
-- hosted migration history.

DO $repair$
DECLARE
  v_signature constant text :=
    'public.admin_list_communications(uuid,text,text,text,text,integer,integer)';
  v_function regprocedure;
  v_definition text;
BEGIN
  v_function := to_regprocedure(v_signature);

  IF v_function IS NULL THEN
    RAISE EXCEPTION 'required function % does not exist', v_signature;
  END IF;

  SELECT pg_get_functiondef(v_function)
  INTO v_definition;

  IF position('rp.id::text = am.recipient_id' IN v_definition) > 0 THEN
    v_definition := replace(
      v_definition,
      'rp.id::text = am.recipient_id',
      'rp.id = am.recipient_id'
    );
    EXECUTE v_definition;
  ELSIF position('rp.id = am.recipient_id' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_communications has an unexpected recipient join';
  END IF;
END;
$repair$;

-- Both functions schema-qualify auth.uid(), so the narrower search path is
-- sufficient and matches the intended SECURITY DEFINER hardening contract.
ALTER FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) SET search_path = public;

ALTER FUNCTION public.admin_get_communication_items(
  text, uuid, integer, integer
) SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_get_communication_items(
  text, uuid, integer, integer
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_communication_items(
  text, uuid, integer, integer
) TO authenticated;

COMMENT ON FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) IS 'Admin-only paginated communication directory. Returns previews and sanitized context; never invitation tokens.';

NOTIFY pgrst, 'reload schema';
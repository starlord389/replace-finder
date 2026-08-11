-- Keep the agent's internal client setup separate from the optional investor
-- workspace invitation. This RPC attaches an invitation to an existing client
-- record instead of creating a duplicate client.
CREATE OR REPLACE FUNCTION public.invite_existing_investor_client(p_client_id uuid)
RETURNS TABLE(representation_id uuid, invite_token text, invite_status text, client_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_agent_email text;
  v_email text;
  v_investor_id uuid;
  v_client public.agent_clients%ROWTYPE;
  v_rep public.agent_representations%ROWTYPE;
  v_invite public.representation_invites%ROWTYPE;
  v_status text;
  v_existing_rep_status text;
  v_existing_invite_status text;
BEGIN
  IF NOT public.is_verified_agent(v_uid) THEN
    RAISE EXCEPTION 'Only a verified agent can invite an investor client.';
  END IF;

  SELECT * INTO v_client
  FROM public.agent_clients
  WHERE id = p_client_id AND agent_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Client not found.'; END IF;
  IF v_client.client_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'This client already has a connected workspace.';
  END IF;

  v_email := lower(btrim(COALESCE(v_client.client_email, '')));
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Add a valid email to the client profile before sending an invitation.';
  END IF;

  SELECT lower(email) INTO v_agent_email FROM public.profiles WHERE id = v_uid;
  IF v_email = v_agent_email THEN RAISE EXCEPTION 'You cannot invite your own account as a client.'; END IF;

  SELECT r.status, i.status INTO v_existing_rep_status, v_existing_invite_status
  FROM public.agent_representations r
  JOIN public.representation_invites i ON i.representation_id = r.id
  WHERE r.agent_id = v_uid
    AND r.is_demo = v_client.is_demo
    AND i.direction = 'agent_to_investor'
    AND i.metadata->>'client_id' = v_client.id::text
    AND r.status NOT IN ('declined', 'expired', 'revoked')
    AND i.status NOT IN ('declined', 'cancelled', 'expired')
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_rep_status = 'active' OR v_existing_invite_status = 'accepted' THEN
      RAISE EXCEPTION 'This client already has a connected workspace.';
    END IF;
    RAISE EXCEPTION 'A workspace invitation is already pending for this client. Manage it from Client Requests.';
  END IF;

  SELECT u.id INTO v_investor_id FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_investor_id IS NOT NULL AND NOT public.has_role(v_investor_id, 'investor'::public.app_role) THEN
    RAISE EXCEPTION 'That email belongs to an account that is not registered as an investor.';
  END IF;
  v_status := CASE WHEN v_investor_id IS NULL THEN 'pending_signup' ELSE 'awaiting_acceptance' END;

  INSERT INTO public.agent_representations(
    investor_id, investor_email, agent_id, agent_email, agent_name,
    status, source, is_default, is_demo, invited_by
  ) VALUES (
    v_investor_id, v_email, v_uid, v_agent_email,
    (SELECT full_name FROM public.profiles WHERE id = v_uid),
    v_status, 'agent_invite', true, v_client.is_demo, v_uid
  ) RETURNING * INTO v_rep;

  INSERT INTO public.representation_invites(representation_id, direction, email, metadata, created_by)
  VALUES (v_rep.id, 'agent_to_investor', v_email, jsonb_build_object('client_id', v_client.id), v_uid)
  RETURNING * INTO v_invite;

  IF v_investor_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_investor_id, 'representation_invite', 'An agent invited you to work together',
      'Review the invitation and choose whether to connect your exchange workspace.',
      '/representation-invite?token=' || v_invite.token,
      jsonb_build_object('representation_id', v_rep.id)
    );
  END IF;

  RETURN QUERY SELECT v_rep.id, v_invite.token, v_rep.status, v_client.id;
END;
$$;

REVOKE ALL ON FUNCTION public.invite_existing_investor_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_existing_investor_client(uuid) TO authenticated;

COMMENT ON FUNCTION public.invite_existing_investor_client(uuid) IS
  'Creates an optional investor workspace invitation for an existing agent client without duplicating the client record.';
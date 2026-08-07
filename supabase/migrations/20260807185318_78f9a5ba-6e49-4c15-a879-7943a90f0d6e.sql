CREATE OR REPLACE FUNCTION public.prepare_representation_invite_delivery(p_representation_id uuid)
RETURNS TABLE (
  invite_id uuid,
  email text,
  direction text,
  token text,
  expires_at timestamptz,
  send_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.representation_invites%ROWTYPE;
  v_rep public.agent_representations%ROWTYPE;
BEGIN
  SELECT * INTO v_invite
  FROM public.representation_invites
  WHERE representation_id = p_representation_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found.'; END IF;

  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id FOR UPDATE;
  IF v_invite.created_by <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the invitation sender can deliver this invitation.';
  END IF;
  IF v_invite.status IN ('accepted', 'declined', 'cancelled') OR v_rep.status = 'active' THEN
    RAISE EXCEPTION 'This invitation is no longer pending.';
  END IF;
  IF v_rep.status IN ('revoked', 'declined') THEN
    RAISE EXCEPTION 'This invitation is no longer pending.';
  END IF;
  IF v_invite.send_count >= 20 THEN
    RAISE EXCEPTION 'Invitation delivery limit reached. Contact support if another invitation is required.';
  END IF;
  IF v_invite.last_sent_at IS NOT NULL AND v_invite.last_sent_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'Wait one minute before resending this invitation.';
  END IF;

  IF v_invite.status = 'expired' OR v_invite.expires_at <= now() THEN
    UPDATE public.representation_invites AS ri
    SET status = 'pending', token = gen_random_uuid()::text,
        expires_at = now() + interval '14 days', accepted_at = NULL,
        accepted_user_id = NULL, cancelled_at = NULL, cancelled_by = NULL,
        updated_at = now()
    WHERE ri.id = v_invite.id
    RETURNING ri.* INTO v_invite;

    UPDATE public.agent_representations AS ar
    SET status = CASE
      WHEN v_invite.direction = 'investor_to_agent' AND ar.agent_id IS NULL THEN 'pending_signup'
      WHEN v_invite.direction = 'investor_to_agent' AND public.is_verified_agent(ar.agent_id) THEN 'awaiting_acceptance'
      WHEN v_invite.direction = 'investor_to_agent' THEN 'pending_verification'
      WHEN ar.investor_id IS NULL THEN 'pending_signup'
      ELSE 'awaiting_acceptance'
    END,
    updated_at = now()
    WHERE ar.id = p_representation_id;
  END IF;

  UPDATE public.representation_invites AS ri
  SET last_sent_at = now(), send_count = ri.send_count + 1,
      delivery_status = 'sending', delivery_error_code = NULL, updated_at = now()
  WHERE ri.id = v_invite.id
  RETURNING ri.* INTO v_invite;

  RETURN QUERY SELECT v_invite.id, v_invite.email, v_invite.direction,
    v_invite.token, v_invite.expires_at, v_invite.send_count;
END;
$$;
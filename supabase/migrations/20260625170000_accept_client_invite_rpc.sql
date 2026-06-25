-- Invited-client linking fix (QA #H2).
--
-- BUG: On the accept-invite path the client (invitee) ran
--   UPDATE public.agent_clients SET client_user_id = <self> WHERE id = <client_id>
-- directly. The only agent_clients UPDATE policy is agent-scoped
-- (USING agent_id = auth.uid()), so as the invitee the statement matched 0 rows
-- with no error. The client_invites row WAS marked accepted (an "Invitee can
-- accept invite" policy exists), so the invite got consumed while the client was
-- never linked -> invited-client onboarding was permanently broken.
--
-- FIX: a SECURITY DEFINER RPC that, running as the definer (bypassing RLS),
-- validates the invite, verifies the caller is the intended invitee (JWT email),
-- links agent_clients.client_user_id = auth.uid(), and marks the invite accepted
-- atomically. Validation mirrors get_invite_by_token + the "Invitee can accept
-- invite" RLS policy (status='pending', not expired, case-insensitive email match).

CREATE OR REPLACE FUNCTION public.accept_client_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite       public.client_invites%ROWTYPE;
  v_caller_email text := auth.jwt() ->> 'email';
  v_uid          uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept an invite.';
  END IF;

  SELECT * INTO v_invite
  FROM public.client_invites
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite is invalid or has been removed.';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite has already been used.';
  END IF;

  IF v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'This invite has expired. Ask your agent to send a new one.';
  END IF;

  IF v_caller_email IS NULL
     OR lower(v_invite.email) <> lower(v_caller_email) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address.';
  END IF;

  -- Link the client record to the accepting user (runs as definer -> bypasses
  -- the agent-only UPDATE policy that caused the original silent no-op).
  UPDATE public.agent_clients
  SET client_user_id = v_uid,
      updated_at = now()
  WHERE id = v_invite.client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The client record for this invite no longer exists.';
  END IF;

  -- Consume the invite only after the link succeeded.
  UPDATE public.client_invites
  SET status = 'accepted',
      accepted_at = now(),
      accepted_user_id = v_uid
  WHERE id = v_invite.id;

  RETURN v_invite.client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_client_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_client_invite(text) TO authenticated;

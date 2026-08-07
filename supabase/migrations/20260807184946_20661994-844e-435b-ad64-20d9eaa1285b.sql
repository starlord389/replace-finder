-- Invitation lifecycle controls and per-exchange representation management.

ALTER TABLE public.representation_invites
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS send_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS delivery_error_code text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Older invitations predate delivery tracking. Do not claim they were either
-- sent or unsent; the sender can resend once to establish a tracked result.
UPDATE public.representation_invites
SET delivery_status = 'unknown'
WHERE send_count = 0 AND last_sent_at IS NULL AND delivery_status = 'not_sent';

ALTER TABLE public.representation_invites
  DROP CONSTRAINT IF EXISTS representation_invites_delivery_status_check;
ALTER TABLE public.representation_invites
  ADD CONSTRAINT representation_invites_delivery_status_check
  CHECK (delivery_status IN ('unknown', 'not_sent', 'sending', 'sent', 'failed'));
ALTER TABLE public.representation_invites
  DROP CONSTRAINT IF EXISTS representation_invites_send_count_check;
ALTER TABLE public.representation_invites
  ADD CONSTRAINT representation_invites_send_count_check CHECK (send_count >= 0);

COMMENT ON COLUMN public.representation_invites.delivery_error_code IS
  'Sanitized delivery classification only; provider responses and secrets are never stored.';

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
    UPDATE public.representation_invites
    SET status = 'pending', token = gen_random_uuid()::text,
        expires_at = now() + interval '14 days', accepted_at = NULL,
        accepted_user_id = NULL, cancelled_at = NULL, cancelled_by = NULL,
        updated_at = now()
    WHERE id = v_invite.id
    RETURNING * INTO v_invite;

    UPDATE public.agent_representations
    SET status = CASE
      WHEN v_invite.direction = 'investor_to_agent' AND agent_id IS NULL THEN 'pending_signup'
      WHEN v_invite.direction = 'investor_to_agent' AND public.is_verified_agent(agent_id) THEN 'awaiting_acceptance'
      WHEN v_invite.direction = 'investor_to_agent' THEN 'pending_verification'
      WHEN investor_id IS NULL THEN 'pending_signup'
      ELSE 'awaiting_acceptance'
    END,
    updated_at = now()
    WHERE id = p_representation_id;
  END IF;

  UPDATE public.representation_invites
  SET last_sent_at = now(), send_count = send_count + 1,
      delivery_status = 'sending', delivery_error_code = NULL, updated_at = now()
  WHERE id = v_invite.id
  RETURNING * INTO v_invite;

  RETURN QUERY SELECT v_invite.id, v_invite.email, v_invite.direction,
    v_invite.token, v_invite.expires_at, v_invite.send_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_representation_invite(p_representation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.representation_invites%ROWTYPE;
  v_rep public.agent_representations%ROWTYPE;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_invite
  FROM public.representation_invites
  WHERE representation_id = p_representation_id AND status IN ('pending', 'expired')
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending invitation not found.'; END IF;
  IF v_invite.created_by <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the invitation sender can cancel it.';
  END IF;
  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id FOR UPDATE;
  IF v_rep.status = 'active' THEN RAISE EXCEPTION 'End the active representation instead.'; END IF;

  UPDATE public.representation_invites
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(), updated_at = now()
  WHERE id = v_invite.id;
  UPDATE public.agent_representations
  SET status = 'revoked', revoked_at = now(), revoked_by = auth.uid(),
      ended_reason = 'Invitation cancelled by sender', updated_at = now()
  WHERE id = p_representation_id;

  v_recipient := CASE WHEN v_invite.direction = 'investor_to_agent' THEN v_rep.agent_id ELSE v_rep.investor_id END;
  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_recipient, 'representation_invite_cancelled', 'Representation invitation cancelled',
      'The sender cancelled this invitation.',
      CASE WHEN v_invite.direction = 'investor_to_agent' THEN '/agent/representation' ELSE '/investor/representation' END,
      jsonb_build_object('representation_id', p_representation_id)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_representation_invite_email(
  p_representation_id uuid,
  p_email text,
  p_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.representation_invites%ROWTYPE;
  v_rep public.agent_representations%ROWTYPE;
  v_email text := lower(btrim(p_email));
  v_target_id uuid;
  v_sender_email text;
  v_status text;
  v_client_id uuid;
BEGIN
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address.';
  END IF;
  SELECT * INTO v_invite
  FROM public.representation_invites
  WHERE representation_id = p_representation_id AND status IN ('pending', 'expired')
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Editable invitation not found.'; END IF;
  IF v_invite.created_by <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the invitation sender can update it.';
  END IF;
  SELECT * INTO v_rep FROM public.agent_representations WHERE id = p_representation_id FOR UPDATE;
  IF v_rep.status = 'active' THEN RAISE EXCEPTION 'Active representation email cannot be changed.'; END IF;
  SELECT lower(email) INTO v_sender_email FROM public.profiles WHERE id = v_invite.created_by;
  IF v_email = v_sender_email THEN RAISE EXCEPTION 'You cannot invite your own account.'; END IF;

  SELECT id INTO v_target_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;
  IF v_invite.direction = 'investor_to_agent' THEN
    IF v_target_id IS NOT NULL AND NOT public.has_role(v_target_id, 'agent'::public.app_role) THEN
      RAISE EXCEPTION 'That email belongs to an account that is not registered as an agent.';
    END IF;
    v_status := CASE
      WHEN v_target_id IS NULL THEN 'pending_signup'
      WHEN public.is_verified_agent(v_target_id) THEN 'awaiting_acceptance'
      ELSE 'pending_verification'
    END;
    UPDATE public.agent_representations
    SET agent_id = v_target_id, agent_email = v_email,
        agent_name = NULLIF(btrim(p_name), ''),
        status = v_status, updated_at = now()
    WHERE id = p_representation_id;
  ELSE
    IF v_target_id IS NOT NULL AND NOT public.has_role(v_target_id, 'investor'::public.app_role) THEN
      RAISE EXCEPTION 'That email belongs to an account that is not registered as an investor.';
    END IF;
    v_status := CASE WHEN v_target_id IS NULL THEN 'pending_signup' ELSE 'awaiting_acceptance' END;
    UPDATE public.agent_representations
    SET investor_id = v_target_id, investor_email = v_email,
        status = v_status, updated_at = now()
    WHERE id = p_representation_id;

    SELECT (v_invite.metadata->>'client_id')::uuid INTO v_client_id;
    IF v_client_id IS NOT NULL THEN
      UPDATE public.agent_clients
      SET client_user_id = v_target_id, client_email = v_email,
          client_name = COALESCE(NULLIF(btrim(p_name), ''), client_name), updated_at = now()
      WHERE id = v_client_id AND agent_id = v_rep.agent_id;
    END IF;
  END IF;

  UPDATE public.representation_invites
  SET email = v_email, token = gen_random_uuid()::text, status = 'pending',
      expires_at = now() + interval '14 days', accepted_at = NULL, accepted_user_id = NULL,
      last_sent_at = NULL, delivery_status = 'not_sent',
      delivery_error_code = NULL, cancelled_at = NULL, cancelled_by = NULL, updated_at = now()
  WHERE id = v_invite.id;

  IF v_target_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_target_id, 'representation_invite', 'New representation invitation',
      'Review the corrected invitation and choose whether to connect.',
      CASE WHEN v_invite.direction = 'investor_to_agent' THEN '/agent/representation' ELSE '/investor/representation' END,
      jsonb_build_object('representation_id', p_representation_id)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_agent_to_exchange(p_representation_id uuid, p_exchange_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rep public.agent_representations%ROWTYPE;
  v_existing public.exchange_agent_assignments%ROWTYPE;
  v_assignment_id uuid;
BEGIN
  SELECT * INTO v_rep FROM public.agent_representations
  WHERE id = p_representation_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'An active representation is required.'; END IF;
  IF auth.uid() <> v_rep.investor_id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the investor or an administrator can expand exchange access.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    WHERE e.id = p_exchange_id AND e.agent_id = v_rep.investor_id AND e.owner_type = 'investor'
  ) THEN RAISE EXCEPTION 'The exchange does not belong to this investor.'; END IF;

  SELECT * INTO v_existing
  FROM public.exchange_agent_assignments
  WHERE exchange_id = p_exchange_id AND status = 'active' AND is_primary
  LIMIT 1 FOR UPDATE;
  IF FOUND AND v_existing.representation_id = p_representation_id THEN
    RETURN v_existing.id;
  END IF;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.exchange_connections c
    SET status = 'cancelled', closed_at = COALESCE(c.closed_at, now()), updated_at = now()
    WHERE c.status IN ('pending', 'accepted', 'in_progress')
      AND v_existing.agent_id IN (c.buyer_agent_id, c.seller_agent_id)
      AND (c.buyer_exchange_id = p_exchange_id OR c.seller_exchange_id = p_exchange_id);
    UPDATE public.agent_contact_requests
    SET representing_agent_id = NULL, connection_id = NULL, status = 'waiting_for_agent', updated_at = now()
    WHERE exchange_id = p_exchange_id AND representing_agent_id = v_existing.agent_id
      AND status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted');
    INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
    VALUES (
      v_existing.agent_id, 'exchange_reassigned', 'Exchange assigned to another agent',
      'Your access to one exchange ended. Historical activity was preserved.',
      '/agent/representation', jsonb_build_object('exchange_id', p_exchange_id, 'representation_id', v_existing.representation_id)
    );
  END IF;

  UPDATE public.exchange_agent_assignments
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE exchange_id = p_exchange_id AND status = 'active';

  INSERT INTO public.exchange_agent_assignments(
    exchange_id, representation_id, investor_id, agent_id, assigned_by
  ) VALUES (p_exchange_id, v_rep.id, v_rep.investor_id, v_rep.agent_id, auth.uid())
  RETURNING id INTO v_assignment_id;

  UPDATE public.agent_contact_requests
  SET representing_agent_id = v_rep.agent_id, status = 'requested', updated_at = now()
  WHERE exchange_id = p_exchange_id AND status = 'waiting_for_agent';
  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_rep.agent_id, 'exchange_assigned', 'Investor assigned you to an exchange',
    'You can now collaborate on this exchange and review its match requests.',
    '/agent/representation', jsonb_build_object('exchange_id', p_exchange_id, 'representation_id', v_rep.id)
  );
  RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_agent_from_exchange(
  p_exchange_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exchange public.exchanges%ROWTYPE;
  v_assignment public.exchange_agent_assignments%ROWTYPE;
BEGIN
  SELECT * INTO v_exchange FROM public.exchanges WHERE id = p_exchange_id FOR UPDATE;
  IF NOT FOUND OR v_exchange.owner_type <> 'investor' THEN RAISE EXCEPTION 'Investor exchange not found.'; END IF;
  IF auth.uid() <> v_exchange.agent_id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the investor or an administrator can remove exchange access.';
  END IF;
  SELECT * INTO v_assignment
  FROM public.exchange_agent_assignments
  WHERE exchange_id = p_exchange_id AND status = 'active' AND is_primary
  LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This exchange does not have an assigned agent.'; END IF;

  UPDATE public.exchange_connections c
  SET status = 'cancelled', closed_at = COALESCE(c.closed_at, now()), updated_at = now()
  WHERE c.status IN ('pending', 'accepted', 'in_progress')
    AND v_assignment.agent_id IN (c.buyer_agent_id, c.seller_agent_id)
    AND (c.buyer_exchange_id = p_exchange_id OR c.seller_exchange_id = p_exchange_id);

  UPDATE public.exchange_agent_assignments
  SET status = 'revoked', revoked_at = now(), updated_at = now()
  WHERE id = v_assignment.id;
  UPDATE public.agent_contact_requests
  SET representing_agent_id = NULL, connection_id = NULL,
      status = 'waiting_for_agent',
      agent_note = COALESCE(NULLIF(btrim(p_reason), ''), agent_note), updated_at = now()
  WHERE exchange_id = p_exchange_id AND representing_agent_id = v_assignment.agent_id
    AND status IN ('requested', 'accepted', 'awaiting_counterparty_agent', 'contacted');

  INSERT INTO public.notifications(user_id, type, title, message, link_to, metadata)
  VALUES (
    v_assignment.agent_id, 'exchange_assignment_removed', 'Exchange access removed',
    'The investor removed your access to one exchange. Historical activity was preserved.',
    '/agent/representation', jsonb_build_object('exchange_id', p_exchange_id, 'representation_id', v_assignment.representation_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_representation(
  p_representation_id uuid,
  p_assign_future boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_rep public.agent_representations%ROWTYPE;
BEGIN
  SELECT * INTO v_rep
  FROM public.agent_representations
  WHERE id = p_representation_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active representation not found.'; END IF;
  IF auth.uid() <> v_rep.investor_id
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only the investor or an administrator can change the default agent.';
  END IF;

  UPDATE public.agent_representations
  SET is_default = false, updated_at = now()
  WHERE investor_id = v_rep.investor_id AND is_demo = v_rep.is_demo
    AND id <> p_representation_id AND is_default;
  UPDATE public.agent_representations
  SET is_default = true, assign_future_exchanges = p_assign_future, updated_at = now()
  WHERE id = p_representation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_representation_invite_delivery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_representation_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_representation_invite_email(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unassign_agent_from_exchange(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_representation(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.prepare_representation_invite_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_representation_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_representation_invite_email(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_agent_from_exchange(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_representation(uuid, boolean) TO authenticated;

NOTIFY pgrst, 'reload schema';
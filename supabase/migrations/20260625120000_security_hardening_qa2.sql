-- Security hardening from QA sweep #2 (2026-06-25).
-- Covers: signup privilege-escalation, self-set verification_status (suspension bypass),
-- chat-message tampering, unbound invite acceptance, and an obsolete role-sync trigger.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) handle_new_user: never let a self-supplied signup "role" escalate to admin.
--    Clamp metadata role to the non-privileged set (agent/client); default agent.
--    app_role enum = ('client','broker','admin','agent'); only agent/client are
--    self-serviceable. Based on the latest (20260604131059) function body.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, mls_number, license_state, brokerage_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'mls_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'license_state', ''),
    NULLIF(NEW.raw_user_meta_data->>'brokerage_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('agent', 'client')
        THEN (NEW.raw_user_meta_data->>'role')::public.app_role
      ELSE 'agent'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Remove the obsolete role-sync trigger. profiles.role was dropped (user_roles
--    is the single source of truth), so this trigger would error on every role
--    write. DROP IF EXISTS is a safe no-op if it's already gone in the live DB.
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS sync_profile_role_from_user_roles_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.sync_profile_role_from_user_roles();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) profiles: a user may edit their own profile but NOT their verification_status
--    (verification/suspension is admin-controlled). Admins and trusted backend
--    contexts (service role / SECURITY DEFINER signup triggers, where auth.uid()
--    is NULL) are exempt. Enforced via trigger because the self-update RLS policy
--    has no WITH CHECK and cannot compare against the prior row.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_profile_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'verification_status can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_verification ON public.profiles;
CREATE TRIGGER trg_profiles_guard_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_status();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) messages: the "mark as read" UPDATE path must not let a recipient rewrite the
--    message body, sender, thread, or timestamp. Make those columns immutable to
--    non-admin authenticated callers (the read-state column stays writable).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_message_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)
     AND (
          NEW.content      IS DISTINCT FROM OLD.content
       OR NEW.sender_id    IS DISTINCT FROM OLD.sender_id
       OR NEW.connection_id IS DISTINCT FROM OLD.connection_id
       OR NEW.created_at   IS DISTINCT FROM OLD.created_at
     ) THEN
    RAISE EXCEPTION 'message content is immutable; only read-state may be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_guard_immutable ON public.messages;
CREATE TRIGGER trg_messages_guard_immutable
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_immutable_columns();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5) client_invites: bind invite acceptance to the invitee's own email so a
--    logged-in user can't mutate someone else's pending invite.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Invitee can accept invite" ON public.client_invites;
CREATE POLICY "Invitee can accept invite"
ON public.client_invites
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND expires_at > now()
  AND lower(email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  status IN ('accepted', 'pending')
  AND lower(email) = lower(auth.jwt() ->> 'email')
);

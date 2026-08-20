-- Remove manual agent approval from the product.
--
-- Agent access is now determined only by:
--   1. an agent role,
--   2. a confirmed email address, and
--   3. an active account.
--
-- The legacy profiles.verification_status column and is_verified_agent()
-- function are retained temporarily because older migrations, policies, and
-- account-suspension code reference them. They no longer represent an approval
-- queue and must not be exposed as one in the application.

UPDATE public.profiles AS p
SET
  verification_status = 'verified',
  verified_at = COALESCE(p.verified_at, timezone('utc', now())),
  verified_by = COALESCE(p.verified_by, p.id),
  updated_at = now()
WHERE p.verification_status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles AS ur
    WHERE ur.user_id = p.id
      AND ur.role = 'agent'::public.app_role
  );

CREATE OR REPLACE FUNCTION public.is_active_agent(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_user_id IS NOT NULL
    AND public.is_account_active(p_user_id)
    AND EXISTS (
      SELECT 1
      FROM public.user_roles AS ur
      WHERE ur.user_id = p_user_id
        AND ur.role = 'agent'::public.app_role
    )
    AND EXISTS (
      SELECT 1
      FROM auth.users AS u
      WHERE u.id = p_user_id
        AND u.deleted_at IS NULL
        AND u.email_confirmed_at IS NOT NULL
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_agent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_agent(uuid) TO authenticated, service_role;

-- Compatibility alias for existing policies and RPCs. Its semantics are now
-- automatic active-agent access; profiles.verification_status is not consulted.
CREATE OR REPLACE FUNCTION public.is_verified_agent(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_active_agent(p_user_id);
$$;

REVOKE ALL ON FUNCTION public.is_verified_agent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_agent(uuid) TO authenticated, service_role;

-- Any legacy invitation that was waiting only on manual approval can advance
-- immediately once the invited agent's email is confirmed.
UPDATE public.agent_representations AS ar
SET status = 'awaiting_acceptance', updated_at = now()
WHERE ar.status = 'pending_verification'
  AND ar.agent_id IS NOT NULL
  AND public.is_active_agent(ar.agent_id);

-- Manual approval is no longer a supported administrative action.
REVOKE ALL ON FUNCTION public.admin_set_agent_verification_status(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.admin_set_agent_verification_status(uuid, text, text);

-- Preserve the legacy column only for the current suspension compatibility
-- path. Pending/verified transitions are intentionally unavailable.
CREATE OR REPLACE FUNCTION public.guard_profile_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND auth.uid() IS NOT NULL THEN
    IF (NEW.verification_status = 'suspended' OR OLD.verification_status = 'suspended')
       AND current_setting('app.admin_account_status_target', true) IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'account access changes must use admin_set_user_account_status';
    END IF;

    IF NEW.verification_status <> 'suspended'
       AND OLD.verification_status <> 'suspended' THEN
      RAISE EXCEPTION 'agent access is automatic after email confirmation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.is_active_agent(uuid) IS
  'True when the user has the agent role, has confirmed their email, and has an active account. No manual approval is required.';
COMMENT ON FUNCTION public.is_verified_agent(uuid) IS
  'Deprecated compatibility alias for is_active_agent(uuid). Do not use as a manual approval signal.';

NOTIFY pgrst, 'reload schema';
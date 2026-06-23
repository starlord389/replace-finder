-- Grant the product owner (Eamon) the admin role in addition to their existing
-- agent role, so they can switch between the Agent and Admin views. Roles are
-- normally managed from the Admin → Users & Roles screen, but that screen is
-- itself admin-gated, so this bootstraps the first admin. Scoped by email and
-- idempotent (safe to re-run; does nothing if the role is already present).
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('eamon.t.mckenna123@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

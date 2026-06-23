ALTER TABLE public.pledged_properties
  ADD COLUMN IF NOT EXISTS address_is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_authorization_confirmed boolean NOT NULL DEFAULT false;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('eamon.t.mckenna123@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;
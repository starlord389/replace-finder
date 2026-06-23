ALTER TABLE public.pledged_properties
  ADD COLUMN IF NOT EXISTS address_is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_authorization_confirmed boolean NOT NULL DEFAULT false;
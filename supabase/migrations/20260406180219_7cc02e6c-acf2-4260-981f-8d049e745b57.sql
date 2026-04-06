
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS mls_number text,
  ADD COLUMN IF NOT EXISTS license_state text,
  ADD COLUMN IF NOT EXISTS brokerage_name text,
  ADD COLUMN IF NOT EXISTS brokerage_address text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS specializations text[],
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('agent', 'client', 'admin'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'suspended'));

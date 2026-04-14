CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  normalized_role text;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  normalized_role := CASE
    WHEN requested_role IN ('agent', 'client', 'admin') THEN requested_role
    ELSE 'client'
  END;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    mls_number,
    license_state,
    brokerage_name,
    verification_status,
    verified_at,
    verified_by
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), ''),
    normalized_role,
    CASE WHEN normalized_role = 'agent' THEN NULLIF(NEW.raw_user_meta_data->>'mls_number', '') ELSE NULL END,
    CASE WHEN normalized_role = 'agent' THEN NULLIF(NEW.raw_user_meta_data->>'license_state', '') ELSE NULL END,
    CASE WHEN normalized_role = 'agent' THEN NULLIF(NEW.raw_user_meta_data->>'brokerage_name', '') ELSE NULL END,
    CASE WHEN normalized_role = 'agent' THEN 'verified' ELSE 'pending' END,
    CASE WHEN normalized_role = 'agent' THEN timezone('utc', now()) ELSE NULL END,
    CASE WHEN normalized_role = 'agent' THEN NEW.id ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, normalized_role::app_role);

  RETURN NEW;
END;
$$;

UPDATE public.profiles
SET
  verification_status = 'verified',
  verified_at = COALESCE(verified_at, timezone('utc', now())),
  verified_by = COALESCE(verified_by, id)
WHERE role = 'agent'
  AND verification_status = 'pending';

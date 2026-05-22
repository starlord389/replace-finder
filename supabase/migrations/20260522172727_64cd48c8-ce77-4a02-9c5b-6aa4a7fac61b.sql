
-- 1. Update the new-user signup trigger to stop writing profiles.role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'agent'::app_role));

  RETURN NEW;
END;
$function$;

-- 2. Drop role column from profiles (single source of truth = user_roles).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 3. Drop over-permissive matches insert policy. Edge functions use service role
--    which bypasses RLS, so no replacement policy is needed.
DROP POLICY IF EXISTS "Service can insert matches" ON public.matches;

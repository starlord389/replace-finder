

# Add Phone Number to Signup + Update Trigger

## What
Add a required phone number field to the signup form and store it in the `profiles` table. Update the `handle_new_user` trigger to pull phone from user metadata. The `profiles.phone` column already exists — no schema change needed.

## Changes

### 1. `src/pages/auth/Signup.tsx` — Add phone input
- Add `phone` state variable
- Include phone in `supabase.auth.signUp` options data: `{ full_name: fullName, phone }`
- Add a phone input field (type `tel`, required, placeholder `(555) 123-4567`) between Full Name and Email

### 2. Database migration — Update `handle_new_user()` trigger function
Update the function to also read `phone` from `raw_user_meta_data` and insert it into the profiles table:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;
```

No other changes needed — the Profile page already has phone editing, and the column exists in the database.


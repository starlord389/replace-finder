-- Private profile avatars: the bucket is private, so reads happen through
-- signed URLs. Signing still goes through storage.objects RLS, so this policy
-- defers to the existing public.profiles RLS policies (owner, admin, active
-- connection, representation counterpart, inquiry counterpart) by probing the
-- profile whose UUID is the first folder segment of the object name.

DROP POLICY IF EXISTS "Profile avatars are publicly readable" ON storage.objects;

DROP POLICY IF EXISTS "Authorized users can read profile avatars" ON storage.objects;
CREATE POLICY "Authorized users can read profile avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
    )
  )
);

-- Preserve owner-folder write restrictions, additionally constraining the
-- uploaded file extension to the supported image formats.
DROP POLICY IF EXISTS "Users upload their own profile avatar" ON storage.objects;
CREATE POLICY "Users upload their own profile avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND name ~* '\.(jpg|jpeg|png|webp)$'
);

DROP POLICY IF EXISTS "Users update their own profile avatar" ON storage.objects;
CREATE POLICY "Users update their own profile avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND name ~* '\.(jpg|jpeg|png|webp)$'
);

DROP POLICY IF EXISTS "Users delete their own profile avatar" ON storage.objects;
CREATE POLICY "Users delete their own profile avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

NOTIFY pgrst, 'reload schema';
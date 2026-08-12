-- Optional trust-profile fields shared by agents and property owners. These
-- fields never gate account access; they help authorized collaborators know
-- who they are working with. Agent production statistics are self-reported.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_headline text
    CHECK (profile_headline IS NULL OR char_length(profile_headline) <= 160),
  ADD COLUMN IF NOT EXISTS service_areas text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS completed_1031_exchanges integer
    CHECK (completed_1031_exchanges IS NULL OR completed_1031_exchanges BETWEEN 0 AND 100000),
  ADD COLUMN IF NOT EXISTS career_transaction_volume numeric
    CHECK (career_transaction_volume IS NULL OR career_transaction_volume BETWEEN 0 AND 1000000000000000);

COMMENT ON COLUMN public.profiles.profile_headline IS
  'Optional short introduction shown to authorized representation and transaction counterparts.';
COMMENT ON COLUMN public.profiles.service_areas IS
  'Optional self-described markets or service areas shown to authorized counterparts.';
COMMENT ON COLUMN public.profiles.completed_1031_exchanges IS
  'Optional self-reported number of completed 1031 exchanges; not platform-verified.';
COMMENT ON COLUMN public.profiles.career_transaction_volume IS
  'Optional self-reported career transaction volume in USD; not platform-verified.';

DROP POLICY IF EXISTS "Profile avatars are publicly readable" ON storage.objects;
CREATE POLICY "Profile avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Users upload their own profile avatar" ON storage.objects;
CREATE POLICY "Users upload their own profile avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
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
);

DROP POLICY IF EXISTS "Users delete their own profile avatar" ON storage.objects;
CREATE POLICY "Users delete their own profile avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

NOTIFY pgrst, 'reload schema';
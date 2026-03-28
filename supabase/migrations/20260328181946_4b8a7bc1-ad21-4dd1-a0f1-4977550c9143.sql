INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;
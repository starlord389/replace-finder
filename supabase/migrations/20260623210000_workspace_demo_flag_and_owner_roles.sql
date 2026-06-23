-- Workspace separation (Demo vs Live).
-- Every record an agent OWNS is stamped demo or live, so a single account can
-- hold an isolated Demo sandbox alongside its real Live data. The three tables
-- below define an agent's workspace; their children (financials, images,
-- criteria, matches, connections) inherit demo/live status from these parents.
ALTER TABLE public.agent_clients      ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.exchanges          ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.pledged_properties ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Owner account: starlord389@gmail.com is the real app login. Grant it the admin
-- and agent roles so the Admin view and agent workspace both work. (Earlier
-- grants targeted the wrong email.) Idempotent.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('starlord389@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'agent'::public.app_role
FROM auth.users
WHERE lower(email) = lower('starlord389@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

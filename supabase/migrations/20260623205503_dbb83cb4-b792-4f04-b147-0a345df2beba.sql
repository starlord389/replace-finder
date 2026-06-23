
ALTER TABLE public.agent_clients ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.pledged_properties ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_agent_clients_is_demo ON public.agent_clients(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_exchanges_is_demo ON public.exchanges(is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS idx_pledged_properties_is_demo ON public.pledged_properties(is_demo) WHERE is_demo = true;

INSERT INTO public.user_roles (user_id, role)
SELECT 'e9b10e55-01a1-4a4b-a24d-3d9fb2b95559'::uuid, r::public.app_role
FROM (VALUES ('admin'), ('agent')) AS v(r)
ON CONFLICT (user_id, role) DO NOTHING;


-- Reassign the 3 mock buyer-side scenarios to starlord389@gmail.com
-- so they can be viewed from one logged-in agent account.
DO $$
DECLARE
  starlord uuid := 'e9b10e55-01a1-4a4b-a24d-3d9fb2b95559';
  old_agents uuid[] := ARRAY[
    '4f826d0b-0373-40ea-829f-c65d8d5a8219'::uuid,  -- eamon.t.mckenna123@gmail.com (to delete)
    '50a076ed-0620-424b-b3ff-84bde2beba83'::uuid,  -- eamon.t.mckenna@icloud.com
    '3ed8c889-fad0-4e63-9b86-dbcfae7fe0e9'::uuid   -- steveryanmartin@gmail.com
  ];
BEGIN
  UPDATE public.exchanges          SET agent_id = starlord WHERE agent_id = ANY(old_agents);
  UPDATE public.agent_clients      SET agent_id = starlord WHERE agent_id = ANY(old_agents);
  UPDATE public.pledged_properties SET agent_id = starlord WHERE agent_id = ANY(old_agents);
  UPDATE public.notifications      SET user_id  = starlord WHERE user_id  = ANY(old_agents);
END $$;

-- Make sure starlord is treated as a fully verified agent so post-login routing
-- sends him straight to the agent workspace (not the launchpad).
UPDATE public.profiles
SET verification_status   = 'verified',
    launchpad_completed_at = COALESCE(launchpad_completed_at, now())
WHERE id = 'e9b10e55-01a1-4a4b-a24d-3d9fb2b95559';

-- Remove the eamon.t.mckenna123@gmail.com account entirely.
-- profiles, user_roles, etc. cascade from auth.users.
DELETE FROM public.notifications WHERE user_id = '4f826d0b-0373-40ea-829f-c65d8d5a8219';
DELETE FROM public.user_roles     WHERE user_id = '4f826d0b-0373-40ea-829f-c65d8d5a8219';
DELETE FROM public.profiles       WHERE id      = '4f826d0b-0373-40ea-829f-c65d8d5a8219';
DELETE FROM auth.users            WHERE id      = '4f826d0b-0373-40ea-829f-c65d8d5a8219';

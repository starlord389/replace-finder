-- Complete the late deployment of the canonical match workflow.
--
-- The admin user-360 migration was applied before the canonical workflow
-- migration in the hosted project. These tables therefore did not exist when
-- the admin migration added its active-account policies to every RLS table.
-- Apply 20260811160000_canonical_match_workflow.sql before this migration.

DROP POLICY IF EXISTS "Active accounts can read" ON public.match_workflow_states;
CREATE POLICY "Active accounts can read"
ON public.match_workflow_states AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can insert" ON public.match_workflow_states;
CREATE POLICY "Active accounts can insert"
ON public.match_workflow_states AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can update" ON public.match_workflow_states;
CREATE POLICY "Active accounts can update"
ON public.match_workflow_states AS RESTRICTIVE FOR UPDATE TO authenticated
USING (public.is_account_active(auth.uid()))
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can delete" ON public.match_workflow_states;
CREATE POLICY "Active accounts can delete"
ON public.match_workflow_states AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can read" ON public.match_workflow_events;
CREATE POLICY "Active accounts can read"
ON public.match_workflow_events AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can insert" ON public.match_workflow_events;
CREATE POLICY "Active accounts can insert"
ON public.match_workflow_events AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can update" ON public.match_workflow_events;
CREATE POLICY "Active accounts can update"
ON public.match_workflow_events AS RESTRICTIVE FOR UPDATE TO authenticated
USING (public.is_account_active(auth.uid()))
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can delete" ON public.match_workflow_events;
CREATE POLICY "Active accounts can delete"
ON public.match_workflow_events AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.is_account_active(auth.uid()));

NOTIFY pgrst, 'reload schema';
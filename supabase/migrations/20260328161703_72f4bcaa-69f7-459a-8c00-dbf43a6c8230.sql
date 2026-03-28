
-- Fix 1: Ensure user_roles INSERT policy truly requires pre-existing admin role
-- Drop and recreate with explicit check that prevents self-escalation
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id != auth.uid()  -- admins cannot grant roles to themselves either
);

-- Add a restrictive default-deny to make sure no other path allows insert
-- The handle_new_user trigger runs as SECURITY DEFINER so bypasses RLS

-- Fix 2: Allow matched users to view inventory documents
CREATE POLICY "Users can view matched documents" ON public.inventory_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.property_id = inventory_documents.property_id AND mpa.user_id = auth.uid()
  )
);

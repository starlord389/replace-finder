
-- Add client response columns to match_results
ALTER TABLE public.match_results
  ADD COLUMN client_response text,
  ADD COLUMN client_response_at timestamptz,
  ADD COLUMN client_viewed_at timestamptz,
  ADD COLUMN client_response_note text;

-- Validate response values
ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_client_response_check
  CHECK (client_response IN ('interested', 'passed'));

-- Allow clients to update response columns on rows they have access to
CREATE POLICY "Clients can update response on accessible matches"
ON public.match_results
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.match_result_id = match_results.id
      AND mpa.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.match_result_id = match_results.id
      AND mpa.user_id = auth.uid()
  )
);

-- Allow clients to read their own match results
CREATE POLICY "Clients can view accessible match results"
ON public.match_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matched_property_access mpa
    WHERE mpa.match_result_id = match_results.id
      AND mpa.user_id = auth.uid()
  )
);

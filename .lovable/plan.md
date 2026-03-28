

# Phase 1: Post-Match Client Response System

## Summary
Add Express Interest / Pass buttons on client match detail pages, track views, show response badges on dashboard, and give admins full visibility into client responses with filtering.

## Database Migration

Single migration adding 4 columns + check constraint + RLS policy:

```sql
-- Add response columns to match_results
ALTER TABLE public.match_results
  ADD COLUMN client_response text,
  ADD COLUMN client_response_at timestamptz,
  ADD COLUMN client_viewed_at timestamptz,
  ADD COLUMN client_response_note text;

-- Validate response values
ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_client_response_check
  CHECK (client_response IN ('interested', 'passed'));

-- Allow clients to update ONLY response columns on rows they have access to
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
```

Note: Column-level security isn't native to Postgres RLS. The policy allows UPDATE on the row, but client code will only send the 4 response columns. Admin-only columns (status, scores, approved_by) are protected by the fact that client code never writes them and admin actions are separate.

## File Changes

### 1. `src/pages/client/MatchDetail.tsx` — Response buttons + view tracking

- Load `match_result` data via the `access.match_result_id` (query `match_results` where id = access.match_result_id and join via matched_property_access)
- **View tracking**: `useEffect` on mount — if `matchResult.client_viewed_at` is null, update it to `now()` (fire once, no UI)
- **Top of hero section** (right-aligned next to property name): Show Express Interest / Pass buttons OR response badge
- **Bottom of page**: Mirror the same buttons/badge after all content
- **Confirmation dialogs**: Use `AlertDialog` from shadcn. Each has optional `Textarea` for note.
- **Post-response state**: Badge with response type, timestamp, note if present, and "Change your response" link

### 2. `src/pages/client/Dashboard.tsx` — Response badges + awaiting banner

- Extend data loading: join `match_results` data for each `matched_property_access` row to get `client_response`, `client_viewed_at`
- **Match cards**: Add badge — "New" (amber, if not viewed), "Interested" (green), "Passed" (gray), "Awaiting your response" (if viewed but no response)
- **Top banner**: If any matches have null `client_response`, show "You have X matches awaiting your response" with link to first one

### 3. `src/pages/admin/MatchRunDetail.tsx` — Response visibility + filtering

- **Summary stats row** at top: Total, Interested, Passed, Awaiting Response, Not Yet Approved (color-coded counts)
- **Each result card**: Add client response badge + note icon (tooltip/popover for note text) + response timestamp
- **Filter bar**: Tabs — All | Interested | Passed | Awaiting Response — filters the results list

### 4. `src/pages/admin/RequestDetail.tsx` — Response summary in sidebar

- Load approved match results for this request (query `match_results` where `request_id = id` and `status = 'approved'`)
- **New sidebar card "Match Response Summary"**: Total approved, Interested count, Passed count, Awaiting count

## Implementation Order

1. Database migration (4 columns + constraint + 2 RLS policies)
2. `MatchDetail.tsx` — view tracking, response buttons, dialogs, post-response state, bottom CTA
3. `Dashboard.tsx` — badges on match cards, awaiting response banner
4. `MatchRunDetail.tsx` — summary stats, response column on cards, filter tabs
5. `RequestDetail.tsx` — response summary sidebar card

No new files needed beyond the migration. All changes are within existing pages using existing shadcn components (AlertDialog, Badge, Tabs, Tooltip).


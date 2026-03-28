

# Fix: Express Interest / Pass Not Saving Client Response

## Problem
The `submitResponse` function in `MatchDetail.tsx` doesn't use `.select()`, so when the RLS policy silently blocks the update (0 rows affected), no error is raised and the UI falsely shows success.

Note: The `matched_property_access.match_result_id` column is `NOT NULL` per the schema, so the backfill migration is unlikely to find rows to update — but we'll run it defensively. No conflicting RESTRICTIVE RLS policies exist on `match_results`.

## Changes

### 1. Backfill migration (defensive)
Run a data migration to backfill any `matched_property_access` rows missing `match_result_id`:
```sql
UPDATE public.matched_property_access mpa
SET match_result_id = mr.id
FROM public.match_results mr
WHERE mpa.match_result_id IS NULL
  AND mpa.request_id = mr.request_id
  AND mpa.property_id = mr.property_id
  AND mr.status = 'approved';
```

### 2. `src/pages/client/MatchDetail.tsx` — Add error visibility

**submitResponse function (~line 107):**
- Add `.select()` to the update call
- Check for empty `data` array (0 rows updated = RLS blocked) and show error toast
- Log result for debugging

**View tracking useEffect (~line 65):**
- Add `.select()` to the update call
- Log result for debugging

No other files changed. No new features. Bug fix only.


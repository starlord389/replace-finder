## Goal

Remove the lonely "Group by client" strip on the matches inbox and tidy the filter footer so "Showing X of Y" sits at the very bottom of the filter section.

## Current layout (in `src/features/matches/components/inbox/InboxList.tsx`)

```text
[ Search + Filter popover ]
[ Active chips ............................. Showing 10 of 10 ]
[ Group by client ]   ← own bar, looks orphaned
[ List ]
```

## Proposed layout

```text
[ Search + Filter popover ]
[ Active chips    [Group by client]   ...   Showing 10 of 10 ]
[ List ]
```

One combined footer row for the filter section. "Showing X of Y" is now the last element on the last row of the filter area.

## Changes

`src/features/matches/components/inbox/InboxList.tsx`

1. Delete the standalone Group-by-client block (the `{onGroupByClientChange && (<div …border-b…>…</div>)}` wrapper, lines ~427–444).
2. Inside the active chips row (lines ~371–423), insert the Group-by-client pill button after the chips/"Clear all" and before the `Showing … of …` span. Keep the same styling it has today (Users icon, active = `bg-primary/10 text-primary`, inactive = muted hover). Only render it when `onGroupByClientChange` is provided.
3. Make sure the chip row renders whenever `onGroupByClientChange` is provided too, so the toggle is always reachable even when no chips/results exist. Update the wrapping condition from `(anyActive || totalInScope > 0)` to `(anyActive || totalInScope > 0 || !!onGroupByClientChange)`.
4. Keep `ml-auto` on the "Showing X of Y" span so it stays pinned to the right edge of that final row.

No other files, no behavior changes to grouping logic, no styling system changes.
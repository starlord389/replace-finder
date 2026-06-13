# Listings page — compact horizontal rows

Rebuild the listing items inside `ListingSwitcher.tsx` using the selected "Premium horizontal list" direction. Keep grouping by client, search/filter bar, dialog, data hooks, and Plus Jakarta Sans/blue-600 styling.

## Scope

**Only edits:** `src/features/workspace/components/ListingSwitcher.tsx` (group + card render block).

No changes to: routes, data hooks, `ListingPreviewDialog`, `AgentListings.tsx`, search/filter UI, fonts, or backend.

## Group header

For each client section:
- Bottom border `border-b border-border/60 pb-3`
- Colored dot (existing per-client color) · client name `text-[13px] font-semibold tracking-tight` · count pill `text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border`
- Drop the redundant "View Portfolio" button from the prototype (not in scope).

## Listing row card

Horizontal flex row, `bg-card border border-border/70 rounded-xl p-3`, `hover:border-primary/40 hover:shadow-[0_8px_20px_-12px_rgba(37,99,235,0.15)]`, focus-visible ring.

Layout:
- **Thumbnail** `w-32 h-20 rounded-lg overflow-hidden` with `propertyImage(null, l.id)`, status pill overlaid top-left (white/95 backdrop, uppercase 9px).
- **Body** flex-1:
  - Top row: title `text-sm font-bold` (hover → `text-primary`) + `MapPin` + city/state on left; right side stacks price `text-base font-bold tabular-nums` + asset-type chip `text-[10px] bg-primary/5 text-primary border-primary/10 rounded px-1.5`.
  - Secondary row: meta strip with vertical dividers. Use available fields only — drop fabricated Cap Rate / SqFt / Updated unless present in `listing` data. Show whichever exist: e.g. `Strategy`, `Status`, `Last viewed` (if `isLast`). Hide row if no meta to display.
- **Chevron** circle on the right, gray → primary on hover.

Use only semantic tokens (`card`, `border`, `foreground`, `muted-foreground`, `primary`). Status pill colors stay tied to existing status logic.

## Spacing

- `space-y-8` between client sections (down from 12)
- `space-y-2` between rows within a section

## Technical notes

- Inspect `useAgentListings` shape before wiring meta strip — only render fields that actually exist on the listing object; no placeholders.
- Preserve existing onClick → `setActiveListingId` + dialog open behavior.
- Keep "Last viewed" indicator (now as a meta strip item, not a separate pill).

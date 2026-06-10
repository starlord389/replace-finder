## Goal
Replace the cramped tile cards on `/agent/listings` with confident, full-width editorial row cards based on the selected "Architectural cards" direction.

## Changes

**`src/features/workspace/components/ListingSwitcher.tsx`** — Replace the current `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` tile grid (and its weak `text-[11px]` client header) with a single-column stack of large row cards. Per group:

- **Group header**: client-color dot + client name (`text-base font-semibold tracking-tight`) + right-aligned listing count, all sitting above a `border-b` rule.
- **Row card** (`Link`): horizontal flex, `border bg-card rounded-md shadow-sm hover:shadow-md`.
  - Left: 256px-wide property thumbnail (`propertyImage(null, id)`), hidden on mobile, `group-hover:scale-105`.
  - Right (`p-8`, flex column, justify-between):
    - Top row: title (`text-lg font-semibold`) + "Last viewed" pill (primary tones) on the left; price (`text-xl font-semibold`) with "Asking Price" caption on the right. Location with `MapPin` under title.
    - Bottom row (above `border-t`): Asset Type and Status mini-columns (uppercase tracked captions + value, status with colored dot) on the left; underlined "View Details" link on the right.

**Semantic tokens only** — `foreground`, `muted-foreground`, `card`, `border`, `primary`. Status dot uses `bg-amber-500` / `bg-emerald-500` / `bg-primary` / `bg-muted-foreground/40` based on status (these are utility colors, kept consistent with the rest of the app's status indicators).

## Out of scope
- No changes to search/filter UI, "Continue where you left off" banner, data hooks, or routing.
- No new fonts — stay on Inter per project memory (the prototype's Playfair Display is dropped).
- No image uploads / extra fields beyond what `AgentListing` already exposes.

## Files
- `src/features/workspace/components/ListingSwitcher.tsx` (only the `groups.map` render block)

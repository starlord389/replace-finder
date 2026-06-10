# Zillow-style listing cards on /agent/listings

Today, under each client header the listings render as a thin text-only divided list. Change them to compact "Zillow-style" cards in a responsive grid so each listing is visually scannable at a glance.

## What changes

Only the per-client section inside `ListingSwitcher.tsx`. Everything else on the page (header, search, filters, chips, "Continue where you left off", grouping by client, last-visited badge) stays exactly as it is.

## Card design

Each card is small (roughly 220–260px wide), with:

- **Photo thumbnail** on top (16:9), using the existing `propertyImage(null, listing.id)` helper so we get a deterministic neutral real-estate placeholder per listing. A status badge ("Draft", "Active", etc.) sits in the top-left corner of the photo; a "Last" pill sits top-right when this was the last opened listing.
- **Price** as the prominent line just below the photo (e.g. `$2.4M`), using the existing `fmtPrice` helper. Falls back to "Price TBD" when null.
- **Title** = `propertyName || address || "Untitled"`, single line truncated.
- **Location row** = city, state with a small `MapPin` icon, single line truncated.
- **Asset type** as a subtle muted chip on the bottom row (when present).

The whole card is a `<Link>` to `/agent/workspace/{id}` with hover lift (border + soft shadow), matching the premium minimal look already used by `PipelineListingCard`.

## Layout

Replace the current `<ul className="divide-y rounded-lg border bg-card">` block with a responsive grid:

```text
1 col on mobile · 2 cols on sm · 3 cols on lg · 4 cols on xl
gap-3
```

The client header row above each grid stays unchanged (colored dot + uppercase client name).

Also widen the page container in `AgentListings.tsx` from `max-w-3xl` to `max-w-6xl` so the grid has room to breathe at 3–4 columns. Empty state and loading state are unchanged.

## Technical notes

- File touched: `src/features/workspace/components/ListingSwitcher.tsx` (swap the inner list rendering for cards) and `src/pages/agent/AgentListings.tsx` (widen the wrapper).
- No data model changes. Photo uses the existing `propertyImage` placeholder helper — no new fields on `AgentListing`.
- No changes to filters, search, sort, grouping, or routing.

## Out of scope

- Real uploaded property photos (not exposed by `useAgentListings` today).
- Beds/baths/sqft — this is commercial 1031 inventory, not residential; we use asset type + price + location instead, which is what already exists on the model.

## Problem

The "Investor preview" dialog shows the empty state ("No property attached yet") for every listing, even though the listings clearly have properties attached (the cards on the page show address, asking price, asset type, etc.).

## Root cause

The dialog gates the preview on a single field:

```ts
const hasProperty = !!listing.propertyId;
const rel = hasProperty ? buildPreviewRel(listing) : null;
```

`listing.propertyId` is sourced from `exchanges.relinquished_property_id` in `useAgentListings.ts`. The hook itself maps it correctly, but the gating is too strict:

- Some real exchanges have `relinquished_property_id = null` even though a property record exists (older rows, drafts, or rows where the FK was never backfilled).
- The hook does fetch `propertyName`, `address`, `city`, `state`, `askingPrice` independently — and the listing cards render fine — so we already have everything we need to drive `PropertyReviewPanel` regardless of whether the FK is populated.

So the dialog refuses to render even when the rest of the listing is fully populated. That's why every listing the user clicks shows the empty state.

## Fix

Stop using `propertyId` as the gate. A listing is "previewable" when it has any concrete property info to display.

### 1. `src/features/workspace/components/ListingPreviewDialog.tsx`

Replace the gate:

```ts
const hasProperty =
  !!listing.propertyId ||
  !!listing.propertyName ||
  !!listing.address ||
  listing.askingPrice != null;
```

Keep the empty-state branch only for true blank drafts (no name, no address, no price, no id). The empty-state copy stays the same.

`buildPreviewRel` already uses `listing.propertyId ?? ""`, so passing an empty `propertyId` into the synthetic `Relationship` is already safe — `PropertyReviewPanel` will render hero/facts/tabs from the rel fields we synthesize (name, city, state, asking price) and any sub-component that queries by id will just no-op.

### 2. `src/features/pipeline/hooks/useAgentListings.ts` (defensive)

If `relinquished_property_id` is null, also look up `pledged_properties` by `exchange_id`. Same query block; just add a second batched fetch and merge into `propMap`/`finMap` keyed by exchange id. This recovers `propertyName/address/city/state/askingPrice` for exchanges where the FK was never set.

## Files

- `src/features/workspace/components/ListingPreviewDialog.tsx`
- `src/features/pipeline/hooks/useAgentListings.ts`

No changes to `PropertyReviewPanel`, no schema changes.
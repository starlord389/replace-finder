## Replace "Open workspace" with "View matches"

### Edits

**`src/features/workspace/components/ListingPreviewDialog.tsx`** (lines 400-404)
Replace the Open workspace button with a "View matches" link:
```tsx
<Button size="sm" asChild>
  <Link to={`/agent/matches?${listing.clientId ? `client=${listing.clientId}&` : ""}listing=${listing.id}`}>
    View matches
  </Link>
</Button>
```

**`src/pages/agent/AgentMatches.tsx`**
Add a `?listing=<id>` URL param that filters `buyerRels` to only matches for that property:
- Read `const listingFilterId = searchParams.get("listing");`
- In the `scopedRels` useMemo, after client scoping, also filter by `r.propertyId === listingFilterId` when set.
- When the listing filter is active, show a small dismissable banner above the toolbar: "Showing matches for {listing name} · Clear" where Clear removes the `listing` param. (Look up name from `agentListings` by id.)

### Not changing
- `/agent/workspace/:id` route + "Continue where you left off" banner on Listings stay (user only asked about this button).
- Edit listing button stays.
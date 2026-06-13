## Make listing preview identical to what counterparties see

The "Investor preview" dialog is currently a bespoke layout. Counterparties actually see `PropertyReviewPanel` (Hero gallery, FactsBar, Sidebar, tabs: Overview/Financials/Location/Match/Docs). Replace the dialog body with that same component.

### 1. `src/features/pipeline/hooks/useAgentListings.ts`
Add `propertyId: string | null` (= `relinquished_property_id`) to `AgentListing` and populate it in the row mapper.

### 2. `src/features/matches/components/inbox/PropertyReviewPanel.tsx`
Add optional `previewMode?: boolean` prop. When true:
- Hide Match and Conversation tabs.
- Hide the top client identity strip.
- Hide `ListingSidebar` (or render a static version with only the price/facts — easier: hide it and let the content span full width).

### 3. `src/features/workspace/components/ListingPreviewDialog.tsx`
Replace the bespoke body with `<PropertyReviewPanel rel={syntheticRel} previewMode />`. Build a synthetic `Relationship` from `AgentListing`:
- `id/matchId` = `preview-${listing.id}`, `connectionId: null`
- `mySide: "seller"`, `stage: "new"`
- `propertyId: listing.propertyId`
- `propertyName/City/State/askingPrice` from listing; `propertyImageUrl: null` (Hero already uses fallback)
- All counterparty/connection/activity fields null/0/empty
- `clientId/clientName` from listing (used internally; UI strip is hidden in previewMode)
- `buyerExchangeId`: `""` (not used in non-match tabs)

Keep the dialog chrome: "INVESTOR PREVIEW" header banner and footer (Close / Edit listing / View matches).

If `listing.propertyId` is null, render an empty state ("Add property details to preview this listing") instead of the panel.

### Files
- `src/features/pipeline/hooks/useAgentListings.ts`
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx`
- `src/features/workspace/components/ListingPreviewDialog.tsx`
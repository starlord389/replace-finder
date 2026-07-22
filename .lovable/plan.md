## Add "How others will see this" preview to the Review step

Show agents a live preview of what their listing will look like to another agent when it surfaces as a match, right inside the Review step of the new/edit listing wizard.

### What it looks like

A new card in `StepReview.tsx` (placed above the Compliance attestation, below Exchange Economics) titled **"Preview — how others will see this match"** containing two mini surfaces stacked:

1. **Match inbox card** — the small card another agent sees in their match list (cover photo, property name, city/state · asset type, asking price · cap rate, a placeholder score badge, and a "New" status chip).
2. **Detail hero row** — the wider header another agent sees after opening the match: cover photo, property name, city/state (or full address if "show exact address" is on), asset type chip, asking price, cap rate, NOI.

Both mini surfaces respect the agent's current form state live — flipping the "Show exact address" toggle, adding photos, or changing the asking price updates the preview immediately.

### Privacy note under the preview

A short line reinforces what's masked: *"Financials are hidden until you accept a connection with a matched buyer."* This matches the real behavior of `matches_secure`.

### Technical details

- New component `src/components/exchange/ReviewMatchPreview.tsx` that takes `{ property, financials, images }` from `WizardState` and renders the two mini surfaces using the same tokens/spacing as `PropertyMatchCard` and `ListingHero` so it looks identical to production.
- Reuses `propertyImage()` fallback for empty photo state and `ASSET_TYPE_LABELS`, `formatCurrency`, `getDerivedFinancials` already imported in the wizard.
- The score badge is a static "—" with a caption "Score depends on the buyer" so we don't fabricate a number.
- Address handling mirrors `useUnifiedRelationships`: show street only when `address_is_public` is true; otherwise show city/state.
- Pure presentational; no new queries, no schema changes, no edge function changes.

### Out of scope

- No changes to the actual match card/hero components used in production.
- No new preview for admin/client surfaces.
- No changes to what other agents actually see — this is a UI mirror only.

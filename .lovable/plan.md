## Goal
On the New Exchange wizard, drop the "Property Snapshot" section (Year Built, Total Units, Building SF). Keep Description (make it explicitly optional) and Property Photos. Then update every place in the app that renders those snapshot fields so nothing shows blanks or dashes.

## Changes

### 1. Wizard form
`src/components/exchange/StepPropertyAndFinancials.tsx`
- Delete the entire "Property Snapshot" `<section>` (year_built, units, building_square_footage inputs).
- Keep the Description textarea; add "(optional)" to its label and helper copy.
- Keep Photos section as-is.

`src/lib/exchangeWizardTypes.ts`
- Remove `year_built`, `units`, `building_square_footage` from `PropertyData` type and `initialWizardState`.

`src/features/exchanges/api/createExchange.ts` & `updateExchange.ts`
- Remove the three fields from the normalized payload.

`supabase/functions/create-exchange/index.ts` & `update-exchange/index.ts`
- Stop reading/writing those columns (leave columns in DB nullable — no migration needed; existing rows keep their data).

`src/pages/agent/EditExchange.tsx`
- Remove the three fields from initial state hydration.

`src/components/exchange/StepReview.tsx`
- Remove the three `<Field>` rows for Year Built / Units / Building SF.

### 2. Marketing / display surfaces
`src/features/matches/components/inbox/tabs/OverviewTab.tsx`
- Rework so Description carries the whole story. When no description, show the existing "No description yet" empty state (already handles the case).

`src/features/matches/hooks/useUnifiedRelationships.ts`
- Drop `units, year_built, building_square_footage` from the select and from the mapped `propertyUnits / propertyYearBuilt / propertyBuildingSqft` fields (and their type).

`src/pages/agent/AgentConnectionDetail.tsx`
- Remove the `{units} units` chips on the two property summary rows (lines ~373, ~385).

`src/features/clients/components/ClientPropertyCards.tsx`
- Drop `units` and `year_built` from the select, type, and rendered chips (lines ~224–226).

### 3. Not touching
- DB schema — columns stay (nullable) so historical rows aren't lost; no migration.
- Matching engine — none of the removed fields feed scoring today.
- Photos, address visibility, financials — unchanged.

## Verification
- `tsgo` clean.
- Manually walk `/agent/exchanges/new`: snapshot gone, description optional, submit succeeds without those fields.
- Open a match Overview tab, a connection detail, and a client property card — no broken chips or empty "Year Built: —" rows.



# Part 1 of 3: Database Migrations + MLS-Level Intake Form

This is the first of three rounds. This round handles all database schema changes and rebuilds the exchange request intake form with MLS-level data collection across 8 steps.

## Database Changes

### Migration 1: Expand `exchange_requests` table
Add columns for the new property detail fields:
- `property_name` text — e.g. "Riverside Apartments"
- `unit_suite` text
- `county` text
- `asset_subtype` text
- `property_class` text — Class A/B/C/D
- `building_square_footage` numeric
- `land_area_acres` numeric
- `num_buildings` integer
- `num_stories` integer
- `parking_spaces` integer
- `parking_type` text
- `zoning` text
- `construction_type` text
- `roof_type` text
- `hvac_type` text
- `property_condition` text
- `recent_renovations` text
- `amenities` text[]
- `gross_scheduled_income` numeric
- `effective_gross_income` numeric
- `real_estate_taxes` numeric
- `insurance` numeric
- `utilities` numeric
- `management_fee` numeric
- `maintenance_repairs` numeric
- `capex_reserves` numeric
- `other_expenses` numeric
- `average_rent_per_unit` numeric
- `current_noi` numeric
- `current_occupancy_rate` numeric
- `current_cap_rate` numeric
- `current_loan_balance` numeric
- `current_interest_rate` numeric
- `annual_debt_service` numeric
- `loan_type` text
- `loan_maturity_date` date
- `has_prepayment_penalty` boolean default false
- `prepayment_penalty_details` text

### Migration 2: Expand `exchange_request_preferences` table
- `target_occupancy_min` numeric
- `target_year_built_min` integer
- `target_property_classes` text[]
- `open_to_dsts` boolean default false
- `open_to_tics` boolean default false

### Migration 3: Create `request_images` table + storage bucket
```sql
CREATE TABLE public.request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.request_images ENABLE ROW LEVEL SECURITY;
-- Users CRUD own, admins read all
INSERT INTO storage.buckets (id, name, public) VALUES ('request-images', 'request-images', true);
-- Storage RLS policies for authenticated uploads
```

### Migration 4: Expand `inventory_properties` and `inventory_financials`
Add columns to inventory tables (for Part 3 match detail page to use later):
- `inventory_properties`: asset_subtype, property_class, land_area_acres, num_buildings, num_stories, parking_spaces, parking_type, zoning, construction_type, roof_type, hvac_type, property_condition, recent_renovations, amenities
- `inventory_financials`: gross_scheduled_income, effective_gross_income, vacancy_rate, real_estate_taxes, insurance, utilities, management_fee, maintenance_repairs, capex_reserves, other_expenses, other_income, loan_amount, loan_rate, annual_debt_service, average_rent_per_unit

## Code Changes

### Rewrite intake form: `src/pages/client/NewRequest.tsx`
- Expand `RequestFormData` interface with all new fields
- Update `INITIAL` defaults
- Change `STEPS` from 6 to 8: Location, Classification, Physical Description, Financials, Debt & Equity, Replacement Criteria, Photos, Review
- Update `buildRequestPayload()` and `buildPrefsPayload()` to include all new columns
- Add unsaved-changes browser prompt (`beforeunload` event)
- Validate required fields per step before allowing Next

### New step components (replace existing 6 with 8):
1. **`StepLocation.tsx`** — Property name, address, unit/suite, city, state (dropdown), ZIP, county
2. **`StepClassification.tsx`** — Asset type, asset subtype (dynamic based on type), strategy, property class dropdown
3. **`StepPhysical.tsx`** — Units/SF (conditional on asset type), year built, building SF, lot size, buildings, stories, parking, zoning, construction, roof, HVAC, condition, renovations textarea, amenities multi-select chips
4. **`StepFinancials.tsx`** — Estimated value, NOI, occupancy rate (required). Gross income, expenses breakdown, auto-calculate cap rate, avg rent per unit (optional with encouragement note)
5. **`StepDebtEquity.tsx`** — Exchange proceeds, estimated equity (required). Loan balance, rate, type, maturity, debt service, prepayment penalty toggle + details (optional)
6. **`StepCriteria.tsx`** — Target asset types, target states, price range (required). Metros tags input, target strategies, cap rate range, occupancy min, year built min, property classes, ID deadline, close deadline, DST/TIC toggles, urgency dropdown, additional notes
7. **`StepPhotos.tsx`** — Drag-and-drop / click-to-browse image uploader. Shows thumbnail grid with remove buttons. Upload to `request-images` bucket. Max 20 photos. Drag-to-reorder for sort_order.
8. **`StepReview.tsx`** — Full summary organized by section. Red indicators for missing required fields. Conditional submit button.

### Delete old step components:
Remove StepRelinquished, StepEconomics, StepGoals, StepGeography, StepTiming (replaced by the 8 new ones)

### Update `src/lib/constants.ts`
- Add `ASSET_SUBTYPE_MAP` — keyed by asset_type, value is array of subtype labels
- Add `PROPERTY_CLASS_OPTIONS`, `PARKING_TYPE_OPTIONS`, `CONSTRUCTION_TYPE_OPTIONS`, etc.
- Add `AMENITY_OPTIONS` array
- Add `LOAN_TYPE_OPTIONS`
- Add `URGENCY_OPTIONS`

## What stays the same
- Routing (same `/dashboard/exchanges/new` and `/:id/edit` paths)
- Draft/edit/re-submit logic already built
- Admin pages untouched
- Match pages untouched (Parts 2 and 3 later)

## What's next (future rounds)
- **Part 2**: Zillow-style match cards on MatchList page
- **Part 3**: Full investment analysis match detail page with charts


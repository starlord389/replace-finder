-- Listing financials are now captured as gross rent roll + total operating
-- expenses (occupancy assumed 100%). NOI and cap rate are derived from these
-- plus the asking price by the create-exchange / update-exchange functions and
-- stored in the existing noi / cap_rate columns, so the match engine is
-- unchanged. Store the two raw inputs so the edit wizard can round-trip them.
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS gross_rent_roll numeric,
  ADD COLUMN IF NOT EXISTS total_operating_expenses numeric;

-- The gross_rent_roll / total_operating_expenses columns (originally introduced
-- by 20260618120000) never made it onto the live database. Both the real
-- listing form (create-exchange / update-exchange derive + write them) and the
-- demo-data builder write these columns, so their absence silently broke every
-- property_financials insert. Re-add them idempotently to guarantee they exist.
ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS gross_rent_roll numeric,
  ADD COLUMN IF NOT EXISTS total_operating_expenses numeric;

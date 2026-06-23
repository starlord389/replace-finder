ALTER TABLE public.property_financials
  ADD COLUMN IF NOT EXISTS gross_rent_roll numeric,
  ADD COLUMN IF NOT EXISTS total_operating_expenses numeric;
-- Optional replacement-property preferences. Blank/null/default values are a
-- deliberate no-op so existing exchanges keep the original automatic matching
-- behavior until an owner or agent opts into criteria.

ALTER TABLE public.replacement_criteria
  ADD COLUMN IF NOT EXISTS additional_cash_available numeric,
  ADD COLUMN IF NOT EXISTS max_ltv numeric,
  ADD COLUMN IF NOT EXISTS min_projected_roe numeric,
  ADD COLUMN IF NOT EXISTS preferred_monthly_cash_flow numeric,
  ADD COLUMN IF NOT EXISTS require_location_match boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_asset_type_match boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.replacement_criteria.additional_cash_available IS
  'Maximum optional cash the exchanger can add. Matching uses only the minimum amount a candidate needs.';
COMMENT ON COLUMN public.replacement_criteria.max_ltv IS
  'Optional exchanger-selected maximum replacement LTV stored as a ratio greater than 0 through 0.75. Null uses the platform default.';
COMMENT ON COLUMN public.replacement_criteria.min_projected_roe IS
  'Optional minimum projected replacement return on equity stored in percentage points (for example, 8 means 8%).';
COMMENT ON COLUMN public.replacement_criteria.preferred_monthly_cash_flow IS
  'Optional minimum projected monthly NOI after modeled principal and interest.';
COMMENT ON COLUMN public.replacement_criteria.require_location_match IS
  'When true, a candidate must match at least one selected state or metro. False keeps geography as a ranking preference.';
COMMENT ON COLUMN public.replacement_criteria.require_asset_type_match IS
  'When true, a candidate must match a selected asset type. False keeps asset type as a ranking preference.';

NOTIFY pgrst, 'reload schema';

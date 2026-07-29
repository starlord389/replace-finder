-- Exchange Up: directional value requirement + purchasing capacity preferences

ALTER TABLE public.replacement_criteria
  ADD COLUMN IF NOT EXISTS min_replacement_value numeric,
  ADD COLUMN IF NOT EXISTS preferred_replacement_value numeric,
  ADD COLUMN IF NOT EXISTS max_replacement_value numeric,
  ADD COLUMN IF NOT EXISTS min_value_increase numeric,
  ADD COLUMN IF NOT EXISTS additional_cash_available numeric,
  ADD COLUMN IF NOT EXISTS desired_loan_amount numeric,
  ADD COLUMN IF NOT EXISTS max_ltv numeric,
  ADD COLUMN IF NOT EXISTS preferred_monthly_cash_flow numeric,
  ADD COLUMN IF NOT EXISTS min_projected_roe numeric;

COMMENT ON COLUMN public.replacement_criteria.min_replacement_value IS 'Hard floor for replacement property value. Defaults to the relinquished property value (Exchange Up rule); never allowed below it.';
COMMENT ON COLUMN public.replacement_criteria.max_ltv IS 'Maximum acceptable loan-to-value for the replacement property, as a fraction (0.75 = 75%).';

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS relinquished_value numeric,
  ADD COLUMN IF NOT EXISTS replacement_value numeric,
  ADD COLUMN IF NOT EXISTS value_increase numeric,
  ADD COLUMN IF NOT EXISTS exchange_up_percentage numeric,
  ADD COLUMN IF NOT EXISTS estimated_replacement_loan numeric,
  ADD COLUMN IF NOT EXISTS estimated_ltv numeric,
  ADD COLUMN IF NOT EXISTS estimated_purchasing_capacity numeric,
  ADD COLUMN IF NOT EXISTS match_classification text NOT NULL DEFAULT 'eligible_exchange_up_match',
  ADD COLUMN IF NOT EXISTS eligibility_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS relinquished_property_id uuid,
  ADD COLUMN IF NOT EXISTS buyer_agent_id uuid,
  ADD COLUMN IF NOT EXISTS seller_agent_id uuid,
  ADD COLUMN IF NOT EXISTS buyer_client_id uuid,
  ADD COLUMN IF NOT EXISTS seller_client_id uuid;

COMMENT ON COLUMN public.matches.match_classification IS 'eligible_exchange_up_match | below_relinquished_value | above_purchasing_capacity | insufficient_roe_improvement | property_preferences_mismatch | financing_information_incomplete | exchange_information_incomplete';
COMMENT ON COLUMN public.matches.exchange_up_percentage IS '(replacement - relinquished) / relinquished * 100. Directional: always >= 0 for eligible matches.';

CREATE INDEX IF NOT EXISTS matches_classification_idx ON public.matches (match_classification);
CREATE INDEX IF NOT EXISTS matches_relinquished_property_idx ON public.matches (relinquished_property_id);
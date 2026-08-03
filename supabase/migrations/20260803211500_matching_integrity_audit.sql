-- Persist the exact financing assumptions behind every recommendation so the
-- displayed result remains auditable after global matching settings change.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS estimated_purchasing_capacity numeric,
  ADD COLUMN IF NOT EXISTS estimated_replacement_loan numeric,
  ADD COLUMN IF NOT EXISTS estimated_ltv numeric,
  ADD COLUMN IF NOT EXISTS relinquished_value numeric,
  ADD COLUMN IF NOT EXISTS replacement_value numeric,
  ADD COLUMN IF NOT EXISTS value_increase numeric,
  ADD COLUMN IF NOT EXISTS exchange_up_percentage numeric,
  ADD COLUMN IF NOT EXISTS match_classification text,
  ADD COLUMN IF NOT EXISTS eligibility_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.matches.estimated_replacement_loan IS
  'Replacement purchase price less the buyer equity reinvested by the matching engine.';
COMMENT ON COLUMN public.matches.estimated_ltv IS
  'Modeled replacement loan divided by replacement value; stored as a ratio.';
COMMENT ON COLUMN public.matches.eligibility_reasons IS
  'Human-readable hard-gate checks passed when the recommendation was scored.';

-- Authenticated users may mark a recommendation viewed, but only the service
-- role/admin may change its system-computed eligibility and financial fields.
CREATE OR REPLACE FUNCTION public.guard_match_system_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)
     AND (
          NEW.buyer_exchange_id             IS DISTINCT FROM OLD.buyer_exchange_id
       OR NEW.seller_property_id            IS DISTINCT FROM OLD.seller_property_id
       OR NEW.total_score                   IS DISTINCT FROM OLD.total_score
       OR NEW.price_score                   IS DISTINCT FROM OLD.price_score
       OR NEW.geo_score                     IS DISTINCT FROM OLD.geo_score
       OR NEW.asset_score                   IS DISTINCT FROM OLD.asset_score
       OR NEW.strategy_score                IS DISTINCT FROM OLD.strategy_score
       OR NEW.financial_score               IS DISTINCT FROM OLD.financial_score
       OR NEW.timing_score                  IS DISTINCT FROM OLD.timing_score
       OR NEW.debt_fit_score                IS DISTINCT FROM OLD.debt_fit_score
       OR NEW.scale_fit_score               IS DISTINCT FROM OLD.scale_fit_score
       OR NEW.estimated_cash_boot           IS DISTINCT FROM OLD.estimated_cash_boot
       OR NEW.estimated_mortgage_boot       IS DISTINCT FROM OLD.estimated_mortgage_boot
       OR NEW.estimated_total_boot          IS DISTINCT FROM OLD.estimated_total_boot
       OR NEW.estimated_boot_tax            IS DISTINCT FROM OLD.estimated_boot_tax
       OR NEW.boot_status                   IS DISTINCT FROM OLD.boot_status
       OR NEW.buyer_current_roe             IS DISTINCT FROM OLD.buyer_current_roe
       OR NEW.candidate_roe                 IS DISTINCT FROM OLD.candidate_roe
       OR NEW.roe_improvement_pp            IS DISTINCT FROM OLD.roe_improvement_pp
       OR NEW.roe_improvement_rel           IS DISTINCT FROM OLD.roe_improvement_rel
       OR NEW.candidate_annual_debt_service IS DISTINCT FROM OLD.candidate_annual_debt_service
       OR NEW.estimated_purchasing_capacity IS DISTINCT FROM OLD.estimated_purchasing_capacity
       OR NEW.estimated_replacement_loan    IS DISTINCT FROM OLD.estimated_replacement_loan
       OR NEW.estimated_ltv                 IS DISTINCT FROM OLD.estimated_ltv
       OR NEW.relinquished_value            IS DISTINCT FROM OLD.relinquished_value
       OR NEW.replacement_value             IS DISTINCT FROM OLD.replacement_value
       OR NEW.value_increase                IS DISTINCT FROM OLD.value_increase
       OR NEW.exchange_up_percentage        IS DISTINCT FROM OLD.exchange_up_percentage
       OR NEW.match_classification          IS DISTINCT FROM OLD.match_classification
       OR NEW.eligibility_reasons           IS DISTINCT FROM OLD.eligibility_reasons
       OR NEW.status                        IS DISTINCT FROM OLD.status
       OR NEW.created_at                    IS DISTINCT FROM OLD.created_at
     ) THEN
    RAISE EXCEPTION 'match scoring columns are system-computed; only the viewed flags may be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_guard_system_columns ON public.matches;
CREATE TRIGGER trg_matches_guard_system_columns
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_match_system_columns();

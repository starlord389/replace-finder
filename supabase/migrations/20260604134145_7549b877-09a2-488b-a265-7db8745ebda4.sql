ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS buyer_current_roe numeric,
  ADD COLUMN IF NOT EXISTS candidate_roe numeric,
  ADD COLUMN IF NOT EXISTS roe_improvement_pp numeric,
  ADD COLUMN IF NOT EXISTS roe_improvement_rel numeric,
  ADD COLUMN IF NOT EXISTS candidate_annual_debt_service numeric;
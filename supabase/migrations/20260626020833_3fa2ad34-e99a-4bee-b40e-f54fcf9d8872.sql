DROP POLICY IF EXISTS "Seller agents can read their matches" ON public.matches;

CREATE OR REPLACE VIEW public.matches_secure
WITH (security_barrier = true) AS
SELECT
  base.id, base.buyer_exchange_id, base.seller_property_id, base.status,
  base.total_score, base.price_score, base.geo_score, base.asset_score,
  base.strategy_score, base.timing_score, base.scale_fit_score,
  base.buyer_agent_viewed, base.buyer_agent_viewed_at,
  base.seller_agent_viewed, base.seller_agent_viewed_at,
  base.created_at, base.updated_at,
  CASE WHEN base.can_see THEN base.buyer_current_roe END            AS buyer_current_roe,
  CASE WHEN base.can_see THEN base.candidate_roe END                AS candidate_roe,
  CASE WHEN base.can_see THEN base.roe_improvement_pp END           AS roe_improvement_pp,
  CASE WHEN base.can_see THEN base.roe_improvement_rel END          AS roe_improvement_rel,
  CASE WHEN base.can_see THEN base.candidate_annual_debt_service END AS candidate_annual_debt_service,
  CASE WHEN base.can_see THEN base.estimated_cash_boot END          AS estimated_cash_boot,
  CASE WHEN base.can_see THEN base.estimated_mortgage_boot END      AS estimated_mortgage_boot,
  CASE WHEN base.can_see THEN base.estimated_total_boot END         AS estimated_total_boot,
  CASE WHEN base.can_see THEN base.estimated_boot_tax END           AS estimated_boot_tax,
  CASE WHEN base.can_see THEN base.financial_score END              AS financial_score,
  CASE WHEN base.can_see THEN base.debt_fit_score END               AS debt_fit_score,
  CASE WHEN base.can_see THEN base.boot_status END                  AS boot_status
FROM (
  SELECT m.*, (
    EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = m.buyer_exchange_id AND e.agent_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.exchange_connections c WHERE c.match_id = m.id AND c.status IN ('accepted','in_progress','completed'))
  ) AS can_see
  FROM public.matches m
) base
WHERE EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = base.buyer_exchange_id AND e.agent_id = auth.uid())
   OR EXISTS (SELECT 1 FROM public.pledged_properties p WHERE p.id = base.seller_property_id AND p.agent_id = auth.uid())
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

REVOKE ALL ON public.matches_secure FROM PUBLIC;
REVOKE ALL ON public.matches_secure FROM anon;
GRANT SELECT ON public.matches_secure TO authenticated;

NOTIFY pgrst, 'reload schema';
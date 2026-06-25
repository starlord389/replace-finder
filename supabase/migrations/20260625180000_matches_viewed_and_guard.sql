-- Matches "viewed" tracking + UPDATE lockdown (QA sweep #2: H5 + H5b).
--
-- H5  : nothing ever set buyer_agent_viewed / seller_agent_viewed = true, so the
--       "new matches to review" badge and the unviewed-first sort never cleared.
--       Add a SECURITY DEFINER RPC the client calls when an agent opens a match.
-- H5b : the matches UPDATE policies are USING-only with NO WITH CHECK / column
--       guard, so an agent could PATCH any column of their own match rows (scores,
--       boot/ROE, status, the join keys) directly over REST. Add a BEFORE UPDATE
--       trigger that makes every system-computed column immutable to non-service
--       callers — only the two viewed flags (+ their timestamps) may change.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) mark_match_viewed: stamp the caller's side of a match as viewed.
--    Buyer side  = the agent on the match's exchange (exchanges.agent_id).
--    Seller side = the agent on the match's pledged property (pledged_properties.agent_id).
--    SECURITY DEFINER so the write can set the viewed flags even though the guard
--    trigger below blocks ordinary callers from touching anything else — the
--    function only ever writes the viewed flags, and it raises if the caller is on
--    neither side, so it can't be used to mark someone else's match.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_match_viewed(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_buyer boolean;
  v_is_seller boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'mark_match_viewed requires an authenticated caller';
  END IF;

  -- Which side is the caller on for this match?
  SELECT
    EXISTS (
      SELECT 1
      FROM public.exchanges e
      WHERE e.id = m.buyer_exchange_id
        AND e.agent_id = v_uid
    ),
    EXISTS (
      SELECT 1
      FROM public.pledged_properties p
      WHERE p.id = m.seller_property_id
        AND p.agent_id = v_uid
    )
  INTO v_is_buyer, v_is_seller
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'match % not found', p_match_id;
  END IF;

  IF v_is_buyer THEN
    UPDATE public.matches
    SET buyer_agent_viewed = true,
        buyer_agent_viewed_at = COALESCE(buyer_agent_viewed_at, now())
    WHERE id = p_match_id;
  ELSIF v_is_seller THEN
    UPDATE public.matches
    SET seller_agent_viewed = true,
        seller_agent_viewed_at = COALESCE(seller_agent_viewed_at, now())
    WHERE id = p_match_id;
  ELSE
    RAISE EXCEPTION 'caller is not the buyer-side or seller-side agent for this match';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_match_viewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_match_viewed(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Guard the matches UPDATE path. The two USING-only UPDATE policies let an
--    agent UPDATE their own match rows, but RLS can't restrict WHICH columns
--    change. The match engine (service role) owns every scoring / boot / ROE /
--    status / join-key column; an authenticated agent may only flip the viewed
--    flags. Mirror the messages/profiles guard-trigger pattern: service role and
--    SECURITY DEFINER contexts have auth.uid() = NULL and are exempt; admins are
--    exempt too. Everyone else is rejected if any non-viewed column changes.
-- ─────────────────────────────────────────────────────────────────────────────
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
          NEW.buyer_exchange_id            IS DISTINCT FROM OLD.buyer_exchange_id
       OR NEW.seller_property_id           IS DISTINCT FROM OLD.seller_property_id
       OR NEW.total_score                  IS DISTINCT FROM OLD.total_score
       OR NEW.price_score                  IS DISTINCT FROM OLD.price_score
       OR NEW.geo_score                    IS DISTINCT FROM OLD.geo_score
       OR NEW.asset_score                  IS DISTINCT FROM OLD.asset_score
       OR NEW.strategy_score               IS DISTINCT FROM OLD.strategy_score
       OR NEW.financial_score              IS DISTINCT FROM OLD.financial_score
       OR NEW.timing_score                 IS DISTINCT FROM OLD.timing_score
       OR NEW.debt_fit_score               IS DISTINCT FROM OLD.debt_fit_score
       OR NEW.scale_fit_score              IS DISTINCT FROM OLD.scale_fit_score
       OR NEW.estimated_cash_boot          IS DISTINCT FROM OLD.estimated_cash_boot
       OR NEW.estimated_mortgage_boot      IS DISTINCT FROM OLD.estimated_mortgage_boot
       OR NEW.estimated_total_boot         IS DISTINCT FROM OLD.estimated_total_boot
       OR NEW.estimated_boot_tax           IS DISTINCT FROM OLD.estimated_boot_tax
       OR NEW.boot_status                  IS DISTINCT FROM OLD.boot_status
       OR NEW.buyer_current_roe            IS DISTINCT FROM OLD.buyer_current_roe
       OR NEW.candidate_roe                IS DISTINCT FROM OLD.candidate_roe
       OR NEW.roe_improvement_pp           IS DISTINCT FROM OLD.roe_improvement_pp
       OR NEW.roe_improvement_rel          IS DISTINCT FROM OLD.roe_improvement_rel
       OR NEW.candidate_annual_debt_service IS DISTINCT FROM OLD.candidate_annual_debt_service
       OR NEW.status                       IS DISTINCT FROM OLD.status
       OR NEW.created_at                   IS DISTINCT FROM OLD.created_at
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

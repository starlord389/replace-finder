CREATE OR REPLACE FUNCTION public.accept_client_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite       public.client_invites%ROWTYPE;
  v_caller_email text := auth.jwt() ->> 'email';
  v_uid          uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept an invite.';
  END IF;

  SELECT * INTO v_invite FROM public.client_invites WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite is invalid or has been removed.';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'This invite has already been used.';
  END IF;

  IF v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'This invite has expired. Ask your agent to send a new one.';
  END IF;

  IF v_caller_email IS NULL OR lower(v_invite.email) <> lower(v_caller_email) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address.';
  END IF;

  UPDATE public.agent_clients
  SET client_user_id = v_uid, updated_at = now()
  WHERE id = v_invite.client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The client record for this invite no longer exists.';
  END IF;

  UPDATE public.client_invites
  SET status = 'accepted', accepted_at = now(), accepted_user_id = v_uid
  WHERE id = v_invite.id;

  RETURN v_invite.client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_client_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_client_invite(text) TO authenticated;

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

  SELECT
    EXISTS (SELECT 1 FROM public.exchanges e WHERE e.id = m.buyer_exchange_id AND e.agent_id = v_uid),
    EXISTS (SELECT 1 FROM public.pledged_properties p WHERE p.id = m.seller_property_id AND p.agent_id = v_uid)
  INTO v_is_buyer, v_is_seller
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'match % not found', p_match_id;
  END IF;

  IF v_is_buyer THEN
    UPDATE public.matches
    SET buyer_agent_viewed = true, buyer_agent_viewed_at = COALESCE(buyer_agent_viewed_at, now())
    WHERE id = p_match_id;
  ELSIF v_is_seller THEN
    UPDATE public.matches
    SET seller_agent_viewed = true, seller_agent_viewed_at = COALESCE(seller_agent_viewed_at, now())
    WHERE id = p_match_id;
  ELSE
    RAISE EXCEPTION 'caller is not the buyer-side or seller-side agent for this match';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_match_viewed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_match_viewed(uuid) TO authenticated;

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
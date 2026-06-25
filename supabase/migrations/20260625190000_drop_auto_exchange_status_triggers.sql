-- Draft listings were silently flipping to 'active' on creation.
--
-- public.exchanges has TWO BEFORE-INSERT/UPDATE triggers that run
-- auto_exchange_status() — trigger_auto_exchange_status (20260406180501) and
-- trg_exchanges_auto_status (20260604131059). That function historically
-- promoted draft -> active once a property + criteria existed, which fights the
-- "Save as draft" flow: create-exchange inserts the exchange as 'draft', then
-- links the criteria_id via UPDATE, and the trigger flips it to 'active'.
--
-- Migration 20260625130000 made the function a no-op, but the promotion is still
-- happening in the live DB (the no-op isn't in effect there). Status is now
-- always written explicitly by the app (create-exchange / update-exchange), the
-- connection lifecycle, and the demo seeder — so the auto-status triggers are
-- obsolete. Drop them outright (definitive, independent of the function body),
-- and re-assert the no-op function in case anything else still references it.

DROP TRIGGER IF EXISTS trigger_auto_exchange_status ON public.exchanges;
DROP TRIGGER IF EXISTS trg_exchanges_auto_status ON public.exchanges;

CREATE OR REPLACE FUNCTION public.auto_exchange_status()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

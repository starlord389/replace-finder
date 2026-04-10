-- Phase 0/2 production foundations:
-- - tighten permissive RLS policies
-- - align role authority between user_roles and profiles
-- - add automation queue/event primitives

-- 1) Tighten permissive insert policies
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service role inserts notifications"
ON public.notifications FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service can insert timeline events" ON public.exchange_timeline;
CREATE POLICY "Service role inserts timeline events"
ON public.exchange_timeline FOR INSERT TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Service can insert matches" ON public.matches;
CREATE POLICY "Service role inserts matches"
ON public.matches FOR INSERT TO service_role
WITH CHECK (true);

-- 2) Keep referral intake open, but validate required shape
DROP POLICY IF EXISTS "Anon can create referral" ON public.referrals;
CREATE POLICY "Anon can create referral (validated)"
ON public.referrals FOR INSERT TO anon
WITH CHECK (
  length(trim(owner_name)) >= 2
  AND owner_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
);

-- 3) Canonical role synchronization (user_roles => profiles.role)
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_role text;
BEGIN
  normalized_role := CASE
    WHEN NEW.role::text = 'broker' THEN 'agent'
    ELSE NEW.role::text
  END;

  UPDATE public.profiles
  SET role = normalized_role,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role_from_user_roles_trigger ON public.user_roles;
CREATE TRIGGER sync_profile_role_from_user_roles_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- backfill existing profile roles from user_roles
UPDATE public.profiles p
SET role = CASE
  WHEN ur.role::text = 'broker' THEN 'agent'
  ELSE ur.role::text
END
FROM public.user_roles ur
WHERE ur.user_id = p.id
  AND p.role IS DISTINCT FROM CASE
    WHEN ur.role::text = 'broker' THEN 'agent'
    ELSE ur.role::text
  END;

-- 4) Automation primitives: matching work queue + event outbox
CREATE TABLE IF NOT EXISTS public.match_job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  enqueued_reason text NOT NULL,
  requested_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_match_job_queue_exchange_property_reason_status
    UNIQUE (exchange_id, property_id, enqueued_reason, status)
);

CREATE INDEX IF NOT EXISTS idx_match_job_queue_pending
  ON public.match_job_queue(status, available_at, created_at);

-- Ensure idempotency constraint exists for pre-existing tables created before this migration version.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_match_job_queue_exchange_property_reason_status'
  ) THEN
    ALTER TABLE public.match_job_queue
      ADD CONSTRAINT uq_match_job_queue_exchange_property_reason_status
      UNIQUE (exchange_id, property_id, enqueued_reason, status);
  END IF;
END $$;

ALTER TABLE public.match_job_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read match queue" ON public.match_job_queue;
CREATE POLICY "Admins can read match queue"
ON public.match_job_queue FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can manage match queue" ON public.match_job_queue;
CREATE POLICY "Service role can manage match queue"
ON public.match_job_queue FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.event_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_pending
  ON public.event_outbox(status, created_at);

ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read event outbox" ON public.event_outbox;
CREATE POLICY "Admins can read event outbox"
ON public.event_outbox FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can manage event outbox" ON public.event_outbox;
CREATE POLICY "Service role can manage event outbox"
ON public.event_outbox FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 5) Enqueue matching jobs when exchange-relevant records change
CREATE OR REPLACE FUNCTION public.enqueue_match_job_for_exchange(_exchange_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _property_id uuid;
BEGIN
  SELECT relinquished_property_id INTO _property_id
  FROM public.exchanges
  WHERE id = _exchange_id;

  IF _property_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.match_job_queue (exchange_id, property_id, enqueued_reason, requested_by)
  VALUES (_exchange_id, _property_id, _reason, auth.uid())
  ON CONFLICT ON CONSTRAINT uq_match_job_queue_exchange_property_reason_status DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_exchange_match_relevant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_match_job_for_exchange(NEW.id, TG_OP || ':exchange');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exchange_match_relevant_trigger ON public.exchanges;
CREATE TRIGGER exchange_match_relevant_trigger
AFTER INSERT OR UPDATE OF criteria_id, relinquished_property_id, sale_close_date, status
ON public.exchanges
FOR EACH ROW
EXECUTE FUNCTION public.on_exchange_match_relevant_change();

CREATE OR REPLACE FUNCTION public.on_criteria_match_relevant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_match_job_for_exchange(NEW.exchange_id, TG_OP || ':criteria');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS criteria_match_relevant_trigger ON public.replacement_criteria;
CREATE TRIGGER criteria_match_relevant_trigger
AFTER INSERT OR UPDATE ON public.replacement_criteria
FOR EACH ROW
EXECUTE FUNCTION public.on_criteria_match_relevant_change();

CREATE OR REPLACE FUNCTION public.on_property_match_relevant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.exchange_id IS NOT NULL THEN
    PERFORM public.enqueue_match_job_for_exchange(NEW.exchange_id, TG_OP || ':property');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_match_relevant_trigger ON public.pledged_properties;
CREATE TRIGGER property_match_relevant_trigger
AFTER INSERT OR UPDATE OF status, exchange_id, city, state, asset_type, strategy_type
ON public.pledged_properties
FOR EACH ROW
EXECUTE FUNCTION public.on_property_match_relevant_change();

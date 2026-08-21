-- Establish one canonical live/demo boundary for standalone communications and
-- prevent cross-environment opportunities from being created.

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_demo boolean;
ALTER TABLE public.admin_messages ADD COLUMN IF NOT EXISTS is_demo boolean;
ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS is_demo boolean;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS is_demo boolean;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS is_demo boolean;

UPDATE public.notifications
SET is_demo = COALESCE(lower(metadata ->> 'demo') = 'true', false)
WHERE is_demo IS NULL;

UPDATE public.admin_messages
SET is_demo = lower(recipient_email) LIKE '%@replacefinder.test'
WHERE is_demo IS NULL;

UPDATE public.email_send_log
SET is_demo = COALESCE(lower(metadata ->> 'demo') = 'true', false)
  OR lower(recipient_email) LIKE '%@replacefinder.test'
WHERE is_demo IS NULL;

UPDATE public.sms_messages sm
SET is_demo = EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE lower(COALESCE(p.email, '')) LIKE '%@replacefinder.test'
    AND right(regexp_replace(COALESCE(p.phone, ''), '[^0-9]', '', 'g'), 10)
      = right(regexp_replace(sm.to_number, '[^0-9]', '', 'g'), 10)
    AND length(regexp_replace(sm.to_number, '[^0-9]', '', 'g')) >= 10
)
WHERE sm.is_demo IS NULL;

UPDATE public.support_tickets st
SET is_demo = EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = st.user_id
    AND lower(COALESCE(p.email, '')) LIKE '%@replacefinder.test'
)
WHERE st.is_demo IS NULL;

ALTER TABLE public.notifications ALTER COLUMN is_demo SET DEFAULT false;
ALTER TABLE public.notifications ALTER COLUMN is_demo SET NOT NULL;
ALTER TABLE public.admin_messages ALTER COLUMN is_demo SET DEFAULT false;
ALTER TABLE public.admin_messages ALTER COLUMN is_demo SET NOT NULL;
ALTER TABLE public.email_send_log ALTER COLUMN is_demo SET DEFAULT false;
ALTER TABLE public.email_send_log ALTER COLUMN is_demo SET NOT NULL;
ALTER TABLE public.sms_messages ALTER COLUMN is_demo SET DEFAULT false;
ALTER TABLE public.sms_messages ALTER COLUMN is_demo SET NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN is_demo SET DEFAULT false;
ALTER TABLE public.support_tickets ALTER COLUMN is_demo SET NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_user_demo_created_idx
  ON public.notifications (user_id, is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_messages_recipient_demo_created_idx
  ON public.admin_messages (recipient_id, is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS email_send_log_demo_created_idx
  ON public.email_send_log (is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS sms_messages_demo_created_idx
  ON public.sms_messages (is_demo, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_demo_created_idx
  ON public.support_tickets (user_id, is_demo, created_at DESC);

CREATE OR REPLACE FUNCTION public.normalize_communication_data_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'notifications' THEN
    NEW.is_demo := COALESCE(NEW.is_demo, false)
      OR COALESCE(lower(NEW.metadata ->> 'demo') = 'true', false);
  ELSIF TG_TABLE_NAME = 'email_send_log' THEN
    NEW.is_demo := COALESCE(NEW.is_demo, false)
      OR COALESCE(lower(NEW.metadata ->> 'demo') = 'true', false)
      OR lower(NEW.recipient_email) LIKE '%@replacefinder.test';
  ELSIF TG_TABLE_NAME = 'admin_messages' THEN
    NEW.is_demo := COALESCE(NEW.is_demo, false)
      OR lower(NEW.recipient_email) LIKE '%@replacefinder.test';
  ELSIF TG_TABLE_NAME = 'support_tickets' THEN
    NEW.is_demo := COALESCE(NEW.is_demo, false) OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = NEW.user_id
        AND lower(COALESCE(p.email, '')) LIKE '%@replacefinder.test'
    );
  ELSIF TG_TABLE_NAME = 'sms_messages' THEN
    NEW.is_demo := COALESCE(NEW.is_demo, false) OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE lower(COALESCE(p.email, '')) LIKE '%@replacefinder.test'
        AND right(regexp_replace(COALESCE(p.phone, ''), '[^0-9]', '', 'g'), 10)
          = right(regexp_replace(NEW.to_number, '[^0-9]', '', 'g'), 10)
        AND length(regexp_replace(NEW.to_number, '[^0-9]', '', 'g')) >= 10
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_communication_data_scope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notifications_data_scope ON public.notifications;
CREATE TRIGGER trg_notifications_data_scope
BEFORE INSERT OR UPDATE OF metadata, is_demo ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.normalize_communication_data_scope();

DROP TRIGGER IF EXISTS trg_admin_messages_data_scope ON public.admin_messages;
CREATE TRIGGER trg_admin_messages_data_scope
BEFORE INSERT OR UPDATE OF recipient_email, is_demo ON public.admin_messages
FOR EACH ROW EXECUTE FUNCTION public.normalize_communication_data_scope();

DROP TRIGGER IF EXISTS trg_email_send_log_data_scope ON public.email_send_log;
CREATE TRIGGER trg_email_send_log_data_scope
BEFORE INSERT OR UPDATE OF recipient_email, metadata, is_demo ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.normalize_communication_data_scope();

DROP TRIGGER IF EXISTS trg_sms_messages_data_scope ON public.sms_messages;
CREATE TRIGGER trg_sms_messages_data_scope
BEFORE INSERT OR UPDATE OF to_number, is_demo ON public.sms_messages
FOR EACH ROW EXECUTE FUNCTION public.normalize_communication_data_scope();

DROP TRIGGER IF EXISTS trg_support_tickets_data_scope ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_data_scope
BEFORE INSERT OR UPDATE OF user_id, is_demo ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.normalize_communication_data_scope();

CREATE OR REPLACE FUNCTION public.guard_match_data_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_demo boolean;
  v_seller_demo boolean;
BEGIN
  SELECT is_demo INTO v_buyer_demo FROM public.exchanges WHERE id = NEW.buyer_exchange_id;
  SELECT is_demo INTO v_seller_demo FROM public.pledged_properties WHERE id = NEW.seller_property_id;
  IF v_buyer_demo IS NULL OR v_seller_demo IS NULL THEN
    RAISE EXCEPTION 'match data-scope roots are missing' USING ERRCODE = '23503';
  END IF;
  IF v_buyer_demo IS DISTINCT FROM v_seller_demo THEN
    RAISE EXCEPTION 'live and demo records cannot be matched' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_match_data_scope() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_matches_guard_data_scope ON public.matches;
CREATE TRIGGER trg_matches_guard_data_scope
BEFORE INSERT OR UPDATE OF buyer_exchange_id, seller_property_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.guard_match_data_scope();

CREATE OR REPLACE FUNCTION public.guard_connection_data_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_buyer_exchange uuid;
  v_match_seller_property uuid;
  v_buyer_demo boolean;
  v_seller_demo boolean;
BEGIN
  SELECT m.buyer_exchange_id, m.seller_property_id
    INTO v_match_buyer_exchange, v_match_seller_property
  FROM public.matches m
  WHERE m.id = NEW.match_id;

  IF v_match_buyer_exchange IS NULL OR v_match_seller_property IS NULL THEN
    RAISE EXCEPTION 'connection match is missing' USING ERRCODE = '23503';
  END IF;
  IF NEW.buyer_exchange_id IS DISTINCT FROM v_match_buyer_exchange THEN
    RAISE EXCEPTION 'connection buyer exchange does not match its opportunity' USING ERRCODE = '23514';
  END IF;
  IF NEW.seller_exchange_id IS NOT NULL AND NEW.seller_exchange_id = NEW.buyer_exchange_id THEN
    RAISE EXCEPTION 'connection cannot use the same exchange on both sides' USING ERRCODE = '23514';
  END IF;

  SELECT e.is_demo INTO v_buyer_demo
  FROM public.exchanges e
  WHERE e.id = NEW.buyer_exchange_id;
  SELECT p.is_demo INTO v_seller_demo
  FROM public.pledged_properties p
  WHERE p.id = v_match_seller_property;
  IF v_buyer_demo IS NULL OR v_seller_demo IS NULL THEN
    RAISE EXCEPTION 'connection data-scope roots are missing' USING ERRCODE = '23503';
  END IF;
  IF v_buyer_demo IS DISTINCT FROM v_seller_demo THEN
    RAISE EXCEPTION 'live and demo records cannot share a connection' USING ERRCODE = '23514';
  END IF;
  IF NEW.seller_exchange_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.exchanges se
    WHERE se.id = NEW.seller_exchange_id
      AND se.is_demo = v_buyer_demo
  ) THEN
    RAISE EXCEPTION 'seller exchange is outside the connection workspace' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_connection_data_scope() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_connections_guard_data_scope ON public.exchange_connections;
CREATE TRIGGER trg_connections_guard_data_scope
BEFORE INSERT OR UPDATE OF match_id, buyer_exchange_id, seller_exchange_id ON public.exchange_connections
FOR EACH ROW EXECUTE FUNCTION public.guard_connection_data_scope();

DO $integrity$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.exchanges bx ON bx.id = m.buyer_exchange_id
    JOIN public.pledged_properties sp ON sp.id = m.seller_property_id
    WHERE bx.is_demo IS DISTINCT FROM sp.is_demo
  ) THEN
    RAISE EXCEPTION 'existing cross-workspace matches must be resolved before enabling the admin boundary';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.exchange_connections c
    JOIN public.matches m ON m.id = c.match_id
    JOIN public.exchanges bx ON bx.id = c.buyer_exchange_id
    JOIN public.pledged_properties sp ON sp.id = m.seller_property_id
    LEFT JOIN public.exchanges sx ON sx.id = c.seller_exchange_id
    WHERE c.buyer_exchange_id IS DISTINCT FROM m.buyer_exchange_id
       OR bx.is_demo IS DISTINCT FROM sp.is_demo
       OR (c.seller_exchange_id IS NOT NULL AND sx.is_demo IS DISTINCT FROM bx.is_demo)
  ) THEN
    RAISE EXCEPTION 'existing cross-workspace connections must be resolved before enabling the admin boundary';
  END IF;
END;
$integrity$;

DO $repair$
DECLARE
  v_function regprocedure;
  v_definition text;
  v_old_validation text := $old$
  IF v_data_scope = 'all' THEN v_data_scope := NULL; END IF;
  IF v_data_scope IS NOT NULL AND v_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be all, live, or demo' USING ERRCODE = '22023';
  END IF;
$old$;
  v_new_validation text := $new$
  IF v_data_scope IS NULL OR v_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'data scope must be live or demo' USING ERRCODE = '22023';
  END IF;
$new$;
BEGIN
  v_function := to_regprocedure(
    'public.admin_list_communications(uuid,text,text,text,text,integer,integer)'
  );
  IF v_function IS NULL THEN
    RAISE EXCEPTION 'admin_list_communications does not exist';
  END IF;
  SELECT pg_get_functiondef(v_function) INTO v_definition;

  IF position(v_old_validation IN v_definition) > 0 THEN
    v_definition := replace(v_definition, v_old_validation, v_new_validation);
  ELSIF position('data scope must be live or demo' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_communications has unexpected scope validation';
  END IF;

  v_definition := replace(v_definition,
    'COALESCE(lower(n.metadata ->> ''demo'') = ''true'', false)', 'n.is_demo');
  v_definition := replace(v_definition,
    'lower(am.recipient_email) LIKE ''%@replacefinder.test''', 'am.is_demo');
  v_definition := replace(v_definition,
    'lower(el.recipient_email) LIKE ''%@replacefinder.test''', 'el.is_demo');
  v_definition := replace(v_definition,
    'lower(COALESCE(sp.email, '''')) LIKE ''%@replacefinder.test''', 'sm.is_demo');
  v_definition := replace(v_definition,
    'lower(COALESCE(up.email, '''')) LIKE ''%@replacefinder.test''', 'st.is_demo');

  IF position('n.is_demo' IN v_definition) = 0
    OR position('am.is_demo' IN v_definition) = 0
    OR position('el.is_demo' IN v_definition) = 0
    OR position('sm.is_demo' IN v_definition) = 0
    OR position('st.is_demo' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'admin_list_communications scope repair was incomplete';
  END IF;

  EXECUTE v_definition;
END;
$repair$;

ALTER FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_communications(
  uuid, text, text, text, text, integer, integer
) TO authenticated;

NOTIFY pgrst, 'reload schema';

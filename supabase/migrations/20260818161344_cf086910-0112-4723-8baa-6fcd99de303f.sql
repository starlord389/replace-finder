ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS notify_listing_inquiry boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_weekly_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_account_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_product_updates boolean NOT NULL DEFAULT true;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_status text;

CREATE INDEX IF NOT EXISTS notifications_email_pending_idx
  ON public.notifications (created_at)
  WHERE emailed_at IS NULL;

CREATE OR REPLACE FUNCTION public.notification_pref_key(_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _type IN ('new_match', 'match', 'match_recommendation') THEN 'notify_new_match'
    WHEN _type IN ('connection_request', 'representation_required', 'representation_invite',
                   'agent_contact_request', 'connection_intent') THEN 'notify_connection_request'
    WHEN _type IN ('connection_accepted', 'representation_accepted', 'connection_started',
                   'representation_assigned') THEN 'notify_connection_accepted'
    WHEN _type IN ('client_agent_message', 'message', 'new_message') THEN 'notify_new_message'
    WHEN _type IN ('investor_inquiry', 'investor_inquiry_response', 'listing_inquiry')
      THEN 'notify_listing_inquiry'
    WHEN _type IN ('deadline', 'deadline_reminder') THEN 'notify_deadline_reminder'
    WHEN _type = 'weekly_digest' THEN 'notify_weekly_digest'
    WHEN _type IN ('exchange_activated', 'account_update') THEN 'notify_account_updates'
    WHEN _type = 'product_update' THEN 'notify_product_updates'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.email_pref_allows(_user_id uuid, _key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  IF _key IS NULL THEN
    RETURN true;
  END IF;

  EXECUTE format(
    'SELECT %I FROM public.user_notification_preferences WHERE user_id = $1',
    _key
  ) INTO v_allowed USING _user_id;

  RETURN COALESCE(v_allowed, true);
EXCEPTION
  WHEN undefined_column THEN
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.email_pref_allows(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_pref_allows(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_notification_emails(_limit integer DEFAULT 25)
RETURNS TABLE (
  notification_id uuid,
  recipient_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_link text,
  notification_metadata jsonb,
  recipient_email text,
  recipient_first_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT n.id
    FROM public.notifications n
    WHERE n.emailed_at IS NULL
      AND n.created_at > now() - interval '24 hours'
      AND COALESCE((n.metadata->>'demo')::boolean, false) = false
      AND public.email_pref_allows(n.user_id, public.notification_pref_key(n.type))
    ORDER BY n.created_at
    LIMIT GREATEST(COALESCE(_limit, 25), 1)
    FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.notifications n
    SET emailed_at = now(), email_status = 'claimed'
    FROM candidates c
    WHERE n.id = c.id
    RETURNING n.id, n.user_id, n.type, n.title, n.message, n.link_to, n.metadata
  )
  SELECT c.id, c.user_id, c.type, c.title, c.message, c.link_to, c.metadata,
         p.email, p.first_name
  FROM claimed c
  LEFT JOIN public.profiles p ON p.id = c.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_emails(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_notification_emails(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.skip_opted_out_notification_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH skipped AS (
    UPDATE public.notifications n
    SET emailed_at = now(), email_status = 'skipped_preference'
    WHERE n.emailed_at IS NULL
      AND n.created_at > now() - interval '24 hours'
      AND (
        COALESCE((n.metadata->>'demo')::boolean, false) = true
        OR NOT public.email_pref_allows(n.user_id, public.notification_pref_key(n.type))
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM skipped;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.skip_opted_out_notification_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.skip_opted_out_notification_emails() TO service_role;

CREATE OR REPLACE FUNCTION public.mark_notification_email(_notification_id uuid, _status text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notifications
  SET email_status = _status,
      emailed_at = CASE WHEN _status = 'retry' THEN NULL ELSE now() END
  WHERE id = _notification_id;
$$;

REVOKE ALL ON FUNCTION public.mark_notification_email(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_email(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.queue_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link_to)
  VALUES (
    NEW.id,
    'welcome',
    'Welcome to 1031ExchangeUp',
    'Your account is ready. Set up your first exchange or listing so Exchange IQ can start monitoring for opportunities.',
    '/'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_queue_welcome_notification ON public.profiles;
CREATE TRIGGER trg_queue_welcome_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_welcome_notification();
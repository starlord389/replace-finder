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
         p.email,
         NULLIF(split_part(COALESCE(p.full_name, ''), ' ', 1), '')
  FROM claimed c
  LEFT JOIN public.profiles p ON p.id = c.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_emails(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_emails(integer) TO service_role;
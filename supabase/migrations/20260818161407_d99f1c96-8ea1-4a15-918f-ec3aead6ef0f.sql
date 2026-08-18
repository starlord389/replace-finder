REVOKE ALL ON FUNCTION public.queue_welcome_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notification_pref_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notification_pref_key(text) TO service_role;
REVOKE ALL ON FUNCTION public.claim_notification_emails(integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.skip_opted_out_notification_emails() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notification_email(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.email_pref_allows(uuid, text) FROM anon;
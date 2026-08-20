CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_kind text;
BEGIN
  SELECT coalesce(u.raw_user_meta_data->>'role', 'investor')
    INTO v_role
    FROM auth.users u
   WHERE u.id = NEW.id;

  v_kind := CASE WHEN v_role = 'agent' THEN 'agent_signup' ELSE 'investor_signup' END;

  PERFORM net.http_post(
    url := 'https://mosuewptjslfrcibjtwc.supabase.co/functions/v1/notify-admin-signup',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vld3B0anNsZnJjaWJqdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDcyNDQsImV4cCI6MjA5MDI4MzI0NH0.o9wZGKJ3TXYSSNVNLhcNsk8Ju7s_qC4zYCEDNVAlysc", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vld3B0anNsZnJjaWJqdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDcyNDQsImV4cCI6MjA5MDI4MzI0NH0.o9wZGKJ3TXYSSNVNLhcNsk8Ju7s_qC4zYCEDNVAlysc"}'::jsonb,
    body := jsonb_build_object('kind', v_kind, 'idempotencySuffix', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_new_signup ON public.profiles;
CREATE TRIGGER trg_notify_admin_new_signup
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_signup();
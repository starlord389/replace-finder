CREATE OR REPLACE FUNCTION public.notify_admin_intake_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text := TG_ARGV[0];
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vld3B0anNsZnJjaWJqdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDcyNDQsImV4cCI6MjA5MDI4MzI0NH0.o9wZGKJ3TXYSSNVNLhcNsk8Ju7s_qC4zYCEDNVAlysc';
  v_body jsonb;
BEGIN
  IF v_kind = 'landlord_referral' THEN
    v_body := jsonb_build_object('kind', v_kind, 'referralId', NEW.id::text);
  ELSE
    v_body := jsonb_build_object('kind', v_kind, 'recordId', NEW.id::text);
  END IF;

  PERFORM net.http_post(
    url := 'https://mosuewptjslfrcibjtwc.supabase.co/functions/v1/notify-admin-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_key,
      'Authorization', 'Bearer ' || v_key
    ),
    body := v_body
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admin_intake_record() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_intake_record() FROM anon;
REVOKE ALL ON FUNCTION public.notify_admin_intake_record() FROM authenticated;

DROP TRIGGER IF EXISTS trg_notify_admin_demo_request ON public.demo_requests;
CREATE TRIGGER trg_notify_admin_demo_request AFTER INSERT ON public.demo_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_intake_record('demo_request');

DROP TRIGGER IF EXISTS trg_notify_admin_event_registration ON public.event_registrations;
CREATE TRIGGER trg_notify_admin_event_registration AFTER INSERT ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_intake_record('event_registration');

DROP TRIGGER IF EXISTS trg_notify_admin_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_notify_admin_support_ticket AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_intake_record('support_ticket');

DROP TRIGGER IF EXISTS trg_notify_admin_listing_inquiry ON public.listing_inquiries;
CREATE TRIGGER trg_notify_admin_listing_inquiry AFTER INSERT ON public.listing_inquiries
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_intake_record('listing_inquiry');

DROP TRIGGER IF EXISTS trg_notify_admin_referral ON public.referrals;
CREATE TRIGGER trg_notify_admin_referral AFTER INSERT ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_intake_record('landlord_referral');
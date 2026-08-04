CREATE TABLE IF NOT EXISTS public.sms_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consented boolean NOT NULL DEFAULT false,
  phone text,
  consented_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_subscriptions TO authenticated;
GRANT ALL ON public.sms_subscriptions TO service_role;

ALTER TABLE public.sms_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sms subscription"
ON public.sms_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sms subscriptions"
ON public.sms_subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_sms_subscriptions_set_updated_at
BEFORE UPDATE ON public.sms_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_my_sms_consent(p_consented boolean, p_phone text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.sms_subscriptions (user_id, consented, phone, consented_at, revoked_at)
  VALUES (
    v_uid,
    COALESCE(p_consented, false),
    NULLIF(btrim(COALESCE(p_phone, '')), ''),
    CASE WHEN p_consented THEN now() END,
    CASE WHEN p_consented THEN NULL ELSE now() END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET consented = EXCLUDED.consented,
      phone = COALESCE(EXCLUDED.phone, public.sms_subscriptions.phone),
      consented_at = CASE WHEN EXCLUDED.consented THEN COALESCE(public.sms_subscriptions.consented_at, now()) ELSE public.sms_subscriptions.consented_at END,
      revoked_at = CASE WHEN EXCLUDED.consented THEN NULL ELSE now() END,
      updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_my_sms_consent(boolean, text) TO authenticated;

ALTER TABLE public.demo_requests ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;
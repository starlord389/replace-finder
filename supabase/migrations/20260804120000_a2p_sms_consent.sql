-- A2P 10DLC consent evidence and user-controlled SMS subscription state.

CREATE TABLE IF NOT EXISTS public.sms_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 7 AND 40),
  consented boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  opted_out_at timestamptz,
  source text NOT NULL,
  disclosure_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (consented AND consented_at IS NOT NULL AND opted_out_at IS NULL)
    OR
    (NOT consented AND opted_out_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.sms_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 7 AND 40),
  action text NOT NULL CHECK (action IN ('opt_in', 'opt_out')),
  source text NOT NULL,
  disclosure_version text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_consent_events_user_occurred
  ON public.sms_consent_events(user_id, occurred_at DESC);

DROP TRIGGER IF EXISTS set_sms_subscriptions_updated_at ON public.sms_subscriptions;
CREATE TRIGGER set_sms_subscriptions_updated_at
  BEFORE UPDATE ON public.sms_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sms_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own SMS subscription" ON public.sms_subscriptions;
CREATE POLICY "Users read own SMS subscription"
  ON public.sms_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read SMS subscriptions" ON public.sms_subscriptions;
CREATE POLICY "Admins read SMS subscriptions"
  ON public.sms_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users read own SMS consent history" ON public.sms_consent_events;
CREATE POLICY "Users read own SMS consent history"
  ON public.sms_consent_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read SMS consent history" ON public.sms_consent_events;
CREATE POLICY "Admins read SMS consent history"
  ON public.sms_consent_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT ON public.sms_subscriptions, public.sms_consent_events TO authenticated;
GRANT ALL ON public.sms_subscriptions, public.sms_consent_events TO service_role;

CREATE OR REPLACE FUNCTION public.set_my_sms_consent(
  p_consented boolean,
  p_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_phone text;
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_phone := NULLIF(btrim(p_phone), '');
  IF v_phone IS NULL THEN
    SELECT phone INTO v_phone
    FROM public.sms_subscriptions
    WHERE user_id = v_user_id;
  END IF;

  IF v_phone IS NULL OR char_length(v_phone) NOT BETWEEN 7 AND 40 THEN
    RAISE EXCEPTION 'A valid mobile number is required';
  END IF;

  INSERT INTO public.sms_subscriptions (
    user_id, phone, consented, consented_at, opted_out_at, source, disclosure_version
  )
  VALUES (
    v_user_id,
    v_phone,
    p_consented,
    CASE WHEN p_consented THEN v_now ELSE NULL END,
    CASE WHEN p_consented THEN NULL ELSE v_now END,
    'account_settings',
    '2026-08-04'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    consented = EXCLUDED.consented,
    consented_at = CASE
      WHEN EXCLUDED.consented THEN v_now
      ELSE public.sms_subscriptions.consented_at
    END,
    opted_out_at = CASE WHEN EXCLUDED.consented THEN NULL ELSE v_now END,
    source = EXCLUDED.source,
    disclosure_version = EXCLUDED.disclosure_version;

  INSERT INTO public.sms_consent_events (
    user_id, phone, action, source, disclosure_version, occurred_at
  )
  VALUES (
    v_user_id,
    v_phone,
    CASE WHEN p_consented THEN 'opt_in' ELSE 'opt_out' END,
    'account_settings',
    '2026-08-04',
    v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_sms_consent(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_sms_consent(boolean, text) TO authenticated;

ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source text,
  ADD COLUMN IF NOT EXISTS sms_consent_disclosure_version text;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source text,
  ADD COLUMN IF NOT EXISTS sms_consent_disclosure_version text;

CREATE OR REPLACE FUNCTION public.capture_public_form_sms_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
BEGIN
  v_phone := NULLIF(btrim(to_jsonb(NEW)->>TG_ARGV[0]), '');

  IF NEW.sms_consent THEN
    IF v_phone IS NULL OR char_length(v_phone) NOT BETWEEN 7 AND 40 THEN
      RAISE EXCEPTION 'A valid mobile number is required for SMS consent';
    END IF;
    NEW.sms_consent_at := now();
    NEW.sms_consent_source := TG_ARGV[1];
    NEW.sms_consent_disclosure_version := '2026-08-04';
  ELSE
    NEW.sms_consent_at := NULL;
    NEW.sms_consent_source := NULL;
    NEW.sms_consent_disclosure_version := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_public_form_sms_consent() FROM PUBLIC;

DROP TRIGGER IF EXISTS capture_demo_request_sms_consent ON public.demo_requests;
CREATE TRIGGER capture_demo_request_sms_consent
  BEFORE INSERT ON public.demo_requests
  FOR EACH ROW EXECUTE FUNCTION public.capture_public_form_sms_consent('phone', 'demo_request');

DROP TRIGGER IF EXISTS capture_referral_sms_consent ON public.referrals;
CREATE TRIGGER capture_referral_sms_consent
  BEFORE INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.capture_public_form_sms_consent('owner_phone', 'property_owner_referral');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role public.app_role;
  v_phone text;
  v_now timestamptz := now();
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('agent', 'client', 'investor')
      THEN (NEW.raw_user_meta_data->>'role')::public.app_role
    ELSE 'agent'::public.app_role
  END;
  v_phone := NULLIF(btrim(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (id, email, full_name, phone, company, mls_number, license_state, brokerage_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(v_phone, ''),
    NULLIF(NEW.raw_user_meta_data->>'company', ''),
    NULLIF(NEW.raw_user_meta_data->>'mls_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'license_state', ''),
    NULLIF(NEW.raw_user_meta_data->>'brokerage_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF NEW.raw_user_meta_data->>'sms_consent' = 'true' AND v_phone IS NOT NULL THEN
    INSERT INTO public.sms_subscriptions (
      user_id, phone, consented, consented_at, opted_out_at, source, disclosure_version
    )
    VALUES (
      NEW.id,
      v_phone,
      true,
      v_now,
      NULL,
      CASE WHEN v_role = 'investor' THEN 'investor_signup' ELSE 'agent_signup' END,
      '2026-08-04'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      phone = EXCLUDED.phone,
      consented = true,
      consented_at = EXCLUDED.consented_at,
      opted_out_at = NULL,
      source = EXCLUDED.source,
      disclosure_version = EXCLUDED.disclosure_version;

    INSERT INTO public.sms_consent_events (
      user_id, phone, action, source, disclosure_version, occurred_at
    )
    VALUES (
      NEW.id,
      v_phone,
      'opt_in',
      CASE WHEN v_role = 'investor' THEN 'investor_signup' ELSE 'agent_signup' END,
      '2026-08-04',
      v_now
    );
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';

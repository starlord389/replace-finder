REVOKE EXECUTE ON FUNCTION public.set_my_sms_consent(boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_sms_consent(boolean, text) TO authenticated;
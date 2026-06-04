
-- 1. Replace handle_new_user with metadata-complete, conflict-safe version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, mls_number, license_state, brokerage_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'mls_number', ''),
    NULLIF(NEW.raw_user_meta_data->>'license_state', ''),
    NULLIF(NEW.raw_user_meta_data->>'brokerage_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'agent'::public.app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Bind handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Exchanges: deadline calc (runs first by name) then status transitions
DROP TRIGGER IF EXISTS trg_exchanges_auto_deadlines ON public.exchanges;
CREATE TRIGGER trg_exchanges_auto_deadlines
  BEFORE INSERT OR UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.auto_calculate_deadlines();

DROP TRIGGER IF EXISTS trg_exchanges_auto_status ON public.exchanges;
CREATE TRIGGER trg_exchanges_auto_status
  BEFORE INSERT OR UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.auto_exchange_status();

-- 4. updated_at triggers on all 11 tables with updated_at
DROP TRIGGER IF EXISTS trg_agent_clients_set_updated_at ON public.agent_clients;
CREATE TRIGGER trg_agent_clients_set_updated_at
  BEFORE UPDATE ON public.agent_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_invites_set_updated_at ON public.client_invites;
CREATE TRIGGER trg_client_invites_set_updated_at
  BEFORE UPDATE ON public.client_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_exchange_connections_set_updated_at ON public.exchange_connections;
CREATE TRIGGER trg_exchange_connections_set_updated_at
  BEFORE UPDATE ON public.exchange_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_exchanges_set_updated_at ON public.exchanges;
CREATE TRIGGER trg_exchanges_set_updated_at
  BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_matches_set_updated_at ON public.matches;
CREATE TRIGGER trg_matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pledged_properties_set_updated_at ON public.pledged_properties;
CREATE TRIGGER trg_pledged_properties_set_updated_at
  BEFORE UPDATE ON public.pledged_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_property_financials_set_updated_at ON public.property_financials;
CREATE TRIGGER trg_property_financials_set_updated_at
  BEFORE UPDATE ON public.property_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_replacement_criteria_set_updated_at ON public.replacement_criteria;
CREATE TRIGGER trg_replacement_criteria_set_updated_at
  BEFORE UPDATE ON public.replacement_criteria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_support_tickets_set_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_set_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_notification_preferences_set_updated_at ON public.user_notification_preferences;
CREATE TRIGGER trg_user_notification_preferences_set_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

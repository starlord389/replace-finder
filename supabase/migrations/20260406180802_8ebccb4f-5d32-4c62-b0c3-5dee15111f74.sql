
CREATE OR REPLACE FUNCTION public.is_exchange_agent(_exchange_id uuid, _user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exchanges WHERE id = _exchange_id AND agent_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

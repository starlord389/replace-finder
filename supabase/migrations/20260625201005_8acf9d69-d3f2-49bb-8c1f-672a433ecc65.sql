DROP TRIGGER IF EXISTS trigger_auto_exchange_status ON public.exchanges;
DROP TRIGGER IF EXISTS trg_exchanges_auto_status ON public.exchanges;

CREATE OR REPLACE FUNCTION public.auto_exchange_status()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
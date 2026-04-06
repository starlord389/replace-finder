
CREATE OR REPLACE FUNCTION public.auto_exchange_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'draft' AND NEW.relinquished_property_id IS NOT NULL AND NEW.criteria_id IS NOT NULL THEN
    NEW.status := 'active';
  END IF;

  IF NEW.status = 'active' AND NEW.sale_close_date IS NOT NULL AND (OLD IS NULL OR OLD.sale_close_date IS NULL) THEN
    NEW.status := 'in_identification';
  END IF;

  IF NEW.status = 'in_closing' AND NEW.actual_close_date IS NOT NULL AND (OLD IS NULL OR OLD.actual_close_date IS NULL) THEN
    NEW.status := 'completed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_exchange_status
  BEFORE UPDATE ON public.exchanges
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_exchange_status();

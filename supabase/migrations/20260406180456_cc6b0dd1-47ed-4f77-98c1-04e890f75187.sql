
CREATE OR REPLACE FUNCTION public.auto_calculate_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sale_close_date IS NOT NULL AND (OLD IS NULL OR OLD.sale_close_date IS NULL OR NEW.sale_close_date != OLD.sale_close_date) THEN
    NEW.identification_deadline := NEW.sale_close_date + INTERVAL '45 days';
    NEW.closing_deadline := NEW.sale_close_date + INTERVAL '180 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_deadlines
  BEFORE INSERT OR UPDATE ON public.exchanges
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_deadlines();

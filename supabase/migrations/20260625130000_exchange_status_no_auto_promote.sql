-- QA #6: stop auto_exchange_status from silently promoting draft -> active.
--
-- Exchange status is now set explicitly by the app: create-exchange / update-exchange
-- write 'active' when the agent activates and 'draft' otherwise, the connection
-- lifecycle writes 'completed', and the demo seeder sets status directly. The old
-- auto-promotion (draft -> active once a property + criteria existed) fought the
-- "save as draft" flow and, paired with create-exchange hardcoding status='draft',
-- contributed to activated listings reading as Draft. Make the trigger function a
-- no-op (it keeps no column references, so it is robust to any dropped date columns).
CREATE OR REPLACE FUNCTION public.auto_exchange_status()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

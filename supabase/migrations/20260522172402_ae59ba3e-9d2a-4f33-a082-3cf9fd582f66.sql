
-- Round 1 demolition: drop legacy client-portal schema and unused tables.
-- CASCADE removes dependent policies, indexes, and foreign keys.

DROP TABLE IF EXISTS public.exchange_request_status_history CASCADE;
DROP TABLE IF EXISTS public.exchange_request_preferences CASCADE;
DROP TABLE IF EXISTS public.matched_property_access CASCADE;
DROP TABLE IF EXISTS public.match_results CASCADE;
DROP TABLE IF EXISTS public.match_runs CASCADE;
DROP TABLE IF EXISTS public.exchange_requests CASCADE;

DROP TABLE IF EXISTS public.inventory_documents CASCADE;
DROP TABLE IF EXISTS public.inventory_images CASCADE;
DROP TABLE IF EXISTS public.inventory_financials CASCADE;
DROP TABLE IF EXISTS public.inventory_source_metadata CASCADE;
DROP TABLE IF EXISTS public.inventory_properties CASCADE;

DROP TABLE IF EXISTS public.dst_properties CASCADE;
DROP TABLE IF EXISTS public.admin_notes CASCADE;

-- Drop legacy enums only used by the dropped tables.
DROP TYPE IF EXISTS public.request_status CASCADE;
DROP TYPE IF EXISTS public.inventory_status CASCADE;
DROP TYPE IF EXISTS public.match_run_status CASCADE;
DROP TYPE IF EXISTS public.match_result_status CASCADE;

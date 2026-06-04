-- Phase 3: Wipe all operational/test data. Preserves auth.users, profiles, user_roles, app_settings.
DELETE FROM public.messages;
DELETE FROM public.exchange_connections;
DELETE FROM public.matches;
DELETE FROM public.exchange_timeline;
DELETE FROM public.identification_list;
DELETE FROM public.property_financials;
DELETE FROM public.property_images;
DELETE FROM public.property_documents;
-- Null FK refs so we can delete properties + criteria without orphaning exchanges
UPDATE public.exchanges SET relinquished_property_id = NULL, criteria_id = NULL;
DELETE FROM public.pledged_properties;
DELETE FROM public.replacement_criteria;
DELETE FROM public.exchanges;
DELETE FROM public.agent_clients;
DELETE FROM public.notifications;
DELETE FROM public.client_invites;
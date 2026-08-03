-- Investor accounts are a first-class, non-privileged application role.
-- This enum change lives in its own migration because PostgreSQL requires a
-- commit before a newly-added enum value can be used by later statements.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'investor';

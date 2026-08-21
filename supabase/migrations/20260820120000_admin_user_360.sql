-- Admin user-360 read model and guarded account commands.
--
-- This migration is intentionally additive. It does not rewrite, delete, or
-- backfill marketplace data. Existing ownership and representation tables stay
-- canonical; these RPCs only give administrators a safe, server-side way to
-- search users and discover the records connected to one account.

CREATE TABLE IF NOT EXISTS public.admin_account_states (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  previous_verification_status text
    CHECK (previous_verification_status IS NULL OR previous_verification_status IN ('pending', 'verified')),
  suspended_at timestamptz,
  suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suspension_reason text CHECK (suspension_reason IS NULL OR char_length(suspension_reason) <= 2000),
  reactivated_at timestamptz,
  reactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_account_states ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_account_states FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.admin_account_states TO authenticated;
GRANT ALL ON public.admin_account_states TO service_role;

DROP POLICY IF EXISTS "Admins can read account states" ON public.admin_account_states;
CREATE POLICY "Admins can read account states"
ON public.admin_account_states FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_admin_account_states_updated_at ON public.admin_account_states;
CREATE TRIGGER trg_admin_account_states_updated_at
BEFORE UPDATE ON public.admin_account_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Suspension must be a database access control, not just a badge in the UI.
-- Profiles and roles remain readable so the application can render the locked
-- account screen; all other RLS-protected public data is hidden, and writes to
-- every RLS-protected public table are denied, while the account is suspended.
CREATE OR REPLACE FUNCTION public.is_account_active(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = p_user_id AND u.deleted_at IS NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = p_user_id AND u.banned_until IS NOT NULL AND u.banned_until > now()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_account_states aas
      WHERE aas.user_id = p_user_id AND aas.account_status = 'suspended'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = p_user_id AND p.verification_status = 'suspended'
    );
$$;

REVOKE ALL ON FUNCTION public.is_account_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active(uuid) TO authenticated, service_role;

-- PostgREST executes this before table reads and RPC calls. It closes the gap
-- left by older SECURITY DEFINER functions that authenticate a caller but do
-- not yet call has_role/is_account_active themselves. A suspended account may
-- still read only its own profile and role rows so the app can render a locked
-- account state; the existing table policies continue to scope those reads.
CREATE OR REPLACE FUNCTION public.enforce_active_account_request()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := COALESCE(auth.role(), '');
  v_path text := COALESCE(current_setting('request.path', true), '');
BEGIN
  IF v_uid IS NULL OR v_role IN ('anon', 'service_role') THEN
    RETURN;
  END IF;

  IF NOT public.is_account_active(v_uid)
     AND v_path NOT IN ('/profiles', '/user_roles') THEN
    RAISE EXCEPTION 'account access is suspended or unavailable'
      USING ERRCODE = '42501', HINT = 'ACCOUNT_INACTIVE';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_active_account_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enforce_active_account_request() TO anon, authenticated, service_role;
ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.enforce_active_account_request';

-- Supabase Storage is a separate API and does not run the PostgREST pre-request
-- hook. Restrictive policies make the same access-state rule apply to every
-- current and future bucket without changing bucket-specific ownership rules.
DROP POLICY IF EXISTS "Active accounts can read storage objects" ON storage.objects;
CREATE POLICY "Active accounts can read storage objects"
ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can insert storage objects" ON storage.objects;
CREATE POLICY "Active accounts can insert storage objects"
ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can update storage objects" ON storage.objects;
CREATE POLICY "Active accounts can update storage objects"
ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (public.is_account_active(auth.uid()))
WITH CHECK (public.is_account_active(auth.uid()));

DROP POLICY IF EXISTS "Active accounts can delete storage objects" ON storage.objects;
CREATE POLICY "Active accounts can delete storage objects"
ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.is_account_active(auth.uid()));

-- Make the central role predicate suspension-aware. Most SECURITY DEFINER
-- commands already authorize through has_role/is_verified_agent, so this also
-- closes those command paths for a suspended account.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_account_active(_user_id)
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id AND ur.role = _role
    );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DO $$
DECLARE
  v_table record;
BEGIN
  FOR v_table IN
    SELECT t.tablename
    FROM pg_catalog.pg_tables t
    WHERE t.schemaname = 'public' AND t.rowsecurity
  LOOP
    IF v_table.tablename NOT IN ('profiles', 'user_roles') THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'Active accounts can read', v_table.tablename
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_account_active(auth.uid()))',
        'Active accounts can read', v_table.tablename
      );
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      'Active accounts can insert', v_table.tablename
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_account_active(auth.uid()))',
      'Active accounts can insert', v_table.tablename
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      'Active accounts can update', v_table.tablename
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_account_active(auth.uid())) WITH CHECK (public.is_account_active(auth.uid()))',
      'Active accounts can update', v_table.tablename
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      'Active accounts can delete', v_table.tablename
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_account_active(auth.uid()))',
      'Active accounts can delete', v_table.tablename
    );
  END LOOP;
END;
$$;

-- Inactive callers need their own profile and role rows to render the locked
-- account screen, but must not retain counterpart visibility granted by the
-- normal permissive relationship policies.
DROP POLICY IF EXISTS "Active accounts or owners can read profiles" ON public.profiles;
CREATE POLICY "Active accounts or owners can read profiles"
ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_account_active(auth.uid()) OR id = auth.uid());

DROP POLICY IF EXISTS "Active accounts or owners can read roles" ON public.user_roles;
CREATE POLICY "Active accounts or owners can read roles"
ON public.user_roles AS RESTRICTIVE FOR SELECT TO authenticated
USING (public.is_account_active(auth.uid()) OR user_id = auth.uid());

-- The legacy client invitation path predates the representation workflow and
-- never received an admin read policy. It remains part of the historical and
-- active user record, so user-360 must be able to display it.
DROP POLICY IF EXISTS "Admins can read all client invites" ON public.client_invites;
CREATE POLICY "Admins can read all client invites"
ON public.client_invites FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Indexes used by the user detail relationship graph. All are additive and do
-- not alter the meaning of existing records.
-- The live schema already carries these nullable historical-participant ids,
-- but the older migration chain never declared them. Keep fresh/preview
-- environments aligned with production before creating their indexes.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS buyer_agent_id uuid,
  ADD COLUMN IF NOT EXISTS seller_agent_id uuid;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc
  ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_match_created
  ON public.exchange_connections (match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_buyer_agent_created
  ON public.matches (buyer_agent_id, created_at DESC)
  WHERE buyer_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_seller_agent_created
  ON public.matches (seller_agent_id, created_at DESC)
  WHERE seller_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_representation_invites_representation_created
  ON public.representation_invites (representation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_match_recommendations_agent_created
  ON public.agent_match_recommendations (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_match_recommendations_investor_created
  ON public.agent_match_recommendations (investor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_match_recommendations_exchange_created
  ON public.agent_match_recommendations (exchange_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_agent_threads_investor_updated
  ON public.client_agent_threads (investor_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_agent_threads_agent_updated
  ON public.client_agent_threads (agent_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_agent_messages_thread_created
  ON public.client_agent_messages (thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_intents_waiting_exchange_status
  ON public.agent_connection_intents (waiting_exchange_id, status, last_requested_at);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_property_created
  ON public.listing_inquiries (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_invites_accepted_user_created
  ON public.client_invites (accepted_user_id, created_at DESC)
  WHERE accepted_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_invites_email_lower_created
  ON public.client_invites (lower(email), created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search text DEFAULT NULL,
  p_role public.app_role DEFAULT NULL,
  p_verification_status text DEFAULT NULL,
  p_account_status text DEFAULT NULL,
  p_data_scope text DEFAULT NULL,
  p_sort text DEFAULT 'recent',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  company text,
  brokerage_name text,
  license_number text,
  license_state text,
  mls_number text,
  years_experience integer,
  profile_photo_url text,
  verification_status text,
  account_status text,
  roles public.app_role[],
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  auth_created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  banned_until timestamptz,
  auth_deleted_at timestamptz,
  is_test_account boolean,
  client_count bigint,
  live_client_count bigint,
  demo_client_count bigint,
  managed_client_count bigint,
  linked_client_count bigint,
  exchange_count bigint,
  live_exchange_count bigint,
  demo_exchange_count bigint,
  agent_managed_exchange_count bigint,
  investor_owned_exchange_count bigint,
  represented_exchange_count bigint,
  linked_client_exchange_count bigint,
  direct_property_count bigint,
  property_count bigint,
  live_property_count bigint,
  demo_property_count bigint,
  match_count bigint,
  live_match_count bigint,
  demo_match_count bigint,
  buyer_side_match_count bigint,
  seller_side_match_count bigint,
  has_live_data boolean,
  has_demo_data boolean,
  total_count bigint,
  filtered_agent_count bigint,
  filtered_investor_count bigint,
  filtered_attention_count bigint,
  platform_total_count bigint,
  platform_agent_count bigint,
  platform_investor_count bigint,
  platform_attention_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_search text := lower(btrim(COALESCE(p_search, '')));
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_fast_path boolean := (p_data_scope IS NULL OR p_data_scope = 'live')
    AND COALESCE(p_sort, 'recent') IN ('recent', 'name');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_verification_status IS NOT NULL AND p_verification_status NOT IN ('pending', 'verified', 'suspended') THEN
    RAISE EXCEPTION 'invalid verification status' USING ERRCODE = '22023';
  END IF;
  IF p_account_status IS NOT NULL AND p_account_status NOT IN ('active', 'suspended', 'deleted') THEN
    RAISE EXCEPTION 'invalid account status' USING ERRCODE = '22023';
  END IF;
  IF p_data_scope IS NOT NULL AND p_data_scope NOT IN ('live', 'demo') THEN
    RAISE EXCEPTION 'invalid data scope' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(p_sort, 'recent') NOT IN ('recent', 'name', 'activity') THEN
    RAISE EXCEPTION 'invalid directory sort' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      u.id,
      COALESCE(
        NULLIF(btrim(p.full_name), ''),
        NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(btrim(u.email), ''),
        'Unnamed user'
      ) AS display_name,
      COALESCE(NULLIF(btrim(p.email), ''), u.email) AS display_email,
      COALESCE(NULLIF(btrim(p.phone), ''), u.phone) AS display_phone,
      p.company,
      p.brokerage_name,
      p.license_number,
      p.license_state,
      p.mls_number,
      p.years_experience,
      p.profile_photo_url,
      COALESCE(p.verification_status, 'pending') AS profile_verification_status,
      CASE
        WHEN u.deleted_at IS NOT NULL THEN 'deleted'
        WHEN s.account_status = 'suspended'
          OR p.verification_status = 'suspended'
          OR (u.banned_until IS NOT NULL AND u.banned_until > now()) THEN 'suspended'
        ELSE 'active'
      END AS effective_account_status,
      p.created_at AS p_created_at,
      p.updated_at AS p_updated_at,
      u.created_at AS u_created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      u.phone_confirmed_at,
      u.banned_until,
      u.deleted_at AS u_deleted_at,
      lower(COALESCE(p.email, u.email, '')) LIKE '%@replacefinder.test' AS test_account
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.admin_account_states s ON s.user_id = u.id
  ),
  -- Identity, role, and account filters do not depend on the relationship
  -- graph. Keep their exact totals ahead of candidate selection so recent/name
  -- pages can avoid evaluating the graph for users that will not be returned.
  identity_raw AS (
    SELECT
      b.*,
      COALESCE(role_summary.roles, ARRAY[]::public.app_role[]) AS user_roles
    FROM base b
    LEFT JOIN LATERAL (
      SELECT array_agg(ur.role ORDER BY ur.role::text) AS roles
      FROM public.user_roles ur
      WHERE ur.user_id = b.id
    ) role_summary ON true
  ), identity_stats AS (
    SELECT
      ir.*,
      count(*) OVER () AS platform_total_count,
      count(*) FILTER (
        WHERE 'agent'::public.app_role = ANY(ir.user_roles)
      ) OVER () AS platform_agent_count,
      count(*) FILTER (
        WHERE 'investor'::public.app_role = ANY(ir.user_roles)
      ) OVER () AS platform_investor_count,
      count(*) FILTER (
        WHERE ir.effective_account_status <> 'active'
           OR (
             'agent'::public.app_role = ANY(ir.user_roles)
             AND ir.profile_verification_status <> 'verified'
           )
      ) OVER () AS platform_attention_count
    FROM identity_raw ir
  ), identity_filtered AS (
    SELECT
      e.*,
      count(*) OVER () AS identity_matched_count,
      count(*) FILTER (
        WHERE 'agent'::public.app_role = ANY(e.user_roles)
      ) OVER () AS identity_filtered_agent_count,
      count(*) FILTER (
        WHERE 'investor'::public.app_role = ANY(e.user_roles)
      ) OVER () AS identity_filtered_investor_count,
      count(*) FILTER (
        WHERE e.effective_account_status <> 'active'
           OR (
             'agent'::public.app_role = ANY(e.user_roles)
             AND e.profile_verification_status <> 'verified'
           )
      ) OVER () AS identity_filtered_attention_count
    FROM identity_stats e
    WHERE (
        v_search = ''
        OR lower(e.display_name) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.display_email, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.company, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.brokerage_name, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.display_phone, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.license_number, '')) LIKE '%' || v_search || '%'
        OR lower(COALESCE(e.mls_number, '')) LIKE '%' || v_search || '%'
      )
      AND (p_role IS NULL OR p_role = ANY(e.user_roles))
      AND (
        p_verification_status IS NULL
        OR (
          'agent'::public.app_role = ANY(e.user_roles)
          AND e.profile_verification_status = p_verification_status
        )
      )
      AND (
        p_account_status IS NULL
        OR e.effective_account_status = p_account_status
      )
      AND (
        p_data_scope IS DISTINCT FROM 'live'
        OR NOT e.test_account
      )
  ), fast_candidates AS (
    SELECT f.*
    FROM identity_filtered f
    WHERE v_fast_path
    ORDER BY
      CASE WHEN COALESCE(p_sort, 'recent') = 'name'
        THEN lower(f.display_name) END ASC NULLS LAST,
      CASE WHEN COALESCE(p_sort, 'recent') = 'recent'
        THEN COALESCE(f.p_created_at, f.u_created_at) END DESC NULLS LAST,
      f.id
    LIMIT v_limit OFFSET v_offset
  ),
  -- Activity ordering and live/demo filters depend on relationship counts, so
  -- only those requests retain the full identity-filtered candidate set.
  slow_candidates AS (
    SELECT f.*
    FROM identity_filtered f
    WHERE NOT v_fast_path
  ), candidates AS (
    SELECT f.* FROM fast_candidates f
    UNION ALL
    SELECT s.* FROM slow_candidates s
  ), enriched_raw AS (
    SELECT
      b.*,
      COALESCE(relationship_summary.client_count, 0) AS client_count,
      COALESCE(relationship_summary.live_client_count, 0) AS live_client_count,
      COALESCE(relationship_summary.demo_client_count, 0) AS demo_client_count,
      COALESCE(relationship_summary.managed_client_count, 0) AS managed_client_count,
      COALESCE(relationship_summary.linked_client_count, 0) AS linked_client_count,
      COALESCE(relationship_summary.exchange_count, 0) AS exchange_count,
      COALESCE(relationship_summary.live_exchange_count, 0) AS live_exchange_count,
      COALESCE(relationship_summary.demo_exchange_count, 0) AS demo_exchange_count,
      COALESCE(relationship_summary.agent_managed_exchange_count, 0) AS agent_managed_exchange_count,
      COALESCE(relationship_summary.investor_owned_exchange_count, 0) AS investor_owned_exchange_count,
      COALESCE(relationship_summary.represented_exchange_count, 0) AS represented_exchange_count,
      COALESCE(relationship_summary.linked_client_exchange_count, 0) AS linked_client_exchange_count,
      COALESCE(relationship_summary.direct_property_count, 0) AS direct_property_count,
      COALESCE(relationship_summary.property_count, 0) AS property_count,
      COALESCE(relationship_summary.live_property_count, 0) AS live_property_count,
      COALESCE(relationship_summary.demo_property_count, 0) AS demo_property_count,
      COALESCE(relationship_summary.match_count, 0) AS match_count,
      COALESCE(relationship_summary.live_match_count, 0) AS live_match_count,
      COALESCE(relationship_summary.demo_match_count, 0) AS demo_match_count,
      COALESCE(relationship_summary.buyer_side_match_count, 0) AS buyer_side_match_count,
      COALESCE(relationship_summary.seller_side_match_count, 0) AS seller_side_match_count,
      COALESCE(relationship_summary.has_live_data, false) AS has_live_data,
      (COALESCE(relationship_summary.has_demo_data, false) OR b.test_account) AS has_demo_data
    FROM candidates b
    LEFT JOIN LATERAL (
      WITH related_clients AS (
        SELECT DISTINCT ac.id, ac.is_demo, ac.agent_id, ac.client_user_id
        FROM public.agent_clients ac
        WHERE ac.agent_id = b.id OR ac.client_user_id = b.id
      ), related_exchanges AS (
        SELECT DISTINCT e.id, e.is_demo, e.owner_type, e.client_id, e.relinquished_property_id
        FROM public.exchanges e
        WHERE e.agent_id = b.id
           OR e.client_id IN (SELECT rc.id FROM related_clients rc)
           OR e.id IN (
             SELECT a.exchange_id
             FROM public.exchange_agent_assignments a
             WHERE a.status = 'active'
               AND (a.agent_id = b.id OR a.investor_id = b.id)
           )
      ), related_properties AS (
        SELECT DISTINCT pp.id, pp.is_demo
        FROM public.pledged_properties pp
        WHERE pp.agent_id = b.id
           OR pp.exchange_id IN (SELECT re.id FROM related_exchanges re)
           OR pp.id IN (
             SELECT re.relinquished_property_id
             FROM related_exchanges re
             WHERE re.relinquished_property_id IS NOT NULL
           )
      ), related_matches AS (
        SELECT DISTINCT
          m.id,
          (COALESCE(be.is_demo, false) OR COALESCE(sp.is_demo, false)) AS is_demo,
          (
            m.buyer_agent_id = b.id
            OR m.buyer_exchange_id IN (SELECT re.id FROM related_exchanges re)
          ) AS buyer_side,
          (
            m.seller_agent_id = b.id
            OR m.seller_property_id IN (SELECT rp.id FROM related_properties rp)
          ) AS seller_side
        FROM public.matches m
        LEFT JOIN public.exchanges be ON be.id = m.buyer_exchange_id
        LEFT JOIN public.pledged_properties sp ON sp.id = m.seller_property_id
        WHERE m.buyer_agent_id = b.id OR m.seller_agent_id = b.id
           OR m.buyer_exchange_id IN (SELECT re.id FROM related_exchanges re)
           OR m.seller_property_id IN (SELECT rp.id FROM related_properties rp)
      ), counts AS (
        SELECT
          (SELECT count(*) FROM related_clients) AS client_count,
          (SELECT count(*) FROM related_clients rc WHERE NOT rc.is_demo) AS live_client_count,
          (SELECT count(*) FROM related_clients rc WHERE rc.is_demo) AS demo_client_count,
          (SELECT count(*) FROM related_clients rc WHERE rc.agent_id = b.id) AS managed_client_count,
          (SELECT count(*) FROM related_clients rc WHERE rc.client_user_id = b.id) AS linked_client_count,
          (SELECT count(*) FROM related_exchanges) AS exchange_count,
          (SELECT count(*) FROM related_exchanges re WHERE NOT re.is_demo) AS live_exchange_count,
          (SELECT count(*) FROM related_exchanges re WHERE re.is_demo) AS demo_exchange_count,
          (SELECT count(*) FROM related_exchanges re WHERE re.owner_type = 'agent') AS agent_managed_exchange_count,
          (SELECT count(*) FROM related_exchanges re WHERE re.owner_type = 'investor') AS investor_owned_exchange_count,
          (
            SELECT count(DISTINCT a.exchange_id)
            FROM public.exchange_agent_assignments a
            WHERE a.agent_id = b.id AND a.status = 'active'
          ) AS represented_exchange_count,
          (
            SELECT count(*)
            FROM related_exchanges re
            JOIN public.agent_clients ac ON ac.id = re.client_id
            WHERE ac.client_user_id = b.id
          ) AS linked_client_exchange_count,
          (SELECT count(*) FROM public.pledged_properties pp WHERE pp.agent_id = b.id) AS direct_property_count,
          (SELECT count(*) FROM related_properties) AS property_count,
          (SELECT count(*) FROM related_properties rp WHERE NOT rp.is_demo) AS live_property_count,
          (SELECT count(*) FROM related_properties rp WHERE rp.is_demo) AS demo_property_count,
          (SELECT count(*) FROM related_matches) AS match_count,
          (SELECT count(*) FROM related_matches rm WHERE NOT rm.is_demo) AS live_match_count,
          (SELECT count(*) FROM related_matches rm WHERE rm.is_demo) AS demo_match_count,
          (SELECT count(*) FROM related_matches rm WHERE rm.buyer_side) AS buyer_side_match_count,
          (SELECT count(*) FROM related_matches rm WHERE rm.seller_side) AS seller_side_match_count
      )
      SELECT
        c.*,
        (c.live_client_count + c.live_exchange_count + c.live_property_count + c.live_match_count > 0) AS has_live_data,
        (c.demo_client_count + c.demo_exchange_count + c.demo_property_count + c.demo_match_count > 0) AS has_demo_data
      FROM counts c
    ) relationship_summary ON true
  ), data_filtered AS (
    SELECT
      e.*,
      count(*) OVER () AS data_matched_count,
      count(*) FILTER (
        WHERE 'agent'::public.app_role = ANY(e.user_roles)
      ) OVER () AS data_filtered_agent_count,
      count(*) FILTER (
        WHERE 'investor'::public.app_role = ANY(e.user_roles)
      ) OVER () AS data_filtered_investor_count,
      count(*) FILTER (
        WHERE e.effective_account_status <> 'active'
           OR (
             'agent'::public.app_role = ANY(e.user_roles)
             AND e.profile_verification_status <> 'verified'
           )
      ) OVER () AS data_filtered_attention_count
    FROM enriched_raw e
    WHERE (
        p_data_scope IS NULL
        -- Live is the real-account directory, not merely the subset that has
        -- already created workspace records. Keeping zero-activity signups in
        -- this scope is essential for onboarding and drop-off analysis.
        OR (p_data_scope = 'live' AND NOT e.test_account)
        OR (p_data_scope = 'demo' AND e.has_demo_data)
      )
  ), paged AS (
    SELECT
      f.*,
      CASE WHEN v_fast_path
        THEN f.identity_matched_count ELSE f.data_matched_count END AS matched_count,
      CASE WHEN v_fast_path
        THEN f.identity_filtered_agent_count ELSE f.data_filtered_agent_count END AS filtered_agent_count,
      CASE WHEN v_fast_path
        THEN f.identity_filtered_investor_count ELSE f.data_filtered_investor_count END AS filtered_investor_count,
      CASE WHEN v_fast_path
        THEN f.identity_filtered_attention_count ELSE f.data_filtered_attention_count END AS filtered_attention_count
    FROM data_filtered f
    ORDER BY
      CASE WHEN COALESCE(p_sort, 'recent') = 'name'
        THEN lower(f.display_name) END ASC NULLS LAST,
      CASE WHEN COALESCE(p_sort, 'recent') = 'activity'
        THEN f.client_count + f.exchange_count + f.property_count + f.match_count
        END DESC NULLS LAST,
      CASE WHEN COALESCE(p_sort, 'recent') IN ('recent', 'activity')
        THEN COALESCE(f.p_created_at, f.u_created_at) END DESC NULLS LAST,
      f.id
    LIMIT v_limit OFFSET CASE WHEN v_fast_path THEN 0 ELSE v_offset END
  )
  SELECT
    pg.id,
    pg.display_name,
    pg.display_email,
    pg.display_phone,
    pg.company,
    pg.brokerage_name,
    pg.license_number,
    pg.license_state,
    pg.mls_number,
    pg.years_experience,
    pg.profile_photo_url,
    pg.profile_verification_status,
    pg.effective_account_status,
    pg.user_roles,
    pg.p_created_at,
    pg.p_updated_at,
    pg.u_created_at,
    pg.last_sign_in_at,
    pg.email_confirmed_at,
    pg.phone_confirmed_at,
    pg.banned_until,
    pg.u_deleted_at,
    pg.test_account,
    pg.client_count,
    pg.live_client_count,
    pg.demo_client_count,
    pg.managed_client_count,
    pg.linked_client_count,
    pg.exchange_count,
    pg.live_exchange_count,
    pg.demo_exchange_count,
    pg.agent_managed_exchange_count,
    pg.investor_owned_exchange_count,
    pg.represented_exchange_count,
    pg.linked_client_exchange_count,
    pg.direct_property_count,
    pg.property_count,
    pg.live_property_count,
    pg.demo_property_count,
    pg.match_count,
    pg.live_match_count,
    pg.demo_match_count,
    pg.buyer_side_match_count,
    pg.seller_side_match_count,
    pg.has_live_data,
    pg.has_demo_data,
    pg.matched_count,
    pg.filtered_agent_count,
    pg.filtered_investor_count,
    pg.filtered_attention_count,
    pg.platform_total_count,
    pg.platform_agent_count,
    pg.platform_investor_count,
    pg.platform_attention_count
  FROM paged pg;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, public.app_role, text, text, text, text, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, public.app_role, text, text, text, text, integer, integer)
  TO authenticated;

-- Lightweight account totals for the command center. This deliberately avoids
-- the relationship graph used by the directory so the header can refresh
-- frequently without scanning every client, exchange, property, and match.
CREATE OR REPLACE FUNCTION public.admin_get_account_summary()
RETURNS TABLE (
  total_accounts bigint,
  agent_accounts bigint,
  investor_accounts bigint,
  new_accounts_7d bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint,
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'agent'::public.app_role
    ))::bigint,
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'investor'::public.app_role
    ))::bigint,
    count(*) FILTER (WHERE u.created_at >= now() - interval '7 days')::bigint
  FROM auth.users u;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_account_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_account_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_user_overview(p_user_id uuid)
RETURNS TABLE (
  profile jsonb,
  roles public.app_role[],
  auth_account jsonb,
  account_state jsonb,
  counts jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  WITH related_exchanges AS (
    SELECT e.id
    FROM public.exchanges e
    WHERE e.agent_id = p_user_id
    UNION
    SELECT e.id
    FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = p_user_id
    UNION
    SELECT a.exchange_id
    FROM public.exchange_agent_assignments a
    WHERE a.agent_id = p_user_id OR a.investor_id = p_user_id
  ), related_properties AS (
    SELECT pp.id
    FROM public.pledged_properties pp
    WHERE pp.agent_id = p_user_id
    UNION
    SELECT pp.id
    FROM public.pledged_properties pp
    JOIN related_exchanges re ON re.id = pp.exchange_id
  ), related_matches AS (
    SELECT m.id
    FROM public.matches m
    WHERE m.buyer_agent_id = p_user_id OR m.seller_agent_id = p_user_id
    UNION
    SELECT m.id
    FROM public.matches m
    JOIN related_exchanges re ON re.id = m.buyer_exchange_id
    UNION
    SELECT m.id
    FROM public.matches m
    JOIN related_properties rp ON rp.id = m.seller_property_id
  ), role_summary AS (
    SELECT COALESCE(array_agg(ur.role ORDER BY ur.role::text), ARRAY[]::public.app_role[]) AS values
    FROM public.user_roles ur WHERE ur.user_id = p_user_id
  )
  SELECT
    COALESCE(to_jsonb(p), '{}'::jsonb),
    rs.values,
    jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'phone', u.phone,
      'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'email_confirmed_at', u.email_confirmed_at,
      'phone_confirmed_at', u.phone_confirmed_at,
      'banned_until', u.banned_until,
      'deleted_at', u.deleted_at
    ),
    jsonb_build_object(
      'account_status', CASE
        WHEN u.deleted_at IS NOT NULL THEN 'deleted'
        WHEN aas.account_status = 'suspended'
          OR p.verification_status = 'suspended'
          OR (u.banned_until IS NOT NULL AND u.banned_until > now()) THEN 'suspended'
        ELSE 'active'
      END,
      'previous_verification_status', aas.previous_verification_status,
      'suspended_at', aas.suspended_at,
      'suspended_by', aas.suspended_by,
      'suspension_reason', aas.suspension_reason,
      'reactivated_at', aas.reactivated_at,
      'reactivated_by', aas.reactivated_by
    ),
    jsonb_build_object(
      'agent_clients', (SELECT count(*) FROM public.agent_clients ac WHERE ac.agent_id = p_user_id),
      'linked_client_records', (SELECT count(*) FROM public.agent_clients ac WHERE ac.client_user_id = p_user_id),
      'related_exchanges', (SELECT count(*) FROM related_exchanges),
      'direct_properties', (SELECT count(*) FROM public.pledged_properties pp WHERE pp.agent_id = p_user_id),
      'related_properties', (SELECT count(*) FROM related_properties),
      'related_matches', (SELECT count(*) FROM related_matches),
      'representations_as_agent', (SELECT count(*) FROM public.agent_representations ar WHERE ar.agent_id = p_user_id),
      'representations_as_investor', (SELECT count(*) FROM public.agent_representations ar WHERE ar.investor_id = p_user_id),
      'active_exchange_assignments', (
        SELECT count(*) FROM public.exchange_agent_assignments a
        WHERE (a.agent_id = p_user_id OR a.investor_id = p_user_id) AND a.status = 'active'
      ),
      'contact_requests', (
        SELECT count(*) FROM public.agent_contact_requests acr
        WHERE acr.investor_id = p_user_id OR acr.representing_agent_id = p_user_id
      ),
      'match_recommendations', (
        SELECT count(*) FROM public.agent_match_recommendations amr
        WHERE amr.investor_id = p_user_id OR amr.agent_id = p_user_id
      ),
      'exchange_connections', (
        SELECT count(*) FROM public.exchange_connections ec
        WHERE ec.buyer_agent_id = p_user_id OR ec.seller_agent_id = p_user_id
          OR ec.buyer_exchange_id IN (SELECT id FROM related_exchanges)
          OR ec.seller_exchange_id IN (SELECT id FROM related_exchanges)
      ),
      'client_agent_threads', (
        SELECT count(*) FROM public.client_agent_threads cat
        WHERE cat.investor_id = p_user_id OR cat.agent_id = p_user_id
      ),
      'saved_properties', (SELECT count(*) FROM public.investor_saved_properties isp WHERE isp.investor_id = p_user_id),
      'legacy_listing_inquiries', (
        SELECT count(*) FROM public.listing_inquiries li
        WHERE li.investor_id = p_user_id OR li.listing_agent_id = p_user_id
      ),
      'notifications', (SELECT count(*) FROM public.notifications n WHERE n.user_id = p_user_id)
    )
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.admin_account_states aas ON aas.user_id = u.id
  CROSS JOIN role_summary rs
  WHERE u.id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_overview(uuid) TO authenticated;

-- Returns a paginated graph of top-level resources connected to one account.
-- Full records remain in their canonical tables and can be loaded by id using
-- the existing admin SELECT policies. Multiple edges are intentional: one user
-- can be both an owner and a participant in the same resource.
CREATE OR REPLACE FUNCTION public.admin_list_user_resources(
  p_user_id uuid,
  p_resource_type text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  resource_type text,
  resource_id uuid,
  relationship_type text,
  parent_id uuid,
  status text,
  is_demo boolean,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;
  RETURN QUERY
  WITH exchange_edges AS (
    SELECT e.id, e.status::text, e.is_demo, e.created_at, e.updated_at,
      CASE WHEN e.owner_type = 'investor' THEN 'owner' ELSE 'managing_agent' END::text AS relation
    FROM public.exchanges e WHERE e.agent_id = p_user_id
    UNION ALL
    SELECT e.id, e.status::text, e.is_demo, e.created_at, e.updated_at, 'client_participant'::text
    FROM public.exchanges e
    JOIN public.agent_clients ac ON ac.id = e.client_id
    WHERE ac.client_user_id = p_user_id
    UNION ALL
    SELECT e.id, e.status::text, e.is_demo, e.created_at, e.updated_at,
      CASE
        WHEN a.agent_id = p_user_id AND a.status = 'active' THEN 'assigned_agent'
        WHEN a.investor_id = p_user_id AND a.status = 'active' THEN 'represented_investor'
        WHEN a.agent_id = p_user_id THEN 'historical_assigned_agent'
        ELSE 'historical_represented_investor'
      END::text
    FROM public.exchange_agent_assignments a
    JOIN public.exchanges e ON e.id = a.exchange_id
    WHERE a.agent_id = p_user_id OR a.investor_id = p_user_id
  ), property_edges AS (
    SELECT pp.id, pp.exchange_id, pp.status::text, pp.is_demo, pp.created_at, pp.updated_at,
      'direct_property_account'::text AS relation
    FROM public.pledged_properties pp WHERE pp.agent_id = p_user_id
    UNION ALL
    SELECT pp.id, pp.exchange_id, pp.status::text, pp.is_demo, pp.created_at, pp.updated_at,
      'through_' || ee.relation
    FROM exchange_edges ee
    JOIN public.pledged_properties pp ON pp.exchange_id = ee.id
  ), match_edges AS (
    SELECT m.id, m.buyer_exchange_id AS parent_id, m.status, e.is_demo, m.created_at, m.updated_at,
      'buyer_side'::text AS relation
    FROM public.matches m
    JOIN public.exchanges e ON e.id = m.buyer_exchange_id
    WHERE m.buyer_agent_id = p_user_id OR m.buyer_exchange_id IN (SELECT id FROM exchange_edges)
    UNION ALL
    SELECT m.id, m.seller_property_id, m.status, pp.is_demo, m.created_at, m.updated_at, 'seller_side'::text
    FROM public.matches m
    JOIN public.pledged_properties pp ON pp.id = m.seller_property_id
    WHERE m.seller_agent_id = p_user_id OR m.seller_property_id IN (SELECT id FROM property_edges)
  ), resources(
    resource_type, resource_id, relationship_type, parent_id,
    status, is_demo, created_at, updated_at
  ) AS (
    SELECT 'client'::text, ac.id,
      CASE WHEN ac.agent_id = p_user_id THEN 'agent_of_client' ELSE 'linked_client_account' END::text,
      NULL::uuid, ac.status, ac.is_demo, ac.created_at, ac.updated_at
    FROM public.agent_clients ac
    WHERE ac.agent_id = p_user_id OR ac.client_user_id = p_user_id
    UNION ALL
    SELECT 'exchange', ee.id, ee.relation, NULL::uuid, ee.status, ee.is_demo, ee.created_at, ee.updated_at
    FROM exchange_edges ee
    UNION ALL
    SELECT 'property', pe.id, pe.relation, pe.exchange_id, pe.status, pe.is_demo, pe.created_at, pe.updated_at
    FROM property_edges pe
    UNION ALL
    SELECT 'match', me.id, me.relation, me.parent_id, me.status, me.is_demo, me.created_at, me.updated_at
    FROM match_edges me
    UNION ALL
    SELECT 'representation', ar.id,
      CASE WHEN ar.agent_id = p_user_id THEN 'agent' ELSE 'investor' END,
      ar.requested_exchange_id, ar.status, ar.is_demo, ar.created_at, ar.updated_at
    FROM public.agent_representations ar
    WHERE ar.agent_id = p_user_id OR ar.investor_id = p_user_id
    UNION ALL
    SELECT 'representation_invite', ri.id, 'representation_participant', ri.representation_id,
      ri.status, ar.is_demo, ri.created_at, ri.updated_at
    FROM public.representation_invites ri
    JOIN public.agent_representations ar ON ar.id = ri.representation_id
    WHERE ar.agent_id = p_user_id OR ar.investor_id = p_user_id
       OR ri.created_by = p_user_id OR ri.accepted_user_id = p_user_id
    UNION ALL
    SELECT 'exchange_assignment', a.id,
      CASE WHEN a.agent_id = p_user_id THEN 'assigned_agent' ELSE 'investor' END,
      a.exchange_id, a.status, e.is_demo, a.created_at, a.updated_at
    FROM public.exchange_agent_assignments a
    JOIN public.exchanges e ON e.id = a.exchange_id
    WHERE a.agent_id = p_user_id OR a.investor_id = p_user_id
    UNION ALL
    SELECT 'contact_request', acr.id,
      CASE WHEN acr.investor_id = p_user_id THEN 'investor' ELSE 'representing_agent' END,
      acr.match_id, acr.status, e.is_demo, acr.created_at, acr.updated_at
    FROM public.agent_contact_requests acr
    JOIN public.exchanges e ON e.id = acr.exchange_id
    WHERE acr.investor_id = p_user_id OR acr.representing_agent_id = p_user_id
    UNION ALL
    SELECT 'match_recommendation', amr.id,
      CASE WHEN amr.investor_id = p_user_id THEN 'investor' ELSE 'agent' END,
      amr.match_id, amr.response, e.is_demo, amr.created_at, amr.updated_at
    FROM public.agent_match_recommendations amr
    JOIN public.exchanges e ON e.id = amr.exchange_id
    WHERE amr.investor_id = p_user_id OR amr.agent_id = p_user_id
    UNION ALL
    SELECT 'connection', ec.id,
      CASE
        WHEN ec.buyer_agent_id = p_user_id THEN 'buyer_agent'
        WHEN ec.seller_agent_id = p_user_id THEN 'seller_agent'
        ELSE 'exchange_principal'
      END,
      ec.match_id, ec.status, e.is_demo, ec.created_at, ec.updated_at
    FROM public.exchange_connections ec
    JOIN public.exchanges e ON e.id = ec.buyer_exchange_id
    WHERE ec.buyer_agent_id = p_user_id OR ec.seller_agent_id = p_user_id
       OR ec.buyer_exchange_id IN (SELECT id FROM exchange_edges)
       OR ec.seller_exchange_id IN (SELECT id FROM exchange_edges)
    UNION ALL
    SELECT 'connection_intent', aci.id,
      CASE
        WHEN aci.initiating_agent_id = p_user_id THEN 'initiating_agent'
        WHEN aci.waiting_owner_id = p_user_id THEN 'waiting_owner'
        ELSE 'exchange_principal'
      END,
      aci.match_id, aci.status, aci.is_demo, aci.created_at, aci.updated_at
    FROM public.agent_connection_intents aci
    WHERE aci.initiating_agent_id = p_user_id OR aci.waiting_owner_id = p_user_id
       OR aci.waiting_exchange_id IN (SELECT id FROM exchange_edges)
    UNION ALL
    SELECT 'client_agent_thread', cat.id,
      CASE WHEN cat.agent_id = p_user_id THEN 'agent' ELSE 'investor' END,
      COALESCE(cat.match_id, cat.exchange_id, cat.representation_id), NULL::text,
      ar.is_demo, cat.created_at, cat.updated_at
    FROM public.client_agent_threads cat
    JOIN public.agent_representations ar ON ar.id = cat.representation_id
    WHERE cat.agent_id = p_user_id OR cat.investor_id = p_user_id
    UNION ALL
    SELECT 'client_invite', ci.id,
      CASE WHEN ci.agent_id = p_user_id THEN 'inviting_agent' ELSE 'invited_client' END,
      ci.client_id, ci.status, ac.is_demo, ci.created_at, ci.updated_at
    FROM public.client_invites ci
    JOIN public.agent_clients ac ON ac.id = ci.client_id
    LEFT JOIN auth.users invited_user ON invited_user.id = p_user_id
    WHERE ci.agent_id = p_user_id OR ci.accepted_user_id = p_user_id
       OR ac.client_user_id = p_user_id
       OR lower(ci.email) = lower(COALESCE(invited_user.email, ''))
    UNION ALL
    SELECT 'saved_property', isp.id, 'investor', isp.property_id, 'saved', isp.is_demo,
      isp.created_at, isp.created_at
    FROM public.investor_saved_properties isp WHERE isp.investor_id = p_user_id
    UNION ALL
    SELECT 'legacy_listing_inquiry', li.id,
      CASE WHEN li.investor_id = p_user_id THEN 'investor' ELSE 'listing_agent' END,
      li.property_id, li.status, li.is_demo, li.created_at, li.updated_at
    FROM public.listing_inquiries li
    WHERE li.investor_id = p_user_id OR li.listing_agent_id = p_user_id
    UNION ALL
    SELECT 'notification', n.id, 'recipient', NULL::uuid,
      CASE WHEN n.read THEN 'read' ELSE 'unread' END, false, n.created_at, n.created_at
    FROM public.notifications n WHERE n.user_id = p_user_id
  ), filtered_resources AS (
    SELECT DISTINCT ON (r.resource_type, r.resource_id, r.relationship_type)
      r.resource_type,
      r.resource_id,
      r.relationship_type,
      r.parent_id,
      r.status,
      r.is_demo,
      r.created_at,
      r.updated_at
    FROM resources r
    WHERE p_resource_type IS NULL OR r.resource_type = p_resource_type
    ORDER BY r.resource_type, r.resource_id, r.relationship_type, r.created_at DESC
  )
  SELECT fr.resource_type, fr.resource_id, fr.relationship_type, fr.parent_id,
    fr.status, fr.is_demo, fr.created_at, fr.updated_at, count(*) OVER ()
  FROM filtered_resources fr
  ORDER BY fr.created_at DESC, fr.resource_type, fr.resource_id
  LIMIT v_limit OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_user_resources(uuid, text, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_user_resources(uuid, text, integer, integer)
  TO authenticated;

-- Guarded role command. The table lock makes the last-admin check safe against
-- concurrent requests, and the audit row is committed in the same transaction
-- as the role change.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_enabled boolean,
  p_reason text DEFAULT NULL
)
RETURNS public.app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_changed boolean := false;
  v_roles public.app_role[];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_role IS NULL OR p_enabled IS NULL THEN
    RAISE EXCEPTION 'user, role, and enabled state are required' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id AND u.deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'roles cannot be changed for a deleted account' USING ERRCODE = '55000';
  END IF;
  IF p_reason IS NOT NULL AND char_length(p_reason) > 2000 THEN
    RAISE EXCEPTION 'reason is too long' USING ERRCODE = '22023';
  END IF;

  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;

  IF NOT p_enabled AND p_role = 'admin'::public.app_role THEN
    IF p_user_id = v_uid THEN
      RAISE EXCEPTION 'you cannot remove your own administrator role' USING ERRCODE = '42501';
    END IF;
    IF (SELECT count(*) FROM public.user_roles ur WHERE ur.role = 'admin'::public.app_role) <= 1 THEN
      RAISE EXCEPTION 'the final administrator role cannot be removed' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF p_enabled THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    v_changed := FOUND;
  ELSE
    DELETE FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role = p_role;
    v_changed := FOUND;
  END IF;

  IF v_changed THEN
    INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id, summary, metadata)
    VALUES (
      v_uid,
      CASE WHEN p_enabled THEN 'role.granted' ELSE 'role.revoked' END,
      'user', p_user_id::text,
      CASE WHEN p_enabled THEN 'Granted ' ELSE 'Revoked ' END || p_role::text || ' role',
      jsonb_build_object('role', p_role::text, 'enabled', p_enabled, 'reason', NULLIF(btrim(p_reason), ''))
    );
  END IF;

  SELECT COALESCE(array_agg(ur.role ORDER BY ur.role::text), ARRAY[]::public.app_role[])
  INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;

  RETURN v_roles;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role, boolean, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role, boolean, text)
  TO authenticated;

-- Role writes must go through the guarded command above. Signup/service-role
-- code continues to work because it runs as the function owner or service role.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
REVOKE INSERT, DELETE ON public.user_roles FROM authenticated;

-- Verification is distinct from suspension. This command keeps agent approval
-- auditable without overloading the account-status API.
CREATE OR REPLACE FUNCTION public.admin_set_agent_verification_status(
  p_user_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_previous text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'verified') THEN
    RAISE EXCEPTION 'verification status must be pending or verified' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id AND u.deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'verification cannot be changed for a deleted account' USING ERRCODE = '55000';
  END IF;
  IF p_reason IS NOT NULL AND char_length(p_reason) > 2000 THEN
    RAISE EXCEPTION 'reason is too long' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role = 'agent'::public.app_role
  ) THEN
    RAISE EXCEPTION 'only agent accounts have an agent verification status' USING ERRCODE = '22023';
  END IF;

  SELECT p.verification_status INTO v_previous
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user profile not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_previous = 'suspended'
     OR EXISTS (
       SELECT 1 FROM public.admin_account_states aas
       WHERE aas.user_id = p_user_id AND aas.account_status = 'suspended'
     ) THEN
    RAISE EXCEPTION 'reactivate the account before changing agent verification' USING ERRCODE = '55000';
  END IF;

  IF v_previous IS DISTINCT FROM p_status THEN
    PERFORM set_config('app.admin_verification_target', p_user_id::text, true);
    UPDATE public.profiles
    SET verification_status = p_status, updated_at = now()
    WHERE id = p_user_id;

    INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id, summary, metadata)
    VALUES (
      v_uid, 'agent.verification_updated', 'user', p_user_id::text,
      CASE WHEN p_status = 'verified' THEN 'Verified agent account' ELSE 'Returned agent verification to pending' END,
      jsonb_build_object(
        'previous_verification_status', v_previous,
        'new_verification_status', p_status,
        'reason', NULLIF(btrim(p_reason), '')
      )
    );
  END IF;

  RETURN p_status;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_agent_verification_status(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_agent_verification_status(uuid, text, text)
  TO authenticated;

-- Persists the pre-suspension verification state so reactivation never silently
-- promotes a pending agent. It updates the existing verification_status field
-- for compatibility with current route guards; a future auth-ban edge function
-- can consume the same admin_account_states record without changing this API.
CREATE OR REPLACE FUNCTION public.admin_set_user_account_status(
  p_user_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS TABLE (
  account_status text,
  verification_status text,
  changed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old_verification text;
  v_restore_verification text;
  v_old_account_status text;
  v_has_profile boolean := false;
  v_has_account_state boolean := false;
  v_changed boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.has_role(v_uid, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'status must be active or suspended' USING ERRCODE = '22023';
  END IF;
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'user not found' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id AND u.deleted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'deleted accounts cannot be suspended or reactivated' USING ERRCODE = '55000';
  END IF;
  IF p_reason IS NOT NULL AND char_length(p_reason) > 2000 THEN
    RAISE EXCEPTION 'reason is too long' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'suspended' AND NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'a suspension reason is required' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'suspended' AND p_user_id = v_uid THEN
    RAISE EXCEPTION 'you cannot suspend your own account' USING ERRCODE = '42501';
  END IF;

  SELECT p.verification_status INTO v_old_verification
  FROM public.profiles p
  WHERE p.id = p_user_id
  FOR UPDATE;
  v_has_profile := FOUND;
  v_old_verification := COALESCE(v_old_verification, 'pending');
  IF p_status = 'active' AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = p_user_id AND u.banned_until IS NOT NULL AND u.banned_until > now()
  ) THEN
    RAISE EXCEPTION 'remove the authentication ban before reactivating this account' USING ERRCODE = '55000';
  END IF;

  SELECT aas.account_status, aas.previous_verification_status
  INTO v_old_account_status, v_restore_verification
  FROM public.admin_account_states aas
  WHERE aas.user_id = p_user_id
  FOR UPDATE;
  v_has_account_state := FOUND;
  v_old_account_status := COALESCE(v_old_account_status,
    CASE WHEN v_old_verification = 'suspended' THEN 'suspended' ELSE 'active' END);

  IF p_status = 'suspended' THEN
    IF NOT v_has_account_state
       OR v_old_account_status <> 'suspended'
       OR (v_has_profile AND v_old_verification <> 'suspended') THEN
      INSERT INTO public.admin_account_states AS current_state(
        user_id, account_status, previous_verification_status,
        suspended_at, suspended_by, suspension_reason,
        reactivated_at, reactivated_by, updated_at
      ) VALUES (
        p_user_id, 'suspended',
        CASE WHEN v_old_verification IN ('pending', 'verified') THEN v_old_verification ELSE NULL END,
        now(), v_uid, btrim(p_reason), NULL, NULL, now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        account_status = 'suspended',
        previous_verification_status = COALESCE(
          current_state.previous_verification_status,
          EXCLUDED.previous_verification_status
        ),
        suspended_at = now(), suspended_by = v_uid,
        suspension_reason = btrim(p_reason),
        reactivated_at = NULL, reactivated_by = NULL, updated_at = now();

      IF v_has_profile THEN
        PERFORM set_config('app.admin_account_status_target', p_user_id::text, true);
        UPDATE public.profiles SET verification_status = 'suspended', updated_at = now()
        WHERE id = p_user_id;
      END IF;
      v_changed := true;
    END IF;
  ELSE
    IF v_old_account_status <> 'active' OR v_old_verification = 'suspended' THEN
      v_restore_verification := CASE
        WHEN v_restore_verification IN ('pending', 'verified') THEN v_restore_verification
        ELSE 'pending'
      END;

      INSERT INTO public.admin_account_states AS current_state(
        user_id, account_status, previous_verification_status,
        reactivated_at, reactivated_by, updated_at
      ) VALUES (
        p_user_id, 'active', NULL, now(), v_uid, now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        account_status = 'active', previous_verification_status = NULL,
        reactivated_at = now(), reactivated_by = v_uid, updated_at = now();

      IF v_has_profile THEN
        PERFORM set_config('app.admin_account_status_target', p_user_id::text, true);
        UPDATE public.profiles SET verification_status = v_restore_verification, updated_at = now()
        WHERE id = p_user_id;
      END IF;
      v_changed := true;
    END IF;
  END IF;

  IF v_changed THEN
    INSERT INTO public.admin_audit_log(actor_id, action, entity_type, entity_id, summary, metadata)
    VALUES (
      v_uid,
      CASE WHEN p_status = 'suspended' THEN 'account.suspended' ELSE 'account.reactivated' END,
      'user', p_user_id::text,
      CASE WHEN p_status = 'suspended' THEN 'Suspended user account' ELSE 'Reactivated user account' END,
      jsonb_build_object(
        'account_status', p_status,
        'previous_verification_status', v_old_verification,
        'new_verification_status', CASE WHEN p_status = 'suspended' THEN 'suspended' ELSE v_restore_verification END,
        'reason', NULLIF(btrim(p_reason), '')
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p_status,
    CASE
      WHEN p_status = 'suspended' THEN 'suspended'
      ELSE COALESCE((SELECT p.verification_status FROM public.profiles p WHERE p.id = p_user_id), v_restore_verification, 'pending')
    END,
    v_changed
  ;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_account_status(uuid, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_account_status(uuid, text, text)
  TO authenticated;

-- Keep the existing self-service profile editor, but require every privileged
-- verification or suspension transition to use its audited command above.
CREATE OR REPLACE FUNCTION public.guard_profile_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND auth.uid() IS NOT NULL THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'verification_status can only be changed by an administrator';
    END IF;

    IF (NEW.verification_status = 'suspended' OR OLD.verification_status = 'suspended')
       AND current_setting('app.admin_account_status_target', true) IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'suspension changes must use admin_set_user_account_status';
    END IF;

    IF NEW.verification_status <> 'suspended'
       AND OLD.verification_status <> 'suspended'
       AND current_setting('app.admin_verification_target', true) IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'verification changes must use admin_set_agent_verification_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_verification ON public.profiles;
CREATE TRIGGER trg_profiles_guard_verification
BEFORE UPDATE OF verification_status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_status();

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- RLS verification for migration 20260624130000_gate_property_address_visibility.
--
-- HOW TO RUN: apply the migration first, then paste this whole file into the
-- Supabase SQL editor (it connects as the privileged `postgres` role) and run it.
-- It seeds three throwaway users + one private active listing, checks every
-- viewer angle, and ROLLS BACK -- it leaves no data behind. A successful run
-- prints "(a)..(d) PASS" notices; any failure raises and aborts.
--
-- It proves:
--   (a) a logged-in agent who is NOT the owner, NOT an admin, and NOT connected
--       cannot read the street address -- not from the base table (0 rows) and
--       not from the view (address comes back NULL). This is the closed leak.
--   (b) the owner still sees the real address.
--   (c) an admin still sees the real address.
--   (d) flipping address_is_public = true reveals it to other agents (the toggle
--       works end-to-end through the database, not just the UI).
--
-- Note on connections: the view intentionally has NO connection-based reveal,
-- matching the app UI (AgentConnectionDetail passes agent_id === user.id, so a
-- connected buyer-side agent only sees the street if the owner published it).
-- That is enforced by construction -- the view SQL never references
-- exchange_connections / users_share_active_connection -- so case (a) holds even
-- for a connected counterparty.

BEGIN;

-- ---- seed (runs as postgres, bypassing RLS) ---------------------------------
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'owner@test.local',  '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'viewer@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'admin@test.local',  '', now(), now());

INSERT INTO public.user_roles (user_id, role)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'admin'::public.app_role);

INSERT INTO public.pledged_properties (id, agent_id, status, address, address_is_public, city, state)
VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'active', '123 Secret St', false, 'Austin', 'TX');

-- Carry the listing id across role switches (transaction-scoped GUC).
SELECT set_config('app.pid', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);

-- ---- (a) attacker: not owner, not admin, not connected ----------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
DO $$
DECLARE base_cnt int; v_cnt int; v_addr text;
BEGIN
  SELECT count(*) INTO base_cnt
    FROM public.pledged_properties WHERE id = current_setting('app.pid')::uuid;
  IF base_cnt <> 0 THEN
    RAISE EXCEPTION '(a) FAIL: non-owner read % base-table row(s); the direct-REST address leak is still open', base_cnt;
  END IF;

  SELECT count(*), max(address) INTO v_cnt, v_addr
    FROM public.pledged_properties_secure WHERE id = current_setting('app.pid')::uuid;
  IF v_cnt <> 1 THEN
    RAISE EXCEPTION '(a) FAIL: non-owner saw % view row(s) for an active listing (expected 1 masked row)', v_cnt;
  END IF;
  IF v_addr IS NOT NULL THEN
    RAISE EXCEPTION '(a) FAIL: non-owner read address "%" via the view (expected NULL)', v_addr;
  END IF;
  RAISE NOTICE '(a) PASS: non-owner gets 0 base rows and a NULL address through the view';
END $$;
RESET ROLE;

-- ---- (b) owner sees the real address ----------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);
DO $$
DECLARE v_addr text;
BEGIN
  SELECT address INTO v_addr
    FROM public.pledged_properties_secure WHERE id = current_setting('app.pid')::uuid;
  IF v_addr IS DISTINCT FROM '123 Secret St' THEN
    RAISE EXCEPTION '(b) FAIL: owner saw address "%" (expected "123 Secret St")', v_addr;
  END IF;
  RAISE NOTICE '(b) PASS: owner sees the real address';
END $$;
RESET ROLE;

-- ---- (c) admin sees the real address ----------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);
DO $$
DECLARE v_addr text;
BEGIN
  SELECT address INTO v_addr
    FROM public.pledged_properties_secure WHERE id = current_setting('app.pid')::uuid;
  IF v_addr IS DISTINCT FROM '123 Secret St' THEN
    RAISE EXCEPTION '(c) FAIL: admin saw address "%" (expected "123 Secret St")', v_addr;
  END IF;
  RAISE NOTICE '(c) PASS: admin sees the real address';
END $$;
RESET ROLE;

-- ---- (d) publishing the address reveals it to other agents ------------------
UPDATE public.pledged_properties
  SET address_is_public = true
  WHERE id = current_setting('app.pid')::uuid;   -- runs as postgres after RESET ROLE
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
DO $$
DECLARE v_addr text;
BEGIN
  SELECT address INTO v_addr
    FROM public.pledged_properties_secure WHERE id = current_setting('app.pid')::uuid;
  IF v_addr IS DISTINCT FROM '123 Secret St' THEN
    RAISE EXCEPTION '(d) FAIL: with address_is_public = true a non-owner saw "%" (expected "123 Secret St")', v_addr;
  END IF;
  RAISE NOTICE '(d) PASS: publishing the address makes it visible to other agents';
END $$;
RESET ROLE;

ROLLBACK;

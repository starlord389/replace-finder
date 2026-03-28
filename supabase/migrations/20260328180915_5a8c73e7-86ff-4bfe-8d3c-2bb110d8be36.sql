
DO $$
DECLARE
  test_user_id uuid;
  req1_id uuid := gen_random_uuid();
  req2_id uuid := gen_random_uuid();
  inv1_id uuid := gen_random_uuid();
  inv2_id uuid := gen_random_uuid();
  inv3_id uuid := gen_random_uuid();
  inv4_id uuid := gen_random_uuid();
  run1_id uuid := gen_random_uuid();
  mr1_id uuid := gen_random_uuid();
  mr2_id uuid := gen_random_uuid();
  mr3_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO test_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in profiles table. Sign up first, then run this migration.';
  END IF;

  -- 2 Exchange Requests
  INSERT INTO public.exchange_requests (id, user_id, status, relinquished_asset_type, relinquished_city, relinquished_state, relinquished_estimated_value, exchange_proceeds, estimated_equity, identification_deadline, close_deadline, urgency, relinquished_description)
  VALUES
    (req1_id, test_user_id, 'active', 'multifamily', 'San Francisco', 'CA', 4200000, 3800000, 2100000, (CURRENT_DATE + interval '45 days')::date, (CURRENT_DATE + interval '180 days')::date, 'immediate', '48-unit multifamily complex in SF Marina district. Fully stabilized, selling to capture appreciation.'),
    (req2_id, test_user_id, 'submitted', 'retail', 'Los Angeles', 'CA', 2100000, 1900000, 950000, (CURRENT_DATE + interval '60 days')::date, (CURRENT_DATE + interval '180 days')::date, 'flexible', 'Strip retail center in West LA. 3 tenants, 2 years remaining on primary lease.')
  ON CONFLICT (id) DO NOTHING;

  -- Preferences for request 1
  INSERT INTO public.exchange_request_preferences (request_id, target_price_min, target_price_max, target_asset_types, target_strategies, target_states, target_cap_rate_min, target_cap_rate_max)
  VALUES (req1_id, 3500000, 6000000, '{multifamily,net_lease}'::asset_type[], '{core,core_plus}'::strategy_type[], '{TX,AZ,FL}'::text[], 5.0, 8.0)
  ON CONFLICT (id) DO NOTHING;

  -- 4 Inventory Properties
  INSERT INTO public.inventory_properties (id, name, asset_type, strategy_type, city, state, address, zip, units, year_built, status, description)
  VALUES
    (inv1_id, 'Sunbelt 48-Unit Garden Apartments', 'multifamily', 'core', 'Phoenix', 'AZ', '4521 E Camelback Rd', '85018', 48, 2018, 'active', 'Class A garden-style apartments in Arcadia corridor. Recently renovated common areas.'),
    (inv2_id, 'DFW NNN Walgreens', 'net_lease', 'nnn', 'Dallas', 'TX', '8900 Preston Rd', '75225', 1, 2020, 'active', 'Single-tenant NNN Walgreens with 15-year absolute net lease. Zero landlord responsibilities.'),
    (inv3_id, 'Tampa Bay Flex Industrial', 'industrial', 'value_add', 'Tampa', 'FL', '2200 N Westshore Blvd', '33607', 4, 2015, 'active', 'Multi-tenant flex industrial park near Port Tampa Bay. 30% below market rents.'),
    (inv4_id, 'Austin Self-Storage Portfolio', 'self_storage', 'core_plus', 'Austin', 'TX', '1100 S Lamar Blvd', '78704', 320, 2017, 'active', 'Climate-controlled self-storage facility in South Austin. Strong population growth area.')
  ON CONFLICT (id) DO NOTHING;

  -- 4 Inventory Financials
  INSERT INTO public.inventory_financials (property_id, asking_price, cap_rate, noi, occupancy_rate, annual_revenue, annual_expenses)
  VALUES
    (inv1_id, 5200000, 6.0, 312000, 94, 520000, 208000),
    (inv2_id, 4100000, 5.5, 225500, 100, 225500, 0),
    (inv3_id, 3800000, 6.5, 247000, 97, 380000, 133000),
    (inv4_id, 2400000, 7.0, 168000, 89, 268000, 100000)
  ON CONFLICT (id) DO NOTHING;

  -- Match Run
  INSERT INTO public.match_runs (id, request_id, status, created_by, total_properties_scored, completed_at)
  VALUES (run1_id, req1_id, 'completed', test_user_id, 4, now())
  ON CONFLICT (id) DO NOTHING;

  -- 3 Match Results (approved, no client response)
  INSERT INTO public.match_results (id, match_run_id, request_id, property_id, total_score, price_score, geo_score, asset_score, strategy_score, financial_score, timing_score, status, approved_by, approved_at)
  VALUES
    (mr1_id, run1_id, req1_id, inv1_id, 92, 88, 95, 100, 90, 85, 98, 'approved', test_user_id, now() - interval '5 days'),
    (mr2_id, run1_id, req1_id, inv2_id, 87, 90, 92, 80, 95, 82, 85, 'approved', test_user_id, now() - interval '5 days'),
    (mr3_id, run1_id, req1_id, inv3_id, 78, 82, 88, 70, 75, 78, 80, 'approved', test_user_id, now() - interval '4 days')
  ON CONFLICT (id) DO NOTHING;

  -- 3 Matched Property Access rows
  INSERT INTO public.matched_property_access (request_id, property_id, match_result_id, user_id, granted_by)
  VALUES
    (req1_id, inv1_id, mr1_id, test_user_id, test_user_id),
    (req1_id, inv2_id, mr2_id, test_user_id, test_user_id),
    (req1_id, inv3_id, mr3_id, test_user_id, test_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Status History for request 1
  INSERT INTO public.exchange_request_status_history (request_id, old_status, new_status, changed_by, created_at)
  VALUES
    (req1_id, 'submitted', 'under_review', test_user_id, now() - interval '12 days'),
    (req1_id, 'under_review', 'active', test_user_id, now() - interval '9 days')
  ON CONFLICT (id) DO NOTHING;

END $$;

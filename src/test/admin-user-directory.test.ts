import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildAdminUserDirectory,
  mapAdminListUsersRow,
  normalizeAdminUserDirectoryParams,
  type AdminUserDirectorySource,
} from "@/features/admin/hooks/useAdminUserDirectory";

function source(value: Partial<AdminUserDirectorySource>): AdminUserDirectorySource {
  return {
    profiles: [],
    roles: [],
    clients: [],
    exchanges: [],
    assignments: [],
    properties: [],
    matches: [],
    ...value,
  } as AdminUserDirectorySource;
}

const profile = {
  id: "dual-user",
  full_name: "Casey Dual",
  email: "casey@example.com",
  phone: null,
  company: null,
  brokerage_name: "Dual Realty",
  license_number: "MA-101",
  license_state: "MA",
  mls_number: null,
  years_experience: 8,
  verification_status: "verified",
  profile_photo_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("admin user directory aggregation", () => {
  it("keeps dual-role, linked-client, represented, buyer, and seller relationships distinct", () => {
    const rows = buildAdminUserDirectory(source({
      profiles: [profile],
      roles: [
        { user_id: "dual-user", role: "admin" },
        { user_id: "dual-user", role: "agent" },
        { user_id: "dual-user", role: "investor" },
      ],
      clients: [
        { id: "managed-live", agent_id: "dual-user", client_user_id: null, is_demo: false },
        { id: "managed-demo", agent_id: "dual-user", client_user_id: null, is_demo: true },
        { id: "linked-live", agent_id: "other-agent", client_user_id: "dual-user", is_demo: false },
      ],
      exchanges: [
        { id: "agent-exchange", agent_id: "dual-user", client_id: "managed-live", owner_type: "agent", is_demo: false, relinquished_property_id: "agent-property" },
        { id: "owner-exchange", agent_id: "dual-user", client_id: null, owner_type: "investor", is_demo: true, relinquished_property_id: "owner-property" },
        { id: "linked-exchange", agent_id: "other-agent", client_id: "linked-live", owner_type: "agent", is_demo: false, relinquished_property_id: "linked-property" },
        { id: "represented-exchange", agent_id: "other-investor", client_id: null, owner_type: "investor", is_demo: false, relinquished_property_id: "represented-property" },
        { id: "outside-exchange", agent_id: "outside-agent", client_id: null, owner_type: "agent", is_demo: false, relinquished_property_id: null },
      ],
      assignments: [
        { exchange_id: "represented-exchange", agent_id: "dual-user", investor_id: "other-investor", status: "active" },
        // The user's demo exchange also assigns them as agent. It must still count once.
        { exchange_id: "owner-exchange", agent_id: "dual-user", investor_id: "dual-user", status: "active" },
      ],
      properties: [
        { id: "agent-property", agent_id: "dual-user", exchange_id: "agent-exchange", is_demo: false },
        { id: "owner-property", agent_id: "dual-user", exchange_id: "owner-exchange", is_demo: true },
        { id: "linked-property", agent_id: "other-agent", exchange_id: "linked-exchange", is_demo: false },
        { id: "represented-property", agent_id: "other-investor", exchange_id: "represented-exchange", is_demo: false },
        { id: "seller-listing", agent_id: "dual-user", exchange_id: null, is_demo: false },
        { id: "outside-property", agent_id: "outside-agent", exchange_id: null, is_demo: false },
      ],
      matches: [
        { id: "buyer-match", buyer_exchange_id: "agent-exchange", seller_property_id: "outside-property", buyer_agent_id: "dual-user", seller_agent_id: "outside-agent" },
        { id: "seller-match", buyer_exchange_id: "outside-exchange", seller_property_id: "seller-listing", buyer_agent_id: "outside-agent", seller_agent_id: "dual-user" },
        { id: "represented-match", buyer_exchange_id: "represented-exchange", seller_property_id: "outside-property", buyer_agent_id: "dual-user", seller_agent_id: "outside-agent" },
        { id: "demo-match", buyer_exchange_id: "owner-exchange", seller_property_id: "outside-property", buyer_agent_id: "dual-user", seller_agent_id: "outside-agent" },
      ],
    }));

    expect(rows).toHaveLength(1);
    const user = rows[0];
    expect(user.roles).toEqual(expect.arrayContaining(["admin", "agent", "investor"]));
    expect(user.clients).toMatchObject({ total: 3, live: 2, demo: 1, managed: 2, linked: 1 });
    expect(user.exchanges).toMatchObject({
      total: 4,
      live: 3,
      demo: 1,
      agentManaged: 2,
      investorOwned: 2,
      represented: 2,
      linkedClient: 1,
    });
    expect(user.properties).toMatchObject({ total: 5, live: 4, demo: 1 });
    expect(user.matches).toMatchObject({ total: 4, live: 3, demo: 1, buyerSide: 3, sellerSide: 1 });
    expect(user.hasLiveData).toBe(true);
    expect(user.hasDemoData).toBe(true);
  });

  it("follows client_user_id to the investor's agent-managed exchange and property", () => {
    const investor = { ...profile, id: "investor", full_name: "Linked Investor", email: "owner@example.com" };
    const rows = buildAdminUserDirectory(source({
      profiles: [investor],
      roles: [{ user_id: "investor", role: "investor" }],
      clients: [{ id: "client", agent_id: "agent", client_user_id: "investor", is_demo: false }],
      exchanges: [{ id: "exchange", agent_id: "agent", client_id: "client", owner_type: "agent", is_demo: false, relinquished_property_id: "property" }],
      properties: [{ id: "property", agent_id: "agent", exchange_id: "exchange", is_demo: false }],
      matches: [{ id: "match", buyer_exchange_id: "exchange", seller_property_id: "candidate", buyer_agent_id: "agent", seller_agent_id: "seller" }],
    }));

    expect(rows[0].clients).toMatchObject({ total: 1, managed: 0, linked: 1 });
    expect(rows[0].exchanges).toMatchObject({ total: 1, linkedClient: 1 });
    expect(rows[0].properties.total).toBe(1);
    expect(rows[0].matches).toMatchObject({ total: 1, buyerSide: 1, sellerSide: 0 });
  });

  it("includes inbound matches through a user's seller property even without a seller exchange", () => {
    const rows = buildAdminUserDirectory(source({
      profiles: [profile],
      properties: [{ id: "listing", agent_id: "dual-user", exchange_id: null, is_demo: false }],
      matches: [{ id: "inbound", buyer_exchange_id: "someone-elses-exchange", seller_property_id: "listing", buyer_agent_id: "buyer-agent", seller_agent_id: "dual-user" }],
    }));

    expect(rows[0].properties.total).toBe(1);
    expect(rows[0].matches).toMatchObject({ total: 1, live: 1, buyerSide: 0, sellerSide: 1 });
  });

  it("ignores revoked exchange assignments", () => {
    const rows = buildAdminUserDirectory(source({
      profiles: [profile],
      exchanges: [{ id: "exchange", agent_id: "investor", client_id: null, owner_type: "investor", is_demo: false, relinquished_property_id: null }],
      assignments: [{ exchange_id: "exchange", agent_id: "dual-user", investor_id: "investor", status: "revoked" }],
    }));

    expect(rows[0].exchanges.total).toBe(0);
  });

  it("keeps seeded demo accounts visible in the complete admin directory", () => {
    const rows = buildAdminUserDirectory(source({
      profiles: [{ ...profile, id: "seeded", email: "listing-agent@replacefinder.test" }],
    }));

    expect(rows[0]).toMatchObject({
      id: "seeded",
      isTestAccount: true,
      hasDemoData: true,
    });
  });

  it("maps auth-only users and server-computed relationship counts", () => {
    const row = mapAdminListUsersRow({
      user_id: "00000000-0000-4000-8000-000000000001",
      full_name: "auth-only@example.com",
      email: "auth-only@example.com",
      phone: null,
      company: null,
      brokerage_name: null,
      license_number: null,
      license_state: null,
      mls_number: null,
      years_experience: null,
      profile_photo_url: null,
      verification_status: "pending",
      account_status: "active",
      roles: [],
      profile_created_at: null,
      profile_updated_at: null,
      auth_created_at: "2026-08-20T12:00:00Z",
      last_sign_in_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      banned_until: null,
      auth_deleted_at: null,
      is_test_account: false,
      client_count: 1,
      live_client_count: 1,
      demo_client_count: 0,
      managed_client_count: 0,
      linked_client_count: 1,
      exchange_count: 2,
      live_exchange_count: 2,
      demo_exchange_count: 0,
      agent_managed_exchange_count: 2,
      investor_owned_exchange_count: 0,
      represented_exchange_count: 0,
      linked_client_exchange_count: 2,
      direct_property_count: 0,
      property_count: 2,
      live_property_count: 2,
      demo_property_count: 0,
      match_count: 3,
      live_match_count: 3,
      demo_match_count: 0,
      buyer_side_match_count: 3,
      seller_side_match_count: 0,
      has_live_data: true,
      has_demo_data: false,
      total_count: 1,
    } as Parameters<typeof mapAdminListUsersRow>[0]);

    expect(row).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      profileExists: false,
      created_at: "2026-08-20T12:00:00Z",
      account_status: "active",
      clients: { total: 1, linked: 1 },
      exchanges: { total: 2, linkedClient: 2 },
      properties: { total: 2 },
      matches: { total: 3, buyerSide: 3 },
    });
  });

  it("normalizes server-side filters and pagination without client-side ambiguity", () => {
    expect(normalizeAdminUserDirectoryParams({
      search: "  Elaine  ",
      role: "agent",
      verificationStatus: "pending",
      accountStatus: "active",
      dataScope: "live",
      sort: "activity",
      page: 3,
      pageSize: 25,
    })).toEqual({
      search: "Elaine",
      role: "agent",
      verificationStatus: "pending",
      accountStatus: "active",
      dataScope: "live",
      sort: "activity",
      page: 3,
      pageSize: 25,
      offset: 50,
    });
  });

  it("maps deleted auth accounts distinctly instead of presenting them as active", () => {
    const deleted = mapAdminListUsersRow({
      user_id: "00000000-0000-4000-8000-000000000002",
      full_name: "Deleted account",
      email: null,
      phone: null,
      company: null,
      brokerage_name: null,
      license_number: null,
      license_state: null,
      mls_number: null,
      years_experience: null,
      profile_photo_url: null,
      verification_status: "pending",
      account_status: "deleted",
      roles: [],
      profile_created_at: null,
      profile_updated_at: null,
      auth_created_at: "2026-08-20T12:00:00Z",
      last_sign_in_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      banned_until: null,
      auth_deleted_at: "2026-08-20T13:00:00Z",
      is_test_account: false,
      client_count: 0,
      live_client_count: 0,
      demo_client_count: 0,
      managed_client_count: 0,
      linked_client_count: 0,
      exchange_count: 0,
      live_exchange_count: 0,
      demo_exchange_count: 0,
      agent_managed_exchange_count: 0,
      investor_owned_exchange_count: 0,
      represented_exchange_count: 0,
      linked_client_exchange_count: 0,
      direct_property_count: 0,
      property_count: 0,
      live_property_count: 0,
      demo_property_count: 0,
      match_count: 0,
      live_match_count: 0,
      demo_match_count: 0,
      buyer_side_match_count: 0,
      seller_side_match_count: 0,
      has_live_data: false,
      has_demo_data: false,
      total_count: 1,
      filtered_agent_count: 0,
      filtered_investor_count: 0,
      filtered_attention_count: 1,
      platform_total_count: 1,
      platform_agent_count: 0,
      platform_investor_count: 0,
      platform_attention_count: 1,
    } as Parameters<typeof mapAdminListUsersRow>[0]);

    expect(deleted).toMatchObject({
      account_status: "deleted",
      auth_deleted_at: "2026-08-20T13:00:00Z",
    });
  });
});

describe("admin user directory RPC contract", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260820120000_admin_user_360.sql"),
    "utf8",
  );

  it("pages identity-filtered recent/name candidates before loading their relationship graph", () => {
    expect(migration).toContain("FROM auth.users u");
    expect(migration).toContain("COALESCE(p.verification_status, 'pending') AS profile_verification_status");
    expect(migration).toContain("'agent'::public.app_role = ANY(e.user_roles)");
    expect(migration).toContain("AND e.profile_verification_status = p_verification_status");
    expect(migration).toContain("p_data_scope = 'live' AND e.has_live_data");
    expect(migration).toContain("p_data_scope = 'demo' AND e.has_demo_data");
    expect(migration).toContain("COALESCE(p_sort, 'recent') = 'activity'");
    expect(migration).toContain("v_fast_path boolean := p_data_scope IS NULL");
    expect(migration).toContain("AND COALESCE(p_sort, 'recent') IN ('recent', 'name')");
    expect(migration).toContain("WHERE NOT v_fast_path");

    const identityFilter = migration.indexOf("), identity_filtered AS (");
    const fastCandidates = migration.indexOf("), fast_candidates AS (");
    const relationshipGraph = migration.indexOf("FROM candidates b");
    const fastCandidateSql = migration.slice(fastCandidates, relationshipGraph);

    expect(identityFilter).toBeGreaterThan(-1);
    expect(identityFilter).toBeLessThan(fastCandidates);
    expect(fastCandidates).toBeLessThan(relationshipGraph);
    expect(fastCandidateSql).toContain("LIMIT v_limit OFFSET v_offset");
    expect(migration).toContain("OFFSET CASE WHEN v_fast_path THEN 0 ELSE v_offset END");
  });

  it("returns exact filtered and platform totals with deleted account state", () => {
    expect(migration).toContain("WHEN u.deleted_at IS NOT NULL THEN 'deleted'");
    expect(migration).toContain("count(*) OVER () AS identity_matched_count");
    expect(migration).toContain("count(*) OVER () AS data_matched_count");
    expect(migration).toContain("THEN f.identity_matched_count ELSE f.data_matched_count END AS matched_count");
    expect(migration).toContain("count(*) OVER () AS platform_total_count");
    expect(migration).toContain("filtered_attention_count bigint");
    expect(migration).toContain("platform_attention_count bigint");
  });
});

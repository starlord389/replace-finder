import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assignmentRelationshipsForUser,
  directPropertyRelationship,
  recordMatchesScope,
  scopeAdminUser360,
  synthesizeProfileFromAuth,
  type AdminUser360,
} from "@/features/admin/hooks/useAdminUser360";

function user360(overrides: Partial<AdminUser360> = {}): AdminUser360 {
  return {
    profile: { id: "user" } as AdminUser360["profile"],
    profileExists: true,
    authAccount: null,
    accountState: null,
    overviewCounts: {},
    roles: ["agent"],
    clients: [],
    exchanges: [],
    properties: [],
    matches: [],
    contextualProperties: [],
    financialsByProperty: {},
    imagesByProperty: {},
    documentsByProperty: {},
    criteriaByExchange: {},
    clientsById: {},
    exchangesById: {},
    propertiesById: {},
    profilesById: {},
    workflowStatesByMatch: {},
    workflowEvents: [],
    representations: [],
    representationInvites: [],
    assignments: [],
    contactRequests: [],
    recommendations: [],
    connectionIntents: [],
    connections: [],
    collaborationThreads: [],
    connectionMessageMetadata: [],
    collaborationMessageMetadata: [],
    savedProperties: [],
    listingInquiries: [],
    investorPreferences: null,
    clientInvites: [],
    identificationList: [],
    notifications: [],
    supportTickets: [],
    timeline: [],
    auditLog: [],
    warnings: [],
    ...overrides,
  };
}

describe("admin user 360 relationship graph", () => {
  it("synthesizes a safe display profile for an auth account with no profile row", () => {
    const profile = synthesizeProfileFromAuth({
      id: "auth-only",
      email: "auth-only@example.com",
      phone: "+15555550100",
      created_at: "2026-08-20T12:00:00Z",
      last_sign_in_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      banned_until: null,
      deleted_at: null,
    });

    expect(profile).toMatchObject({
      id: "auth-only",
      email: "auth-only@example.com",
      phone: "+15555550100",
      verification_status: "pending",
      created_at: "2026-08-20T12:00:00Z",
    });
    expect(profile.service_areas).toEqual([]);
    expect(profile.specializations).toEqual([]);
  });

  it("does not label the investor side of an assignment as an assigned agent", () => {
    const active = { agent_id: "agent", investor_id: "owner", status: "active", revoked_at: null };
    expect(assignmentRelationshipsForUser("agent", active)).toEqual(["assigned_agent"]);
    expect(assignmentRelationshipsForUser("owner", active)).toEqual(["linked_client_account"]);

    const revoked = { ...active, status: "revoked", revoked_at: "2026-08-01T00:00:00Z" };
    expect(assignmentRelationshipsForUser("agent", revoked)).toEqual(["historical_participant"]);
    expect(assignmentRelationshipsForUser("owner", revoked)).toEqual(["historical_participant"]);
  });

  it("labels direct properties from the exchange owner type before falling back to account roles", () => {
    expect(directPropertyRelationship(["agent", "investor"], "agent")).toBe("managing_agent");
    expect(directPropertyRelationship(["agent", "investor"], "investor")).toBe("account_owner");
    expect(directPropertyRelationship(["agent"], null)).toBe("managing_agent");
    expect(directPropertyRelationship(["investor"], null)).toBe("account_owner");
  });
});

describe("admin user 360 live/demo scope", () => {
  const data = user360({
    clients: [
      { id: "client-live", is_demo: false, relationships: [] },
      { id: "client-demo", is_demo: true, relationships: [] },
    ] as AdminUser360["clients"],
    exchanges: [
      { id: "exchange-live", is_demo: false, relationships: [] },
      { id: "exchange-demo", is_demo: true, relationships: [] },
    ] as AdminUser360["exchanges"],
    properties: [
      { id: "seller-live", is_demo: false, relationships: [], contextualOnly: false },
      { id: "seller-demo", is_demo: true, relationships: [], contextualOnly: false },
    ] as AdminUser360["properties"],
    matches: [
      { id: "match-live-buyer", buyer_exchange_id: "exchange-live", seller_property_id: "outside", relationships: [] },
      { id: "match-demo-buyer", buyer_exchange_id: "exchange-demo", seller_property_id: "outside", relationships: [] },
      { id: "match-live-seller", buyer_exchange_id: "outside-live", seller_property_id: "seller-live", relationships: [] },
      { id: "match-demo-seller", buyer_exchange_id: "outside-demo", seller_property_id: "seller-demo", relationships: [] },
    ] as AdminUser360["matches"],
    representations: [
      { id: "rep-live", is_demo: false },
      { id: "rep-demo", is_demo: true },
    ] as AdminUser360["representations"],
    representationInvites: [
      { id: "rep-invite-live", representation_id: "rep-live" },
      { id: "rep-invite-demo", representation_id: "rep-demo" },
    ] as AdminUser360["representationInvites"],
    assignments: [
      { id: "assignment-live", exchange_id: "exchange-live", representation_id: "rep-live" },
      { id: "assignment-demo", exchange_id: "exchange-demo", representation_id: "rep-demo" },
    ] as AdminUser360["assignments"],
    contactRequests: [
      { id: "request-live", exchange_id: "exchange-live", match_id: "match-live-buyer", property_id: "outside" },
      { id: "request-demo", exchange_id: "exchange-demo", match_id: "match-demo-buyer", property_id: "outside" },
    ] as AdminUser360["contactRequests"],
    recommendations: [
      { id: "recommendation-live", exchange_id: "exchange-live", match_id: "match-live-buyer" },
      { id: "recommendation-demo", exchange_id: "exchange-demo", match_id: "match-demo-buyer" },
    ] as AdminUser360["recommendations"],
    connectionIntents: [
      { id: "intent-live", is_demo: false },
      { id: "intent-demo", is_demo: true },
    ] as AdminUser360["connectionIntents"],
    connections: [
      // Seller-side records must scope through match_id even when the buyer
      // exchange belongs to another account.
      { id: "connection-live", match_id: "match-live-seller", buyer_exchange_id: "outside-live", seller_exchange_id: null },
      { id: "connection-demo", match_id: "match-demo-seller", buyer_exchange_id: "outside-demo", seller_exchange_id: null },
    ] as AdminUser360["connections"],
    collaborationThreads: [
      { id: "thread-live", exchange_id: "exchange-live", match_id: null, representation_id: null },
      { id: "thread-demo", exchange_id: null, match_id: null, representation_id: "rep-demo" },
    ] as AdminUser360["collaborationThreads"],
    connectionMessageMetadata: [
      { id: "message-live", parentId: "connection-live", senderId: "a", createdAt: "", readAt: null },
      { id: "message-demo", parentId: "connection-demo", senderId: "a", createdAt: "", readAt: null },
    ],
    collaborationMessageMetadata: [
      { id: "thread-message-live", parentId: "thread-live", senderId: "a", createdAt: "", readAt: null },
      { id: "thread-message-demo", parentId: "thread-demo", senderId: "a", createdAt: "", readAt: null },
    ],
    savedProperties: [
      { id: "saved-live", is_demo: false },
      { id: "saved-demo", is_demo: true },
    ] as AdminUser360["savedProperties"],
    listingInquiries: [
      { id: "inquiry-live", is_demo: false },
      { id: "inquiry-demo", is_demo: true },
    ] as AdminUser360["listingInquiries"],
    clientInvites: [
      { id: "client-invite-live", client_id: "client-live" },
      { id: "client-invite-demo", client_id: "client-demo" },
    ] as AdminUser360["clientInvites"],
    timeline: [
      { id: "timeline-live", exchange_id: "exchange-live" },
      { id: "timeline-demo", exchange_id: "exchange-demo" },
    ] as AdminUser360["timeline"],
    workflowEvents: [
      { id: "workflow-live", match_id: "match-live-seller" },
      { id: "workflow-demo", match_id: "match-demo-seller" },
    ] as AdminUser360["workflowEvents"],
  });

  it("keeps buyer-side and listing-side relationships inside the correct workspace", () => {
    const live = scopeAdminUser360(data, "live");
    expect(live.clients.map((row) => row.id)).toEqual(["client-live"]);
    expect(live.exchanges.map((row) => row.id)).toEqual(["exchange-live"]);
    expect(live.properties.map((row) => row.id)).toEqual(["seller-live"]);
    expect(live.matches.map((row) => row.id)).toEqual(["match-live-buyer", "match-live-seller"]);
    expect(live.connections.map((row) => row.id)).toEqual(["connection-live"]);
    expect(live.connectionMessageMetadata.map((row) => row.id)).toEqual(["message-live"]);
    expect(live.collaborationThreads.map((row) => row.id)).toEqual(["thread-live"]);
    expect(live.representations.map((row) => row.id)).toEqual(["rep-live"]);
    expect(live.clientInvites.map((row) => row.id)).toEqual(["client-invite-live"]);
    expect(live.timeline.map((row) => row.id)).toEqual(["timeline-live"]);
    expect(live.workflowEvents.map((row) => row.id)).toEqual(["workflow-live"]);
  });

  it("returns only demo-linked operational records in demo scope", () => {
    const demo = scopeAdminUser360(data, "demo");
    expect(demo.matches.map((row) => row.id)).toEqual(["match-demo-buyer", "match-demo-seller"]);
    expect(demo.connections.map((row) => row.id)).toEqual(["connection-demo"]);
    expect(demo.collaborationThreads.map((row) => row.id)).toEqual(["thread-demo"]);
    expect(demo.savedProperties.map((row) => row.id)).toEqual(["saved-demo"]);
    expect(demo.listingInquiries.map((row) => row.id)).toEqual(["inquiry-demo"]);
    expect(demo.representationInvites.map((row) => row.id)).toEqual(["rep-invite-demo"]);
  });

  it("treats legacy rows without an is_demo flag as live", () => {
    expect(recordMatchesScope({}, "live")).toBe(true);
    expect(recordMatchesScope({}, "demo")).toBe(false);
  });
});

describe("admin invitation privacy", () => {
  it("never selects invitation bearer tokens into the user overview", () => {
    const source = readFileSync("src/features/admin/hooks/useAdminUser360.ts", "utf8");
    expect(source).not.toMatch(/from\("(?:client_invites|representation_invites)"\)\.select\("\*"\)/);
    expect(source).not.toContain('representationInvites: Tables<"representation_invites">[]');
    expect(source).not.toContain('clientInvites: Tables<"client_invites">[]');
  });

  it("resolves pending email invitations through exact server-side relationship edges", () => {
    const source = readFileSync("src/features/admin/hooks/useAdminUser360.ts", "utf8");
    expect(source).not.toContain('.ilike("email"');
    expect(source).toContain('p_resource_type: "client_invite"');
    expect(source).toContain('loadAdminClientInvites(userId, warnings)');
    expect(source).toContain("return uniqueById(invitations)");
  });
});

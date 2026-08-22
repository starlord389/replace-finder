import { describe, expect, it } from "vitest";
import type { AdminUser360, AdminUserScopedData } from "@/features/admin/hooks/useAdminUser360";
import {
  buildAdminWorkspaceGraph,
  parseWorkspaceSelection,
  serializeWorkspaceSelection,
} from "@/features/admin-crm/workspace/workspaceGraph";

const created = "2026-08-20T12:00:00.000Z";

describe("admin relationship workspace graph", () => {
  it("nests an agent client, their current property, and that property's buyer-side matches", () => {
    const client = { id: "client-1", client_name: "Sarah Chen", created_at: created, updated_at: created } as AdminUser360["clients"][number];
    const exchange = { id: "exchange-1", client_id: client.id, relinquished_property_id: "property-1", created_at: created, updated_at: created } as AdminUser360["exchanges"][number];
    const property = { id: "property-1", exchange_id: exchange.id, created_at: created, updated_at: created } as AdminUser360["properties"][number];
    const match = { id: "match-1", buyer_exchange_id: exchange.id, seller_property_id: "candidate-1", total_score: 91, created_at: created, updated_at: created } as AdminUser360["matches"][number];
    const graph = buildAdminWorkspaceGraph({} as AdminUser360, view({ clients: [client], exchanges: [exchange], properties: [property], matches: [match] }));

    expect(graph.clients).toHaveLength(1);
    expect(graph.clients[0].client.id).toBe(client.id);
    expect(graph.clients[0].properties[0].property.id).toBe(property.id);
    expect(graph.clients[0].properties[0].exchange?.id).toBe(exchange.id);
    expect(graph.clients[0].properties[0].matches.map((row) => row.id)).toEqual([match.id]);
    expect(graph.directProperties).toHaveLength(0);
  });

  it("keeps standalone listing inventory visible and attaches seller-side matches", () => {
    const property = { id: "listing-1", exchange_id: null, created_at: created, updated_at: created } as AdminUser360["properties"][number];
    const match = { id: "match-2", buyer_exchange_id: "other-exchange", seller_property_id: property.id, total_score: 84, created_at: created, updated_at: created } as AdminUser360["matches"][number];
    const graph = buildAdminWorkspaceGraph({} as AdminUser360, view({ properties: [property], matches: [match] }));

    expect(graph.directProperties).toHaveLength(1);
    expect(graph.directProperties[0].side).toBe("listing");
    expect(graph.directProperties[0].matches[0].id).toBe(match.id);
  });

  it("uses stable deep links for records", () => {
    expect(parseWorkspaceSelection("property:abc")).toEqual({ type: "property", id: "abc" });
    expect(parseWorkspaceSelection("activity")).toEqual({ type: "activity" });
    expect(parseWorkspaceSelection("relationships")).toEqual({ type: "relationships" });
    expect(parseWorkspaceSelection("unknown:abc")).toEqual({ type: "account" });
    expect(serializeWorkspaceSelection({ type: "match", id: "match-1" })).toBe("match:match-1");
  });
});

function view(overrides: Partial<AdminUserScopedData>): AdminUserScopedData {
  return {
    clients: [], exchanges: [], properties: [], matches: [], representations: [], representationInvites: [],
    assignments: [], contactRequests: [], recommendations: [], connectionIntents: [], connections: [],
    collaborationThreads: [], connectionMessageMetadata: [], collaborationMessageMetadata: [],
    savedProperties: [], listingInquiries: [], clientInvites: [], identificationList: [], timeline: [],
    notifications: [], supportTickets: [],
    workflowEvents: [], ...overrides,
  };
}

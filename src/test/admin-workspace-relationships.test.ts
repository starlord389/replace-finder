import { describe, expect, it } from "vitest";
import type { AdminClientInvite, AdminUserClient } from "@/features/admin/hooks/useAdminUser360";
import {
  getActiveOwnerRepresentation,
  getClientWorkspaceAccess,
  getOwnerRepresentations,
} from "@/features/admin-crm/workspace/workspaceRelationshipState";
import type { Tables } from "@/integrations/supabase/types";

const now = "2026-08-21T12:00:00.000Z";

const client = (overrides: Partial<AdminUserClient> = {}) => ({
  id: "client-1",
  agent_id: "agent-1",
  client_name: "Jordan Lee",
  client_email: "jordan@example.com",
  client_user_id: null,
  created_at: now,
  updated_at: now,
  ...overrides,
}) as AdminUserClient;

const invite = (overrides: Partial<AdminClientInvite> = {}) => ({
  id: "invite-1",
  client_id: "client-1",
  agent_id: "agent-1",
  email: "jordan@example.com",
  status: "pending",
  created_at: now,
  updated_at: now,
  ...overrides,
}) as AdminClientInvite;

const representation = (overrides: Partial<Tables<"agent_representations">> = {}) => ({
  id: "representation-1",
  agent_id: "agent-1",
  investor_id: "owner-1",
  status: "active",
  created_at: now,
  updated_at: now,
  ...overrides,
}) as Tables<"agent_representations">;

describe("admin workspace relationship states", () => {
  it("distinguishes CRM-only, invited, and connected clients", () => {
    expect(getClientWorkspaceAccess(client(), []).state).toBe("crm_only");
    expect(getClientWorkspaceAccess(client(), [invite()]).state).toBe("invited");
    expect(getClientWorkspaceAccess(client({ client_user_id: "owner-1" }), []).state).toBe("connected");
    expect(getClientWorkspaceAccess(client(), [invite({ status: "accepted", accepted_user_id: "owner-1" })]).state).toBe("connected");
  });

  it("tags an agent recorded as their own client as self-owned", () => {
    const access = getClientWorkspaceAccess(client({ client_user_id: "agent-1" }), []);
    expect(access.state).toBe("self");
    expect(access.label).toBe("Self-owned");
  });

  it("uses only the property owner's side of representation relationships", () => {
    const rows = [
      representation(),
      representation({ id: "former", status: "revoked", updated_at: "2026-08-20T12:00:00.000Z" }),
      representation({ id: "other-owner", investor_id: "owner-2" }),
    ];

    expect(getOwnerRepresentations("owner-1", rows).map((row) => row.id)).toEqual([
      "representation-1",
      "former",
    ]);
    expect(getActiveOwnerRepresentation("owner-1", rows)?.id).toBe("representation-1");
    expect(getActiveOwnerRepresentation("owner-2", [representation({ investor_id: "owner-1" })])).toBeNull();
  });
});

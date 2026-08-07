import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const diagnostic = readFileSync(
  resolve(process.cwd(), "supabase/functions/run-representation-e2e/index.ts"),
  "utf8",
);
const adminWorkspace = readFileSync(
  resolve(process.cwd(), "src/pages/admin/AdminRepresentations.tsx"),
  "utf8",
);

describe("representation multi-account diagnostic contract", () => {
  it("requires an administrator and uses isolated authenticated identities", () => {
    expect(diagnostic).toContain("requireAdmin");
    expect(diagnostic).toContain("Five isolated authenticated accounts created");
    expect(diagnostic).toContain("signInWithPassword");
    expect(diagnostic).toContain('"investor"');
    expect(diagnostic).toContain('"agent"');
  });

  it("covers invitation, agent-only contact, private collaboration, and reassignment", () => {
    expect(diagnostic).toContain('"invite_representing_agent"');
    expect(diagnostic).toContain('"invite_investor_client"');
    expect(diagnostic).toContain('"accept_representation_invite"');
    expect(diagnostic).toContain('"request_agent_contact"');
    expect(diagnostic).toContain('"start_agent_connection"');
    expect(diagnostic).toContain("Investor cannot send counterparty messages");
    expect(diagnostic).toContain("Counterparty agent cannot write to the private client thread");
    expect(diagnostic).toContain('"assign_agent_to_exchange"');
    expect(diagnostic).toContain('"unassign_agent_from_exchange"');
  });

  it("always cleans up fixtures and is runnable from representation operations", () => {
    expect(diagnostic).toContain("finally");
    expect(diagnostic).toContain("cleanupFixtures");
    expect(diagnostic).toContain("deleteUser");
    expect(adminWorkspace).toContain("Run multi-account test");
    expect(adminWorkspace).toContain('"run-representation-e2e"');
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const diagnostic = readFileSync(
  resolve(process.cwd(), "supabase/functions/run-representation-e2e/index.ts"),
  "utf8",
);

describe("representation multi-account diagnostic contract", () => {
  it("requires an administrator and uses isolated authenticated identities", () => {
    expect(diagnostic).toContain("requireAdmin");
    expect(diagnostic).toContain("serviceRoleKey");
    expect(diagnostic).toContain("Five isolated authenticated accounts created");
    expect(diagnostic).toContain("signInWithPassword");
    expect(diagnostic).toContain('"investor"');
    expect(diagnostic).toContain('"agent"');
    expect(diagnostic).toContain('rpc("is_active_agent"');
    expect(diagnostic).not.toContain('rpc("is_verified_agent"');
  });

  it("covers invitation, agent-only contact, private collaboration, and reassignment", () => {
    expect(diagnostic).toContain('"invite_representing_agent"');
    expect(diagnostic).toContain('"invite_investor_client"');
    expect(diagnostic).toContain('"accept_representation_invite"');
    expect(diagnostic).toContain('"request_agent_contact"');
    expect(diagnostic).toContain('"start_agent_connection"');
    const activationCheck = diagnostic.indexOf(
      "Agent conversation is active immediately without counterparty approval",
    );
    const firstMessage = diagnostic.indexOf("E2E primary-agent message");
    expect(activationCheck).toBeGreaterThan(-1);
    expect(firstMessage).toBeGreaterThan(activationCheck);
    expect(diagnostic).not.toContain("Counterparty agent accepted the pending connection before messaging");
    expect(diagnostic).toContain("Investor cannot send counterparty messages");
    expect(diagnostic).toContain("Investor contact request automatically advances the opportunity");
    expect(diagnostic).toContain("Both authorized sides can read the same opportunity stage");
    expect(diagnostic).toContain("Investor cannot directly overwrite the opportunity workflow");
    expect(diagnostic).toContain("Starting the agent conversation automatically advances the opportunity");
    expect(diagnostic).toContain("Investor cannot manually advance the agent-only deal workflow");
    expect(diagnostic).toContain('"record_match_workflow_stage"');
    expect(diagnostic).toContain("Under-contract workflow synchronizes the durable connection state");
    expect(diagnostic).toContain("Counterparty agent cannot write to the private client thread");
    expect(diagnostic).toContain('"assign_agent_to_exchange"');
    expect(diagnostic).toContain("without changing another exchange or stranding its opportunity");
    expect(diagnostic).toContain('"unassign_agent_from_exchange"');
  });

  it("always cleans up its isolated fixtures", () => {
    expect(diagnostic).toContain("finally");
    expect(diagnostic).toContain("cleanupFixtures");
    expect(diagnostic).toContain("deleteUser");
  });
});

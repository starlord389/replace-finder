import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const invitationActions = readFileSync(
  resolve(process.cwd(), "src/features/representation/components/InvitationManagementActions.tsx"),
  "utf8",
);
const investorWorkspace = readFileSync(
  resolve(process.cwd(), "src/pages/investor/InvestorRepresentation.tsx"),
  "utf8",
);
const agentWorkspace = readFileSync(
  resolve(process.cwd(), "src/pages/agent/AgentRepresentation.tsx"),
  "utf8",
);

describe("representation management interfaces", () => {
  it("exposes the complete pending-invitation lifecycle to invitation senders", () => {
    expect(invitationActions).toContain("Copy link");
    expect(invitationActions).toContain("Renew and send");
    expect(invitationActions).toContain("Correct email");
    expect(invitationActions).toContain("Invitation cancelled");
    expect(invitationActions).toContain("delivery_error_code");
  });

  it("lets investors manage agents independently for every exchange", () => {
    expect(investorWorkspace).toContain("Exchange agent access");
    expect(investorWorkspace).toContain("Reassign");
    expect(investorWorkspace).toContain("removeExchangeAgent");
    expect(investorWorkspace).toContain("Default agent");
    expect(investorWorkspace).toContain("Automatically assign to new exchanges");
  });

  it("shows agents the exchanges assigned by each represented client", () => {
    expect(agentWorkspace).toContain("exchangeLabels");
    expect(agentWorkspace).toContain("clientAssignments");
  });
});

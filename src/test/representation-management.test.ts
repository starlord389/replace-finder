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
    expect(investorWorkspace).toContain('value="overview"');
    expect(investorWorkspace).toContain('value="exchanges"');
    expect(investorWorkspace).toContain('value="messages"');
    expect(investorWorkspace).toContain('value="agents"');
    expect(investorWorkspace).toContain("Exchange assignments");
    expect(investorWorkspace).toContain("Change agent");
    expect(investorWorkspace).toContain("removeExchangeAgent");
    expect(investorWorkspace).toContain("Default agent");
    expect(investorWorkspace).toContain("Automatically cover new exchanges");
    expect(investorWorkspace).toContain("Match outreach");
    expect(investorWorkspace).toContain("contactRequestGuidance");
    expect(investorWorkspace).toContain("investorContactRequestStatusLabel");
    expect(investorWorkspace).toContain("Needs your attention");
    expect(investorWorkspace).toContain("Most investors only need one agent");
    expect(investorWorkspace).toContain("activeRepresentations.length > 1");
    expect(investorWorkspace).toContain("onlyRepresentation");
  });

  it("shows agents the exchanges assigned by each represented client", () => {
    expect(agentWorkspace).toContain("exchangeLabels");
    expect(agentWorkspace).toContain("clientAssignments");
  });

  it("reviews client-requested matches in place instead of navigating away", () => {
    expect(agentWorkspace).toContain("selectedRequestId");
    expect(agentWorkspace).toContain('searchParams.get("request")');
    expect(agentWorkspace).toContain("rel={selectedRequestRel}");
    expect(agentWorkspace).toContain('initialTab={selectedRequestTab}');
    expect(agentWorkspace).toContain("Your client has already reviewed this match");
    expect(agentWorkspace).not.toContain("to={`/agent/matches?match=${request.match_id}`}");
  });

  it("uses stable empty query results so loading effects cannot cause render loops", () => {
    expect(investorWorkspace).toContain("data: representations = EMPTY_REPRESENTATIONS");
    expect(investorWorkspace).toContain("data: assignments = EMPTY_ASSIGNMENTS");
    expect(agentWorkspace).toContain("data: representations = EMPTY_REPRESENTATIONS");
    expect(agentWorkspace).toContain("data: requests = EMPTY_CONTACT_REQUESTS");
    expect(investorWorkspace).not.toContain("data: representations = []");
    expect(agentWorkspace).not.toContain("data: representations = []");
  });
});

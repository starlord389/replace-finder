import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const addClientPage = readFileSync(
  resolve(process.cwd(), "src/pages/agent/AgentClientDetail.tsx"),
  "utf8",
);
const clientProfile = readFileSync(
  resolve(process.cwd(), "src/features/clients/components/ClientProfileTab.tsx"),
  "utf8",
);
const launchpadContent = readFileSync(
  resolve(process.cwd(), "src/content/agentLaunchpad.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260811101500_invite_existing_client_workspace.sql"),
  "utf8",
);
const launchpadPage = readFileSync(
  resolve(process.cwd(), "src/pages/agent/AgentLaunchpad.tsx"),
  "utf8",
);
const exchangeClientStep = readFileSync(
  resolve(process.cwd(), "src/components/exchange/StepSelectClient.tsx"),
  "utf8",
);

describe("agent client onboarding workflow", () => {
  it("keeps the Launchpad client step focused on creating an internal client record", () => {
    expect(launchpadContent).toContain('title: "Add your first client"');
    expect(launchpadContent).toContain('href: "/agent/clients/new"');
    expect(addClientPage).toContain('.from("agent_clients")');
    expect(addClientPage).toContain('"Add Client"');
    expect(addClientPage).not.toContain("inviteInvestorClient");
    expect(addClientPage).not.toContain("Client added and invitation sent");
  });

  it("makes workspace access an explicit, benefit-led optional choice", () => {
    expect(addClientPage).toContain("Want to invite this client to the platform?");
    expect(addClientPage).toContain("Add their properties");
    expect(addClientPage).toContain("Review their matches");
    expect(addClientPage).toContain("Stay their preferred agent");
    expect(addClientPage).toContain("Add Client & Send Invitation");
    expect(addClientPage).toContain("inviteExistingInvestorClient(data.id)");
    expect(clientProfile).toContain("Invite this client to their own workspace");
    expect(clientProfile).toContain("inviteExistingInvestorClient(clientId)");
    expect(clientProfile).toContain("Manage in Client Requests");
  });

  it("requires only a client name and explains the benefit of an optional email", () => {
    for (const clientForm of [addClientPage, exchangeClientStep]) {
      expect(clientForm).toContain("Client name");
      expect(clientForm).toContain("(required)");
      expect(clientForm).toContain("Email");
      expect(clientForm).toContain("Phone");
      expect(clientForm).toContain("(optional)");
      expect(clientForm).toContain("send matching properties directly to this client");
    }

    expect(addClientPage).toContain("client_email: email.trim() || null");
    expect(exchangeClientStep).toContain("client_email: newClient.email.trim() || null");
  });

  it("keeps inline Launchpad education complete after its panel is closed", () => {
    expect(launchpadPage).toContain("matchingViewed");
    expect(launchpadPage).toContain("clientRequestsViewed");
    expect(launchpadPage).toContain("launchpad_client_requests_ack_at");
    expect(launchpadPage).toContain("Closing this walkthrough will not remove your completion");
  });

  it("invites an existing record without creating a duplicate client", () => {
    expect(migration).toContain("invite_existing_investor_client");
    expect(migration).toContain("WHERE id = p_client_id AND agent_id = v_uid");
    expect(migration).not.toContain("INSERT INTO public.agent_clients");
    expect(migration).toContain("jsonb_build_object('client_id', v_client.id)");
  });
});

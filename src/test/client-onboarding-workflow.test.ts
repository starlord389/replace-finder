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

describe("agent client onboarding workflow", () => {
  it("keeps the Launchpad client step focused on creating an internal client record", () => {
    expect(launchpadContent).toContain('title: "Add your first client"');
    expect(launchpadContent).toContain('href: "/agent/clients/new"');
    expect(addClientPage).toContain('.from("agent_clients")');
    expect(addClientPage).toContain('"Add Client"');
    expect(addClientPage).not.toContain("inviteInvestorClient");
    expect(addClientPage).not.toContain("Client added and invitation sent");
  });

  it("makes workspace access a separate optional action on the saved client profile", () => {
    expect(addClientPage).toContain("Client workspace access is optional");
    expect(clientProfile).toContain("Invite this client to their own workspace");
    expect(clientProfile).toContain("inviteExistingInvestorClient(clientId)");
    expect(clientProfile).toContain("Manage in Client Requests");
  });

  it("invites an existing record without creating a duplicate client", () => {
    expect(migration).toContain("invite_existing_investor_client");
    expect(migration).toContain("WHERE id = p_client_id AND agent_id = v_uid");
    expect(migration).not.toContain("INSERT INTO public.agent_clients");
    expect(migration).toContain("jsonb_build_object('client_id', v_client.id)");
  });
});

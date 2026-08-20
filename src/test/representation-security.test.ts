import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260807120000_agent_representation_workflow.sql"),
  "utf8",
);
const managementMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260807144500_invitation_and_exchange_agent_management.sql"),
  "utf8",
);
const automaticAdmission = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260820213000_automatic_agent_admission.sql"),
  "utf8",
);
const currentWording = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260820221500_remove_legacy_verified_agent_wording.sql"),
  "utf8",
);

describe("agent-mediated representation security", () => {
  it("blocks the retired direct investor inquiry channel", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Investors create inquiries"');
    expect(migration).toContain("REVOKE INSERT ON public.listing_inquiries FROM authenticated");
  });

  it("requires active agents for external messages and connections", () => {
    expect(automaticAdmission).toContain("SELECT public.is_active_agent(p_user_id)");
    expect(currentWording).toContain("Active agents can send connection messages");
    expect(migration).toContain("REVOKE INSERT ON public.exchange_connections FROM authenticated");
  });

  it("preserves investor ownership through exchange assignments", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.exchange_agent_assignments");
    expect(migration).toContain("public.has_active_exchange_assignment(auth.uid(), id)");
    expect(migration).toContain("The exchange does not belong to this investor");
    expect(migration).toContain("guard_represented_exchange_ownership");
    expect(migration).toContain("guard_represented_property_ownership");
  });

  it("blocks either investor-owned side until it has an active agent", () => {
    expect(migration).toContain("An agent is interested in your exchange");
    expect(migration).toContain("An agent is interested in your listing");
    expect(migration).toContain("The client contact request does not belong to this match");
  });

  it("keeps client-agent collaboration separate from external messages", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.client_agent_messages");
    expect(migration).toContain('CREATE POLICY "Client and agent can send private collaboration messages"');
    expect(currentWording).toContain("Active agents can send connection messages");
  });

  it("limits invitation management to the sender and rotates corrected links", () => {
    expect(managementMigration).toContain("Only the invitation sender can deliver this invitation");
    expect(managementMigration).toContain("Wait one minute before resending this invitation");
    expect(managementMigration).toContain("token = gen_random_uuid()::text");
    expect(managementMigration).toContain("Invitation cancelled by sender");
  });

  it("keeps per-exchange assignment control with the investor", () => {
    expect(managementMigration).toContain("Only the investor or an administrator can remove exchange access");
    expect(managementMigration).toContain("Only the investor or an administrator can change the default agent");
    expect(managementMigration).toContain("CREATE OR REPLACE FUNCTION public.unassign_agent_from_exchange");
    expect(managementMigration).toContain("CREATE OR REPLACE FUNCTION public.set_default_representation");
  });
});

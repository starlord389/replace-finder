import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260807120000_agent_representation_workflow.sql"),
  "utf8",
);

describe("agent-mediated representation security", () => {
  it("blocks the retired direct investor inquiry channel", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Investors create inquiries"');
    expect(migration).toContain("REVOKE INSERT ON public.listing_inquiries FROM authenticated");
  });

  it("requires verified agents for external messages and connections", () => {
    expect(migration).toContain('CREATE POLICY "Verified agents can send connection messages"');
    expect(migration).toContain("public.is_verified_agent(auth.uid())");
    expect(migration).toContain("REVOKE INSERT ON public.exchange_connections FROM authenticated");
  });

  it("preserves investor ownership through exchange assignments", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.exchange_agent_assignments");
    expect(migration).toContain("public.has_active_exchange_assignment(auth.uid(), id)");
    expect(migration).toContain("The exchange does not belong to this investor");
    expect(migration).toContain("guard_represented_exchange_ownership");
    expect(migration).toContain("guard_represented_property_ownership");
  });

  it("blocks either investor-owned side until it has a verified agent", () => {
    expect(migration).toContain("An agent is interested in your exchange");
    expect(migration).toContain("An agent is interested in your listing");
    expect(migration).toContain("The client contact request does not belong to this match");
  });

  it("keeps client-agent collaboration separate from external messages", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.client_agent_messages");
    expect(migration).toContain('CREATE POLICY "Client and agent can send private collaboration messages"');
    expect(migration).toContain('CREATE POLICY "Verified agents can send connection messages"');
  });
});

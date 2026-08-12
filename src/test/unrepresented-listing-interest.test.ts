import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260812193000_unrepresented_counterparty_interest.sql"),
  "utf8",
);
const matchingCore = readFileSync(
  resolve(process.cwd(), "supabase/functions/_shared/matching-core.ts"),
  "utf8",
);
const investorPage = readFileSync(
  resolve(process.cwd(), "src/pages/investor/InvestorRepresentation.tsx"),
  "utf8",
);

describe("unrepresented investor listing interest", () => {
  it("keeps the anti-self-match rule scoped to the same beneficial owner", () => {
    expect(matchingCore).toContain('buyerExchange?.owner_type === "investor"');
    expect(matchingCore).toContain("buyerExchange.agent_id === candidateProperty?.agent_id");
    expect(matchingCore).not.toContain("candidateProperty?.owner_type === \"investor\"");
  });

  it("persists interest and resolves it when a verified agent is assigned", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.agent_connection_intents");
    expect(migration).toContain("public.queue_agent_connection_intent");
    expect(migration).toContain("public.resolve_agent_connection_intent");
    expect(migration).toContain("trg_resolve_connection_intents_on_assignment");
    expect(migration).toContain("'accepted', now()");
    expect(migration).toContain("AND buyer_agent_id = v_buyer_agent");
    expect(migration).toContain("AND seller_agent_id = v_seller_agent");
  });

  it("does not grant investors direct write access or agent conversation access", () => {
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.agent_connection_intents FROM authenticated");
    expect(migration).toContain("GRANT SELECT ON public.agent_connection_intents TO authenticated");
    expect(migration).toContain("IF NOT public.is_verified_agent(v_uid)");
  });

  it("gives the owner clear assignment and referral actions", () => {
    expect(investorPage).toContain("Assign my agent and connect");
    expect(investorPage).toContain("Invite my agent");
    expect(investorPage).toContain("Help me find an agent");
    expect(investorPage).toContain("conversation is being opened automatically");
  });
});

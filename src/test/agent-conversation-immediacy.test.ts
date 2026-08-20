import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260811143000_immediate_agent_conversations.sql"),
  "utf8",
);
const automaticAdmission = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260820213000_automatic_agent_admission.sql"),
  "utf8",
);
const retiredVerification = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260820221500_remove_legacy_verified_agent_wording.sql"),
  "utf8",
);
const matchActions = readFileSync(
  resolve(process.cwd(), "src/features/matches/components/inbox/useMatchActions.ts"),
  "utf8",
);
const connectionDetail = readFileSync(
  resolve(process.cwd(), "src/pages/agent/AgentConnectionDetail.tsx"),
  "utf8",
);

describe("immediate agent conversations", () => {
  it("keeps active-agent and assignment gates", () => {
    expect(automaticAdmission).toContain("CREATE OR REPLACE FUNCTION public.is_active_agent");
    expect(retiredVerification).toContain("'public.is_verified_agent', 'public.is_active_agent'");
    expect(migration).toContain("public.exchange_agent_assignments");
    expect(migration).toContain("You are not the assigned agent for either side of this match");
    expect(migration).toContain("The same agent cannot automatically represent both sides");
  });

  it("activates new and legacy pending conversations without counterparty approval", () => {
    expect(migration).toContain("v_my_side, 'accepted', now()");
    expect(migration).toContain("v_connection_status IN ('pending', 'declined', 'cancelled')");
    expect(migration).toContain("WHERE status = 'pending'");
    expect(retiredVerification).toContain("DROP FUNCTION public.is_verified_agent(uuid)");
  });

  it("opens the conversation immediately in the frontend", () => {
    expect(matchActions).toContain('title: "Conversation ready"');
    expect(matchActions).toContain("cb.onOpenConversation?.()");
    expect(matchActions).not.toContain("the other agent needs to accept");
    expect(connectionDetail).not.toContain("Incoming Connection Request");
    expect(connectionDetail).not.toContain("handleAccept");
  });
});

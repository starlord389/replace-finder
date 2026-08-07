import { describe, expect, it } from "vitest";
import {
  INVESTOR_FILTER_TABS,
  INVESTOR_LIFECYCLE_ORDER,
  nextActionsForAudience,
  rankExplanation,
  rankReason,
  statusForAudience,
} from "@/features/matches/components/inbox/inboxHelpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

describe("investor match workflow", () => {
  it("removes agent/client-only lifecycle stages", () => {
    expect(INVESTOR_LIFECYCLE_ORDER).toEqual([
      "new",
      "in_conversation",
      "loi",
      "under_contract",
      "closed",
    ]);
    expect(INVESTOR_FILTER_TABS.map((tab) => tab.key)).not.toContain("sent_to_client");
    expect(INVESTOR_FILTER_TABS.map((tab) => tab.key)).not.toContain("client_interested");
  });

  it("routes a new investor match through the investor's representing agent", () => {
    const actions = nextActionsForAudience("new", "investor");
    expect(actions.primary).toEqual({
      id: "request_agent_contact",
      label: "Ask My Agent to Connect",
    });
    expect(actions.secondary).toEqual([
      { id: "not_a_fit", label: "Not a Fit", tone: "destructive" },
    ]);
  });

  it("does not expose counterparty deal controls to investors after contact begins", () => {
    expect(nextActionsForAudience("in_conversation", "investor").primary).toBeNull();
    expect(nextActionsForAudience("loi", "investor").primary).toBeNull();
    expect(nextActionsForAudience("under_contract", "investor").primary).toBeNull();
  });

  it("normalizes old agent-only demo states for the investor view", () => {
    expect(statusForAudience("sent_to_client", "investor")).toBe("new");
    expect(statusForAudience("client_interested", "investor")).toBe("new");
    expect(statusForAudience("client_interested", "agent")).toBe("client_interested");
  });

  it("explains rankings with the actual ROE and financing rules", () => {
    const match = {
      roeImprovementPp: 1.5,
      estimatedLtv: 0.615,
      askingPrice: 5_200_000,
      estimatedPurchasingCapacity: 8_000_000,
    } as unknown as Relationship;

    expect(rankReason(match)).toBe("ROE +1.5 pts · 61.5% LTV");
    expect(rankExplanation(match, 1)).toBe(
      "Ranked #1 because projected ROE improves by 1.5 percentage points and modeled financing is 61.5% LTV and the $5.20M price is within the $8.00M purchasing ceiling.",
    );
    expect(rankExplanation(match, 1)).not.toMatch(/location|asset type|strategy/i);
  });
});

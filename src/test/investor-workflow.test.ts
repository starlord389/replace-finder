import { describe, expect, it } from "vitest";
import {
  INVESTOR_FILTER_TABS,
  INVESTOR_LIFECYCLE_ORDER,
  nextActionsForAudience,
  statusForAudience,
} from "@/features/matches/components/inbox/inboxHelpers";

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

  it("routes a new investor match directly to the listing agent", () => {
    const actions = nextActionsForAudience("new", "investor");
    expect(actions.primary).toEqual({
      id: "message_listing_agent",
      label: "Message Listing Agent",
    });
    expect(actions.secondary).toEqual([
      { id: "not_a_fit", label: "Not a Fit", tone: "destructive" },
    ]);
  });

  it("normalizes old agent-only demo states for the investor view", () => {
    expect(statusForAudience("sent_to_client", "investor")).toBe("new");
    expect(statusForAudience("client_interested", "investor")).toBe("new");
    expect(statusForAudience("client_interested", "agent")).toBe("client_interested");
  });
});

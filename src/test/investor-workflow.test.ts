import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  INVESTOR_FILTER_TABS,
  INVESTOR_LIFECYCLE_ORDER,
  deriveUiStatus,
  nextActionsForAudience,
  nextActionsForRelationship,
  rankExplanation,
  rankReason,
  statusForAudience,
} from "@/features/matches/components/inbox/inboxHelpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { MatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";

const EMPTY_LOCAL_STATE: MatchLocalState = {
  sentToClientAt: null,
  clientInterestedAt: null,
  conversationStartedAt: null,
  loiSentAt: null,
  underContractAt: null,
  closedAt: null,
  archivedAt: null,
  notFitAt: null,
  clientPassedAt: null,
  sellerUnavailableAt: null,
  agentNote: "",
};

const relationshipSource = readFileSync(
  resolve(process.cwd(), "src/features/matches/hooks/useUnifiedRelationships.ts"),
  "utf8",
);
const listingSource = readFileSync(
  resolve(process.cwd(), "src/features/pipeline/hooks/useAgentListings.ts"),
  "utf8",
);
const actionSource = readFileSync(
  resolve(process.cwd(), "src/features/matches/components/inbox/useMatchActions.ts"),
  "utf8",
);
import { MATCH_PLAN } from "../../supabase/functions/demo-data/fixtures";

const demoDataSource = readFileSync(
  resolve(process.cwd(), "supabase/functions/demo-data/index.ts"),
  "utf8",
);

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

  it("does not treat an inbound match on the investor's own listing as a buyer request", () => {
    const inboundListingMatch = {
      mySide: "seller",
      agentContactRequestStatus: null,
    } as unknown as Relationship;
    expect(nextActionsForRelationship(inboundListingMatch, "new", "investor").primary).toEqual({
      id: "manage_listing_representation",
      label: "Manage Listing Agent",
    });
    expect(actionSource).toContain('window.location.assign("/investor/representation")');
  });

  it("keeps investor demo actions on investor-owned exchanges and refreshes request state", () => {
    expect(relationshipSource).toContain('.eq("owner_type", ownerType)');
    expect(listingSource).toContain('.eq("owner_type", ownerType)');
    expect(relationshipSource).not.toContain('isDemo && ownerType === "investor"');
    expect(listingSource).not.toContain('isDemo && ownerType === "investor"');
    expect(actionSource).toContain('queryKey: ["unified-relationships"]');
    expect(actionSource).toContain("Couldn't complete this action");
    expect(demoDataSource).toContain("exchangeIdFor(planned.buyer)");
    expect(MATCH_PLAN.filter((m) => m.buyer === "investor").length).toBeGreaterThanOrEqual(2);
  });

  it("does not expose counterparty deal controls to investors after contact begins", () => {
    expect(nextActionsForAudience("in_conversation", "investor").primary).toBeNull();
    expect(nextActionsForAudience("loi", "investor").primary).toBeNull();
    expect(nextActionsForAudience("under_contract", "investor").primary).toBeNull();
  });

  it("treats an investor-originated contact request as client interest for the agent", () => {
    const relationship = {
      agentContactRequestId: "request-1",
      agentContactRequestStatus: "requested",
      clientRecommendationResponse: null,
      stage: "new",
    } as unknown as Relationship;
    const status = deriveUiStatus(relationship, EMPTY_LOCAL_STATE);

    expect(status).toBe("client_interested");
    expect(nextActionsForRelationship(relationship, status, "agent").primary).toEqual({
      id: "message_listing_agent",
      label: "Contact Listing Agent",
    });
    expect(nextActionsForRelationship(relationship, status, "agent").secondary).toEqual([
      { id: "decline_client_request", label: "Pass on Client Request", tone: "destructive" },
    ]);
    expect(nextActionsForRelationship(relationship, statusForAudience(status, "investor"), "investor").primary).toEqual({
      id: "view_agent_request",
      label: "Request Sent to My Agent",
    });
  });

  it("uses persisted recommendation responses instead of asking the agent to resend", () => {
    const interested = {
      agentContactRequestStatus: null,
      clientRecommendationResponse: "interested",
      stage: "new",
    } as unknown as Relationship;
    const pending = { ...interested, clientRecommendationResponse: "pending" } as Relationship;
    const passed = { ...interested, clientRecommendationResponse: "passed" } as Relationship;

    expect(deriveUiStatus(interested, EMPTY_LOCAL_STATE)).toBe("client_interested");
    expect(deriveUiStatus(pending, EMPTY_LOCAL_STATE)).toBe("sent_to_client");
    expect(deriveUiStatus(passed, EMPTY_LOCAL_STATE)).toBe("archived");
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

import { describe, expect, it } from "vitest";
import { buildMatchesScopeSearch, findMatchScopeGroup } from "@/features/matches/lib/matchScope";

const groups = [
  { clientId: "client-a", clientName: "Client A", listings: [{ exchangeId: "exchange-a" }] },
  { clientId: "client-b", clientName: "Client B", listings: [{ exchangeId: "exchange-b" }] },
];

describe("matches page scope", () => {
  it("infers the visible client from a listing-only URL", () => {
    expect(findMatchScopeGroup(groups, "exchange-b", null)?.clientId).toBe("client-b");
  });

  it("treats the specific listing as authoritative over a stale client parameter", () => {
    expect(findMatchScopeGroup(groups, "exchange-b", "client-a")?.clientId).toBe("client-b");
  });

  it("builds a fully explicit agent scope after activation", () => {
    expect(buildMatchesScopeSearch("agent", "exchange-b", "client-b")).toBe(
      "client=client-b&listing=exchange-b",
    );
  });

  it("keeps investor URLs property-scoped without an agent client parameter", () => {
    expect(buildMatchesScopeSearch("investor", "exchange-b", "client-b")).toBe(
      "listing=exchange-b",
    );
  });
});

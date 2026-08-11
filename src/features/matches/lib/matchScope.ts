export interface MatchScopeGroup {
  clientId: string | null;
  listings: Array<{ exchangeId: string }>;
}

/**
 * A property/exchange is more specific than a client, so it is the source of
 * truth when both URL parameters are present. This also lets older links that
 * contain only `listing` hydrate the correct visible client selector.
 */
export function findMatchScopeGroup<T extends MatchScopeGroup>(
  groups: T[],
  listingId: string | null,
  clientId: string | null,
): T | null {
  if (listingId) {
    const listingGroup = groups.find((group) =>
      group.listings.some((listing) => listing.exchangeId === listingId),
    );
    if (listingGroup) return listingGroup;
  }

  if (!clientId) return null;
  return groups.find((group) => group.clientId === clientId) ?? null;
}

export function buildMatchesScopeSearch(
  audience: "agent" | "investor",
  exchangeId: string,
  clientId?: string | null,
): string {
  const params = new URLSearchParams();
  if (audience === "agent" && clientId) params.set("client", clientId);
  params.set("listing", exchangeId);
  return params.toString();
}

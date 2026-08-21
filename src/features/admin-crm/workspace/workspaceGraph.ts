import type {
  AdminUser360,
  AdminUserClient,
  AdminUserExchange,
  AdminUserMatch,
  AdminUserProperty,
  AdminUserScopedData,
} from "@/features/admin/hooks/useAdminUser360";

export type WorkspaceRecordType =
  | "account"
  | "client"
  | "exchange"
  | "property"
  | "match"
  | "listings"
  | "launchpad"
  | "communications"
  | "activity"
  | "access";

export type WorkspaceSelection = {
  type: WorkspaceRecordType;
  id?: string;
};

export type WorkspacePropertyBranch = {
  property: AdminUserProperty;
  exchange: AdminUserExchange | null;
  matches: AdminUserMatch[];
  side: "current" | "listing";
};

export type WorkspaceClientBranch = {
  client: AdminUserClient;
  exchanges: AdminUserExchange[];
  properties: WorkspacePropertyBranch[];
};

export type AdminWorkspaceGraph = {
  clients: WorkspaceClientBranch[];
  directProperties: WorkspacePropertyBranch[];
  unlinkedExchanges: AdminUserExchange[];
  clientById: Record<string, WorkspaceClientBranch>;
  propertyById: Record<string, WorkspacePropertyBranch>;
  exchangeById: Record<string, AdminUserExchange>;
  matchById: Record<string, AdminUserMatch>;
};

function sortByUpdated<T extends { updated_at?: string; created_at: string }>(rows: T[]) {
  return [...rows].sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at));
}

function matchesForProperty(
  property: AdminUserProperty,
  exchange: AdminUserExchange | null,
  matches: AdminUserMatch[],
) {
  const related = matches.filter((match) =>
    (exchange && match.buyer_exchange_id === exchange.id) || match.seller_property_id === property.id,
  );
  return [...new Map(related.map((match) => [match.id, match])).values()].sort(
    (a, b) => b.total_score - a.total_score,
  );
}

function resolveExchangeProperty(
  exchange: AdminUserExchange,
  properties: AdminUserProperty[],
) {
  if (exchange.relinquished_property_id) {
    const relinquished = properties.find((property) => property.id === exchange.relinquished_property_id);
    if (relinquished) return relinquished;
  }
  return properties.find((property) => property.exchange_id === exchange.id) ?? null;
}

/**
 * Builds the admin workspace around the actual product hierarchy:
 * account -> clients -> exchanges/current properties -> matches.
 * Listing inventory that is not attached to a client remains visible as a
 * separate branch instead of being silently folded into another relationship.
 */
export function buildAdminWorkspaceGraph(
  data: AdminUser360,
  view: AdminUserScopedData,
): AdminWorkspaceGraph {
  const attachedPropertyIds = new Set<string>();
  const attachedExchangeIds = new Set<string>();

  const clients = sortByUpdated(view.clients).map((client): WorkspaceClientBranch => {
    const exchanges = sortByUpdated(view.exchanges.filter((exchange) => exchange.client_id === client.id));
    const properties = exchanges.flatMap((exchange) => {
      const property = resolveExchangeProperty(exchange, view.properties);
      if (!property) return [];
      attachedPropertyIds.add(property.id);
      attachedExchangeIds.add(exchange.id);
      return [{
        property,
        exchange,
        matches: matchesForProperty(property, exchange, view.matches),
        side: "current" as const,
      }];
    });
    return { client, exchanges, properties };
  });

  const directExchangeBranches = sortByUpdated(
    view.exchanges.filter((exchange) => !exchange.client_id && !attachedExchangeIds.has(exchange.id)),
  ).flatMap((exchange) => {
    const property = resolveExchangeProperty(exchange, view.properties);
    if (!property) return [];
    attachedExchangeIds.add(exchange.id);
    attachedPropertyIds.add(property.id);
    return [{
      property,
      exchange,
      matches: matchesForProperty(property, exchange, view.matches),
      side: "current" as const,
    }];
  });

  const standaloneListings = sortByUpdated(
    view.properties.filter((property) => !attachedPropertyIds.has(property.id)),
  ).map((property): WorkspacePropertyBranch => {
    const exchange = property.exchange_id
      ? view.exchanges.find((item) => item.id === property.exchange_id) ?? null
      : null;
    if (exchange) attachedExchangeIds.add(exchange.id);
    return {
      property,
      exchange,
      matches: matchesForProperty(property, exchange, view.matches),
      side: "listing",
    };
  });

  const directProperties = [...directExchangeBranches, ...standaloneListings];
  const unlinkedExchanges = sortByUpdated(
    view.exchanges.filter((exchange) => !attachedExchangeIds.has(exchange.id)),
  );

  const clientById = Object.fromEntries(clients.map((branch) => [branch.client.id, branch]));
  const propertyBranches = [
    ...clients.flatMap((branch) => branch.properties),
    ...directProperties,
  ];

  return {
    clients,
    directProperties,
    unlinkedExchanges,
    clientById,
    propertyById: Object.fromEntries(propertyBranches.map((branch) => [branch.property.id, branch])),
    exchangeById: Object.fromEntries(view.exchanges.map((exchange) => [exchange.id, exchange])),
    matchById: Object.fromEntries(view.matches.map((match) => [match.id, match])),
  };
}

export function parseWorkspaceSelection(value: string | null): WorkspaceSelection {
  if (!value) return { type: "account" };
  if (["listings", "launchpad", "communications", "activity", "access"].includes(value)) return { type: value as WorkspaceRecordType };
  const separator = value.indexOf(":");
  if (separator === -1) return { type: "account" };
  const type = value.slice(0, separator) as WorkspaceRecordType;
  const id = value.slice(separator + 1);
  if (!["client", "exchange", "property", "match"].includes(type) || !id) return { type: "account" };
  return { type, id };
}

export function serializeWorkspaceSelection(selection: WorkspaceSelection) {
  return selection.id ? `${selection.type}:${selection.id}` : selection.type;
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Enums, Tables } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;
type Profile = Pick<
  Tables<"profiles">,
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "company"
  | "brokerage_name"
  | "license_number"
  | "license_state"
  | "mls_number"
  | "years_experience"
  | "verification_status"
  | "profile_photo_url"
  | "created_at"
  | "updated_at"
>;
type Role = Pick<Tables<"user_roles">, "user_id" | "role">;
type Client = Pick<Tables<"agent_clients">, "id" | "agent_id" | "client_user_id" | "is_demo">;
type Exchange = Pick<
  Tables<"exchanges">,
  "id" | "agent_id" | "client_id" | "owner_type" | "is_demo" | "relinquished_property_id"
>;
type Assignment = Pick<Tables<"exchange_agent_assignments">, "exchange_id" | "agent_id" | "investor_id" | "status">;
type Property = Pick<Tables<"pledged_properties">, "id" | "agent_id" | "exchange_id" | "is_demo">;
type Match = Pick<
  Tables<"matches">,
  "id" | "buyer_exchange_id" | "seller_property_id" | "buyer_agent_id" | "seller_agent_id"
>;

export interface AdminDirectoryCount {
  total: number;
  live: number;
  demo: number;
}

export interface AdminUserDirectoryRow extends Profile {
  profileExists: boolean;
  account_status: "active" | "suspended" | "deleted";
  auth_created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  banned_until: string | null;
  auth_deleted_at: string | null;
  roles: AppRole[];
  clients: AdminDirectoryCount & {
    managed: number;
    linked: number;
  };
  exchanges: AdminDirectoryCount & {
    agentManaged: number;
    investorOwned: number;
    represented: number;
    linkedClient: number;
  };
  properties: AdminDirectoryCount;
  matches: AdminDirectoryCount & {
    buyerSide: number;
    sellerSide: number;
  };
  hasLiveData: boolean;
  hasDemoData: boolean;
  isTestAccount: boolean;
}

export interface AdminUserDirectorySource {
  profiles: Profile[];
  roles: Role[];
  clients: Client[];
  exchanges: Exchange[];
  assignments: Assignment[];
  properties: Property[];
  matches: Match[];
}

function addToMap(map: Map<string, Set<string>>, userId: string | null | undefined, recordId: string) {
  if (!userId) return;
  const records = map.get(userId) ?? new Set<string>();
  records.add(recordId);
  map.set(userId, records);
}

function idsFor(map: Map<string, Set<string>>, userId: string) {
  return map.get(userId) ?? new Set<string>();
}

function countRecords(ids: Set<string>, demoById: Map<string, boolean>): AdminDirectoryCount {
  let demo = 0;
  for (const id of ids) {
    if (demoById.get(id)) demo += 1;
  }
  return { total: ids.size, live: ids.size - demo, demo };
}

function unionInto(target: Map<string, Set<string>>, source: Map<string, Set<string>>) {
  for (const [userId, ids] of source) {
    for (const id of ids) addToMap(target, userId, id);
  }
}

/**
 * Builds one directory summary per profile while retaining the distinct ways a
 * user participates in the product. Headline totals are de-duplicated by record
 * id, so a dual-role owner who is also their own assigned agent is counted once.
 */
export function buildAdminUserDirectory(source: AdminUserDirectorySource): AdminUserDirectoryRow[] {
  const rolesByUser = new Map<string, Set<AppRole>>();
  for (const role of source.roles) {
    const roles = rolesByUser.get(role.user_id) ?? new Set<AppRole>();
    roles.add(role.role);
    rolesByUser.set(role.user_id, roles);
  }

  const clientsById = new Map(source.clients.map((client) => [client.id, client]));
  const clientDemo = new Map(source.clients.map((client) => [client.id, client.is_demo]));
  const managedClients = new Map<string, Set<string>>();
  const linkedClients = new Map<string, Set<string>>();
  const relatedClients = new Map<string, Set<string>>();
  for (const client of source.clients) {
    addToMap(managedClients, client.agent_id, client.id);
    addToMap(relatedClients, client.agent_id, client.id);
    addToMap(linkedClients, client.client_user_id, client.id);
    addToMap(relatedClients, client.client_user_id, client.id);
  }

  const exchangesById = new Map(source.exchanges.map((exchange) => [exchange.id, exchange]));
  const exchangeDemo = new Map(source.exchanges.map((exchange) => [exchange.id, exchange.is_demo]));
  const relatedExchanges = new Map<string, Set<string>>();
  const directExchanges = new Map<string, Set<string>>();
  const representedExchanges = new Map<string, Set<string>>();
  const linkedClientExchanges = new Map<string, Set<string>>();
  for (const exchange of source.exchanges) {
    addToMap(directExchanges, exchange.agent_id, exchange.id);
    addToMap(relatedExchanges, exchange.agent_id, exchange.id);

    const clientUserId = exchange.client_id
      ? clientsById.get(exchange.client_id)?.client_user_id
      : null;
    addToMap(linkedClientExchanges, clientUserId, exchange.id);
    addToMap(relatedExchanges, clientUserId, exchange.id);
  }
  for (const assignment of source.assignments) {
    if (assignment.status !== "active") continue;
    addToMap(representedExchanges, assignment.agent_id, assignment.exchange_id);
    addToMap(relatedExchanges, assignment.agent_id, assignment.exchange_id);
    addToMap(relatedExchanges, assignment.investor_id, assignment.exchange_id);
  }

  const propertiesById = new Map(source.properties.map((property) => [property.id, property]));
  const propertyDemo = new Map(source.properties.map((property) => [property.id, property.is_demo]));
  const relatedProperties = new Map<string, Set<string>>();
  for (const property of source.properties) {
    addToMap(relatedProperties, property.agent_id, property.id);
  }
  for (const [userId, exchangeIds] of relatedExchanges) {
    for (const exchangeId of exchangeIds) {
      const exchange = exchangesById.get(exchangeId);
      if (exchange?.relinquished_property_id) {
        addToMap(relatedProperties, userId, exchange.relinquished_property_id);
      }
    }
  }
  const usersByExchange = new Map<string, Set<string>>();
  for (const [userId, exchangeIds] of relatedExchanges) {
    for (const exchangeId of exchangeIds) addToMap(usersByExchange, exchangeId, userId);
  }
  for (const property of source.properties) {
    if (!property.exchange_id) continue;
    for (const userId of idsFor(usersByExchange, property.exchange_id)) {
      addToMap(relatedProperties, userId, property.id);
    }
  }

  const usersByProperty = new Map<string, Set<string>>();
  for (const [userId, propertyIds] of relatedProperties) {
    for (const propertyId of propertyIds) addToMap(usersByProperty, propertyId, userId);
  }

  const relatedMatches = new Map<string, Set<string>>();
  const buyerMatches = new Map<string, Set<string>>();
  const sellerMatches = new Map<string, Set<string>>();
  const matchDemo = new Map<string, boolean>();
  for (const match of source.matches) {
    const buyerUsers = idsFor(usersByExchange, match.buyer_exchange_id);
    const sellerUsers = idsFor(usersByProperty, match.seller_property_id);
    for (const userId of buyerUsers) {
      addToMap(buyerMatches, userId, match.id);
      addToMap(relatedMatches, userId, match.id);
    }
    for (const userId of sellerUsers) {
      addToMap(sellerMatches, userId, match.id);
      addToMap(relatedMatches, userId, match.id);
    }
    for (const agentId of [match.buyer_agent_id, match.seller_agent_id]) {
      addToMap(relatedMatches, agentId, match.id);
    }

    matchDemo.set(
      match.id,
      Boolean(
        exchangesById.get(match.buyer_exchange_id)?.is_demo ||
        propertiesById.get(match.seller_property_id)?.is_demo,
      ),
    );
  }

  // Preserve side-specific counts for historical agent participation, even if
  // the exchange/property assignment changed after the match was created.
  for (const match of source.matches) {
    addToMap(buyerMatches, match.buyer_agent_id, match.id);
    addToMap(sellerMatches, match.seller_agent_id, match.id);
  }

  // Related sets already contain all direct and linked relationships. The
  // explicit union calls make that contract clear if new subtypes are added.
  unionInto(relatedClients, managedClients);
  unionInto(relatedClients, linkedClients);

  return source.profiles.map((profile) => {
    const clientIds = idsFor(relatedClients, profile.id);
    const exchangeIds = idsFor(relatedExchanges, profile.id);
    const propertyIds = idsFor(relatedProperties, profile.id);
    const matchIds = idsFor(relatedMatches, profile.id);
    const clientCounts = countRecords(clientIds, clientDemo);
    const exchangeCounts = countRecords(exchangeIds, exchangeDemo);
    const propertyCounts = countRecords(propertyIds, propertyDemo);
    const matchCounts = countRecords(matchIds, matchDemo);

    let agentManaged = 0;
    let investorOwned = 0;
    for (const exchangeId of exchangeIds) {
      if (exchangesById.get(exchangeId)?.owner_type === "investor") investorOwned += 1;
      else agentManaged += 1;
    }

    return {
      ...profile,
      profileExists: true,
      account_status: profile.verification_status === "suspended" ? "suspended" : "active",
      auth_created_at: profile.created_at,
      last_sign_in_at: null,
      email_confirmed_at: null,
      phone_confirmed_at: null,
      banned_until: null,
      auth_deleted_at: null,
      roles: [...(rolesByUser.get(profile.id) ?? [])],
      clients: {
        ...clientCounts,
        managed: idsFor(managedClients, profile.id).size,
        linked: idsFor(linkedClients, profile.id).size,
      },
      exchanges: {
        ...exchangeCounts,
        agentManaged,
        investorOwned,
        represented: idsFor(representedExchanges, profile.id).size,
        linkedClient: idsFor(linkedClientExchanges, profile.id).size,
      },
      properties: propertyCounts,
      matches: {
        ...matchCounts,
        buyerSide: idsFor(buyerMatches, profile.id).size,
        sellerSide: idsFor(sellerMatches, profile.id).size,
      },
      hasLiveData:
        clientCounts.live + exchangeCounts.live + propertyCounts.live + matchCounts.live > 0,
      hasDemoData:
        clientCounts.demo + exchangeCounts.demo + propertyCounts.demo + matchCounts.demo > 0 ||
        Boolean(profile.email?.toLowerCase().endsWith("@replacefinder.test")),
      isTestAccount: Boolean(profile.email?.toLowerCase().endsWith("@replacefinder.test")),
    };
  });
}

export const ADMIN_USER_DIRECTORY_QUERY_KEY = ["admin-user-directory"] as const;

export type AdminUserDirectorySort = "recent" | "name" | "activity";
export type AdminUserDirectoryDataScope = "all" | "live" | "demo";
export type AdminUserDirectoryAccountStatus = "all" | "active" | "suspended" | "deleted";

export interface AdminUserDirectoryParams {
  search?: string;
  role?: AppRole | "all";
  verificationStatus?: "all" | "pending" | "verified" | "suspended";
  accountStatus?: AdminUserDirectoryAccountStatus;
  dataScope?: AdminUserDirectoryDataScope;
  sort?: AdminUserDirectorySort;
  page?: number;
  pageSize?: number;
}

export interface AdminUserDirectorySummary {
  totalAccounts: number;
  agentAccounts: number;
  investorAccounts: number;
  needsReview: number;
}

export interface AdminUserDirectoryPage {
  users: AdminUserDirectoryRow[];
  totalCount: number;
  filteredSummary: AdminUserDirectorySummary;
  platformSummary: AdminUserDirectorySummary;
  page: number;
  pageSize: number;
  source: "rpc" | "legacy";
}

export interface NormalizedAdminUserDirectoryParams {
  search: string;
  role: AppRole | null;
  verificationStatus: "pending" | "verified" | "suspended" | null;
  accountStatus: "active" | "suspended" | "deleted" | null;
  dataScope: "live" | "demo" | null;
  sort: AdminUserDirectorySort;
  page: number;
  pageSize: number;
  offset: number;
}

export function normalizeAdminUserDirectoryParams(
  params: AdminUserDirectoryParams = {},
): NormalizedAdminUserDirectoryParams {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(params.pageSize ?? 25)));
  return {
    search: params.search?.trim() ?? "",
    role: params.role && params.role !== "all" ? params.role : null,
    verificationStatus: params.verificationStatus && params.verificationStatus !== "all"
      ? params.verificationStatus
      : null,
    accountStatus: params.accountStatus && params.accountStatus !== "all"
      ? params.accountStatus
      : null,
    dataScope: params.dataScope && params.dataScope !== "all" ? params.dataScope : null,
    sort: params.sort ?? "recent",
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

type AdminListUsersRow = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];

function count(total: number, live: number, demo: number): AdminDirectoryCount {
  return { total: Number(total ?? 0), live: Number(live ?? 0), demo: Number(demo ?? 0) };
}

export function mapAdminListUsersRow(row: AdminListUsersRow): AdminUserDirectoryRow {
  const createdAt = row.profile_created_at ?? row.auth_created_at;
  const updatedAt = row.profile_updated_at ?? createdAt;
  return {
    id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    brokerage_name: row.brokerage_name,
    license_number: row.license_number,
    license_state: row.license_state,
    mls_number: row.mls_number,
    years_experience: row.years_experience,
    verification_status: row.verification_status,
    profile_photo_url: row.profile_photo_url,
    profileExists: row.profile_created_at != null,
    created_at: createdAt,
    updated_at: updatedAt,
    account_status: row.account_status === "deleted"
      ? "deleted"
      : row.account_status === "suspended"
        ? "suspended"
        : "active",
    auth_created_at: row.auth_created_at,
    last_sign_in_at: row.last_sign_in_at,
    email_confirmed_at: row.email_confirmed_at,
    phone_confirmed_at: row.phone_confirmed_at,
    banned_until: row.banned_until,
    auth_deleted_at: row.auth_deleted_at,
    roles: row.roles ?? [],
    clients: {
      ...count(row.client_count, row.live_client_count, row.demo_client_count),
      managed: Number(row.managed_client_count ?? 0),
      linked: Number(row.linked_client_count ?? 0),
    },
    exchanges: {
      ...count(row.exchange_count, row.live_exchange_count, row.demo_exchange_count),
      agentManaged: Number(row.agent_managed_exchange_count ?? 0),
      investorOwned: Number(row.investor_owned_exchange_count ?? 0),
      represented: Number(row.represented_exchange_count ?? 0),
      linkedClient: Number(row.linked_client_exchange_count ?? 0),
    },
    properties: count(row.property_count, row.live_property_count, row.demo_property_count),
    matches: {
      ...count(row.match_count, row.live_match_count, row.demo_match_count),
      buyerSide: Number(row.buyer_side_match_count ?? 0),
      sellerSide: Number(row.seller_side_match_count ?? 0),
    },
    hasLiveData: Boolean(row.has_live_data),
    hasDemoData: Boolean(row.has_demo_data) || Boolean(row.is_test_account),
    isTestAccount: Boolean(row.is_test_account),
  };
}

function isMissingAdminDirectoryRpc(error: { code?: string; message?: string }) {
  return error.code === "PGRST202" || error.code === "42883" ||
    /admin_list_users.*(not found|schema cache|does not exist)/i.test(error.message ?? "");
}

const EMPTY_SUMMARY: AdminUserDirectorySummary = {
  totalAccounts: 0,
  agentAccounts: 0,
  investorAccounts: 0,
  needsReview: 0,
};

function summaryFromRpcRow(
  row: AdminListUsersRow | undefined,
  scope: "filtered" | "platform",
): AdminUserDirectorySummary {
  if (!row) return EMPTY_SUMMARY;
  return {
    totalAccounts: Number(scope === "platform" ? row.platform_total_count : row.total_count),
    agentAccounts: Number(scope === "platform" ? row.platform_agent_count : row.filtered_agent_count),
    investorAccounts: Number(scope === "platform" ? row.platform_investor_count : row.filtered_investor_count),
    needsReview: Number(scope === "platform" ? row.platform_attention_count : row.filtered_attention_count),
  };
}

async function callAdminDirectoryRpc(params: NormalizedAdminUserDirectoryParams) {
  return supabase.rpc("admin_list_users", {
    p_search: params.search || null,
    p_role: params.role,
    p_verification_status: params.verificationStatus,
    p_account_status: params.accountStatus,
    p_data_scope: params.dataScope,
    p_sort: params.sort,
    p_limit: params.pageSize,
    p_offset: params.offset,
  });
}

async function loadFromAdminDirectoryRpc(
  params: NormalizedAdminUserDirectoryParams,
): Promise<AdminUserDirectoryPage> {
  const result = await callAdminDirectoryRpc(params);
  if (result.error) throw result.error;

  const rows = result.data ?? [];
  let platformSummary = summaryFromRpcRow(rows[0], "platform");
  if (!rows.length) {
    // An empty filtered page has no row on which PostgreSQL can carry window
    // totals. Fetch one unfiltered row so the platform summary cards never lie.
    const summaryResult = await callAdminDirectoryRpc(normalizeAdminUserDirectoryParams({ pageSize: 1 }));
    if (summaryResult.error) throw summaryResult.error;
    platformSummary = summaryFromRpcRow(summaryResult.data?.[0], "platform");
  }

  return {
    users: rows.map(mapAdminListUsersRow),
    totalCount: Number(rows[0]?.total_count ?? 0),
    filteredSummary: summaryFromRpcRow(rows[0], "filtered"),
    platformSummary,
    page: params.page,
    pageSize: params.pageSize,
    source: "rpc",
  };
}

async function loadFromLegacyTables(params: NormalizedAdminUserDirectoryParams): Promise<AdminUserDirectoryPage> {
  const [profiles, roles, clients, exchanges, assignments, properties, matches] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, company, brokerage_name, license_number, license_state, mls_number, years_experience, verification_status, profile_photo_url, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("agent_clients").select("id, agent_id, client_user_id, is_demo"),
    supabase.from("exchanges").select("id, agent_id, client_id, owner_type, is_demo, relinquished_property_id"),
    supabase.from("exchange_agent_assignments").select("exchange_id, agent_id, investor_id, status"),
    supabase.from("pledged_properties").select("id, agent_id, exchange_id, is_demo"),
    supabase.from("matches").select("id, buyer_exchange_id, seller_property_id, buyer_agent_id, seller_agent_id"),
  ]);

  const failed = [profiles, roles, clients, exchanges, assignments, properties, matches].find(
    (result) => result.error,
  );
  if (failed?.error) throw failed.error;

  const allUsers = buildAdminUserDirectory({
    profiles: (profiles.data ?? []) as Profile[],
    roles: (roles.data ?? []) as Role[],
    clients: (clients.data ?? []) as Client[],
    exchanges: (exchanges.data ?? []) as Exchange[],
    assignments: (assignments.data ?? []) as Assignment[],
    properties: (properties.data ?? []) as Property[],
    matches: (matches.data ?? []) as Match[],
  });
  const term = params.search.toLowerCase();
  const filtered = allUsers.filter((user) => {
    const matchesSearch = !term || [
      user.full_name, user.email, user.phone, user.company, user.brokerage_name,
      user.license_number, user.license_state, user.mls_number,
    ].some((value) => value?.toLowerCase().includes(term));
    const matchesRole = !params.role || user.roles.includes(params.role);
    const matchesVerification = !params.verificationStatus || (
      user.roles.includes("agent") && user.verification_status === params.verificationStatus
    );
    const matchesAccount = !params.accountStatus || user.account_status === params.accountStatus;
    const matchesData = !params.dataScope ||
      (params.dataScope === "live" ? user.hasLiveData : user.hasDemoData);
    return matchesSearch && matchesRole && matchesVerification && matchesAccount && matchesData;
  }).sort((a, b) => {
    if (params.sort === "name") {
      return (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "");
    }
    if (params.sort === "activity") {
      const aActivity = a.clients.total + a.exchanges.total + a.properties.total + a.matches.total;
      const bActivity = b.clients.total + b.exchanges.total + b.properties.total + b.matches.total;
      return bActivity - aActivity || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const summarize = (users: AdminUserDirectoryRow[]): AdminUserDirectorySummary => ({
    totalAccounts: users.length,
    agentAccounts: users.filter((user) => user.roles.includes("agent")).length,
    investorAccounts: users.filter((user) => user.roles.includes("investor")).length,
    needsReview: users.filter((user) =>
      user.account_status !== "active" ||
      (user.roles.includes("agent") && user.verification_status !== "verified")
    ).length,
  });

  return {
    users: filtered.slice(params.offset, params.offset + params.pageSize),
    totalCount: filtered.length,
    filteredSummary: summarize(filtered),
    platformSummary: summarize(allUsers),
    page: params.page,
    pageSize: params.pageSize,
    source: "legacy",
  };
}

export function useAdminUserDirectory(params: AdminUserDirectoryParams = {}) {
  const normalized = normalizeAdminUserDirectoryParams(params);
  return useQuery({
    queryKey: [...ADMIN_USER_DIRECTORY_QUERY_KEY, normalized],
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      try {
        return await loadFromAdminDirectoryRpc(normalized);
      } catch (error) {
        if (!isMissingAdminDirectoryRpc(error as { code?: string; message?: string })) throw error;
        // Deployment-safe fallback: the frontend can be published before the
        // additive Lovable migration. It is removed from the hot path as soon
        // as PostgREST sees admin_list_users.
        return loadFromLegacyTables(normalized);
      }
    },
  });
}

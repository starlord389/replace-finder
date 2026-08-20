import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type AdminUserScope = "all" | "live" | "demo";
export type AdminUserRelationship =
  | "account_owner"
  | "managing_agent"
  | "assigned_agent"
  | "linked_client_account"
  | "buyer_side"
  | "listing_side"
  | "historical_participant";

export type AdminUserClient = Tables<"agent_clients"> & {
  relationships: AdminUserRelationship[];
};

export type AdminUserExchange = Tables<"exchanges"> & {
  relationships: AdminUserRelationship[];
};

export type AdminUserProperty = Tables<"pledged_properties"> & {
  relationships: AdminUserRelationship[];
  contextualOnly: boolean;
};

export type AdminUserMatch = Tables<"matches"> & {
  relationships: AdminUserRelationship[];
};

export type AdminRepresentationInvite = Omit<Tables<"representation_invites">, "token">;
export type AdminClientInvite = Omit<Tables<"client_invites">, "token">;
const ADMIN_CLIENT_INVITE_FIELDS = "id, accepted_at, accepted_user_id, agent_id, client_id, created_at, email, expires_at, status, updated_at" as const;

export type AdminAuthAccount = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone_confirmed_at: string | null;
  banned_until: string | null;
  deleted_at: string | null;
};

export type AdminAccountState = {
  account_status: "active" | "suspended" | "deleted";
  previous_verification_status: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  reactivated_at: string | null;
  reactivated_by: string | null;
};

export type MatchWorkflowState = Tables<"match_workflow_states">;
export type MatchWorkflowEvent = Tables<"match_workflow_events">;

export type MessageMetadata = {
  id: string;
  parentId: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
};

export type AdminUser360 = {
  profile: Tables<"profiles">;
  profileExists: boolean;
  authAccount: AdminAuthAccount | null;
  accountState: AdminAccountState | null;
  overviewCounts: Record<string, number>;
  roles: Enums<"app_role">[];
  clients: AdminUserClient[];
  exchanges: AdminUserExchange[];
  properties: AdminUserProperty[];
  matches: AdminUserMatch[];
  contextualProperties: Tables<"pledged_properties">[];
  financialsByProperty: Record<string, Tables<"property_financials">>;
  imagesByProperty: Record<string, Tables<"property_images">[]>;
  documentsByProperty: Record<string, Tables<"property_documents">[]>;
  criteriaByExchange: Record<string, Tables<"replacement_criteria">>;
  clientsById: Record<string, Tables<"agent_clients">>;
  exchangesById: Record<string, Tables<"exchanges">>;
  propertiesById: Record<string, Tables<"pledged_properties">>;
  profilesById: Record<string, Tables<"profiles">>;
  workflowStatesByMatch: Record<string, MatchWorkflowState>;
  workflowEvents: MatchWorkflowEvent[];
  representations: Tables<"agent_representations">[];
  representationInvites: AdminRepresentationInvite[];
  assignments: Tables<"exchange_agent_assignments">[];
  contactRequests: Tables<"agent_contact_requests">[];
  recommendations: Tables<"agent_match_recommendations">[];
  connectionIntents: Tables<"agent_connection_intents">[];
  connections: Tables<"exchange_connections">[];
  collaborationThreads: Tables<"client_agent_threads">[];
  connectionMessageMetadata: MessageMetadata[];
  collaborationMessageMetadata: MessageMetadata[];
  savedProperties: Tables<"investor_saved_properties">[];
  listingInquiries: Tables<"listing_inquiries">[];
  investorPreferences: Tables<"investor_preferences"> | null;
  clientInvites: AdminClientInvite[];
  identificationList: Tables<"identification_list">[];
  notifications: Tables<"notifications">[];
  supportTickets: Tables<"support_tickets">[];
  timeline: Tables<"exchange_timeline">[];
  auditLog: Tables<"admin_audit_log">[];
  warnings: string[];
};

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type PagedQueryResult<T> = QueryResult<T[]> & { truncated?: boolean };

const ADMIN_HISTORY_PAGE_SIZE = 500;
const ADMIN_HISTORY_MAX_ROWS = 10_000;

export class AdminUserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "AdminUserNotFoundError";
  }
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function addRelationship<T extends { id: string }>(
  map: Map<string, T & { relationships: AdminUserRelationship[] }>,
  row: T,
  relationship: AdminUserRelationship,
) {
  const current = map.get(row.id);
  if (!current) {
    map.set(row.id, { ...row, relationships: [relationship] });
    return;
  }
  if (!current.relationships.includes(relationship)) current.relationships.push(relationship);
}

export function assignmentRelationshipsForUser(
  userId: string,
  assignment: Pick<Tables<"exchange_agent_assignments">, "agent_id" | "investor_id" | "status" | "revoked_at">,
): AdminUserRelationship[] {
  const isCurrent = assignment.status === "active" && !assignment.revoked_at;
  const relationships: AdminUserRelationship[] = [];
  if (assignment.agent_id === userId) relationships.push(isCurrent ? "assigned_agent" : "historical_participant");
  if (assignment.investor_id === userId) relationships.push(isCurrent ? "linked_client_account" : "historical_participant");
  return [...new Set(relationships)];
}

export function directPropertyRelationship(
  roles: Enums<"app_role">[],
  ownerType: Tables<"exchanges">["owner_type"] | null | undefined,
): AdminUserRelationship {
  if (ownerType === "agent") return "managing_agent";
  if (ownerType === "investor") return "account_owner";
  return roles.includes("agent") && !roles.includes("investor") ? "managing_agent" : "account_owner";
}

function collect<T>(result: QueryResult<T[]>, label: string, warnings: string[]) {
  if (result.error) {
    warnings.push(`${label}: ${result.error.message}`);
    return [] as T[];
  }
  return result.data ?? [];
}

function collectOne<T>(result: QueryResult<T>, label: string, warnings: string[]) {
  if (result.error) {
    warnings.push(`${label}: ${result.error.message}`);
    return null;
  }
  return result.data ?? null;
}

function collectPaged<T>(result: PagedQueryResult<T>, label: string, warnings: string[]) {
  const rows = collect(result, label, warnings);
  if (result.truncated) {
    warnings.push(`${label}: showing the newest ${rows.length.toLocaleString()} records; narrow the account scope to review older history`);
  }
  return rows;
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<QueryResult<T[]>>,
  pageSize = ADMIN_HISTORY_PAGE_SIZE,
): Promise<PagedQueryResult<T>> {
  const rows: T[] = [];
  for (let from = 0; from < ADMIN_HISTORY_MAX_ROWS; from += pageSize) {
    const result = await fetchPage(from, from + pageSize - 1);
    if (result.error) return { data: rows, error: result.error };
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
  return { data: rows, error: null, truncated: true };
}

async function loadAdminClientInvites(
  userId: string,
  warnings: string[],
): Promise<AdminClientInvite[]> {
  const resourceResult = await fetchAllPages<{
    resource_id: string;
    total_count: number;
  }>((from, to) => {
    const pageSize = to - from + 1;
    return supabase.rpc("admin_list_user_resources", {
      p_user_id: userId,
      p_resource_type: "client_invite",
      p_limit: pageSize,
      p_offset: from,
    }) as unknown as PromiseLike<QueryResult<Array<{ resource_id: string; total_count: number }>>>;
  }, 200);

  if (resourceResult.error) {
    // Deployment-safe fallback: direct identity edges remain safe, while the
    // warning makes clear that email-addressed pending invitations require the
    // admin graph migration. Never fall back to an unescaped ILIKE lookup.
    warnings.push(`Client invitation relationship graph: ${resourceResult.error.message}`);
    const fallback = await supabase
      .from("client_invites")
      .select(ADMIN_CLIENT_INVITE_FIELDS)
      .or(`agent_id.eq.${userId},accepted_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    return collect(fallback as QueryResult<AdminClientInvite[]>, "Client invitations", warnings);
  }

  if (resourceResult.truncated) {
    warnings.push(`Client invitations: relationship graph exceeded ${ADMIN_HISTORY_MAX_ROWS.toLocaleString()} records`);
  }
  const ids = [...new Set((resourceResult.data ?? []).map((row) => row.resource_id))];
  const invitations: AdminClientInvite[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const result = await supabase
      .from("client_invites")
      .select(ADMIN_CLIENT_INVITE_FIELDS)
      .in("id", ids.slice(index, index + 100))
      .order("created_at", { ascending: false });
    invitations.push(...collect(result as QueryResult<AdminClientInvite[]>, "Client invitations", warnings));
  }
  return uniqueById(invitations).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function groupByProperty<T extends { property_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((groups, row) => {
    (groups[row.property_id] ??= []).push(row);
    return groups;
  }, {});
}

function indexBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, T>>((index, row) => {
    const value = row[key];
    if (typeof value === "string") index[value] = row;
    return index;
  }, {});
}

function inFilter(values: string[]) {
  return `(${values.join(",")})`;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string) {
  // Several PostgREST `.or()` filters below use the route parameter in their
  // expression. UUID validation prevents malformed routes from becoming raw
  // filter syntax and gives the UI the same not-found treatment as a missing user.
  if (!UUID_PATTERN.test(value)) throw new AdminUserNotFoundError();
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeAuthAccount(value: unknown, userId: string): AdminAuthAccount | null {
  const row = jsonObject(value);
  const id = stringValue(row.id);
  const createdAt = stringValue(row.created_at);
  if (!id || !createdAt) return null;
  return {
    id: id || userId,
    email: stringValue(row.email),
    phone: stringValue(row.phone),
    created_at: createdAt,
    last_sign_in_at: stringValue(row.last_sign_in_at),
    email_confirmed_at: stringValue(row.email_confirmed_at),
    phone_confirmed_at: stringValue(row.phone_confirmed_at),
    banned_until: stringValue(row.banned_until),
    deleted_at: stringValue(row.deleted_at),
  };
}

function normalizeAccountState(value: unknown): AdminAccountState | null {
  const row = jsonObject(value);
  const status = row.account_status;
  if (status !== "active" && status !== "suspended" && status !== "deleted") return null;
  return {
    account_status: status,
    previous_verification_status: stringValue(row.previous_verification_status),
    suspended_at: stringValue(row.suspended_at),
    suspended_by: stringValue(row.suspended_by),
    suspension_reason: stringValue(row.suspension_reason),
    reactivated_at: stringValue(row.reactivated_at),
    reactivated_by: stringValue(row.reactivated_by),
  };
}

function normalizeCounts(value: unknown) {
  return Object.entries(jsonObject(value)).reduce<Record<string, number>>((counts, [key, current]) => {
    if (typeof current === "number" && Number.isFinite(current)) counts[key] = current;
    return counts;
  }, {});
}

export function synthesizeProfileFromAuth(auth: AdminAuthAccount): Tables<"profiles"> {
  return {
    id: auth.id,
    full_name: null,
    email: auth.email,
    phone: auth.phone,
    company: null,
    brokerage_name: null,
    brokerage_address: null,
    license_number: null,
    license_state: null,
    mls_number: null,
    years_experience: null,
    verification_status: "pending",
    verified_at: null,
    verified_by: null,
    bio: null,
    profile_headline: null,
    profile_photo_url: null,
    service_areas: [],
    specializations: [],
    completed_1031_exchanges: null,
    career_transaction_volume: null,
    launchpad_client_requests_ack_at: null,
    launchpad_completed_at: null,
    launchpad_matches_ack_at: null,
    launchpad_matching_ack_at: null,
    launchpad_pipeline_ack_at: null,
    launchpad_version: null,
    created_at: auth.created_at,
    updated_at: auth.created_at,
  };
}

function maybeIn<T>(
  values: string[],
  query: () => PromiseLike<QueryResult<T[]>>,
): Promise<QueryResult<T[]>> {
  return values.length ? Promise.resolve(query()) : Promise.resolve({ data: [], error: null });
}

function asMessageMetadata(
  rows: Array<{ id: string; sender_id: string; created_at: string; read_at: string | null }>,
  parentKey: "connection_id" | "thread_id",
) {
  return rows.map((row) => ({
    id: row.id,
    parentId: (row as typeof row & Record<typeof parentKey, string>)[parentKey],
    senderId: row.sender_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  }));
}

/**
 * Resolves every current platform relationship for one account. This intentionally
 * keeps relationship labels instead of flattening identities: an account can be
 * an agent, a self-managed property owner, and a linked CRM client at the same time.
 * Message bodies are never loaded by this overview query.
 */
export async function loadAdminUser360(userId: string): Promise<AdminUser360> {
  assertUuid(userId);
  const warnings: string[] = [];
  const overviewResult = await supabase.rpc("admin_get_user_overview", { p_user_id: userId }).maybeSingle();
  let authAccount: AdminAuthAccount | null = null;
  let accountState: AdminAccountState | null = null;
  let overviewCounts: Record<string, number> = {};
  let overviewRoles: Enums<"app_role">[] | null = null;
  let profile: Tables<"profiles"> | null = null;
  let profileExists = false;

  if (!overviewResult.error && overviewResult.data) {
    authAccount = normalizeAuthAccount(overviewResult.data.auth_account, userId);
    accountState = normalizeAccountState(overviewResult.data.account_state);
    overviewCounts = normalizeCounts(overviewResult.data.counts);
    overviewRoles = overviewResult.data.roles ?? [];
    const profileObject = jsonObject(overviewResult.data.profile);
    profileExists = Object.keys(profileObject).length > 0;
    if (profileExists) profile = profileObject as Tables<"profiles">;
    else if (authAccount) profile = synthesizeProfileFromAuth(authAccount);
  } else if (overviewResult.error) {
    // The application can be shipped before Lovable applies the additive RPC.
    // Existing profile-backed accounts remain available through the legacy read;
    // auth-only accounts become available as soon as the migration is deployed.
    warnings.push(`Auth account overview: ${overviewResult.error.message}`);
  }

  if (!profile) {
    const profileResult = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileResult.error) throw profileResult.error;
    if (!profileResult.data) throw new AdminUserNotFoundError();
    profile = profileResult.data;
    profileExists = true;
  }

  const [
    rolesResult,
    clientsResult,
    ownedExchangesResult,
    assignmentsResult,
    representationsResult,
    contactRequestsResult,
    recommendationsResult,
    intentsResult,
    savedResult,
    inquiriesResult,
    threadsResult,
    preferencesResult,
    notificationsResult,
    supportResult,
    auditResult,
    clientInvites,
  ] = await Promise.all([
    supabase.from("user_roles").select("*").eq("user_id", userId),
    supabase.from("agent_clients").select("*").or(`agent_id.eq.${userId},client_user_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("exchanges").select("*").eq("agent_id", userId).order("created_at", { ascending: false }),
    supabase.from("exchange_agent_assignments").select("*").or(`agent_id.eq.${userId},investor_id.eq.${userId}`).order("assigned_at", { ascending: false }),
    supabase.from("agent_representations").select("*").or(`agent_id.eq.${userId},investor_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("agent_contact_requests").select("*").or(`investor_id.eq.${userId},representing_agent_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("agent_match_recommendations").select("*").or(`investor_id.eq.${userId},agent_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("agent_connection_intents").select("*").or(`waiting_owner_id.eq.${userId},initiating_agent_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("investor_saved_properties").select("*").eq("investor_id", userId).order("created_at", { ascending: false }),
    supabase.from("listing_inquiries").select("*").or(`investor_id.eq.${userId},listing_agent_id.eq.${userId}`).order("created_at", { ascending: false }),
    supabase.from("client_agent_threads").select("*").or(`investor_id.eq.${userId},agent_id.eq.${userId}`).order("updated_at", { ascending: false }),
    supabase.from("investor_preferences").select("*").eq("user_id", userId).maybeSingle(),
    fetchAllPages((from, to) => supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(from, to)),
    fetchAllPages((from, to) => supabase.from("support_tickets").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(from, to)),
    fetchAllPages((from, to) => supabase.from("admin_audit_log").select("*").or(`actor_id.eq.${userId},entity_id.eq.${userId}`).order("created_at", { ascending: false }).range(from, to)),
    // The server graph performs exact case-insensitive email matching and only
    // returns safe resource ids. Bearer invitation tokens never reach the browser.
    loadAdminClientInvites(userId, warnings),
  ]);

  const roles = overviewRoles ?? collect(rolesResult, "Roles", warnings).map((row) => row.role);
  const clientRows = collect(clientsResult, "Clients", warnings);
  const assignments = collect(assignmentsResult, "Exchange assignments", warnings);
  const representations = collect(representationsResult, "Representations", warnings);
  const contactRequests = collect(contactRequestsResult, "Contact requests", warnings);
  const recommendations = collect(recommendationsResult, "Recommendations", warnings);
  const connectionIntents = collect(intentsResult, "Connection intents", warnings);
  const savedProperties = collect(savedResult, "Saved properties", warnings);
  const listingInquiries = collect(inquiriesResult, "Listing inquiries", warnings);
  const collaborationThreads = collect(threadsResult, "Client-agent threads", warnings);
  const investorPreferences = collectOne(preferencesResult, "Investor preferences", warnings);
  const notifications = collectPaged(notificationsResult, "Notifications", warnings);
  const supportTickets = collectPaged(supportResult, "Support tickets", warnings);
  const auditLog = collectPaged(auditResult, "Audit history", warnings).filter(
    (row) => row.actor_id === userId || (row.entity_type === "user" && row.entity_id === userId),
  );
  const directClientInvites = clientInvites;

  const clientMap = new Map<string, AdminUserClient>();
  for (const client of clientRows) {
    if (client.agent_id === userId) addRelationship(clientMap, client, "managing_agent");
    if (client.client_user_id === userId) addRelationship(clientMap, client, "linked_client_account");
  }
  const clients = [...clientMap.values()];

  const clientExchangeResult = await maybeIn(
    clients.map((client) => client.id),
    () => supabase.from("exchanges").select("*").in("client_id", clients.map((client) => client.id)).order("created_at", { ascending: false }),
  );
  const assignedExchangeResult = await maybeIn(
    assignments.map((assignment) => assignment.exchange_id),
    () => supabase.from("exchanges").select("*").in("id", assignments.map((assignment) => assignment.exchange_id)).order("created_at", { ascending: false }),
  );

  const ownedExchanges = collect(ownedExchangesResult, "Owned exchanges", warnings);
  const clientExchanges = collect(clientExchangeResult, "Client exchanges", warnings);
  const assignedExchanges = collect(assignedExchangeResult, "Assigned exchanges", warnings);
  const exchangeMap = new Map<string, AdminUserExchange>();
  for (const exchange of ownedExchanges) {
    addRelationship(
      exchangeMap,
      exchange,
      exchange.owner_type === "investor" ? "account_owner" : "managing_agent",
    );
  }
  for (const exchange of clientExchanges) {
    const client = clientMap.get(exchange.client_id ?? "");
    if (client?.relationships.includes("managing_agent")) addRelationship(exchangeMap, exchange, "managing_agent");
    if (client?.relationships.includes("linked_client_account")) addRelationship(exchangeMap, exchange, "linked_client_account");
  }
  for (const exchange of assignedExchanges) {
    const relatedAssignments = assignments.filter((assignment) => assignment.exchange_id === exchange.id);
    for (const assignment of relatedAssignments) {
      assignmentRelationshipsForUser(userId, assignment).forEach((relationship) => {
        addRelationship(exchangeMap, exchange, relationship);
      });
    }
  }
  const exchanges = [...exchangeMap.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const exchangeIds = exchanges.map((exchange) => exchange.id);

  const propertyOrFilters = [`agent_id.eq.${userId}`];
  if (exchangeIds.length) propertyOrFilters.push(`exchange_id.in.${inFilter(exchangeIds)}`);
  const propertyResult = await supabase
    .from("pledged_properties")
    .select("*")
    .or(propertyOrFilters.join(","))
    .order("created_at", { ascending: false });
  const directProperties = collect(propertyResult, "Properties", warnings);
  const propertyMap = new Map<string, AdminUserProperty>();
  for (const property of directProperties) {
    if (property.agent_id === userId) {
      const relatedExchange = property.exchange_id ? exchangeMap.get(property.exchange_id) : null;
      addRelationship(
        propertyMap,
        { ...property, contextualOnly: false },
        directPropertyRelationship(roles, relatedExchange?.owner_type),
      );
    }
    if (property.exchange_id && exchangeMap.get(property.exchange_id)?.relationships.includes("managing_agent")) {
      addRelationship(propertyMap, { ...property, contextualOnly: false }, "managing_agent");
    }
    if (property.exchange_id && exchangeMap.get(property.exchange_id)?.relationships.includes("assigned_agent")) {
      addRelationship(propertyMap, { ...property, contextualOnly: false }, "assigned_agent");
    }
    if (property.exchange_id && exchangeMap.get(property.exchange_id)?.relationships.includes("linked_client_account")) {
      addRelationship(propertyMap, { ...property, contextualOnly: false }, "linked_client_account");
    }
  }
  const directPropertyIds = [...propertyMap.keys()];

  const matchOrFilters = [`buyer_agent_id.eq.${userId}`, `seller_agent_id.eq.${userId}`];
  if (exchangeIds.length) matchOrFilters.push(`buyer_exchange_id.in.${inFilter(exchangeIds)}`);
  if (directPropertyIds.length) matchOrFilters.push(`seller_property_id.in.${inFilter(directPropertyIds)}`);
  const matchesResult = await supabase
    .from("matches")
    .select("*")
    .or(matchOrFilters.join(","))
    .order("created_at", { ascending: false });
  const matchRows = collect(matchesResult, "Matches", warnings);
  const matchMap = new Map<string, AdminUserMatch>();
  for (const match of matchRows) {
    if (exchangeMap.has(match.buyer_exchange_id)) addRelationship(matchMap, match, "buyer_side");
    if (propertyMap.has(match.seller_property_id)) addRelationship(matchMap, match, "listing_side");
    if (match.buyer_agent_id === userId || match.seller_agent_id === userId) {
      addRelationship(matchMap, match, "historical_participant");
    }
  }
  const matches = [...matchMap.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const matchIds = matches.map((match) => match.id);

  const contextPropertyIds = [...new Set([
    ...matches.flatMap((match) => [match.seller_property_id, match.relinquished_property_id]),
    ...savedProperties.map((saved) => saved.property_id),
    ...listingInquiries.map((inquiry) => inquiry.property_id),
    ...contactRequests.map((request) => request.property_id),
    ...connectionIntents.map((intent) => intent.property_id),
  ])];
  const contextPropertyResult = await maybeIn(
    contextPropertyIds,
    () => supabase.from("pledged_properties").select("*").in("id", contextPropertyIds),
  );
  const contextualProperties = collect(contextPropertyResult, "Match properties", warnings);
  for (const property of contextualProperties) {
    if (!propertyMap.has(property.id)) {
      propertyMap.set(property.id, { ...property, relationships: [], contextualOnly: true });
    }
  }
  const allProperties = [...propertyMap.values()];
  const allPropertyIds = allProperties.map((property) => property.id);

  const connectionOrFilters = [`buyer_agent_id.eq.${userId}`, `seller_agent_id.eq.${userId}`];
  if (exchangeIds.length) {
    connectionOrFilters.push(`buyer_exchange_id.in.${inFilter(exchangeIds)}`);
    connectionOrFilters.push(`seller_exchange_id.in.${inFilter(exchangeIds)}`);
  }

  const representationIds = representations.map((representation) => representation.id);
  const connectionResultPromise = supabase
    .from("exchange_connections")
    .select("*")
    .or(connectionOrFilters.join(","))
    .order("created_at", { ascending: false });

  const [
    financialsResult,
    imagesResult,
    documentsResult,
    criteriaResult,
    connectionsResult,
    repInvitesResult,
    identificationResult,
    timelineResult,
    workflowStatesResult,
    workflowEventsResult,
  ] = await Promise.all([
    maybeIn(allPropertyIds, () => supabase.from("property_financials").select("*").in("property_id", allPropertyIds)),
    maybeIn(allPropertyIds, () => supabase.from("property_images").select("*").in("property_id", allPropertyIds).order("sort_order", { ascending: true })),
    maybeIn(allPropertyIds, () => supabase.from("property_documents").select("*").in("property_id", allPropertyIds).order("created_at", { ascending: false })),
    maybeIn(exchangeIds, () => supabase.from("replacement_criteria").select("*").in("exchange_id", exchangeIds)),
    connectionResultPromise,
    maybeIn(representationIds, () => supabase.from("representation_invites").select("id, accepted_at, accepted_user_id, cancelled_at, cancelled_by, created_at, created_by, delivery_error_code, delivery_status, direction, email, expires_at, last_sent_at, metadata, representation_id, send_count, status, updated_at").in("representation_id", representationIds).order("created_at", { ascending: false })),
    maybeIn(exchangeIds, () => supabase.from("identification_list").select("*").in("exchange_id", exchangeIds).order("added_at", { ascending: false })),
    exchangeIds.length
      ? fetchAllPages((from, to) => supabase.from("exchange_timeline").select("*").in("exchange_id", exchangeIds).order("created_at", { ascending: false }).range(from, to))
      : Promise.resolve({ data: [], error: null }),
    maybeIn(matchIds, () => supabase.from("match_workflow_states").select("*").in("match_id", matchIds)),
    matchIds.length
      ? fetchAllPages((from, to) => supabase.from("match_workflow_events").select("*").in("match_id", matchIds).order("created_at", { ascending: false }).range(from, to))
      : Promise.resolve({ data: [], error: null }),
  ]);

  const financials = collect(financialsResult, "Property financials", warnings);
  const images = collect(imagesResult, "Property images", warnings);
  const documents = collect(documentsResult, "Property documents", warnings);
  const criteria = collect(criteriaResult, "Exchange criteria", warnings);
  const connections = collect(connectionsResult, "Connections", warnings);
  const representationInvites = collect(
    repInvitesResult as QueryResult<AdminRepresentationInvite[]>,
    "Representation invitations",
    warnings,
  );
  const identificationList = collect(identificationResult, "Identification list", warnings);
  const timeline = collectPaged(timelineResult, "Exchange timeline", warnings);
  const workflowStates = collect(workflowStatesResult, "Match workflow state", warnings);
  const workflowEvents = collectPaged(workflowEventsResult, "Match workflow history", warnings);

  const connectionIds = connections.map((connection) => connection.id);
  const threadIds = collaborationThreads.map((thread) => thread.id);
  const [connectionMessagesResult, collaborationMessagesResult] = await Promise.all([
    connectionIds.length
      ? fetchAllPages((from, to) => supabase.from("messages").select("id, connection_id, sender_id, created_at, read_at").in("connection_id", connectionIds).order("created_at", { ascending: false }).range(from, to))
      : Promise.resolve({ data: [], error: null }),
    threadIds.length
      ? fetchAllPages((from, to) => supabase.from("client_agent_messages").select("id, thread_id, sender_id, created_at, read_at").in("thread_id", threadIds).order("created_at", { ascending: false }).range(from, to))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const connectionMessageRows = collectPaged(connectionMessagesResult, "Connection message metadata", warnings);
  const collaborationMessageRows = collectPaged(collaborationMessagesResult, "Collaboration message metadata", warnings);

  const relatedProfileIds = new Set<string>([userId]);
  clients.forEach((client) => {
    relatedProfileIds.add(client.agent_id);
    if (client.client_user_id) relatedProfileIds.add(client.client_user_id);
  });
  assignments.forEach((assignment) => {
    relatedProfileIds.add(assignment.agent_id);
    relatedProfileIds.add(assignment.investor_id);
  });
  representations.forEach((representation) => {
    if (representation.agent_id) relatedProfileIds.add(representation.agent_id);
    if (representation.investor_id) relatedProfileIds.add(representation.investor_id);
  });
  connections.forEach((connection) => {
    relatedProfileIds.add(connection.buyer_agent_id);
    relatedProfileIds.add(connection.seller_agent_id);
  });
  contactRequests.forEach((request) => {
    relatedProfileIds.add(request.investor_id);
    if (request.representing_agent_id) relatedProfileIds.add(request.representing_agent_id);
  });
  recommendations.forEach((recommendation) => {
    relatedProfileIds.add(recommendation.agent_id);
    relatedProfileIds.add(recommendation.investor_id);
  });
  connectionIntents.forEach((intent) => {
    relatedProfileIds.add(intent.initiating_agent_id);
    relatedProfileIds.add(intent.waiting_owner_id);
  });
  listingInquiries.forEach((inquiry) => {
    relatedProfileIds.add(inquiry.investor_id);
    relatedProfileIds.add(inquiry.listing_agent_id);
  });
  collaborationThreads.forEach((thread) => {
    relatedProfileIds.add(thread.agent_id);
    relatedProfileIds.add(thread.investor_id);
  });
  const profileIds = [...relatedProfileIds];
  const relatedProfilesResult = await supabase.from("profiles").select("*").in("id", profileIds);
  const profiles = collect(relatedProfilesResult, "Related profiles", warnings);

  const allExchanges = uniqueById([...exchanges, ...ownedExchanges, ...clientExchanges, ...assignedExchanges]);
  const completenessChecks: Array<[string, number | undefined, number]> = [
    ["exchanges", overviewCounts.related_exchanges, exchanges.length],
    ["properties", overviewCounts.related_properties, [...propertyMap.values()].filter((row) => !row.contextualOnly).length],
    ["matches", overviewCounts.related_matches, matches.length],
    ["connections", overviewCounts.exchange_connections, connections.length],
    ["collaboration threads", overviewCounts.client_agent_threads, collaborationThreads.length],
  ];
  completenessChecks.forEach(([label, expected, loaded]) => {
    if (expected != null && loaded < expected) {
      warnings.push(`${label}: loaded ${loaded} of ${expected}; narrow the account view or check admin read policies`);
    }
  });

  return {
    profile,
    profileExists,
    authAccount,
    accountState,
    overviewCounts,
    roles,
    clients,
    exchanges,
    properties: allProperties.filter((property) => !property.contextualOnly),
    matches,
    contextualProperties,
    financialsByProperty: indexBy(financials, "property_id"),
    imagesByProperty: groupByProperty(images),
    documentsByProperty: groupByProperty(documents),
    criteriaByExchange: indexBy(criteria, "exchange_id"),
    clientsById: indexBy(clientRows, "id"),
    exchangesById: indexBy(allExchanges, "id"),
    propertiesById: indexBy(allProperties, "id"),
    profilesById: indexBy(profiles, "id"),
    workflowStatesByMatch: indexBy(workflowStates, "match_id"),
    workflowEvents,
    representations,
    representationInvites,
    assignments,
    contactRequests,
    recommendations,
    connectionIntents,
    connections,
    collaborationThreads,
    connectionMessageMetadata: asMessageMetadata(connectionMessageRows, "connection_id"),
    collaborationMessageMetadata: asMessageMetadata(collaborationMessageRows, "thread_id"),
    savedProperties,
    listingInquiries,
    investorPreferences,
    clientInvites: directClientInvites,
    identificationList,
    notifications,
    supportTickets,
    timeline,
    auditLog,
    warnings,
  };
}

export function useAdminUser360(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin-user-360", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: () => loadAdminUser360(userId!),
  });
}

export function recordMatchesScope(record: { is_demo?: boolean }, scope: AdminUserScope) {
  if (scope === "all") return true;
  return scope === "demo" ? record.is_demo === true : record.is_demo !== true;
}

export type AdminUserScopedData = {
  clients: AdminUser360["clients"];
  exchanges: AdminUserExchange[];
  properties: AdminUserProperty[];
  matches: AdminUserMatch[];
  representations: AdminUser360["representations"];
  representationInvites: AdminUser360["representationInvites"];
  assignments: AdminUser360["assignments"];
  contactRequests: AdminUser360["contactRequests"];
  recommendations: AdminUser360["recommendations"];
  connectionIntents: AdminUser360["connectionIntents"];
  connections: AdminUser360["connections"];
  collaborationThreads: AdminUser360["collaborationThreads"];
  connectionMessageMetadata: AdminUser360["connectionMessageMetadata"];
  collaborationMessageMetadata: AdminUser360["collaborationMessageMetadata"];
  savedProperties: AdminUser360["savedProperties"];
  listingInquiries: AdminUser360["listingInquiries"];
  clientInvites: AdminUser360["clientInvites"];
  identificationList: AdminUser360["identificationList"];
  timeline: AdminUser360["timeline"];
  workflowEvents: AdminUser360["workflowEvents"];
};

/**
 * Applies the live/demo workspace boundary to every relationship that can be
 * traced to a client, exchange, property, match, or representation. Account-wide
 * records such as profile fields, support tickets, and audit entries intentionally
 * remain outside this scoped result.
 */
export function scopeAdminUser360(data: AdminUser360, scope: AdminUserScope): AdminUserScopedData {
  if (scope === "all") {
    return {
      clients: data.clients,
      exchanges: data.exchanges,
      properties: data.properties,
      matches: data.matches,
      representations: data.representations,
      representationInvites: data.representationInvites,
      assignments: data.assignments,
      contactRequests: data.contactRequests,
      recommendations: data.recommendations,
      connectionIntents: data.connectionIntents,
      connections: data.connections,
      collaborationThreads: data.collaborationThreads,
      connectionMessageMetadata: data.connectionMessageMetadata,
      collaborationMessageMetadata: data.collaborationMessageMetadata,
      savedProperties: data.savedProperties,
      listingInquiries: data.listingInquiries,
      clientInvites: data.clientInvites,
      identificationList: data.identificationList,
      timeline: data.timeline,
      workflowEvents: data.workflowEvents,
    };
  }

  const clients = data.clients.filter((row) => recordMatchesScope(row, scope));
  const exchanges = data.exchanges.filter((row) => recordMatchesScope(row, scope));
  const properties = data.properties.filter((row) => recordMatchesScope(row, scope));
  const representations = data.representations.filter((row) => recordMatchesScope(row, scope));
  const exchangeIds = new Set(exchanges.map((row) => row.id));
  const propertyIds = new Set(properties.map((row) => row.id));
  const representationIds = new Set(representations.map((row) => row.id));
  const matches = data.matches.filter((row) =>
    exchangeIds.has(row.buyer_exchange_id) || propertyIds.has(row.seller_property_id),
  );
  const matchIds = new Set(matches.map((row) => row.id));
  const assignments = data.assignments.filter((row) =>
    exchangeIds.has(row.exchange_id) || representationIds.has(row.representation_id),
  );
  const contactRequests = data.contactRequests.filter((row) =>
    exchangeIds.has(row.exchange_id) || matchIds.has(row.match_id) || propertyIds.has(row.property_id),
  );
  const recommendations = data.recommendations.filter((row) =>
    exchangeIds.has(row.exchange_id) || matchIds.has(row.match_id),
  );
  const connectionIntents = data.connectionIntents.filter((row) => recordMatchesScope(row, scope));
  const connections = data.connections.filter((row) =>
    matchIds.has(row.match_id) ||
    exchangeIds.has(row.buyer_exchange_id) ||
    Boolean(row.seller_exchange_id && exchangeIds.has(row.seller_exchange_id)),
  );
  const connectionIds = new Set(connections.map((row) => row.id));
  const collaborationThreads = data.collaborationThreads.filter((row) =>
    Boolean(row.exchange_id && exchangeIds.has(row.exchange_id)) ||
    Boolean(row.match_id && matchIds.has(row.match_id)) ||
    Boolean(row.representation_id && representationIds.has(row.representation_id)),
  );
  const threadIds = new Set(collaborationThreads.map((row) => row.id));
  const visibleClientIds = new Set(clients.map((row) => row.id));

  return {
    clients,
    exchanges,
    properties,
    matches,
    representations,
    representationInvites: data.representationInvites.filter((row) => representationIds.has(row.representation_id)),
    assignments,
    contactRequests,
    recommendations,
    connectionIntents,
    connections,
    collaborationThreads,
    connectionMessageMetadata: data.connectionMessageMetadata.filter((row) => connectionIds.has(row.parentId)),
    collaborationMessageMetadata: data.collaborationMessageMetadata.filter((row) => threadIds.has(row.parentId)),
    savedProperties: data.savedProperties.filter((row) => recordMatchesScope(row, scope)),
    listingInquiries: data.listingInquiries.filter((row) => recordMatchesScope(row, scope)),
    clientInvites: data.clientInvites.filter((row) => visibleClientIds.has(row.client_id)),
    identificationList: data.identificationList.filter((row) => exchangeIds.has(row.exchange_id)),
    timeline: data.timeline.filter((row) => exchangeIds.has(row.exchange_id)),
    workflowEvents: data.workflowEvents.filter((row) => matchIds.has(row.match_id)),
  };
}

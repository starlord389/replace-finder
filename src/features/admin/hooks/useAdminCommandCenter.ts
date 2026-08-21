import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";
import {
  adminRoleSummary,
  exchangeManagedForLabel,
  exchangeOwnerTypeLabel,
  isInvestorOwned,
} from "@/features/admin/lib/accountTypes";
import { getListingLocationLabel, resolveListingName } from "@/lib/listingDisplay";

type Profile = Tables<"profiles">;
type UserRole = Tables<"user_roles">;
type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type Match = Tables<"matches">;
type Connection = Tables<"exchange_connections">;
type Client = Tables<"agent_clients">;
type Ticket = Tables<"support_tickets">;
type Demo = Tables<"demo_requests">;
type Contact = Tables<"contact_submissions">;
type Referral = Tables<"referrals">;
type EventRegistration = Tables<"event_registrations">;
type TimelineEvent = Tables<"exchange_timeline">;
type Representation = Tables<"agent_representations">;
type RepresentationInvite = Pick<
  Tables<"representation_invites">,
  "id" | "delivery_status" | "status" | "email" | "delivery_error_code" | "updated_at" | "representation_id"
>;
type ExchangeAssignment = Tables<"exchange_agent_assignments">;
type AgentContactRequest = Tables<"agent_contact_requests">;
type AgentConnectionIntent = Tables<"agent_connection_intents">;
type AdminAccountSummaryRow = Database["public"]["Functions"]["admin_get_account_summary"]["Returns"][number];
type CountedAdminQueryResult = {
  data: readonly unknown[] | null;
  error: { message: string } | null;
  count: number | null;
};

export type AdminAttentionPriority = "critical" | "high" | "medium";

export interface AdminAttentionItem {
  id: string;
  priority: AdminAttentionPriority;
  category: "deadline" | "support" | "lead" | "demo" | "connection" | "account" | "representation";
  title: string;
  detail: string;
  timestamp: string;
  href: string;
}

export interface AdminSearchItem {
  id: string;
  type: "User" | "Exchange" | "Property" | "Connection" | "Demo" | "Lead" | "Ticket" | "Event";
  title: string;
  subtitle: string;
  href: string;
}

export interface CommandCenterSource {
  profiles: Profile[];
  roles: UserRole[];
  exchanges: Exchange[];
  properties: Property[];
  matches: Match[];
  connections: Connection[];
  clients: Client[];
  tickets: Ticket[];
  demos: Demo[];
  contacts: Contact[];
  referrals: Referral[];
  eventRegistrations: EventRegistration[];
  timeline: TimelineEvent[];
  representations: Representation[];
  representationInvites: RepresentationInvite[];
  assignments: ExchangeAssignment[];
  contactRequests: AgentContactRequest[];
  connectionIntents: AgentConnectionIntent[];
}

const ACTIVE_EXCHANGE_STATUSES = new Set(["active", "in_identification", "in_closing"]);
const PRIORITY_ORDER: Record<AdminAttentionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export interface AdminAccountSummary {
  totalAccounts: number;
  agentAccounts: number;
  investorAccounts: number;
  newAccounts7d: number;
}

type AdminCommandCenterSnapshot = {
  attentionItems: AdminAttentionItem[];
  attentionTotal: number;
  attentionTruncated: boolean;
  pipeline: Record<string, number>;
  upcomingDemos: Demo[];
  recentActivity: TimelineEvent[];
  eventRegistrations: EventRegistration[];
  lastUpdatedAt: string;
  overdueDeadlineCount: number;
  kpis: {
    activeExchanges: number;
    activeMatches: number;
    readyToAdvance: number;
    openConnections: number;
    properties: number;
    activeRepresentations: number;
    openContactRequests: number;
    awaitingRepresentation: number;
    openTickets: number;
    newLeads: number;
  };
  growth: {
    users: number;
    exchanges: number;
    demos: number;
    events: number;
  };
};

function parseCommandCenterSnapshot(value: unknown): AdminCommandCenterSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The Command Center returned an invalid response.");
  }
  const row = value as Partial<AdminCommandCenterSnapshot>;
  return {
    attentionItems: Array.isArray(row.attentionItems) ? row.attentionItems : [],
    attentionTotal: Number(row.attentionTotal ?? 0),
    attentionTruncated: Boolean(row.attentionTruncated),
    pipeline: row.pipeline && typeof row.pipeline === "object" ? row.pipeline : {},
    upcomingDemos: Array.isArray(row.upcomingDemos) ? row.upcomingDemos : [],
    recentActivity: Array.isArray(row.recentActivity) ? row.recentActivity : [],
    eventRegistrations: Array.isArray(row.eventRegistrations) ? row.eventRegistrations : [],
    lastUpdatedAt: String(row.lastUpdatedAt ?? new Date().toISOString()),
    overdueDeadlineCount: Number(row.overdueDeadlineCount ?? 0),
    kpis: {
      activeExchanges: Number(row.kpis?.activeExchanges ?? 0),
      activeMatches: Number(row.kpis?.activeMatches ?? 0),
      readyToAdvance: Number(row.kpis?.readyToAdvance ?? 0),
      openConnections: Number(row.kpis?.openConnections ?? 0),
      properties: Number(row.kpis?.properties ?? 0),
      activeRepresentations: Number(row.kpis?.activeRepresentations ?? 0),
      openContactRequests: Number(row.kpis?.openContactRequests ?? 0),
      awaitingRepresentation: Number(row.kpis?.awaitingRepresentation ?? 0),
      openTickets: Number(row.kpis?.openTickets ?? 0),
      newLeads: Number(row.kpis?.newLeads ?? 0),
    },
    growth: {
      users: Number(row.growth?.users ?? 0),
      exchanges: Number(row.growth?.exchanges ?? 0),
      demos: Number(row.growth?.demos ?? 0),
      events: Number(row.growth?.events ?? 0),
    },
  };
}

export function mapAdminAccountSummary(row: AdminAccountSummaryRow): AdminAccountSummary {
  return {
    totalAccounts: Number(row.total_accounts ?? 0),
    agentAccounts: Number(row.agent_accounts ?? 0),
    investorAccounts: Number(row.investor_accounts ?? 0),
    newAccounts7d: Number(row.new_accounts_7d ?? 0),
  };
}

export function assertAdminCommandCenterRowsComplete(
  label: string,
  loadedCount: number,
  totalCount: number | null,
) {
  if (totalCount == null) {
    throw new Error(
      `Command Center could not verify the ${label} row count. Partial operational totals will not be shown.`,
    );
  }
  if (loadedCount !== totalCount) {
    throw new Error(
      `Command Center loaded ${loadedCount} of ${totalCount} ${label} records. Partial operational totals will not be shown.`,
    );
  }
}

function clean(value: string | null | undefined, fallback = "Unknown") {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function fullLocation(property: Property) {
  return getListingLocationLabel(property) || "Location unavailable";
}

function propertyLabel(property: Property) {
  return resolveListingName(property, true);
}

function daysUntil(iso: string) {
  const day = 24 * 60 * 60 * 1000;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / day);
}

function deadlineTitle(label: string, days: number) {
  if (days < 0) return `${label} overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return `${label} is due today`;
  return `${label} in ${days} day${days === 1 ? "" : "s"}`;
}

function deadlinePriority(days: number): AdminAttentionPriority | null {
  if (days <= 2) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return null;
}

function ageInDays(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function buildAdminAttentionItems(source: CommandCenterSource): AdminAttentionItem[] {
  const clientsById = new Map(source.clients.map((client) => [client.id, client.client_name]));
  const profilesById = new Map(source.profiles.map((profile) => [profile.id, clean(profile.full_name, profile.email ?? undefined)]));
  const exchangesById = new Map(source.exchanges.map((exchange) => [exchange.id, exchange]));
  const items: AdminAttentionItem[] = [];

  for (const exchange of source.exchanges) {
    if (!ACTIVE_EXCHANGE_STATUSES.has(exchange.status)) continue;
    const ownerName = clean(profilesById.get(exchange.agent_id), "Account owner");
    const detail = isInvestorOwned(exchange.owner_type)
      ? `${ownerName} · ${exchangeOwnerTypeLabel(exchange.owner_type)} · Self-managed`
      : `${exchangeManagedForLabel(exchange.owner_type, clientsById.get(exchange.client_id))} · Agent ${ownerName}`;
    const deadlines = [
      ["Identification deadline", exchange.identification_deadline],
      ["Closing deadline", exchange.closing_deadline],
    ] as const;

    for (const [label, deadline] of deadlines) {
      if (!deadline) continue;
      const days = daysUntil(deadline);
      const priority = deadlinePriority(days);
      if (!priority) continue;
      items.push({
        id: `deadline-${exchange.id}-${label}`,
        priority,
        category: "deadline",
        title: deadlineTitle(label, days),
        detail,
        timestamp: deadline,
        href: `/admin/opportunities/exchanges/${exchange.id}`,
      });
    }
  }

  for (const ticket of source.tickets) {
    if (!["open", "in_progress"].includes(ticket.status)) continue;
    items.push({
      id: `ticket-${ticket.id}`,
      priority: ticket.status === "open" && ageInDays(ticket.created_at) >= 2 ? "critical" : "high",
      category: "support",
      title: ticket.subject,
      detail: `${ticket.category.replace(/_/g, " ")} support ticket · ${ticket.status.replace(/_/g, " ")}`,
      timestamp: ticket.created_at,
      href: `/admin/support?ticket=${ticket.id}`,
    });
  }

  for (const contact of source.contacts) {
    if (contact.status !== "new") continue;
    items.push({
      id: `contact-${contact.id}`,
      priority: ageInDays(contact.created_at) >= 2 ? "high" : "medium",
      category: "lead",
      title: `New message from ${contact.name}`,
      detail: contact.email,
      timestamp: contact.created_at,
      href: `/admin/intake?tab=contact&q=${encodeURIComponent(contact.email)}`,
    });
  }

  for (const referral of source.referrals) {
    if (referral.status !== "pending") continue;
    items.push({
      id: `referral-${referral.id}`,
      priority: ageInDays(referral.created_at) >= 2 ? "high" : "medium",
      category: "lead",
      title: `Unassigned referral: ${referral.owner_name}`,
      detail: clean(referral.property_location, referral.owner_email),
      timestamp: referral.created_at,
      href: `/admin/intake?tab=referrals&q=${encodeURIComponent(referral.owner_email)}`,
    });
  }

  for (const demo of source.demos) {
    if (demo.status !== "new") continue;
    items.push({
      id: `demo-${demo.id}`,
      priority: ageInDays(demo.created_at) >= 2 ? "high" : "medium",
      category: "demo",
      title: `Demo request from ${demo.full_name}`,
      detail: `${demo.company} · ${demo.scheduled_at ? "scheduled" : "not scheduled"}`,
      timestamp: demo.created_at,
      href: `/admin/demos?q=${encodeURIComponent(demo.work_email)}`,
    });
  }

  for (const connection of source.connections) {
    if (connection.status !== "pending") continue;
    const buyerType = exchangeOwnerTypeLabel(exchangesById.get(connection.buyer_exchange_id)?.owner_type);
    const sellerType = exchangeOwnerTypeLabel(
      connection.seller_exchange_id ? exchangesById.get(connection.seller_exchange_id)?.owner_type : null,
    );
    items.push({
      id: `connection-${connection.id}`,
      priority: ageInDays(connection.created_at) >= 3 ? "high" : "medium",
      category: "connection",
      title: "Connection awaiting response",
      detail: `${clean(profilesById.get(connection.buyer_agent_id), "Buyer account")} (${buyerType}) → ${clean(profilesById.get(connection.seller_agent_id), "Seller account")} (${sellerType})`,
      timestamp: connection.created_at,
      href: `/admin/opportunities/connections/${connection.id}`,
    });
  }

  for (const representation of source.representations) {
    if (!["awaiting_agent", "pending_verification", "awaiting_investor_confirmation"].includes(representation.status)) continue;
    const title = representation.status === "awaiting_agent"
      ? "Property owner is waiting for an agent"
      : representation.status === "pending_verification"
        ? "Representation is waiting on the agent to confirm their email"
        : "Representation is waiting on owner confirmation";
    items.push({
      id: `representation-${representation.id}`,
      priority: ageInDays(representation.updated_at) >= 2 ? "high" : "medium",
      category: "representation",
      title,
      detail: `${representation.investor_email} · ${representation.agent_email || "No agent assigned"}`,
      timestamp: representation.updated_at,
      href: `/admin/representation-requests?q=${encodeURIComponent(representation.investor_email)}`,
    });
  }

  for (const request of source.contactRequests) {
    if (!["requested", "awaiting_counterparty_agent"].includes(request.status)) continue;
    const exchange = exchangesById.get(request.exchange_id);
    const owner = clean(profilesById.get(request.investor_id), "Property owner");
    items.push({
      id: `contact-request-${request.id}`,
      priority: ageInDays(request.updated_at) >= 2 ? "high" : "medium",
      category: "representation",
      title: request.status === "requested" ? "Client request needs an agent response" : "Contact request is waiting on the other side",
      detail: `${owner} · ${exchange ? exchangeOwnerTypeLabel(exchange.owner_type) : "Exchange"}`,
      timestamp: request.updated_at,
      href: `/admin/users/${request.investor_id}?tab=relationships`,
    });
  }

  for (const intent of source.connectionIntents) {
    if (!["awaiting_representation", "conflict"].includes(intent.status)) continue;
    const owner = clean(profilesById.get(intent.waiting_owner_id), "Property owner");
    items.push({
      id: `connection-intent-${intent.id}`,
      priority: intent.status === "conflict" || ageInDays(intent.updated_at) >= 2 ? "high" : "medium",
      category: "representation",
      title: intent.status === "conflict" ? "Agent connection conflict needs review" : "Listing interest is waiting on representation",
      detail: `${owner} · ${intent.waiting_on_side === "seller" ? "listing side" : "buyer side"}`,
      timestamp: intent.updated_at,
      href: `/admin/representation-requests?q=${encodeURIComponent(owner)}`,
    });
  }

  for (const invite of source.representationInvites) {
    if (invite.delivery_status !== "failed" || invite.status !== "pending") continue;
    items.push({
      id: `representation-invite-${invite.id}`,
      priority: "high",
      category: "representation",
      title: "Representation invitation failed to deliver",
      detail: `${invite.email} · ${invite.delivery_error_code || "delivery error"}`,
      timestamp: invite.updated_at,
      href: `/admin/representation-requests?q=${encodeURIComponent(invite.email)}`,
    });
  }

  for (const profile of source.profiles) {
    if (profile.verification_status !== "suspended") continue;
    items.push({
      id: `account-${profile.id}`,
      priority: "medium",
      category: "account",
      title: `${clean(profile.full_name, profile.email ?? undefined)} is suspended`,
      detail: "Review whether this account should remain restricted.",
      timestamp: profile.updated_at,
      href: `/admin/users/${profile.id}`,
    });
  }

  return items.sort((a, b) => {
    const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priority !== 0) return priority;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

export function buildAdminSearchItems(source: CommandCenterSource): AdminSearchItem[] {
  const profilesById = new Map(source.profiles.map((profile) => [profile.id, clean(profile.full_name, profile.email ?? undefined)]));
  const clientsById = new Map(source.clients.map((client) => [client.id, client.client_name]));
  const exchangesById = new Map(source.exchanges.map((exchange) => [exchange.id, exchange]));
  const rolesByUser = source.roles.reduce<Map<string, string[]>>((map, role) => {
    map.set(role.user_id, [...(map.get(role.user_id) ?? []), role.role]);
    return map;
  }, new Map());
  const items: AdminSearchItem[] = [];

  for (const profile of source.profiles) {
    items.push({
      id: `user-${profile.id}`,
      type: "User",
      title: clean(profile.full_name, profile.email ?? undefined),
      subtitle: [adminRoleSummary(rolesByUser.get(profile.id) ?? []), profile.email, profile.brokerage_name]
        .filter(Boolean)
        .join(" · "),
      href: `/admin/users/${profile.id}`,
    });
  }

  for (const exchange of source.exchanges) {
    const ownerName = clean(profilesById.get(exchange.agent_id), "Account owner");
    const managedFor = exchangeManagedForLabel(exchange.owner_type, clientsById.get(exchange.client_id));
    items.push({
      id: `exchange-${exchange.id}`,
      type: "Exchange",
      title: `${isInvestorOwned(exchange.owner_type) ? ownerName : managedFor} exchange`,
      subtitle: `${exchange.status.replace(/_/g, " ")} · ${exchangeOwnerTypeLabel(exchange.owner_type)} · ${ownerName}`,
      href: `/admin/opportunities/exchanges/${exchange.id}`,
    });
  }

  for (const property of source.properties) {
    const exchange = property.exchange_id ? exchangesById.get(property.exchange_id) : null;
    items.push({
      id: `property-${property.id}`,
      type: "Property",
      title: propertyLabel(property),
      subtitle: `${fullLocation(property)} · ${exchangeOwnerTypeLabel(exchange?.owner_type)} · ${clean(profilesById.get(property.agent_id), "Account owner")}`,
      href: `/admin/properties/${property.id}`,
    });
  }

  for (const connection of source.connections) {
    const buyerType = exchangeOwnerTypeLabel(exchangesById.get(connection.buyer_exchange_id)?.owner_type);
    const sellerType = exchangeOwnerTypeLabel(
      connection.seller_exchange_id ? exchangesById.get(connection.seller_exchange_id)?.owner_type : null,
    );
    items.push({
      id: `connection-${connection.id}`,
      type: "Connection",
      title: `${clean(profilesById.get(connection.buyer_agent_id), "Buyer account")} ↔ ${clean(profilesById.get(connection.seller_agent_id), "Seller account")}`,
      subtitle: `${connection.status.replace(/_/g, " ")} · ${buyerType} ↔ ${sellerType}`,
      href: `/admin/opportunities/connections/${connection.id}`,
    });
  }

  for (const demo of source.demos) {
    items.push({
      id: `demo-${demo.id}`,
      type: "Demo",
      title: demo.full_name,
      subtitle: `${demo.work_email} · ${demo.company}`,
      href: `/admin/demos?q=${encodeURIComponent(demo.work_email)}`,
    });
  }

  for (const contact of source.contacts) {
    items.push({
      id: `contact-${contact.id}`,
      type: "Lead",
      title: contact.name,
      subtitle: `${contact.email} · contact submission`,
      href: `/admin/intake?tab=contact&q=${encodeURIComponent(contact.email)}`,
    });
  }

  for (const referral of source.referrals) {
    items.push({
      id: `referral-${referral.id}`,
      type: "Lead",
      title: referral.owner_name,
      subtitle: `${referral.owner_email} · landlord referral`,
      href: `/admin/intake?tab=referrals&q=${encodeURIComponent(referral.owner_email)}`,
    });
  }

  for (const ticket of source.tickets) {
    items.push({
      id: `ticket-${ticket.id}`,
      type: "Ticket",
      title: ticket.subject,
      subtitle: `${ticket.category.replace(/_/g, " ")} · ${ticket.status.replace(/_/g, " ")}`,
      href: `/admin/support?ticket=${ticket.id}`,
    });
  }

  for (const registration of source.eventRegistrations) {
    items.push({
      id: `event-${registration.id}`,
      type: "Event",
      title: registration.full_name,
      subtitle: `${registration.email} · ${registration.event.replace(/-/g, " ")}`,
      href: `/admin/intake?tab=events&q=${encodeURIComponent(registration.email)}`,
    });
  }

  return items;
}

export function formatAdminRelativeTime(iso: string) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (deltaMs < 0) {
    const futureMinutes = Math.ceil(Math.abs(deltaMs) / 60000);
    if (futureMinutes < 60) return `in ${futureMinutes}m`;
    const futureHours = Math.ceil(futureMinutes / 60);
    if (futureHours < 24) return `in ${futureHours}h`;
    const futureDays = Math.ceil(futureHours / 24);
    if (futureDays < 7) return `in ${futureDays}d`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useAdminCommandCenter(scope: "live" | "demo" = "live") {
  return useQuery({
    queryKey: ["admin-command-center", scope],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_command_center", {
        p_data_scope: scope,
      });
      if (error) throw error;
      if (!data?.[0]) throw new Error("The Command Center returned no response.");
      return parseCommandCenterSnapshot(data[0].snapshot);
    },
  });
}

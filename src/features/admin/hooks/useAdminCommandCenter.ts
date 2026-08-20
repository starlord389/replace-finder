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
  const representationsById = new Map(source.representations.map((representation) => [representation.id, representation]));
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
        href: `/admin/deals/exchanges/${exchange.id}`,
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
      href: `/admin/deals/connections/${connection.id}`,
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
      href: representation.investor_id
        ? `/admin/users/${representation.investor_id}?tab=relationships`
        : `/admin/representations?q=${encodeURIComponent(representation.investor_email)}`,
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
      href: `/admin/users/${intent.waiting_owner_id}?tab=relationships`,
    });
  }

  for (const invite of source.representationInvites) {
    if (invite.delivery_status !== "failed" || invite.status !== "pending") continue;
    const representation = representationsById.get(invite.representation_id);
    items.push({
      id: `representation-invite-${invite.id}`,
      priority: "high",
      category: "representation",
      title: "Representation invitation failed to deliver",
      detail: `${invite.email} · ${invite.delivery_error_code || "delivery error"}`,
      timestamp: invite.updated_at,
      href: representation?.investor_id
        ? `/admin/users/${representation.investor_id}?tab=relationships`
        : `/admin/representations?q=${encodeURIComponent(invite.email)}`,
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
      href: `/admin/deals/exchanges/${exchange.id}`,
    });
  }

  for (const property of source.properties) {
    const exchange = property.exchange_id ? exchangesById.get(property.exchange_id) : null;
    items.push({
      id: `property-${property.id}`,
      type: "Property",
      title: propertyLabel(property),
      subtitle: `${fullLocation(property)} · ${exchangeOwnerTypeLabel(exchange?.owner_type)} · ${clean(profilesById.get(property.agent_id), "Account owner")}`,
      href: `/admin/deals?tab=properties&property=${property.id}&q=${encodeURIComponent(propertyLabel(property))}`,
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
      href: `/admin/deals/connections/${connection.id}`,
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

export function useAdminCommandCenter() {
  return useQuery({
    queryKey: ["admin-command-center"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [exchangeResult, accountSummaryResult] = await Promise.all([
        supabase
          .from("exchanges")
          .select("*", { count: "exact" })
          .eq("is_demo", false)
          .order("created_at", { ascending: false }),
        supabase.rpc("admin_get_account_summary").maybeSingle(),
      ]);
      if (exchangeResult.error) throw exchangeResult.error;
      if (accountSummaryResult.error) throw accountSummaryResult.error;
      assertAdminCommandCenterRowsComplete(
        "live exchange",
        exchangeResult.data?.length ?? 0,
        exchangeResult.count,
      );
      if (!accountSummaryResult.data) {
        throw new Error("Command Center account totals are unavailable. Partial account KPIs will not be shown.");
      }

      const exchanges = exchangeResult.data ?? [];
      const accountSummary = mapAdminAccountSummary(accountSummaryResult.data);
      const liveExchangeIds = exchanges.map((exchange) => exchange.id);
      const scopeIds = liveExchangeIds.length
        ? liveExchangeIds
        : ["00000000-0000-0000-0000-000000000000"];

      const [
        propertiesResult,
        matchesResult,
        connectionsResult,
        profilesResult,
        rolesResult,
        clientsResult,
        ticketsResult,
        demosResult,
        contactsResult,
        referralsResult,
        eventsResult,
        timelineResult,
        representationsResult,
        representationInvitesResult,
        assignmentsResult,
        contactRequestsResult,
        connectionIntentsResult,
      ] = await Promise.all([
        supabase.from("pledged_properties").select("*", { count: "exact" }).eq("is_demo", false).order("created_at", { ascending: false }),
        supabase.from("matches").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("exchange_connections").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*", { count: "exact" }),
        supabase.from("agent_clients").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("demo_requests").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("contact_submissions").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("referrals").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("event_registrations").select("*", { count: "exact" }).order("created_at", { ascending: false }),
        supabase.from("exchange_timeline").select("*").in("exchange_id", scopeIds).order("created_at", { ascending: false }).limit(30),
        supabase.from("agent_representations").select("*", { count: "exact" }).eq("is_demo", false).order("created_at", { ascending: false }),
        supabase
          .from("representation_invites")
          .select("id, delivery_status, status, email, delivery_error_code, updated_at, representation_id", { count: "exact" })
          .order("updated_at", { ascending: false }),
        supabase.from("exchange_agent_assignments").select("*", { count: "exact" }).in("exchange_id", scopeIds).order("created_at", { ascending: false }),
        supabase.from("agent_contact_requests").select("*", { count: "exact" }).in("exchange_id", scopeIds).order("created_at", { ascending: false }),
        supabase.from("agent_connection_intents").select("*", { count: "exact" }).eq("is_demo", false).order("created_at", { ascending: false }),
      ]);

      const countedResults: Array<[string, CountedAdminQueryResult]> = [
        ["live property", propertiesResult],
        ["match", matchesResult],
        ["connection", connectionsResult],
        ["profile", profilesResult],
        ["role", rolesResult],
        ["client", clientsResult],
        ["support ticket", ticketsResult],
        ["demo request", demosResult],
        ["contact submission", contactsResult],
        ["referral", referralsResult],
        ["event registration", eventsResult],
        ["live representation", representationsResult],
        ["representation invitation", representationInvitesResult],
        ["exchange assignment", assignmentsResult],
        ["agent contact request", contactRequestsResult],
        ["live connection intent", connectionIntentsResult],
      ];
      for (const [label, result] of countedResults) {
        if (result.error) throw result.error;
        assertAdminCommandCenterRowsComplete(label, result.data?.length ?? 0, result.count);
      }
      if (timelineResult.error) throw timelineResult.error;

      const profiles = (profilesResult.data ?? []).filter(
        (profile) => !profile.email?.toLowerCase().endsWith("@replacefinder.test"),
      );
      const profileIds = new Set(profiles.map((profile) => profile.id));
      const livePropertyIds = new Set((propertiesResult.data ?? []).map((property) => property.id));
      const liveExchangeIdSet = new Set(liveExchangeIds);
      const liveRepresentations = representationsResult.data ?? [];
      const liveRepresentationIds = new Set(liveRepresentations.map((representation) => representation.id));
      const source: CommandCenterSource = {
        profiles,
        roles: (rolesResult.data ?? []).filter((role) => profileIds.has(role.user_id)),
        exchanges,
        properties: propertiesResult.data ?? [],
        matches: (matchesResult.data ?? []).filter(
          (match) => liveExchangeIdSet.has(match.buyer_exchange_id) || livePropertyIds.has(match.seller_property_id),
        ),
        connections: (connectionsResult.data ?? []).filter(
          (connection) => liveExchangeIdSet.has(connection.buyer_exchange_id) || Boolean(connection.seller_exchange_id && liveExchangeIdSet.has(connection.seller_exchange_id)),
        ),
        clients: clientsResult.data ?? [],
        tickets: ticketsResult.data ?? [],
        demos: demosResult.data ?? [],
        contacts: contactsResult.data ?? [],
        referrals: referralsResult.data ?? [],
        eventRegistrations: eventsResult.data ?? [],
        timeline: timelineResult.data ?? [],
        representations: liveRepresentations,
        representationInvites: (representationInvitesResult.data ?? []).filter((invite) => liveRepresentationIds.has(invite.representation_id)),
        assignments: assignmentsResult.data ?? [],
        contactRequests: contactRequestsResult.data ?? [],
        connectionIntents: connectionIntentsResult.data ?? [],
      };

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const activeExchanges = source.exchanges.filter((exchange) => ACTIVE_EXCHANGE_STATUSES.has(exchange.status));
      const attentionItems = buildAdminAttentionItems(source);
      const pipeline = source.exchanges.reduce<Record<string, number>>((counts, exchange) => {
        counts[exchange.status] = (counts[exchange.status] ?? 0) + 1;
        return counts;
      }, {});
      const upcomingDemos = source.demos
        .filter((demo) =>
          demo.scheduled_at &&
          !["unqualified", "closed"].includes(demo.status) &&
          new Date(demo.scheduled_at).getTime() >= now
        )
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
        .slice(0, 5);

      return {
        attentionItems,
        searchItems: buildAdminSearchItems(source),
        pipeline,
        upcomingDemos,
        recentActivity: source.timeline.slice(0, 10),
        eventRegistrations: source.eventRegistrations,
        lastUpdatedAt: new Date().toISOString(),
        overdueDeadlineCount: attentionItems.filter(
          (item) => item.category === "deadline" && item.title.includes("overdue"),
        ).length,
        kpis: {
          activeExchanges: activeExchanges.length,
          activeMatches: source.matches.filter((match) => match.status === "active").length,
          openConnections: source.connections.filter((connection) =>
            ["pending", "accepted", "in_progress"].includes(connection.status)
          ).length,
          properties: source.properties.length,
          users: accountSummary.totalAccounts,
          agents: accountSummary.agentAccounts,
          investors: accountSummary.investorAccounts,
          agentManagedExchanges: activeExchanges.filter((exchange) => !isInvestorOwned(exchange.owner_type)).length,
          investorManagedExchanges: activeExchanges.filter((exchange) => isInvestorOwned(exchange.owner_type)).length,
          newLeads:
            source.contacts.filter((contact) => contact.status === "new").length +
            source.referrals.filter((referral) => referral.status === "pending").length +
            source.demos.filter((demo) => demo.status === "new").length,
          openTickets: source.tickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status)).length,
          activeRepresentations: source.representations.filter((representation) => representation.status === "active").length,
          openContactRequests: source.contactRequests.filter((request) => ["requested", "awaiting_counterparty_agent"].includes(request.status)).length,
          awaitingRepresentation: source.connectionIntents.filter((intent) => intent.status === "awaiting_representation").length,
        },
        growth: {
          users: accountSummary.newAccounts7d,
          exchanges: source.exchanges.filter((exchange) => new Date(exchange.created_at).getTime() >= weekAgo).length,
          demos: source.demos.filter((demo) => new Date(demo.created_at).getTime() >= weekAgo).length,
          events: source.eventRegistrations.filter((registration) => new Date(registration.created_at).getTime() >= weekAgo).length,
        },
      };
    },
  });
}

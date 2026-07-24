import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AdminReportRange = 7 | 30 | 90 | "all";

export type AdminReportData = {
  profiles: Tables<"profiles">[];
  roles: Tables<"user_roles">[];
  clients: Tables<"agent_clients">[];
  exchanges: Tables<"exchanges">[];
  properties: Tables<"pledged_properties">[];
  connections: Tables<"exchange_connections">[];
  contacts: Tables<"contact_submissions">[];
  referrals: Tables<"referrals">[];
  demos: Tables<"demo_requests">[];
  events: Tables<"event_registrations">[];
  tickets: Tables<"support_tickets">[];
};

export type AdminReportSnapshot = {
  users: number;
  agents: number;
  exchanges: number;
  activeExchanges: number;
  leads: number;
  unresolvedTickets: number;
  exchangeStatuses: Record<string, number>;
  leadSources: Record<string, number>;
  supportStatuses: Record<string, number>;
};

const ACTIVE_EXCHANGE_STATUSES = new Set(["active", "in_identification", "in_closing"]);
const UNRESOLVED_TICKET_STATUSES = new Set(["open", "in_progress"]);

export function getAdminReportCutoff(range: AdminReportRange, now = Date.now()) {
  return range === "all" ? null : now - range * 24 * 60 * 60 * 1000;
}

export function isWithinAdminReportRange(
  createdAt: string,
  range: AdminReportRange,
  now = Date.now(),
) {
  const cutoff = getAdminReportCutoff(range, now);
  return cutoff == null || new Date(createdAt).getTime() >= cutoff;
}

export function buildAdminReportSnapshot(
  data: AdminReportData,
  range: AdminReportRange,
  now = Date.now(),
): AdminReportSnapshot {
  const withinRange = <T extends { created_at: string }>(rows: T[]) =>
    rows.filter((row) => isWithinAdminReportRange(row.created_at, range, now));

  const profiles = withinRange(data.profiles);
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const exchanges = withinRange(data.exchanges);
  const contacts = withinRange(data.contacts);
  const referrals = withinRange(data.referrals);
  const demos = withinRange(data.demos);
  const events = withinRange(data.events);
  const tickets = withinRange(data.tickets);

  return {
    users: profiles.length,
    agents: new Set(
      data.roles
        .filter((role) => role.role === "agent" && profileIds.has(role.user_id))
        .map((role) => role.user_id),
    ).size,
    exchanges: exchanges.length,
    activeExchanges: exchanges.filter((exchange) => ACTIVE_EXCHANGE_STATUSES.has(exchange.status)).length,
    leads: contacts.length + referrals.length + demos.length + events.length,
    unresolvedTickets: tickets.filter((ticket) => UNRESOLVED_TICKET_STATUSES.has(ticket.status)).length,
    exchangeStatuses: countBy(exchanges, (exchange) => exchange.status),
    leadSources: {
      contacts: contacts.length,
      referrals: referrals.length,
      demos: demos.length,
      events: events.length,
    },
    supportStatuses: countBy(tickets, (ticket) => ticket.status),
  };
}

function countBy<T>(rows: T[], key: (row: T) => string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const value = key(row);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function useAdminReports() {
  return useQuery({
    queryKey: ["admin-reports"],
    staleTime: 60_000,
    queryFn: async (): Promise<AdminReportData> => {
      const [
        profiles,
        roles,
        clients,
        exchanges,
        properties,
        connections,
        contacts,
        referrals,
        demos,
        events,
        tickets,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("agent_clients").select("*").order("created_at", { ascending: false }),
        supabase.from("exchanges").select("*").eq("is_demo", false).order("created_at", { ascending: false }),
        supabase.from("pledged_properties").select("*").eq("is_demo", false).order("created_at", { ascending: false }),
        supabase.from("exchange_connections").select("*").order("created_at", { ascending: false }),
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }),
        supabase.from("demo_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("event_registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      ]);

      const results = [
        profiles,
        roles,
        clients,
        exchanges,
        properties,
        connections,
        contacts,
        referrals,
        demos,
        events,
        tickets,
      ];
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const liveProfiles = (profiles.data ?? []).filter(
        (profile) => !profile.email?.toLowerCase().endsWith("@replacefinder.test"),
      );
      const liveProfileIds = new Set(liveProfiles.map((profile) => profile.id));
      const liveExchangeIds = new Set((exchanges.data ?? []).map((exchange) => exchange.id));

      return {
        profiles: liveProfiles,
        roles: (roles.data ?? []).filter((role) => liveProfileIds.has(role.user_id)),
        clients: (clients.data ?? []).filter((client) => !client.is_demo),
        exchanges: exchanges.data ?? [],
        properties: properties.data ?? [],
        connections: (connections.data ?? []).filter((connection) =>
          liveExchangeIds.has(connection.buyer_exchange_id) ||
          (connection.seller_exchange_id ? liveExchangeIds.has(connection.seller_exchange_id) : false),
        ),
        contacts: contacts.data ?? [],
        referrals: referrals.data ?? [],
        demos: demos.data ?? [],
        events: events.data ?? [],
        tickets: tickets.data ?? [],
      };
    },
  });
}

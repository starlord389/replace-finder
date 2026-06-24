import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resolveListingName } from "@/lib/listingDisplay";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

const URGENT_WINDOW_DAYS = 14;
const LIST_LIMIT = 5;

export interface UrgentDeadlineRow {
  exchangeId: string;
  clientName: string;
  deadlineType: "identification" | "closing";
  deadline: string;
  daysRemaining: number;
}

export interface UnreviewedMatchRow {
  matchId: string;
  buyerExchangeId: string;
  totalScore: number;
  clientId: string | null;
  clientName: string;
  propertyName: string;
  createdAt: string;
}


export interface PendingConnectionRow {
  connectionId: string;
  matchId: string;
  otherAgentName: string;
  otherAgentBrokerage: string | null;
  propertyName: string | null;
  initiatedAt: string;
}

export interface AgentAttentionData {
  urgentDeadlines: UrgentDeadlineRow[];
  unreviewedMatches: UnreviewedMatchRow[];
  pendingConnections: PendingConnectionRow[];
  isEmpty: boolean;
}

async function fetchAgentAttention(userId: string, isDemo: boolean): Promise<AgentAttentionData> {
  const [exchangesRes, connectionsRes] = await Promise.all([
    supabase
      .from("exchanges")
      .select(
        "id, client_id, status, identification_deadline, closing_deadline, agent_clients(client_name)",
      )
      .eq("agent_id", userId)
      .eq("is_demo", isDemo),
    supabase
      .from("exchange_connections")
      .select(
        "id, match_id, status, initiated_by, initiated_at, buyer_agent_id, seller_agent_id",
      )
      .or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`)
      .eq("status", "pending")
      .order("initiated_at", { ascending: false }),
  ]);

  const exchanges = exchangesRes.data ?? [];
  const today = new Date();

  const deadlines: UrgentDeadlineRow[] = [];
  for (const exchange of exchanges as Array<{
    id: string;
    status: string;
    identification_deadline: string | null;
    closing_deadline: string | null;
    agent_clients: { client_name?: string } | null;
  }>) {
    if (
      exchange.status !== "in_identification" &&
      exchange.status !== "in_closing"
    ) {
      continue;
    }
    const clientName = exchange.agent_clients?.client_name ?? "Unknown Client";
    if (exchange.identification_deadline) {
      const days = differenceInDays(
        parseISO(exchange.identification_deadline),
        today,
      );
      if (days >= 0 && days <= URGENT_WINDOW_DAYS) {
        deadlines.push({
          exchangeId: exchange.id,
          clientName,
          deadlineType: "identification",
          deadline: exchange.identification_deadline,
          daysRemaining: days,
        });
      }
    }
    if (exchange.closing_deadline) {
      const days = differenceInDays(parseISO(exchange.closing_deadline), today);
      if (days >= 0 && days <= URGENT_WINDOW_DAYS) {
        deadlines.push({
          exchangeId: exchange.id,
          clientName,
          deadlineType: "closing",
          deadline: exchange.closing_deadline,
          daysRemaining: days,
        });
      }
    }
  }
  deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
  const urgentDeadlines = deadlines.slice(0, LIST_LIMIT);

  const exchangeIds = exchanges.map((e) => e.id);
  const clientInfoByExchange = new Map<string, { id: string | null; name: string }>(
    exchanges.map((e: any) => [
      e.id,
      {
        id: e.client_id ?? null,
        name: (e as { agent_clients: { client_name?: string } | null }).agent_clients?.client_name ?? "Client",
      },
    ]),
  );

  let unreviewedMatches: UnreviewedMatchRow[] = [];
  if (exchangeIds.length > 0) {
    const { data: matchRows } = await supabase
      .from("matches")
      .select(
        "id, buyer_exchange_id, seller_property_id, total_score, created_at",
      )
      .in("buyer_exchange_id", exchangeIds)
      .eq("status", "active")
      .eq("buyer_agent_viewed", false)
      .order("total_score", { ascending: false })
      .limit(LIST_LIMIT);

    const matches = (matchRows ?? []) as Array<{
      id: string;
      buyer_exchange_id: string;
      seller_property_id: string;
      total_score: number;
      created_at: string;
    }>;

    if (matches.length > 0) {
      const propertyIds = [...new Set(matches.map((m) => m.seller_property_id))];
      const { data: props } = await supabase
        .from("pledged_properties")
        .select("id, property_name, address, address_is_public, city, state, asset_type")
        .in("id", propertyIds);
      // Counterparty (seller) properties → never reveal the street unless public.
      const propMap = new Map(
        (props ?? []).map((p: any) => [p.id, resolveListingName(p, false)]),
      );

      unreviewedMatches = matches.map((m) => {
        const info = clientInfoByExchange.get(m.buyer_exchange_id);
        return {
          matchId: m.id,
          buyerExchangeId: m.buyer_exchange_id,
          totalScore: Number(m.total_score ?? 0),
          clientId: info?.id ?? null,
          clientName: info?.name ?? "Client",
          propertyName: propMap.get(m.seller_property_id) ?? "Property",
          createdAt: m.created_at,
        };
      });
    }
  }


  const connections = (connectionsRes.data ?? []) as Array<{
    id: string;
    match_id: string;
    status: string;
    initiated_by: string;
    initiated_at: string;
    buyer_agent_id: string;
    seller_agent_id: string;
  }>;

  const awaiting = connections.filter((c) => {
    const youAreBuyer = c.buyer_agent_id === userId;
    return youAreBuyer ? c.initiated_by === "seller_agent" : c.initiated_by === "buyer_agent";
  });

  let pendingConnections: PendingConnectionRow[] = [];
  if (awaiting.length > 0) {
    // Connections carry no demo stamp, so scope them by the property the match
    // is about (counterparty demo properties are is_demo; the owner's own listing
    // carries its own flag). Filter BEFORE limiting so the workspace is respected.
    const matchIds = [...new Set(awaiting.map((c) => c.match_id))];
    const { data: matchesData } = matchIds.length > 0
      ? await supabase.from("matches").select("id, seller_property_id").in("id", matchIds)
      : { data: [] as Array<{ id: string; seller_property_id: string }> };
    const matchMap = new Map((matchesData ?? []).map((m) => [m.id, m]));
    const sellerPropertyIds = [...new Set((matchesData ?? []).map((m) => m.seller_property_id))];
    const { data: props } = sellerPropertyIds.length > 0
      ? await supabase.from("pledged_properties").select("id, property_name, address, address_is_public, city, state, asset_type, is_demo").in("id", sellerPropertyIds)
      : { data: [] as Array<any> };
    const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));

    const scoped = awaiting.filter((c) => {
      const m = matchMap.get(c.match_id);
      const p = m ? propMap.get(m.seller_property_id) : null;
      return p ? Boolean(p.is_demo) === isDemo : !isDemo;
    }).slice(0, LIST_LIMIT);

    const otherAgentIds = [...new Set(scoped.map((c) => c.buyer_agent_id === userId ? c.seller_agent_id : c.buyer_agent_id))];
    const { data: profilesData } = otherAgentIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, brokerage_name").in("id", otherAgentIds)
      : { data: [] as Array<{ id: string; full_name: string | null; brokerage_name: string | null }> };
    const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

    pendingConnections = scoped.map((c) => {
      const otherId = c.buyer_agent_id === userId ? c.seller_agent_id : c.buyer_agent_id;
      const otherProfile = profileMap.get(otherId);
      const m = matchMap.get(c.match_id);
      return {
        connectionId: c.id,
        matchId: c.match_id,
        otherAgentName: otherProfile?.full_name ?? "Another agent",
        otherAgentBrokerage: otherProfile?.brokerage_name ?? null,
        propertyName: m ? resolveListingName(propMap.get(m.seller_property_id), false) : null,
        initiatedAt: c.initiated_at,
      };
    });
  }

  return {
    urgentDeadlines,
    unreviewedMatches,
    pendingConnections,
    isEmpty:
      urgentDeadlines.length === 0 &&
      unreviewedMatches.length === 0 &&
      pendingConnections.length === 0,
  };
}

export function useAgentAttentionQuery(userId?: string) {
  const { isDemo } = useWorkspaceMode();
  return useQuery({
    queryKey: ["agent-attention", userId, isDemo],
    queryFn: () => fetchAgentAttention(userId!, isDemo),
    enabled: Boolean(userId),
  });
}

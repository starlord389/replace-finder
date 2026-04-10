import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface DeadlineAlert {
  exchangeId: string;
  clientName: string;
  deadlineType: "identification" | "closing";
  deadline: string;
  daysRemaining: number;
}

export interface AgentDashboardData {
  brokerageName: string | null;
  clientCount: number;
  exchangeCount: number;
  matchCount: number;
  connectionCount: number;
  deadlines: DeadlineAlert[];
}

async function fetchAgentDashboard(userId: string): Promise<AgentDashboardData> {
  const [profileRes, clientsRes, exchangesRes, matchesRes, connectionsRes, deadlinesRes] =
    await Promise.all([
      supabase.from("profiles").select("brokerage_name").eq("id", userId).single(),
      supabase.from("agent_clients").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("status", "active"),
      supabase.from("exchanges").select("id", { count: "exact", head: true }).eq("agent_id", userId).in("status", ["active", "in_identification", "in_closing"]),
      supabase.from("exchanges").select("id").eq("agent_id", userId).then(async ({ data: exs }) => {
        if (!exs?.length) return { count: 0 };
        const { count } = await supabase.from("matches").select("id", { count: "exact", head: true }).in("buyer_exchange_id", exs.map((e) => e.id));
        return { count: count ?? 0 };
      }),
      supabase.from("exchange_connections").select("id", { count: "exact", head: true }).or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`).eq("status", "pending"),
      supabase.from("exchanges").select("id, identification_deadline, closing_deadline, agent_clients(client_name)").eq("agent_id", userId).in("status", ["in_identification", "in_closing"]).not("identification_deadline", "is", null),
    ]);

  const today = new Date();
  const alerts: DeadlineAlert[] = [];
  if (deadlinesRes.data) {
    for (const exchange of deadlinesRes.data as any[]) {
      const clientName = exchange.agent_clients?.client_name ?? "Unknown Client";
      if (exchange.identification_deadline) {
        const days = differenceInDays(parseISO(exchange.identification_deadline), today);
        if (days >= 0) {
          alerts.push({
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
        if (days >= 0) {
          alerts.push({
            exchangeId: exchange.id,
            clientName,
            deadlineType: "closing",
            deadline: exchange.closing_deadline,
            daysRemaining: days,
          });
        }
      }
    }
  }

  alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    brokerageName: profileRes.data?.brokerage_name ?? null,
    clientCount: clientsRes.count ?? 0,
    exchangeCount: exchangesRes.count ?? 0,
    matchCount: typeof matchesRes === "object" && "count" in matchesRes ? (matchesRes.count as number) : 0,
    connectionCount: connectionsRes.count ?? 0,
    deadlines: alerts,
  };
}

export function useAgentDashboardQuery(userId?: string) {
  return useQuery({
    queryKey: ["agent-dashboard", userId],
    queryFn: () => fetchAgentDashboard(userId!),
    enabled: Boolean(userId),
  });
}

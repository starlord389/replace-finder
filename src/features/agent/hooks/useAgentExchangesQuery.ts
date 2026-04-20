import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentExchangeRow {
  id: string;
  status: string;
  exchange_proceeds: number | null;
  identification_deadline: string | null;
  closing_deadline: string | null;
  created_at: string;
  agent_clients: { client_name: string } | null;
  pledged_properties: { address: string | null; city: string | null; state: string | null } | null;
}

async function fetchAgentExchanges(userId: string): Promise<AgentExchangeRow[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select("id, status, exchange_proceeds, identification_deadline, closing_deadline, created_at, agent_clients(client_name), pledged_properties(address, city, state)")
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as AgentExchangeRow[];
}

export function useAgentExchangesQuery(userId?: string) {
  return useQuery({
    queryKey: ["agent-exchanges", userId],
    queryFn: () => fetchAgentExchanges(userId!),
    enabled: Boolean(userId),
  });
}

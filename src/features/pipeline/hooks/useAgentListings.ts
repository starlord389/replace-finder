import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentListing {
  id: string;
  status: string;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
  propertyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

async function fetchAgentListings(userId: string): Promise<AgentListing[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "id, status, created_at, relinquished_property_id, client_id, agent_clients(client_name)"
    )
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    created_at: string;
    relinquished_property_id: string | null;
    client_id: string | null;
    agent_clients: { client_name: string } | null;
  }>;

  const propIds = rows.map((r) => r.relinquished_property_id).filter((v): v is string => !!v);

  let propMap: Record<string, { property_name: string | null; address: string | null; city: string | null; state: string | null }> = {};
  if (propIds.length) {
    const { data: props, error: pErr } = await supabase
      .from("pledged_properties")
      .select("id, property_name, address, city, state")
      .in("id", propIds);
    if (pErr) throw pErr;
    propMap = Object.fromEntries((props ?? []).map((p: any) => [p.id, p]));
  }

  return rows.map((r) => {
    const p = r.relinquished_property_id ? propMap[r.relinquished_property_id] : null;
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      clientId: r.client_id,
      clientName: r.agent_clients?.client_name ?? null,
      propertyName: p?.property_name ?? null,
      address: p?.address ?? null,
      city: p?.city ?? null,
      state: p?.state ?? null,
    };
  });
}

export function useAgentListings(userId?: string) {
  return useQuery({
    queryKey: ["agent-listings", userId],
    queryFn: () => fetchAgentListings(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

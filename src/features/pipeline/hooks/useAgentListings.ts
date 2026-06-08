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
  assetType: string | null;
  strategyType: string | null;
  askingPrice: number | null;
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

  let propMap: Record<string, any> = {};
  let finMap: Record<string, { asking_price: number | null }> = {};
  if (propIds.length) {
    const [{ data: props, error: pErr }, { data: fins, error: fErr }] = await Promise.all([
      supabase
        .from("pledged_properties")
        .select("id, property_name, address, city, state, asset_type, strategy_type")
        .in("id", propIds),
      supabase
        .from("property_financials")
        .select("property_id, asking_price")
        .in("property_id", propIds),
    ]);
    if (pErr) throw pErr;
    if (fErr) throw fErr;
    propMap = Object.fromEntries((props ?? []).map((p: any) => [p.id, p]));
    finMap = Object.fromEntries((fins ?? []).map((f: any) => [f.property_id, f]));
  }

  return rows.map((r) => {
    const p = r.relinquished_property_id ? propMap[r.relinquished_property_id] : null;
    const f = r.relinquished_property_id ? finMap[r.relinquished_property_id] : null;
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
      assetType: p?.asset_type ?? null,
      strategyType: p?.strategy_type ?? null,
      askingPrice: f?.asking_price ?? null,
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

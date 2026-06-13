import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentListing {
  id: string;
  status: string;
  createdAt: string;
  clientId: string | null;
  clientName: string | null;
  propertyId: string | null;
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
  const exchangeIds = rows.map((r) => r.id);

  let propMap: Record<string, any> = {};
  let finMap: Record<string, { asking_price: number | null }> = {};
  // Map from exchange_id -> pledged_property (fallback when FK is unset)
  let propByExchange: Record<string, any> = {};

  // Fetch by relinquished_property_id (primary) and by exchange_id (fallback) in parallel
  const [
    { data: props, error: pErr },
    { data: fins, error: fErr },
    { data: propsByEx, error: peErr },
  ] = await Promise.all([
    propIds.length
      ? supabase
          .from("pledged_properties")
          .select("id, exchange_id, property_name, address, city, state, asset_type, strategy_type")
          .in("id", propIds)
      : Promise.resolve({ data: [], error: null } as any),
    propIds.length
      ? supabase
          .from("property_financials")
          .select("property_id, asking_price")
          .in("property_id", propIds)
      : Promise.resolve({ data: [], error: null } as any),
    exchangeIds.length
      ? supabase
          .from("pledged_properties")
          .select("id, exchange_id, property_name, address, city, state, asset_type, strategy_type")
          .in("exchange_id", exchangeIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (pErr) throw pErr;
  if (fErr) throw fErr;
  if (peErr) throw peErr;

  propMap = Object.fromEntries((props ?? []).map((p: any) => [p.id, p]));
  finMap = Object.fromEntries((fins ?? []).map((f: any) => [f.property_id, f]));
  propByExchange = Object.fromEntries(
    (propsByEx ?? []).filter((p: any) => p.exchange_id).map((p: any) => [p.exchange_id, p]),
  );

  // Backfill financials for properties found via exchange_id fallback
  const fallbackPropIds = Object.values(propByExchange)
    .map((p: any) => p.id)
    .filter((id: string) => id && !finMap[id]);
  if (fallbackPropIds.length) {
    const { data: extraFins, error: efErr } = await supabase
      .from("property_financials")
      .select("property_id, asking_price")
      .in("property_id", fallbackPropIds);
    if (efErr) throw efErr;
    for (const f of extraFins ?? []) {
      finMap[(f as any).property_id] = f as any;
    }
  }

  return rows.map((r) => {
    const primary = r.relinquished_property_id ? propMap[r.relinquished_property_id] : null;
    const fallback = propByExchange[r.id];
    const p = primary ?? fallback ?? null;
    const propId = r.relinquished_property_id ?? p?.id ?? null;
    const f = propId ? finMap[propId] : null;
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      propertyId: propId,
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

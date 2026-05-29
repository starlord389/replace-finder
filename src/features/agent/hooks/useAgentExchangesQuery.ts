import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentExchangeRow {
  id: string;
  status: string;
  exchange_proceeds: number | null;
  identification_deadline: string | null;
  closing_deadline: string | null;
  created_at: string;
  relinquished_property_id: string | null;
  agent_clients: { client_name: string } | null;
  pledged_properties: {
    id: string;
    property_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    asset_type: string | null;
    units: number | null;
    year_built: number | null;
    status: string;
    asking_price: number | null;
    cap_rate: number | null;
    cover_url: string | null;
    match_count: number;
  } | null;
}

async function fetchAgentExchanges(userId: string): Promise<AgentExchangeRow[]> {
  // NOTE: pledged_properties is NOT embedded here because `exchanges` and
  // `pledged_properties` share two foreign keys (exchanges.relinquished_property_id
  // and pledged_properties.exchange_id), which makes PostgREST embeds ambiguous.
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "id, status, exchange_proceeds, identification_deadline, closing_deadline, created_at, relinquished_property_id, agent_clients(client_name)"
    )
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const exchanges = (data ?? []) as Array<Omit<AgentExchangeRow, "pledged_properties">>;

  const propertyIds = exchanges
    .map((e) => e.relinquished_property_id)
    .filter((v): v is string => Boolean(v));

  if (propertyIds.length === 0) {
    return exchanges.map((e) => ({ ...e, pledged_properties: null }));
  }

  const [propsRes, finsRes, imgsRes, matchesRes] = await Promise.all([
    supabase
      .from("pledged_properties")
      .select("id, property_name, address, city, state, asset_type, units, year_built, status")
      .in("id", propertyIds),
    supabase
      .from("property_financials")
      .select("property_id, asking_price, cap_rate")
      .in("property_id", propertyIds),
    supabase
      .from("property_images")
      .select("property_id, storage_path")
      .in("property_id", propertyIds)
      .order("sort_order"),
    supabase
      .from("matches")
      .select("seller_property_id")
      .in("seller_property_id", propertyIds),
  ]);

  if (propsRes.error) throw propsRes.error;

  const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
  const coverMap = new Map<string, string>();
  for (const img of imgsRes.data ?? []) {
    if (!coverMap.has(img.property_id)) {
      const { data: signed } = supabase.storage
        .from("property-images")
        .getPublicUrl(img.storage_path);
      coverMap.set(img.property_id, signed?.publicUrl ?? "");
    }
  }
  const matchCountMap = new Map<string, number>();
  for (const m of matchesRes.data ?? []) {
    matchCountMap.set(m.seller_property_id, (matchCountMap.get(m.seller_property_id) ?? 0) + 1);
  }

  const propMap = new Map(
    (propsRes.data ?? []).map((p: any) => {
      const fin = finMap.get(p.id);
      return [
        p.id,
        {
          id: p.id,
          property_name: p.property_name,
          address: p.address,
          city: p.city,
          state: p.state,
          asset_type: p.asset_type,
          units: p.units,
          year_built: p.year_built,
          status: p.status,
          asking_price: fin?.asking_price ?? null,
          cap_rate: fin?.cap_rate ?? null,
          cover_url: coverMap.get(p.id) ?? null,
          match_count: matchCountMap.get(p.id) ?? 0,
        },
      ];
    })
  );

  return exchanges.map((e) => ({
    ...e,
    pledged_properties: e.relinquished_property_id
      ? propMap.get(e.relinquished_property_id) ?? null
      : null,
  }));
}

export function useAgentExchangesQuery(userId?: string) {
  return useQuery({
    queryKey: ["agent-exchanges", userId],
    queryFn: () => fetchAgentExchanges(userId!),
    enabled: Boolean(userId),
  });
}

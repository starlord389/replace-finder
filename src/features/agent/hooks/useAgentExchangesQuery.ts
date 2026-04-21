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
  pledged_properties: { address: string | null; city: string | null; state: string | null } | null;
}

async function fetchAgentExchanges(userId: string): Promise<AgentExchangeRow[]> {
  // NOTE: pledged_properties is NOT embedded here because `exchanges` and
  // `pledged_properties` share two foreign keys (exchanges.relinquished_property_id
  // and pledged_properties.exchange_id), which makes PostgREST embeds ambiguous
  // and causes the whole query to fail. Fetch the relinquished properties in a
  // second round trip instead.
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "id, status, exchange_proceeds, identification_deadline, closing_deadline, created_at, relinquished_property_id, agent_clients(client_name)"
    )
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const exchanges = (data ?? []) as Array<
    Omit<AgentExchangeRow, "pledged_properties">
  >;

  const propertyIds = exchanges
    .map((e) => e.relinquished_property_id)
    .filter((v): v is string => Boolean(v));

  let propertyMap: Record<
    string,
    { address: string | null; city: string | null; state: string | null }
  > = {};

  if (propertyIds.length > 0) {
    const { data: properties, error: propError } = await supabase
      .from("pledged_properties")
      .select("id, address, city, state")
      .in("id", propertyIds);

    if (propError) {
      throw propError;
    }

    propertyMap = Object.fromEntries(
      (properties ?? []).map((p) => [
        p.id,
        { address: p.address, city: p.city, state: p.state },
      ])
    );
  }

  return exchanges.map((e) => ({
    ...e,
    pledged_properties: e.relinquished_property_id
      ? propertyMap[e.relinquished_property_id] ?? null
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

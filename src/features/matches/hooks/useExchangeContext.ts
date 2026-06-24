import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveListingName } from "@/lib/listingDisplay";

export interface ExchangeContext {
  id: string;
  clientName: string | null;
  relinquishedAddress: string | null;
  relinquishedCity: string | null;
  relinquishedState: string | null;
  relinquishedName: string | null;
  exchangeProceeds: number | null;
  targetStates: string[] | null;
  targetPriceMin: number | null;
  targetPriceMax: number | null;
  targetAssetTypes: string[] | null;
}

async function fetchExchangeContext(exchangeId: string): Promise<ExchangeContext | null> {
  const { data: ex } = await supabase
    .from("exchanges")
    .select(
      "id, exchange_proceeds, relinquished_property_id, criteria_id, agent_clients(client_name)",
    )
    .eq("id", exchangeId)
    .maybeSingle();
  if (!ex) return null;

  const [propRes, critRes] = await Promise.all([
    ex.relinquished_property_id
      ? supabase
          .from("pledged_properties")
          .select("property_name, address, address_is_public, city, state, asset_type")
          .eq("id", ex.relinquished_property_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    ex.criteria_id
      ? supabase
          .from("replacement_criteria")
          .select("target_states, target_price_min, target_price_max, target_asset_types")
          .eq("id", ex.criteria_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const prop: any = propRes.data;
  const crit: any = critRes.data;

  return {
    id: ex.id,
    clientName: (ex as any).agent_clients?.client_name ?? null,
    relinquishedName: prop ? resolveListingName(prop, true) : null,
    relinquishedAddress: prop?.address ?? null,
    relinquishedCity: prop?.city ?? null,
    relinquishedState: prop?.state ?? null,
    exchangeProceeds: ex.exchange_proceeds != null ? Number(ex.exchange_proceeds) : null,
    targetStates: crit?.target_states ?? null,
    targetPriceMin: crit?.target_price_min != null ? Number(crit.target_price_min) : null,
    targetPriceMax: crit?.target_price_max != null ? Number(crit.target_price_max) : null,
    targetAssetTypes: crit?.target_asset_types ?? null,
  };
}

export function useExchangeContext(exchangeId: string | null | undefined) {
  return useQuery({
    queryKey: ["exchange-context", exchangeId],
    queryFn: () => fetchExchangeContext(exchangeId!),
    enabled: !!exchangeId,
  });
}

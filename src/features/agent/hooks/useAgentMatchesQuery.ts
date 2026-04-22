import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";

export interface AgentMatchRow {
  id: string;
  buyer_exchange_id: string;
  seller_property_id: string;
  total_score: number;
  boot_status: string;
  estimated_total_boot: number | null;
  buyer_agent_viewed: boolean;
  created_at: string;
  price_score: number;
  geo_score: number;
  asset_score: number;
  strategy_score: number;
  financial_score: number;
  timing_score: number;
  debt_fit_score: number;
  scale_fit_score: number;
  property?: any;
  financials?: any;
  coverUrl?: string | null;
  clientName?: string;
  /** snapshot of the buyer's relinquished property for side-by-side comparison */
  relinquished?: {
    price: number | null;
    noi: number | null;
    capRate: number | null;
    units: number | null;
    sf: number | null;
    city: string | null;
    state: string | null;
  } | null;
}

interface AgentMatchesData {
  buyerMatches: AgentMatchRow[];
  sellerMatches: AgentMatchRow[];
  exchangeMap: Map<string, string>;
}

async function fetchAgentMatches(userId: string): Promise<AgentMatchesData> {
  const { data: exchanges } = await supabase
    .from("exchanges")
    .select("id, client_id")
    .eq("agent_id", userId);
  const exchangeIds = (exchanges ?? []).map((e) => e.id);

  const { data: props } = await supabase
    .from("pledged_properties")
    .select("id, property_name")
    .eq("agent_id", userId);
  const propertyIds = (props ?? []).map((p) => p.id);
  const propNameMap = new Map((props ?? []).map((p) => [p.id, p.property_name || "Property"]));

  const clientIds = [...new Set((exchanges ?? []).map((e) => e.client_id))];
  const { data: clients } = clientIds.length > 0
    ? await supabase.from("agent_clients").select("id, client_name").in("id", clientIds)
    : { data: [] as any[] };
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.client_name]));

  const exchangeMap = new Map<string, string>();
  (exchanges ?? []).forEach((exchange) => {
    exchangeMap.set(exchange.id, clientMap.get(exchange.client_id) || "Client");
  });

  let buyerData: AgentMatchRow[] = [];
  if (exchangeIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .in("buyer_exchange_id", exchangeIds)
      .eq("status", "active")
      .order("total_score", { ascending: false });
    buyerData = (data ?? []) as unknown as AgentMatchRow[];
  }

  let sellerData: AgentMatchRow[] = [];
  if (propertyIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .in("seller_property_id", propertyIds)
      .eq("status", "active")
      .order("total_score", { ascending: false });
    sellerData = (data ?? []) as unknown as AgentMatchRow[];
  }

  if (buyerData.length > 0) {
    const sellerPropIds = [...new Set(buyerData.map((m) => m.seller_property_id))];
    const [propsRes, finsRes, imgsRes] = await Promise.all([
      supabase.from("pledged_properties").select("*").in("id", sellerPropIds),
      supabase.from("property_financials").select("*").in("property_id", sellerPropIds),
      supabase.from("property_images").select("*").in("property_id", sellerPropIds).order("sort_order"),
    ]);

    const pMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
    const fMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
    const iMap = new Map<string, any>();
    (imgsRes.data ?? []).forEach((img: any) => {
      if (!iMap.has(img.property_id)) iMap.set(img.property_id, img);
    });

    buyerData.forEach((match) => {
      match.property = pMap.get(match.seller_property_id);
      match.financials = fMap.get(match.seller_property_id);
      const firstImg = iMap.get(match.seller_property_id);
      match.coverUrl = firstImg ? resolvePropertyImageUrl(firstImg.storage_path) : null;
      match.clientName = exchangeMap.get(match.buyer_exchange_id) || "Client";
    });

    buyerData.sort((a, b) => {
      if (a.buyer_agent_viewed !== b.buyer_agent_viewed) return a.buyer_agent_viewed ? 1 : -1;
      return Number(b.total_score) - Number(a.total_score);
    });
  }

  sellerData.forEach((match) => {
    (match as any).sellerPropertyName = propNameMap.get(match.seller_property_id) || "Your property";
  });

  return { buyerMatches: buyerData, sellerMatches: sellerData, exchangeMap };
}

export function useAgentMatchesQuery(userId?: string) {
  return useQuery({
    queryKey: ["agent-matches", userId],
    queryFn: () => fetchAgentMatches(userId!),
    enabled: Boolean(userId),
  });
}

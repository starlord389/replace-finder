import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveListingName } from "@/lib/listingDisplay";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

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
  pipelineStageOverride: string | null;
  /** First uploaded photo (display URL), or null when the listing has no real photo. */
  coverUrl: string | null;
}

async function fetchAgentListings(userId: string, isDemo: boolean): Promise<AgentListing[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "id, status, created_at, relinquished_property_id, client_id, pipeline_stage_override, agent_clients(client_name)"
    )
    .eq("agent_id", userId)
    .eq("is_demo", isDemo)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    created_at: string;
    relinquished_property_id: string | null;
    client_id: string | null;
    pipeline_stage_override: string | null;
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

  // First uploaded photo per property → real cover URL (no fabricated fallback).
  const allPropIds = Array.from(
    new Set([
      ...propIds,
      ...Object.values(propByExchange).map((p: any) => p.id).filter(Boolean),
    ]),
  );
  const coverByProp: Record<string, string> = {};
  if (allPropIds.length) {
    const { data: imgs } = await supabase
      .from("property_images")
      .select("property_id, storage_path")
      .in("property_id", allPropIds)
      .order("sort_order");
    for (const img of imgs ?? []) {
      const pid = (img as any).property_id as string;
      if (!coverByProp[pid]) {
        coverByProp[pid] = resolvePropertyImageUrl((img as any).storage_path);
      }
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
      // Agent's own listing → always show the exact address (falls back to a label).
      propertyName: p ? resolveListingName(p, true) : null,
      address: p?.address ?? null,
      city: p?.city ?? null,
      state: p?.state ?? null,
      assetType: p?.asset_type ?? null,
      strategyType: p?.strategy_type ?? null,
      askingPrice: f?.asking_price ?? null,
      pipelineStageOverride: r.pipeline_stage_override,
      coverUrl: propId ? coverByProp[propId] ?? null : null,
    };
  });
}

export function useAgentListings(userId?: string) {
  const { isDemo } = useWorkspaceMode();
  return useQuery({
    queryKey: ["agent-listings", userId, isDemo],
    queryFn: () => fetchAgentListings(userId!, isDemo),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

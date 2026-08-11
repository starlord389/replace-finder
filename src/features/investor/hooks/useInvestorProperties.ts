import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import type { InvestorProperty } from "@/features/investor/types";
import { resolveListingName } from "@/lib/listingDisplay";

async function fetchProperties(isDemo: boolean): Promise<InvestorProperty[]> {
  const { data: properties, error } = await supabase
    .from("pledged_properties_secure")
    .select("id, agent_id, property_name, address, address_is_public, city, state, zip, asset_type, strategy_type, units, year_built, building_square_footage, description, recent_renovations, is_demo, listed_at")
    .eq("status", "active")
    .eq("is_demo", isDemo)
    .order("listed_at", { ascending: false });
  if (error) throw error;

  const ids = (properties ?? []).map((property) => property.id).filter((id): id is string => !!id);
  if (!ids.length) return [];

  const [{ data: financials, error: financialError }, { data: images, error: imageError }] = await Promise.all([
    supabase
      .from("property_financials")
      .select("property_id, asking_price, cap_rate, occupancy_rate, noi, gross_rent_roll, total_operating_expenses")
      .in("property_id", ids),
    supabase
      .from("property_images")
      .select("property_id, storage_path, sort_order")
      .in("property_id", ids)
      .order("sort_order"),
  ]);
  if (financialError) throw financialError;
  if (imageError) throw imageError;

  const financialByProperty = new Map((financials ?? []).map((row) => [row.property_id, row]));
  const imagesByProperty = new Map<string, string[]>();
  for (const image of images ?? []) {
    const list = imagesByProperty.get(image.property_id) ?? [];
    list.push(resolvePropertyImageUrl(image.storage_path));
    imagesByProperty.set(image.property_id, list);
  }

  return (properties ?? []).filter((property): property is typeof property & { id: string; agent_id: string } => !!property.id && !!property.agent_id).map((property) => {
    const financial = financialByProperty.get(property.id);
    return {
      id: property.id,
      agentId: property.agent_id,
      name: resolveListingName(property, false),
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      assetType: property.asset_type,
      strategyType: property.strategy_type,
      units: property.units,
      yearBuilt: property.year_built,
      buildingSquareFeet: property.building_square_footage,
      description: property.description,
      recentRenovations: property.recent_renovations,
      askingPrice: financial?.asking_price == null ? null : Number(financial.asking_price),
      capRate: financial?.cap_rate == null ? null : Number(financial.cap_rate),
      occupancyRate: financial?.occupancy_rate == null ? null : Number(financial.occupancy_rate),
      noi: financial?.noi == null ? null : Number(financial.noi),
      grossRentRoll: financial?.gross_rent_roll == null ? null : Number(financial.gross_rent_roll),
      totalOperatingExpenses: financial?.total_operating_expenses == null ? null : Number(financial.total_operating_expenses),
      imageUrls: imagesByProperty.get(property.id) ?? [],
      isDemo: property.is_demo ?? false,
      listedAt: property.listed_at,
    };
  });
}

export function useInvestorProperties() {
  const { hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const effectiveDemo = isDemo && hasRole("admin");
  return useQuery({
    queryKey: ["investor-properties", effectiveDemo],
    queryFn: () => fetchProperties(effectiveDemo),
    staleTime: 30_000,
  });
}

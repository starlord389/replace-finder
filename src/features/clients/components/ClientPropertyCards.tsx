import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ASSET_TYPE_LABELS, EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS } from "@/lib/constants";
import { resolveListingName } from "@/lib/listingDisplay";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { ListingPreviewDialog } from "@/features/workspace/components/ListingPreviewDialog";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  clientId: string;
  clientName: string | null;
}

interface ListingRow {
  exchangeId: string;
  exchangeStatus: string;
  createdAt: string;
  propertyId: string | null;
  propertyName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  assetType: string | null;
  askingPrice: number | null;
  capRate: number | null;
  coverUrl: string | null;
}

async function fetchListings(clientId: string): Promise<ListingRow[]> {
  const { data: exchanges } = await supabase
    .from("exchanges")
    .select("id, status, relinquished_property_id, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (!exchanges || exchanges.length === 0) return [];

  const propIds = exchanges
    .map((e) => e.relinquished_property_id)
    .filter((v): v is string => Boolean(v));

  if (propIds.length === 0) {
    return exchanges.map((e) => ({
      exchangeId: e.id,
      exchangeStatus: e.status as string,
      createdAt: e.created_at,
      propertyId: null,
      propertyName: null,
      address: null,
      city: null,
      state: null,
      assetType: null,
      askingPrice: null,
      capRate: null,
      coverUrl: null,
    }));
  }

  const [propsRes, finsRes, imgsRes] = await Promise.all([
    supabase
      .from("pledged_properties")
      .select("id, property_name, address, city, state, asset_type")
      .in("id", propIds),
    supabase
      .from("property_financials")
      .select("property_id, asking_price, cap_rate")
      .in("property_id", propIds),
    supabase
      .from("property_images")
      .select("property_id, storage_path")
      .in("property_id", propIds)
      .order("sort_order"),
  ]);

  const propMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
  const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
  const coverByProp = new Map<string, string>();
  for (const img of imgsRes.data ?? []) {
    if (!coverByProp.has(img.property_id)) {
      coverByProp.set(img.property_id, resolvePropertyImageUrl(img.storage_path));
    }
  }

  return exchanges.map((e) => {
    const prop: any = e.relinquished_property_id ? propMap.get(e.relinquished_property_id) : null;
    const fin: any = e.relinquished_property_id ? finMap.get(e.relinquished_property_id) : null;
    return {
      exchangeId: e.id,
      exchangeStatus: e.status as string,
      createdAt: e.created_at,
      propertyId: e.relinquished_property_id,
      // Agent's own client listing → they always see the exact address.
      propertyName: prop ? resolveListingName(prop, true) : null,
      address: prop?.address ?? null,
      city: prop?.city ?? null,
      state: prop?.state ?? null,
      assetType: prop?.asset_type ?? null,
      askingPrice: fin?.asking_price ?? null,
      capRate: fin?.cap_rate ? Number(fin.cap_rate) : null,
      coverUrl: e.relinquished_property_id ? coverByProp.get(e.relinquished_property_id) ?? null : null,
    };
  });
}

function fmtPrice(v: number | null) {
  if (!v) return "Price TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

// Shape a client listing into the AgentListing the preview dialog expects, so
// clicking a card opens the SAME investor-preview popup as the Listings tab.
function toAgentListing(l: ListingRow, clientId: string, clientName: string | null): AgentListing {
  return {
    id: l.exchangeId,
    status: l.exchangeStatus,
    createdAt: l.createdAt,
    clientId,
    clientName,
    propertyId: l.propertyId,
    propertyName: l.propertyName,
    address: l.address,
    city: l.city,
    state: l.state,
    assetType: l.assetType,
    strategyType: null,
    askingPrice: l.askingPrice,
    pipelineStageOverride: null,
    coverUrl: l.coverUrl,
  };
}

export function ClientPropertyCards({ clientId, clientName }: Props) {
  const [previewListing, setPreviewListing] = useState<AgentListing | null>(null);
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["client-listings", clientId],
    queryFn: () => fetchListings(clientId),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No listings yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a listing to pledge a relinquished property for this client.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to={`/agent/exchanges/new?client=${clientId}`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => {
        const loc = [l.city, l.state].filter(Boolean).join(", ");
        return (
          <button
            key={l.exchangeId}
            type="button"
            onClick={() => setPreviewListing(toAgentListing(l, clientId, clientName))}
            className="block w-full text-left"
          >
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <div className="relative aspect-[16/10] bg-muted">
                {l.coverUrl ? (
                  <img
                    src={l.coverUrl}
                    alt={l.propertyName || "Property"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <Badge
                    className={`${
                      EXCHANGE_STATUS_COLORS[l.exchangeStatus] ||
                      "bg-muted text-muted-foreground"
                    } text-[10px]`}
                  >
                    {EXCHANGE_STATUS_LABELS[l.exchangeStatus] || l.exchangeStatus}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-lg font-bold text-foreground">
                  {fmtPrice(l.askingPrice)}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {l.capRate != null && <span>{l.capRate.toFixed(1)}% cap</span>}
                </div>
                <p className="mt-2 truncate font-semibold text-foreground">
                  {l.propertyName ||
                    l.address ||
                    (l.exchangeStatus === "draft" ? "Draft — no property yet" : "Untitled")}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                </p>
                {l.assetType && (
                  <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {ASSET_TYPE_LABELS[l.assetType as Enums<"asset_type">]}
                  </span>
                )}
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>

    <ListingPreviewDialog
      listing={previewListing}
      open={previewListing !== null}
      onOpenChange={(o) => !o && setPreviewListing(null)}
    />
    </>
  );
}

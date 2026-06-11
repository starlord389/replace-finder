import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building,
  Calendar,
  Eye,
  Home,
  Images,
  LayoutGrid,
  MapPin,
  Pencil,
  Ruler,
  Store,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { propertyImages } from "@/features/matches/components/inbox/propertyImage";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";

interface Props {
  listing: AgentListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreviewData {
  property: {
    id: string;
    property_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    asset_type: string | null;
    asset_subtype: string | null;
    property_class: string | null;
    strategy_type: string | null;
    units: number | null;
    building_square_footage: number | null;
    land_area_acres: number | null;
    year_built: number | null;
    parking_spaces: number | null;
    amenities: string[] | null;
    description: string | null;
    recent_renovations: string | null;
  } | null;
  financials: {
    asking_price: number | null;
    cap_rate: number | null;
    noi: number | null;
    occupancy_rate: number | null;
    annual_revenue: number | null;
  } | null;
  images: string[];
}

async function fetchPreview(exchangeId: string): Promise<PreviewData> {
  const { data: ex } = await supabase
    .from("exchanges")
    .select("relinquished_property_id")
    .eq("id", exchangeId)
    .single();
  const propId = ex?.relinquished_property_id ?? null;
  if (!propId) return { property: null, financials: null, images: [] };

  const [propRes, finRes, imgRes] = await Promise.all([
    supabase
      .from("pledged_properties")
      .select(
        "id, property_name, address, city, state, zip, asset_type, asset_subtype, property_class, strategy_type, units, building_square_footage, land_area_acres, year_built, parking_spaces, amenities, description, recent_renovations",
      )
      .eq("id", propId)
      .single(),
    supabase
      .from("property_financials")
      .select("asking_price, cap_rate, noi, occupancy_rate, annual_revenue")
      .eq("property_id", propId)
      .maybeSingle(),
    supabase
      .from("property_images")
      .select("storage_path, sort_order")
      .eq("property_id", propId)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    property: (propRes.data ?? null) as PreviewData["property"],
    financials: (finRes.data ?? null) as PreviewData["financials"],
    images: (imgRes.data ?? []).map((r: any) => r.storage_path).filter(Boolean),
  };
}

function fmtPrice(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function fmtNumber(v: number | null | undefined, suffix = "") {
  if (v == null) return "—";
  return `${v.toLocaleString()}${suffix}`;
}

export function ListingPreviewDialog({ listing, open, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["listing-preview", listing?.id],
    queryFn: () => fetchPreview(listing!.id),
    enabled: !!listing && open,
    staleTime: 30_000,
  });

  const [active, setActive] = useState(0);

  if (!listing) return null;

  const title =
    data?.property?.property_name ||
    listing.propertyName ||
    listing.address ||
    "Untitled listing";
  const location =
    [data?.property?.city ?? listing.city, data?.property?.state ?? listing.state]
      .filter(Boolean)
      .join(", ");
  const askingPrice =
    data?.financials?.asking_price ?? listing.askingPrice ?? null;
  const assetType =
    data?.property?.asset_type ?? listing.assetType ?? null;
  const assetLabel = assetType
    ? (ASSET_TYPE_LABELS as Record<string, string>)[assetType] ?? assetType
    : null;

  const galleryKey = listing.id;
  const uploaded = data?.images ?? [];
  const gallery = uploaded.length
    ? [...uploaded, ...propertyImages(uploaded[0] ?? null, galleryKey, 8)].slice(0, 8)
    : propertyImages(null, galleryKey, 8);

  const isDraft = listing.status === "draft";
  const hasProperty = !!data?.property;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Listing preview — {title}</DialogTitle>
        <DialogDescription className="sr-only">
          Marketing-card preview of how matched investors see this listing.
        </DialogDescription>

        {/* Preview-mode banner */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-5 py-2.5 text-xs">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold uppercase tracking-[0.16em] text-foreground">
            Investor preview
          </span>
          <span className="text-muted-foreground">
            This is how matched investors see your listing.
          </span>
        </div>

        <div className="max-h-[78vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !hasProperty ? (
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <h2 className="text-base font-semibold text-foreground">
                No property attached yet
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {isDraft
                  ? "This listing is still a draft. Finish setting up the property to see the investor preview."
                  : "Add a property to this listing to see the investor preview."}
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link to={`/agent/exchanges/${listing.id}/edit`}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit listing
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="relative w-full overflow-hidden bg-muted">
                <div className="relative aspect-[16/9] w-full">
                  <img
                    src={gallery[active]}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      Matched
                    </span>
                    {assetLabel && (
                      <span className="inline-flex items-center rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-foreground shadow backdrop-blur">
                        {assetLabel}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-lg bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow backdrop-blur">
                    <Images className="h-3.5 w-3.5" />
                    {gallery.length} photos
                  </div>

                  <div className="absolute bottom-5 left-5 text-white">
                    <h1 className="text-2xl font-bold leading-tight tracking-tight drop-shadow-md sm:text-3xl">
                      {title}
                    </h1>
                    {location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90 drop-shadow">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto bg-card px-5 py-3">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                        active === i
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent opacity-80 hover:opacity-100",
                      )}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Price strip */}
              <div className="flex flex-wrap items-end justify-between gap-4 border-y border-border bg-muted/30 px-6 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Asking Price
                  </p>
                  <p className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
                    {fmtPrice(askingPrice)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  {data?.financials?.cap_rate != null && (
                    <KeyStat
                      label="Cap Rate"
                      value={`${Number(data.financials.cap_rate).toFixed(2)}%`}
                    />
                  )}
                  {data?.financials?.noi != null && (
                    <KeyStat label="NOI" value={fmtPrice(data.financials.noi)} />
                  )}
                  {data?.financials?.occupancy_rate != null && (
                    <KeyStat
                      label="Occupancy"
                      value={`${Number(data.financials.occupancy_rate).toFixed(0)}%`}
                    />
                  )}
                  {data?.property?.property_class && (
                    <KeyStat label="Class" value={data.property.property_class} />
                  )}
                </div>
              </div>

              {/* Facts */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border bg-card px-6 py-5 sm:grid-cols-3 md:grid-cols-6">
                <Fact
                  icon={Ruler}
                  label="Building Size"
                  value={
                    data?.property?.building_square_footage != null
                      ? `${Number(data.property.building_square_footage).toLocaleString()} sf`
                      : "—"
                  }
                />
                <Fact
                  icon={MapPin}
                  label="Lot Size"
                  value={
                    data?.property?.land_area_acres != null
                      ? `${Number(data.property.land_area_acres).toFixed(2)} ac`
                      : "—"
                  }
                />
                <Fact
                  icon={Calendar}
                  label="Year Built"
                  value={data?.property?.year_built?.toString() ?? "—"}
                />
                <Fact
                  icon={Building}
                  label="Units"
                  value={fmtNumber(data?.property?.units)}
                />
                <Fact
                  icon={Home}
                  label="Parking"
                  value={fmtNumber(data?.property?.parking_spaces)}
                />
                <Fact
                  icon={Store}
                  label="Strategy"
                  value={data?.property?.strategy_type ?? "—"}
                />
              </div>

              {/* Description + amenities */}
              <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_280px]">
                <div className="min-w-0 space-y-4">
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      About this property
                    </h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {data?.property?.description?.replace(/__mock__\s*/g, "") ||
                        "No description provided yet."}
                    </p>
                  </section>
                  {data?.property?.recent_renovations && (
                    <section>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Recent renovations
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {data.property.recent_renovations}
                      </p>
                    </section>
                  )}
                </div>
                <aside className="space-y-4">
                  {data?.property?.amenities && data.property.amenities.length > 0 && (
                    <section>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Highlights
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {data.property.amenities.map((a) => (
                          <Badge key={a} variant="secondary" className="font-normal">
                            {a}
                          </Badge>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    Investor identity is revealed only after both sides accept the
                    connection. Contact and counterparty details are hidden in this
                    preview.
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {listing.clientName ? (
              <>
                Listing for{" "}
                <span className="font-medium text-foreground">{listing.clientName}</span>
              </>
            ) : (
              "Unassigned listing"
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/agent/exchanges/${listing.id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit listing
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`/agent/workspace/${listing.id}`}>
                Open workspace
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function KeyStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, LayoutGrid, LoaderCircle, Pencil, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { supabase } from "@/integrations/supabase/client";
import {
  buildListingPreviewRelationship,
  type ListingPreviewDetails,
} from "@/features/workspace/lib/listingPreview";

interface Props {
  listing: AgentListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath?: string;
}

const PROPERTY_PREVIEW_COLUMNS = "id, property_name, address, address_is_public, city, state, zip, asset_type, asset_subtype, strategy_type, property_class, property_condition, year_built, units, building_square_footage, land_area_acres, num_buildings, num_stories, parking_spaces, parking_type, construction_type, roof_type, hvac_type, zoning, amenities, description, recent_renovations";

async function fetchListingPreviewDetails(propertyId: string): Promise<ListingPreviewDetails> {
  const [propertyResult, financialResult, imagesResult] = await Promise.all([
    supabase
      .from("pledged_properties")
      .select(PROPERTY_PREVIEW_COLUMNS)
      .eq("id", propertyId)
      .maybeSingle(),
    supabase
      .from("property_financials")
      .select("asking_price, cap_rate, occupancy_rate, gross_rent_roll, total_operating_expenses, noi")
      .eq("property_id", propertyId)
      .maybeSingle(),
    supabase
      .from("property_images")
      .select("storage_path, sort_order")
      .eq("property_id", propertyId)
      .order("sort_order"),
  ]);

  if (propertyResult.error) throw propertyResult.error;
  if (financialResult.error) throw financialResult.error;
  if (imagesResult.error) throw imagesResult.error;

  return {
    property: propertyResult.data as ListingPreviewDetails["property"],
    financials: financialResult.data as ListingPreviewDetails["financials"],
    imageUrls: (imagesResult.data ?? []).map((image) => resolvePropertyImageUrl(image.storage_path)),
  };
}

export function ListingPreviewDialog({ listing, open, onOpenChange, basePath = "/agent" }: Props) {
  const propertyId = listing?.propertyId ?? null;
  const previewQuery = useQuery({
    queryKey: ["listing-preview-details", propertyId],
    queryFn: () => fetchListingPreviewDetails(propertyId!),
    enabled: open && Boolean(propertyId),
    staleTime: 30_000,
  });

  if (!listing) return null;

  const title = listing.propertyName || listing.address || "Untitled listing";
  const hasProperty =
    Boolean(listing.propertyId) ||
    Boolean(listing.propertyName) ||
    Boolean(listing.address) ||
    listing.askingPrice != null;
  const isDraft = listing.status === "draft";
  const needsHydration = Boolean(propertyId);
  const rel = hasProperty && (!needsHydration || previewQuery.data)
    ? buildListingPreviewRelationship(listing, previewQuery.data ?? null, basePath)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Investor preview - {title}</DialogTitle>
        <DialogDescription className="sr-only">
          A preview of how matched investors see your listing.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-5 py-2.5 text-xs">
          <Eye className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold uppercase tracking-[0.16em] text-foreground">
            Investor preview
          </span>
          <span className="text-muted-foreground">
            This is how matched investors see your listing.
          </span>
        </div>

        <div className="max-h-[80vh] overflow-y-auto">
          {!hasProperty ? (
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
                <Link to={`${basePath}/exchanges/${listing.id}/edit`}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit listing
                </Link>
              </Button>
            </div>
          ) : needsHydration && previewQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Loading complete listing</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connecting the property details, financials, and photos.
                </p>
              </div>
            </div>
          ) : previewQuery.isError ? (
            <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
              <AlertCircle className="h-9 w-9 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">Couldn't load the complete preview</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  The listing exists, but its detailed property records could not be loaded. Try again before sharing it.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => previewQuery.refetch()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
              </Button>
            </div>
          ) : rel ? (
            <div className="p-4">
              <PropertyReviewPanel rel={rel} previewMode />
            </div>
          ) : null}
        </div>

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
              <Link to={`${basePath}/exchanges/${listing.id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit listing
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link
                to={`${basePath}/matches?${listing.clientId ? `client=${listing.clientId}&` : ""}listing=${listing.id}`}
              >
                View matches
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Link } from "react-router-dom";
import { Eye, LayoutGrid, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  listing: AgentListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildPreviewRel(listing: AgentListing): Relationship {
  return {
    id: `preview-${listing.id}`,
    matchId: `preview-${listing.id}`,
    connectionId: null,
    mySide: "seller",
    stage: "new",
    score: 0,
    bootStatus: "",
    estimatedBoot: null,
    buyerCurrentRoe: null,
    candidateRoe: null,
    roeImprovementPp: null,
    roeImprovementRel: null,
    counterpartyName: null,
    counterpartyBrokerage: null,
    counterpartyAvatar: null,
    propertyId: listing.propertyId ?? "",
    propertyName:
      listing.propertyName || listing.address || "Untitled listing",
    propertyCity: listing.city,
    propertyState: listing.state,
    propertyImageUrl: null,
    askingPrice: listing.askingPrice,
    capRate: null,
    clientId: listing.clientId,
    clientName: listing.clientName,
    buyerExchangeId: "",
    relinquishedLabel: null,
    lastActivityAt: listing.createdAt,
    lastMessagePreview: null,
    lastMessageSenderId: null,
    unreadCount: 0,
    isNewMatch: false,
    connectionStatus: null,
    connectionInitiatedBy: null,
    acceptedAt: null,
    declinedAt: null,
    closedAt: null,
    underContractAt: null,
    inspectionCompleteAt: null,
    financingApprovedAt: null,
    declineReason: null,
    buyerAgentId: "",
    sellerAgentId: null,
  };
}

export function ListingPreviewDialog({ listing, open, onOpenChange }: Props) {
  if (!listing) return null;

  const title = listing.propertyName || listing.address || "Untitled listing";
  const hasProperty =
    !!listing.propertyId ||
    !!listing.propertyName ||
    !!listing.address ||
    listing.askingPrice != null;
  const isDraft = listing.status === "draft";
  const rel = hasProperty ? buildPreviewRel(listing) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Investor preview — {title}</DialogTitle>
        <DialogDescription className="sr-only">
          This is exactly how matched investors see your listing.
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

        <div className="max-h-[80vh] overflow-y-auto">
          {!rel ? (
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
            <div className="p-4">
              <PropertyReviewPanel rel={rel} previewMode />
            </div>
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
              <Link
                to={`/agent/matches?${listing.clientId ? `client=${listing.clientId}&` : ""}listing=${listing.id}`}
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

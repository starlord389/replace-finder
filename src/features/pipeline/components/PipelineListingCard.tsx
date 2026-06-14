import { Link } from "react-router-dom";
import { MapPin, ArrowRight, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import {
  STAGE_DEFS,
  STAGE_RANK,
  type StageKey,
} from "@/features/pipeline/lib/pipelineStages";
import type { ListingMeta } from "@/features/pipeline/lib/pipelineFilters";

function fmtPrice(v: number | null | undefined) {
  if (!v) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function deadlineChipClass(days: number | null): string {
  if (days === null) return "bg-muted text-muted-foreground";
  if (days <= 7) return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
  if (days <= 14) return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  if (days <= 30) return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
}

interface PipelineListingCardProps {
  meta: ListingMeta;
  isDragOverlay?: boolean;
}

export function PipelineListingCard({
  meta,
  isDragOverlay = false,
}: PipelineListingCardProps) {
  const { listing, stage, isOverridden, matchCount, bestScore, lastActivityAt } = meta;
  const accent = getClientAccent(listing.clientId);
  const title =
    listing.propertyName ||
    listing.address ||
    (listing.status === "draft" ? "Draft listing" : "Untitled");
  const location = [listing.city, listing.state].filter(Boolean).join(", ") || null;
  const price = fmtPrice(listing.askingPrice);
  const currentRank = STAGE_RANK[stage];

  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: listing.id,
    data: { stage },
    disabled: isDragOverlay,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-l-[4px] bg-card p-3 transition-shadow",
        accent.borderLeft,
        isDragging && "opacity-40",
        isDragOverlay && "shadow-xl ring-1 ring-primary/30",
        !isDragging && !isDragOverlay && "hover:shadow-md",
      )}
    >
      {/* Top row: client + auto/manual badge + drag handle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
          <span className="truncate">{listing.clientName ?? "No client"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isOverridden && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              manual
            </span>
          )}
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag listing"
            className="cursor-grab rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-muted hover:text-foreground active:cursor-grabbing group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title + price */}
      <div className="mt-1 flex items-start justify-between gap-2">
        <Link
          to={`/agent/workspace/${listing.id}`}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:text-primary"
        >
          {title}
        </Link>
        {price && (
          <span className="shrink-0 text-sm font-semibold text-foreground">
            {price}
          </span>
        )}
      </div>

      {/* Location + asset pill */}
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        {location && (
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" /> {location}
          </span>
        )}
        {listing.assetType && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            {listing.assetType}
          </span>
        )}
      </div>

      {/* Score + deadline chips */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {bestScore !== null && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {Math.round(bestScore)} score
          </span>
        )}
        {meta.nearestDeadlineDays !== null && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              deadlineChipClass(meta.nearestDeadlineDays),
            )}
          >
            {meta.nearestDeadlineType === "identification" ? "ID" : "Close"} ·{" "}
            {meta.nearestDeadlineDays === 0
              ? "today"
              : `${meta.nearestDeadlineDays}d`}
          </span>
        )}
      </div>

      {/* Stage progress dots */}
      <div className="mt-2.5 flex items-center gap-1" aria-label="Stage progress">
        {STAGE_DEFS.map((s) => {
          const reached = STAGE_RANK[s.key] <= currentRank;
          return (
            <span
              key={s.key}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                reached ? "bg-primary" : "bg-muted",
              )}
              title={s.title}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-medium">
          {matchCount} {matchCount === 1 ? "match" : "matches"}
        </span>
        <div className="flex items-center gap-2">
          {lastActivityAt && (
            <span>{formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}</span>
          )}
          <Link
            to={`/agent/workspace/${listing.id}`}
            className="invisible inline-flex items-center font-medium text-primary group-hover:visible"
          >
            Open <ArrowRight className="ml-0.5 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

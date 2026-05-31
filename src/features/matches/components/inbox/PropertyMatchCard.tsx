import { cn } from "@/lib/utils";
import { propertyImage } from "./propertyImage";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import { currency, scoreDotClass } from "../helpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import {
  deriveUiStatus,
  nextActionsFor,
  rankReason,
  UI_STATUS_CLASS,
  UI_STATUS_LABEL,
} from "./inboxHelpers";
import { readMatchLocalState } from "./useMatchLocalState";

interface Props {
  rel: Relationship;
  selected: boolean;
  onSelect: () => void;
  assetType?: string | null;
  showClientLabel?: boolean;
  rank?: number;
}

export function PropertyMatchCard({ rel, selected, onSelect, assetType, showClientLabel = false, rank }: Props) {
  const local = readMatchLocalState(rel.matchId);
  const status = deriveUiStatus(rel, local);
  const action = nextActionsFor(status).primary;

  const noi =
    rel.askingPrice && rel.capRate
      ? `${currency(rel.askingPrice * (rel.capRate / 100))} NOI`
      : null;

  const assetLabel = assetType
    ? ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS] ?? assetType
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full min-w-0 gap-3 overflow-hidden rounded-xl border bg-card p-3 text-left transition-all",
        "hover:border-primary/40 hover:shadow-sm",
        selected
          ? "border-primary ring-2 ring-primary/15 shadow-sm"
          : "border-border",
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img
          src={propertyImage(rel.propertyImageUrl, rel.id)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span
          className={cn(
            "absolute bottom-1 left-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow",
            scoreDotClass(rel.score),
          )}
          title={`Match score ${Math.round(rel.score)}`}
        >
          {Math.round(rel.score)}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            {rank != null && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/80">
                #{rank}
              </span>
            )}
            <p className="truncate text-sm font-semibold text-foreground">
              {rel.propertyName}
            </p>
          </div>
          {rel.unreadCount > 0 && (
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
          {assetLabel && <span> · {assetLabel}</span>}
        </p>
        {showClientLabel && rel.clientName && (
          <p className="truncate text-[11px] font-medium text-primary/80">
            Matched for {rel.clientName}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="font-semibold text-foreground">{currency(rel.askingPrice)}</span>
          {rel.capRate != null && (
            <span className="text-muted-foreground">{rel.capRate.toFixed(1)}% cap</span>
          )}
          {noi && <span className="text-muted-foreground">{noi}</span>}
        </div>

        <p className="mt-1 truncate text-[10px] italic text-muted-foreground">
          {rankReason(rel)}
        </p>


        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              UI_STATUS_CLASS[status],
            )}
          >
            {UI_STATUS_LABEL[status]}
          </span>
          {action && (
            <span className="truncate text-[10px] font-medium text-primary">
              → {action.label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

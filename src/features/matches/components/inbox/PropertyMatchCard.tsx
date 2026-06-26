import { cn } from "@/lib/utils";
import { propertyImage } from "./propertyImage";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import { currency, scoreDotClass } from "../helpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import {
  deriveUiStatus,
  formatCapRate,
  nextActionsFor,
  UI_STATUS_CLASS,
  UI_STATUS_LABEL,
} from "./inboxHelpers";
import { readMatchLocalState, useMatchLocalStateVersion } from "./useMatchLocalState";
import { ClientLeadLine } from "@/features/matches/components/shared/ClientLeadLine";

interface Props {
  rel: Relationship;
  selected: boolean;
  onSelect: () => void;
  assetType?: string | null;
  /** When true, suppress the client lead line (used when scope is grouped by client header). */
  hideClientLead?: boolean;
  rank?: number;
}

export function PropertyMatchCard({ rel, selected, onSelect, assetType, hideClientLead = false, rank }: Props) {
  // Re-render this card when any match's local state changes, so its status
  // badge / next-action stay fresh after an action taken elsewhere.
  useMatchLocalStateVersion();
  const local = readMatchLocalState(rel.matchId);
  const status = deriveUiStatus(rel, local);
  const action = nextActionsFor(status).primary;

  const assetLabel = assetType
    ? ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS] ?? assetType
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex w-full min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3 text-left transition-all duration-200",
        selected
          ? "border-primary/60 shadow-[0_2px_4px_rgba(38,33,28,0.05),0_16px_32px_-16px_rgba(38,33,28,0.28)] ring-1 ring-primary/10"
          : "border-border hover:-translate-y-px hover:border-primary/25 hover:shadow-[0_2px_4px_rgba(38,33,28,0.04),0_14px_28px_-16px_rgba(38,33,28,0.22)]",
      )}
    >
      {/* Client identity lead row */}
      {!hideClientLead && (
        <div className="flex items-center justify-between gap-2">
          <ClientLeadLine
            clientId={rel.clientId}
            clientName={rel.clientName}
            relinquishedLabel={rel.relinquishedLabel}
            size="sm"
            className="min-w-0 flex-1"
          />
          {rank != null && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground/70">
              #{rank}
            </span>
          )}
        </div>
      )}

      {/* Matched property */}
      <div className="flex min-w-0 gap-3">
        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/[0.04]">
          <img
            src={propertyImage(rel.propertyImageUrl, rel.id)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {rel.unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card"
              aria-label="Unread messages"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-[13.5px] font-semibold leading-snug text-foreground">
              {rel.propertyName}
            </p>
            <span
              className={cn(
                "flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white",
                scoreDotClass(rel.score),
              )}
              title={`Match score ${Math.round(rel.score)}`}
            >
              {Math.round(rel.score)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
            {assetLabel && <span> · {assetLabel}</span>}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
            <span className="font-semibold text-foreground">{currency(rel.askingPrice)}</span>
            {rel.capRate != null && (
              <>
                <span className="text-border">·</span>
                <span className="text-muted-foreground">{formatCapRate(rel.capRate)} cap</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status + next action */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
            UI_STATUS_CLASS[status],
          )}
        >
          {UI_STATUS_LABEL[status]}
        </span>
        {action && (
          <span className="truncate text-[11px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
            {action.label} →
          </span>
        )}
      </div>
    </button>
  );
}

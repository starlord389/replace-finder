import {
  Building, Ruler, Calendar, Layers, TrendingUp, DollarSign, ArrowRight, Scale, Trees,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreChipClass } from "../helpers";
import {
  financialMetrics, UI_STATUS_LABEL, UI_STATUS_CLASS,
  type UiStatus, type ActionDescriptor,
} from "./inboxHelpers";
import { ACTION_ICONS } from "./actionIcons";

/** Boot exposure for this match, in plain words — null when there's no boot signal. */
function prettyBoot(bootStatus: string | null): string | null {
  switch (bootStatus) {
    case "no_boot": return "No boot";
    case "minor_boot": return "Minor boot";
    case "significant_boot": return "Significant";
    default: return null;
  }
}

interface Props {
  rel: Relationship;
  previewMode?: boolean;
  status?: UiStatus;
  /** The single most important next action — pinned as the header CTA. */
  primary?: ActionDescriptor | null;
  onPrimary?: () => void;
  primaryBusy?: boolean;
  /** Jump to the Match tab from the score chip. */
  onJumpToMatch?: () => void;
}

/**
 * Redfin/Zillow-style listing header: price-forward, with the key facts inline
 * and the primary deal action pinned so it's always one click away. The hero
 * above already carries the property name + location, so this bar leads with
 * price and numbers rather than repeating the title.
 */
export function ListingHeaderBar({
  rel, previewMode = false, status, primary, onPrimary, primaryBusy, onJumpToMatch,
}: Props) {
  const fm = financialMetrics(rel);
  const cap = fm.find((m) => m.key === "cap")?.value;
  const noi = fm.find((m) => m.key === "noi")?.value;
  const assetLabel = rel.propertyAssetType
    ? (ASSET_TYPE_LABELS as Record<string, string>)[rel.propertyAssetType] ?? rel.propertyAssetType
    : null;

  // Only real, agent-entered facts — absent fields are omitted, never fabricated.
  const stats: Array<{ icon: LucideIcon; label: string; value: string }> = [];
  if (assetLabel) stats.push({ icon: Building, label: "Type", value: assetLabel });
  if (rel.propertyLotAcres) stats.push({ icon: Trees, label: "Lot", value: `${rel.propertyLotAcres} acres` });
  if (cap && cap !== "—") stats.push({ icon: TrendingUp, label: "Cap", value: cap });
  if (noi && noi !== "—") stats.push({ icon: DollarSign, label: "NOI", value: noi });
  const boot = prettyBoot(rel.bootStatus);
  if (boot) stats.push({ icon: Scale, label: "Boot", value: boot });

  const PrimaryIcon = primary ? ACTION_ICONS[primary.id] ?? ArrowRight : null;

  return (
    <div className="border-b border-border px-5 py-5 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="text-3xl font-bold leading-none tracking-tight text-foreground sm:text-[2.5rem]">
              {currency(rel.askingPrice)}
            </p>
            {!previewMode && status && (
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  UI_STATUS_CLASS[status],
                )}
              >
                {UI_STATUS_LABEL[status]}
              </span>
            )}
          </div>

          {stats.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3.5">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/65">
                    <s.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-[15px] font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!previewMode && (
          <div className="flex flex-wrap items-stretch gap-2.5 sm:shrink-0">
            {onJumpToMatch && (
              <button
                type="button"
                onClick={onJumpToMatch}
                className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 transition-colors hover:border-primary/40"
                aria-label="See why this matched"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    scoreChipClass(rel.score),
                  )}
                >
                  {Math.round(rel.score)}
                </span>
                <span className="hidden text-left text-[11px] font-semibold leading-tight text-muted-foreground sm:block">
                  Match<br />score
                </span>
              </button>
            )}
            {primary && onPrimary && (
              <Button
                className="h-auto min-h-[44px] w-full justify-center gap-2 px-5 text-sm font-semibold sm:w-auto"
                onClick={onPrimary}
                disabled={primaryBusy}
              >
                {PrimaryIcon && <PrimaryIcon className="h-4 w-4" />}
                {primary.label}
                <ArrowRight className="h-4 w-4 opacity-70" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

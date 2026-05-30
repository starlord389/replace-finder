import { Link } from "react-router-dom";
import { Building2, ExternalLink, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BOOT_STATUS_LABELS } from "@/lib/constants";
import { currency, scoreDotClass, scoreTextClass } from "./helpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

function BootChip({ status, total }: { status: string; total: number | null }) {
  if (status === "no_boot") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> No boot
      </span>
    );
  }
  if (status === "insufficient_data") return null;
  const Icon = status === "significant_boot" ? ShieldAlert : AlertTriangle;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
      <Icon className="h-3 w-3" /> {total ? currency(total) : BOOT_STATUS_LABELS[status] || status}
    </span>
  );
}

interface Props {
  rel: Relationship;
  defaultOpen?: boolean;
}

export function ContextPanel({ rel, defaultOpen = false }: Props) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-b border-border bg-muted/30">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-muted/50">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
              scoreDotClass(rel.score),
            )}
          >
            {Math.round(rel.score)}
          </span>
          <p className="truncate text-xs font-medium text-foreground">
            {rel.propertyName}
            <span className="ml-1.5 font-normal text-muted-foreground">
              {currency(rel.askingPrice)}
              {rel.propertyCity && ` · ${rel.propertyCity}, ${rel.propertyState}`}
            </span>
          </p>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground group-data-[state=open]:hidden">
          Context
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground hidden group-data-[state=open]:inline">
          Hide
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out">
        <div className="space-y-3 border-t border-border/60 bg-background px-4 py-3">
          {/* Property card */}
          <div className="overflow-hidden rounded-lg border bg-card">
            {rel.propertyImageUrl ? (
              <img src={rel.propertyImageUrl} alt={rel.propertyName} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground">{rel.propertyName}</p>
              {(rel.propertyCity || rel.propertyState) && (
                <p className="text-xs text-muted-foreground">
                  {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ")}
                </p>
              )}
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Price</p>
                  <p className="font-medium text-foreground">{currency(rel.askingPrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cap</p>
                  <p className="font-medium text-foreground">
                    {rel.capRate != null ? `${rel.capRate.toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Score</p>
                  <p className={cn("font-medium", scoreTextClass(rel.score))}>
                    {Math.round(rel.score)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <BootChip status={rel.bootStatus} total={rel.estimatedBoot} />
              </div>
            </div>
          </div>

          {/* Client */}
          {rel.mySide === "buyer" && rel.clientName && (
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Your client</p>
              <p className="text-xs font-medium text-foreground">{rel.clientName}</p>
            </div>
          )}

          {/* Deep link */}
          <Link
            to={`/agent/matches/${rel.matchId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View full match details <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

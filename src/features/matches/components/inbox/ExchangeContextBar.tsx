import { useMemo } from "react";
import { ChevronDown, MapPin, Calendar, Target, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useAgentExchangesQuery, type AgentExchangeRow } from "@/features/agent/hooks/useAgentExchangesQuery";
import { useExchangeContext } from "@/features/matches/hooks/useExchangeContext";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { cn } from "@/lib/utils";

interface Props {
  selectedExchangeId: string | "all";
  onChange: (id: string | "all") => void;
  totalCount: number;
  scopedMatchCount?: number;
  rels?: Relationship[];
}

function currency(v: number | null | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

function daysFromNow(date: string | null | undefined): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function exchangeLabel(ex: AgentExchangeRow): string {
  const client = ex.agent_clients?.client_name ?? "Client";
  const place = [ex.pledged_properties?.city, ex.pledged_properties?.state]
    .filter(Boolean)
    .join(", ");
  return place ? `${client} · ${place}` : client;
}

export function ExchangeContextBar({ selectedExchangeId, onChange, totalCount, scopedMatchCount, rels = [] }: Props) {
  const { user } = useAuth();
  const { data: exchanges = [] } = useAgentExchangesQuery(user?.id);
  const { data: ctx } = useExchangeContext(
    selectedExchangeId === "all" ? null : selectedExchangeId,
  );

  // Per-exchange match stats (count + best score + days to ID deadline)
  const statsByExchange = useMemo(() => {
    const m = new Map<string, { count: number; best: number }>();
    rels.forEach((r) => {
      const cur = m.get(r.buyerExchangeId) ?? { count: 0, best: 0 };
      cur.count += 1;
      if (r.score > cur.best) cur.best = r.score;
      m.set(r.buyerExchangeId, cur);
    });
    return m;
  }, [rels]);

  const selectedSummary = useMemo(() => {
    if (selectedExchangeId === "all") return "All exchanges";
    const ex = exchanges.find((e) => e.id === selectedExchangeId);
    return ex ? exchangeLabel(ex) : "Select an exchange";
  }, [exchanges, selectedExchangeId]);

  const idDays = daysFromNow(ctx?.identificationDeadline);

  return (
    <div className="shrink-0 rounded-xl border bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1">
                <span className="max-w-[14rem] truncate text-xs font-medium">
                  {selectedSummary}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-1">
              <button
                type="button"
                onClick={() => onChange("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                  selectedExchangeId === "all" && "bg-muted font-medium",
                )}
              >
                <span>All exchanges</span>
                <span className="text-[11px] text-muted-foreground">{totalCount}</span>
              </button>
              <div className="my-1 h-px bg-border" />
              <div className="max-h-72 overflow-y-auto">
                {exchanges.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No exchanges yet.
                  </p>
                ) : (
                  exchanges.map((ex) => {
                    const active = ex.id === selectedExchangeId;
                    const stat = statsByExchange.get(ex.id);
                    const dl = daysFromNow(ex.identification_deadline);
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onChange(ex.id)}
                        className={cn(
                          "flex w-full flex-col items-start rounded-md px-2 py-2 text-left hover:bg-muted",
                          active && "bg-muted",
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {ex.agent_clients?.client_name ?? "Client"}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                            {stat ? `${stat.count} match${stat.count === 1 ? "" : "es"}` : "0 matches"}
                          </span>
                        </div>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {ex.pledged_properties?.address ||
                            [ex.pledged_properties?.city, ex.pledged_properties?.state]
                              .filter(Boolean)
                              .join(", ") ||
                            "No relinquished property"}
                        </span>
                        <div className="mt-0.5 flex w-full items-center gap-3 text-[10px] text-muted-foreground">
                          {stat && stat.best > 0 && (
                            <span>Best score <span className="font-semibold text-foreground">{Math.round(stat.best)}</span></span>
                          )}
                          {dl != null && (
                            <span className={cn(dl < 0 ? "text-destructive" : dl <= 14 ? "text-amber-600" : undefined)}>
                              {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d to ID`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Context details */}
          {selectedExchangeId === "all" ? (
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              Showing matches across all your active exchanges.
            </div>
          ) : ctx ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              <ContextItem icon={User} label="Client">
                {ctx.clientName ?? "—"}
              </ContextItem>
              <ContextItem icon={Building2} label="Relinquished">
                <span className="truncate">
                  {ctx.relinquishedAddress ||
                    ctx.relinquishedName ||
                    [ctx.relinquishedCity, ctx.relinquishedState].filter(Boolean).join(", ") ||
                    "—"}
                </span>
              </ContextItem>
              {(ctx.relinquishedCity || ctx.relinquishedState) && (
                <ContextItem icon={MapPin} label="Location">
                  {[ctx.relinquishedCity, ctx.relinquishedState].filter(Boolean).join(", ")}
                </ContextItem>
              )}
              <ContextItem icon={null} label="Value">
                <span className="font-semibold text-foreground">
                  {currency(ctx.exchangeProceeds)}
                </span>
              </ContextItem>
              {idDays != null && (
                <ContextItem icon={Calendar} label="ID deadline">
                  <span
                    className={cn(
                      "font-semibold",
                      idDays < 0
                        ? "text-destructive"
                        : idDays <= 14
                        ? "text-amber-600"
                        : "text-foreground",
                    )}
                  >
                    {idDays < 0 ? `${Math.abs(idDays)}d overdue` : `${idDays}d left`}
                  </span>
                </ContextItem>
              )}
              {(ctx.targetStates?.length || ctx.targetPriceMin || ctx.targetPriceMax) && (
                <ContextItem icon={Target} label="Target">
                  <span className="truncate">
                    {ctx.targetStates?.length ? ctx.targetStates.slice(0, 3).join("/") : "Any geo"}
                    {(ctx.targetPriceMin || ctx.targetPriceMax) && (
                      <>
                        {" · "}
                        {currency(ctx.targetPriceMin)}–{currency(ctx.targetPriceMax)}
                      </>
                    )}
                  </span>
                </ContextItem>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Loading exchange details…</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }> | null;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}:
      </span>
      <span className="truncate text-foreground/90">{children}</span>
    </div>
  );
}

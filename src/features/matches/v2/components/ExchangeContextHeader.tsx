import { ChevronDown, MapPin, Building2, Calendar, Target, User, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useExchangeContext } from "@/features/matches/hooks/useExchangeContext";
import { cn } from "@/lib/utils";
import { daysFromNow } from "../mocks/exchangeMocks";
import type { WorkspaceExchange } from "../hooks/useWorkspaceExchanges";

interface Props {
  exchange: WorkspaceExchange;
  onChangeExchange: () => void;
}

function currency(v: number | null | undefined): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

export function ExchangeContextHeader({ exchange, onChangeExchange }: Props) {
  const { data: ctx } = useExchangeContext(exchange.id);
  const { toast } = useToast();

  const days = daysFromNow(exchange.identificationDeadline);
  const location = [
    exchange.relinquishedCity ?? ctx?.relinquishedCity,
    exchange.relinquishedState ?? ctx?.relinquishedState,
  ]
    .filter(Boolean)
    .join(", ");
  const relinquishedLabel =
    exchange.relinquishedAddress ||
    ctx?.relinquishedAddress ||
    ctx?.relinquishedName ||
    location ||
    "Relinquished property";

  const targetStates = ctx?.targetStates ?? [];
  const targetMin = ctx?.targetPriceMin ?? null;
  const targetMax = ctx?.targetPriceMax ?? null;
  const targetAssets = ctx?.targetAssetTypes ?? [];

  return (
    <header className="shrink-0 rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active exchange
          </p>
          <h1 className="mt-1 truncate text-xl font-semibold text-foreground">
            {exchange.clientName}'s 1031 Exchange
          </h1>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Relinquished: {relinquishedLabel}</span>
            {location && (
              <>
                <span aria-hidden className="text-muted-foreground/50">·</span>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onChangeExchange}>
            Change exchange <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/agent/clients">
              <User className="mr-1 h-3.5 w-3.5" /> View client
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast({ title: "Note saved", description: "Notes coming soon — stub for now." })
            }
          >
            <StickyNote className="mr-1 h-3.5 w-3.5" /> Add note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Value" value={currency(exchange.relinquishedValue ?? ctx?.exchangeProceeds)} />
        <Stat
          label="ID deadline"
          value={
            days == null ? "—" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`
          }
          tone={days == null ? undefined : days < 0 ? "danger" : days <= 14 ? "warn" : undefined}
          icon={Calendar}
        />
        <Stat
          label="Target"
          value={
            <span className="truncate">
              {targetStates.length ? targetStates.slice(0, 3).join("/") : "Any geo"}
              {(targetMin || targetMax) && (
                <span className="text-muted-foreground">
                  {" · "}
                  {currency(targetMin)}–{currency(targetMax)}
                </span>
              )}
              {targetAssets.length > 0 && (
                <span className="text-muted-foreground"> · {targetAssets.slice(0, 2).join("/")}</span>
              )}
            </span>
          }
          icon={Target}
        />
        <Stat label="Matches" value={exchange.matchCount.toString()} />
        <Stat
          label="Best match"
          value={exchange.bestScore > 0 ? Math.round(exchange.bestScore).toString() : "—"}
          tone={exchange.bestScore >= 85 ? "good" : undefined}
        />
        <Stat label="Status" value={<span className="capitalize">{exchange.status}</span>} />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "good" | "warn" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "mt-0.5 truncate text-sm font-semibold text-foreground",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

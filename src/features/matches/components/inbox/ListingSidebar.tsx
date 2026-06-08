import { TrendingUp, DollarSign, Building, Users, Calendar, FileText, Mail, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreDotClass } from "../helpers";
import { financialMetrics } from "./inboxHelpers";

interface Props {
  rel: Relationship;
  onOpenWorkflow: () => void;
  onJumpToMatch: () => void;
}

export function ListingSidebar({ rel, onOpenWorkflow, onJumpToMatch }: Props) {
  const all = financialMetrics(rel);
  const cap = all.find((m) => m.key === "cap")?.value ?? "—";
  const noi = all.find((m) => m.key === "noi")?.value ?? "—";
  const occ = all.find((m) => m.key === "occupancy")?.value ?? "—";

  const seed = rel.matchId.charCodeAt(0) || 7;
  const totalUnits = ((seed % 12) + 4);

  const kpis = [
    { icon: TrendingUp, label: "Cap Rate", value: cap, tint: "text-emerald-600" },
    { icon: DollarSign, label: "NOI", value: noi, tint: "text-primary" },
    { icon: Building, label: "Units", value: String(totalUnits), tint: "text-foreground" },
    { icon: Users, label: "Occupied", value: occ, tint: "text-foreground" },
  ];

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Asking Price
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
            {currency(rel.askingPrice)}
          </p>
        </div>

        <div className="my-5 border-t border-border" />

        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-muted/50 px-3 py-3 text-center">
              <k.icon className={cn("mx-auto h-4 w-4", k.tint)} />
              <p className="mt-1.5 text-lg font-bold leading-tight text-foreground">{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2.5">
          <Button className="h-11 w-full gap-2 text-sm font-semibold" onClick={onOpenWorkflow}>
            <Calendar className="h-4 w-4" />
            Schedule Showing
          </Button>
          <Button variant="outline" className="h-11 w-full gap-2 text-sm font-semibold" onClick={onOpenWorkflow}>
            <FileText className="h-4 w-4" />
            Request Offering Memo
          </Button>
        </div>

        {/* Match score callout */}
        <button
          type="button"
          onClick={onJumpToMatch}
          className="mt-5 flex w-full items-center justify-between rounded-xl border bg-gradient-to-br from-primary/5 to-primary/[0.02] px-4 py-3 text-left transition-colors hover:border-primary/40"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Match score
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">Why this matched →</p>
          </div>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
              scoreDotClass(rel.score),
            )}
          >
            {Math.round(rel.score)}
          </span>
        </button>

        <div className="my-5 border-t border-border" />

        {/* Listed by */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Listed by
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {rel.counterpartyAvatar ? (
                <img src={rel.counterpartyAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                (rel.counterpartyName ?? "LA").split(" ").map((n) => n[0]).slice(0, 2).join("")
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {rel.counterpartyName ?? "Listing Agent"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {rel.counterpartyBrokerage ?? "Brokerage"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenWorkflow}>
              <Mail className="h-3.5 w-3.5" /> Email
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenWorkflow}>
              <Phone className="h-3.5 w-3.5" /> Call
            </Button>
          </div>
        </div>

        <div className="my-5 border-t border-border" />

        <Button
          variant="ghost"
          className="w-full justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={onOpenWorkflow}
        >
          <Settings className="h-3.5 w-3.5" />
          Manage this match
        </Button>
      </div>
    </aside>
  );
}

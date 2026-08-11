import { ArrowRight, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  current: number;
  replacement: number;
  format: (value: number) => string;
  delta: string;
};

function formatMoney(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absolute >= 1_000_000) {
    return `${sign}$${(absolute / 1_000_000).toFixed(absolute >= 10_000_000 ? 0 : 2).replace(/\.00$/, "")}M`;
  }
  if (absolute >= 1_000) return `${sign}$${Math.round(absolute / 1_000)}K`;
  return `${sign}$${Math.round(absolute).toLocaleString()}`;
}

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatPercentagePoints(value: number): string {
  return `${value.toFixed(1)}%`;
}

function signedMoney(value: number): string {
  if (value === 0) return "$0";
  return `${value > 0 ? "+" : "-"}${formatMoney(Math.abs(value))}`;
}

function signedPercentPoints(value: number): string {
  if (value === 0) return "0.0 pp";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} pp`;
}

function barWidth(value: number, max: number): string {
  if (value === 0 || max === 0) return "0%";
  return `${Math.max(5, (Math.abs(value) / max) * 100)}%`;
}

function ComparisonMetric({ metric }: { metric: Metric }) {
  const difference = metric.replacement - metric.current;
  const improved = difference > 0;
  const declined = difference < 0;
  const max = Math.max(Math.abs(metric.current), Math.abs(metric.replacement));
  const TrendIcon = improved ? TrendingUp : declined ? TrendingDown : ArrowRight;

  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">{metric.label}</h4>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            improved && "bg-emerald-100 text-emerald-700",
            declined && "bg-amber-100 text-amber-700",
            !improved && !declined && "bg-muted text-muted-foreground",
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {metric.delta}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Current property</span>
            <span className="font-semibold tabular-nums text-foreground">{metric.format(metric.current)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-slate-400 transition-all"
              style={{ width: barWidth(metric.current, max) }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-foreground">Replacement</span>
            <span className={cn("font-semibold tabular-nums", improved ? "text-emerald-700" : "text-foreground")}>
              {metric.format(metric.replacement)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", declined ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: barWidth(metric.replacement, max) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinancialOpportunityComparison({ rel }: { rel: Relationship }) {
  if (rel.mySide !== "buyer") return null;

  const metrics: Metric[] = [];

  if (rel.buyerCurrentRoe != null && rel.candidateRoe != null) {
    const differencePp = (rel.candidateRoe - rel.buyerCurrentRoe) * 100;
    metrics.push({
      label: "Return on equity",
      current: rel.buyerCurrentRoe,
      replacement: rel.candidateRoe,
      format: formatPercent,
      delta: signedPercentPoints(differencePp),
    });
  }

  if (rel.currentNoi != null && rel.noi != null) {
    metrics.push({
      label: "Net operating income",
      current: rel.currentNoi,
      replacement: rel.noi,
      format: formatMoney,
      delta: `${signedMoney(rel.noi - rel.currentNoi)}/yr`,
    });
  }

  if (
    rel.currentNoi != null &&
    rel.currentAnnualDebtService != null &&
    rel.noi != null &&
    rel.candidateAnnualDebtService != null
  ) {
    const currentCashFlow = rel.currentNoi - rel.currentAnnualDebtService;
    const replacementCashFlow = rel.noi - rel.candidateAnnualDebtService;
    metrics.push({
      label: "Annual cash flow after debt service",
      current: currentCashFlow,
      replacement: replacementCashFlow,
      format: formatMoney,
      delta: `${signedMoney(replacementCashFlow - currentCashFlow)}/yr`,
    });
  }

  if (rel.currentCapRate != null && rel.capRate != null) {
    metrics.push({
      label: "Cap rate",
      current: rel.currentCapRate,
      replacement: rel.capRate,
      format: formatPercentagePoints,
      delta: signedPercentPoints(rel.capRate - rel.currentCapRate),
    });
  }

  if (metrics.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50/80 via-card to-card">
      <div className="border-b bg-card/70 px-5 py-4 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Financial opportunity comparison
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your current property compared with this replacement using Exchange IQ™ modeled financing.
          </p>
        </div>
        <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:mt-0">
          Modeled comparison
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <ComparisonMetric key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="flex gap-2 border-t bg-card/60 px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Estimates use stored current-property financials and modeled replacement financing. They are not a guarantee;
          verify the listing's T-12 or offering memorandum and confirm lender terms before making a decision.
        </p>
      </div>
    </section>
  );
}

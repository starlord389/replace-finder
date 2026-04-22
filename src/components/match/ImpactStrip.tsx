import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtMoney = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v).toLocaleString()}`;
};

type Direction = "favorable" | "unfavorable" | "neutral";

interface Tile {
  label: string;
  yours: number | null | undefined;
  theirs: number | null | undefined;
  /** how to interpret an increase: favorable (green if up), unfavorable (red if up), neutral (always neutral color) */
  upIs?: "favorable" | "unfavorable" | "neutral";
  format: "money" | "pct" | "bp" | "count";
}

function classify(diff: number, upIs: Tile["upIs"]): Direction {
  if (Math.abs(diff) < 0.0001) return "neutral";
  if (upIs === "neutral") return "neutral";
  const up = diff > 0;
  if (upIs === "favorable") return up ? "favorable" : "unfavorable";
  return up ? "unfavorable" : "favorable";
}

function colorFor(d: Direction) {
  if (d === "favorable") return "border-green-500/30 bg-green-500/5";
  if (d === "unfavorable") return "border-red-500/30 bg-red-500/5";
  return "border-border bg-muted/30";
}
function textFor(d: Direction) {
  if (d === "favorable") return "text-green-600";
  if (d === "unfavorable") return "text-red-600";
  return "text-muted-foreground";
}

function formatDiff(diff: number, format: Tile["format"]) {
  const sign = diff > 0 ? "+" : "";
  if (format === "money") return `${sign}${fmtMoney(diff)}`;
  if (format === "pct") return `${sign}${diff.toFixed(1)}%`;
  if (format === "bp") return `${sign}${(diff * 100).toFixed(0)} bps`;
  return `${sign}${Math.round(diff).toLocaleString()}`;
}

export function ImpactStrip({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">At-a-glance Impact</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">How the key numbers shift if you make this exchange.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          if (t.yours == null || t.theirs == null) {
            return (
              <div key={t.label} className="rounded-lg border bg-muted/30 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">Insufficient data</p>
              </div>
            );
          }
          const diff = Number(t.theirs) - Number(t.yours);
          const dir = classify(diff, t.upIs);
          const Icon = dir === "favorable" ? TrendingUp : dir === "unfavorable" ? TrendingDown : Minus;
          const pctChange = t.yours !== 0 ? (diff / Math.abs(Number(t.yours))) * 100 : null;
          return (
            <div key={t.label} className={cn("rounded-lg border p-4", colorFor(dir))}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t.label}</p>
              <div className={cn("mt-2 flex items-baseline gap-2 text-2xl font-bold", textFor(dir))}>
                <Icon className="h-5 w-5" />
                {formatDiff(diff, t.format)}
              </div>
              {pctChange != null && t.format !== "pct" && t.format !== "bp" && (
                <p className={cn("mt-1 text-xs font-medium", textFor(dir))}>
                  {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}% vs your property
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

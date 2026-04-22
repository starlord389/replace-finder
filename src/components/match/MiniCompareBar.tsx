import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bar {
  label: string;
  yours: number | null | undefined;
  theirs: number | null | undefined;
  /** how to display the value */
  format: "money" | "pct";
  /** an increase from yours -> theirs is favorable? */
  upIs?: "favorable" | "unfavorable" | "neutral";
}

const fmtCompact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(v / 1000)}K`;
  return `$${Math.round(v)}`;
};

export function MiniCompareBar({ bars }: { bars: Bar[] }) {
  const valid = bars.filter((b) => b.yours != null && b.theirs != null);
  if (valid.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {valid.map((b) => {
        const max = Math.max(Math.abs(Number(b.yours)), Math.abs(Number(b.theirs)), 1);
        const yPct = (Math.abs(Number(b.yours)) / max) * 100;
        const tPct = (Math.abs(Number(b.theirs)) / max) * 100;
        const diff = Number(b.theirs) - Number(b.yours);
        const dir =
          Math.abs(diff) < 0.0001 || b.upIs === "neutral"
            ? "neutral"
            : (b.upIs === "favorable" ? diff > 0 : diff < 0)
            ? "favorable"
            : "unfavorable";
        const Icon = dir === "favorable" ? TrendingUp : dir === "unfavorable" ? TrendingDown : Minus;
        const tone =
          dir === "favorable" ? "text-green-600" : dir === "unfavorable" ? "text-red-600" : "text-muted-foreground";

        const fmtVal = (v: number) => (b.format === "money" ? fmtCompact(v) : `${v.toFixed(1)}%`);

        return (
          <div key={b.label} className="flex items-center gap-2 text-[11px]">
            <span className="w-14 shrink-0 text-muted-foreground">{b.label}</span>
            <div className="flex-1 space-y-0.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-muted-foreground/40" style={{ width: `${yPct}%` }} />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${tPct}%` }} />
              </div>
            </div>
            <span className={cn("flex w-16 shrink-0 items-center justify-end gap-0.5 font-medium tabular-nums", tone)}>
              <Icon className="h-3 w-3" />
              {fmtVal(Number(b.theirs))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

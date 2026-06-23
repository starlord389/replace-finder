import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { matchBreakdown } from "./inboxHelpers";

function barColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 45) return "bg-slate-300"; // neutral — e.g. a fit dimension with no client preference set
  return "bg-rose-500";
}

export function MatchBreakdownChart({ rel }: { rel: Relationship }) {
  const dims = matchBreakdown(rel);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Match breakdown</h3>
        <span className="text-xs text-muted-foreground">Overall {Math.round(rel.score)}</span>
      </div>
      <div className="space-y-2.5">
        {dims.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-foreground/80">{d.label}</span>
              <span className="font-medium text-foreground">{d.score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", barColor(d.score))}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

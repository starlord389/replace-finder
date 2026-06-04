import { Check, TrendingUp } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { whyThisMatched } from "./inboxHelpers";

function fmtPct(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

export function WhyThisMatched({ rel }: { rel: Relationship }) {
  const bullets = whyThisMatched(rel);
  const hasRoe = rel.buyerCurrentRoe != null && rel.candidateRoe != null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Why this matched</h3>

      {hasRoe && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" />
            Return on Equity
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2 text-sm text-foreground">
            <span className="text-muted-foreground">Current</span>
            <span className="font-semibold">{fmtPct(rel.buyerCurrentRoe)}</span>
            <span className="text-muted-foreground">→ Projected</span>
            <span className="font-semibold text-emerald-700">{fmtPct(rel.candidateRoe)}</span>
            {rel.roeImprovementPp != null && (
              <span className="text-xs font-medium text-emerald-700">
                (+{rel.roeImprovementPp.toFixed(1)} pp
                {rel.roeImprovementRel != null ? `, +${Math.round(rel.roeImprovementRel * 100)}%` : ""})
              </span>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

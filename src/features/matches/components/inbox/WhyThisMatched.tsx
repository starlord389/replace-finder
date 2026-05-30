import { Check } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { whyThisMatched } from "./inboxHelpers";

export function WhyThisMatched({ rel }: { rel: Relationship }) {
  const bullets = whyThisMatched(rel);
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Why this matched</h3>
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

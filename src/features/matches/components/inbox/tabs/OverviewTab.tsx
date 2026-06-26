import { Building2, Sparkles } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

export function OverviewTab({ rel }: { rel: Relationship }) {
  // The hard facts (type, size, year, units, lot, cap, NOI) live in the
  // price/stat header right above the tabs — this tab is the narrative only,
  // so we don't repeat the same numbers twice on one screen.
  const description = rel.propertyDescription?.trim();
  const renovations = rel.propertyRenovations?.trim();

  if (!description && !renovations) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
        <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">No description yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The listing agent hasn't written an overview for this property. The key numbers are in
          the header and on the Financials tab, and you can ask for more in the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {description && (
        <section>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            From the listing agent
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Property Overview</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        </section>
      )}

      {renovations && (
        <section className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </span>
            Recent Renovations
          </h3>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {renovations}
          </p>
        </section>
      )}
    </div>
  );
}

import { Building2, Sparkles } from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

export function OverviewTab({ rel }: { rel: Relationship }) {
  const assetLabel = rel.propertyAssetType
    ? (ASSET_TYPE_LABELS as Record<string, string>)[rel.propertyAssetType] ?? rel.propertyAssetType
    : null;

  // Only real, agent-entered facts. Absent fields are omitted (never fabricated).
  const facts: { label: string; value: string }[] = [];
  if (assetLabel) facts.push({ label: "Asset Type", value: assetLabel });
  if (rel.propertyBuildingSqft)
    facts.push({ label: "Building Size", value: `${rel.propertyBuildingSqft.toLocaleString()} sq.ft.` });
  if (rel.propertyLotAcres) facts.push({ label: "Lot Size", value: `${rel.propertyLotAcres} acres` });
  if (rel.propertyYearBuilt) facts.push({ label: "Year Built", value: String(rel.propertyYearBuilt) });
  if (rel.propertyUnits) facts.push({ label: "Total Units", value: String(rel.propertyUnits) });

  const description = rel.propertyDescription?.trim();
  const renovations = rel.propertyRenovations?.trim();
  const hasAnything = !!description || !!renovations || facts.length > 0;

  if (!hasAnything) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
        <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">No property details yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The listing agent hasn't added a description or property facts for this listing. Key
          numbers are on the Financials tab, and you can ask for more in the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {description ? (
        <section>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            From the listing agent
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Property Overview</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        </section>
      ) : null}

      {(facts.length > 0 || renovations) && (
        <section className="grid gap-5 md:grid-cols-2">
          {facts.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                Property Details
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-xl bg-muted/40 px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-foreground">{f.label}</p>
                    <p className="mt-0.5 text-base font-semibold text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renovations && (
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                Recent Renovations
              </h3>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {renovations}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

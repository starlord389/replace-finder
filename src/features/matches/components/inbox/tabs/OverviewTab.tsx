import { Building2, Sparkles } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

export function OverviewTab({ rel }: { rel: Relationship }) {
  // The price and any real facts live in the header above; this tab is the
  // agent-written narrative only.
  const description = rel.propertyDescription?.trim();
  const renovations = rel.propertyRenovations?.trim();
  const amenities = rel.propertyAmenities ?? [];
  const facts = [
    ["Subtype", rel.propertyAssetSubtype],
    ["Investment profile", rel.propertyStrategyType?.split("_").join(" ")],
    ["Class", rel.propertyClass],
    ["Condition", rel.propertyCondition],
    ["Year built", rel.propertyYearBuilt?.toString()],
    ["Units", rel.propertyUnits?.toLocaleString()],
    ["Building size", rel.propertyBuildingSquareFeet != null ? `${rel.propertyBuildingSquareFeet.toLocaleString()} sq ft` : null],
    ["Land area", rel.propertyLotAcres != null ? `${rel.propertyLotAcres} acres` : null],
    ["Buildings", rel.propertyNumBuildings?.toLocaleString()],
    ["Stories", rel.propertyNumStories?.toLocaleString()],
    ["Parking", rel.propertyParkingSpaces != null || rel.propertyParkingType
      ? [rel.propertyParkingSpaces != null ? `${rel.propertyParkingSpaces} spaces` : null, rel.propertyParkingType].filter(Boolean).join(", ")
      : null],
    ["Construction", rel.propertyConstructionType],
    ["Roof", rel.propertyRoofType],
    ["HVAC", rel.propertyHvacType],
    ["Zoning", rel.propertyZoning],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const hasStructuredDetails = facts.length > 0 || amenities.length > 0;

  if (!description && !renovations && !hasStructuredDetails) {
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
      {hasStructuredDetails && (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Property Details</h2>
          {facts.length > 0 && (
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm font-medium capitalize text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {amenities.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amenities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{amenity}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
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

import { Ruler, MapPin, Calendar, Building, Layers } from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Fact {
  icon: typeof Ruler;
  label: string;
  value: string;
}

export function ListingFactsBar({ rel }: { rel: Relationship }) {
  // Only real, agent-entered facts — nothing fabricated. Absent fields are omitted.
  const facts: Fact[] = [];

  if (rel.propertyAssetType) {
    facts.push({
      icon: Building,
      label: "Type",
      value:
        (ASSET_TYPE_LABELS as Record<string, string>)[rel.propertyAssetType] ??
        rel.propertyAssetType,
    });
  }
  if (rel.propertyBuildingSqft) {
    facts.push({ icon: Ruler, label: "Building", value: `${rel.propertyBuildingSqft.toLocaleString()} sq.ft.` });
  }
  if (rel.propertyLotAcres) {
    facts.push({ icon: MapPin, label: "Lot", value: `${rel.propertyLotAcres} acres` });
  }
  if (rel.propertyYearBuilt) {
    facts.push({ icon: Calendar, label: "Year Built", value: String(rel.propertyYearBuilt) });
  }
  if (rel.propertyUnits) {
    facts.push({ icon: Layers, label: "Units", value: String(rel.propertyUnits) });
  }

  // Nothing real to show → render nothing rather than fabricate.
  if (facts.length === 0) return null;

  return (
    <div className="border-y border-border bg-muted/40">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        {facts.map((f, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2 text-sm">
            <f.icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{f.label}:</span>
            <span className="font-semibold text-foreground">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

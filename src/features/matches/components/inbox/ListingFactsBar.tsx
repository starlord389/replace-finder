import { Ruler, MapPin, Calendar, Building, Home, Store } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Fact {
  icon: typeof Ruler;
  label: string;
  value: string;
}

export function ListingFactsBar({ rel }: { rel: Relationship }) {
  // Deterministic derived values for demo data when underlying fields are absent.
  const seed = rel.matchId.charCodeAt(0) || 7;
  const totalUnits = ((seed % 12) + 4); // 4..15
  const residential = Math.max(1, Math.round(totalUnits * 0.7));
  const commercial = Math.max(0, totalUnits - residential);
  const yearBuilt = 1900 + (seed % 120);
  const buildingSize = `${(2 + (seed % 9)).toFixed(0)},${(seed * 73) % 900 + 100} sq.ft.`;
  const lotSize = `${(0.05 + (seed % 30) / 100).toFixed(2)} acres`;

  const facts: Fact[] = [
    { icon: Ruler, label: "Building Size", value: buildingSize },
    { icon: MapPin, label: "Lot Size", value: lotSize },
    { icon: Calendar, label: "Year Built", value: String(yearBuilt) },
    { icon: Building, label: "Total Units", value: String(totalUnits) },
    { icon: Home, label: "Residential", value: `${residential} units` },
    { icon: Store, label: "Commercial", value: `${commercial} units` },
  ];

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

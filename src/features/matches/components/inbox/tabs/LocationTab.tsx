import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

export function LocationTab({ rel }: { rel: Relationship }) {
  const city = rel.propertyCity ?? "this market";
  const state = rel.propertyState ?? "";
  const address = [rel.propertyName, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Prime Location</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Situated in the heart of {city}{state ? `, ${state}` : ""}'s most vibrant district —
          walkable, well-trafficked, and surrounded by amenities that drive sustained demand.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="relative aspect-[16/9] w-full bg-muted">
          <img
            src={`https://staticmap.openstreetmap.de/staticmap.php?center=42.6159,-70.6620&zoom=15&size=1200x600&maptype=mapnik`}
            alt="Map"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Fallback decorative grid map */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
            <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          {/* Address card overlay */}
          <div className="absolute left-5 top-5 max-w-xs rounded-xl bg-card p-4 shadow-lg">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {rel.propertyName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[city, state].filter(Boolean).join(", ")}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]">
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-3 w-3" /> Directions
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Pin */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/30" />
              <div className="absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Walkability", value: "Highly walkable downtown core" },
          { label: "Transit", value: "Multiple bus lines · commuter rail nearby" },
          { label: "Demand drivers", value: "Restaurants, retail, waterfront" },
        ].map((b) => (
          <div key={b.label} className="rounded-xl border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {b.label}
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">{b.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

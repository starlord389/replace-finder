import { useEffect, useMemo, useState } from "react";
import { MapPin, ExternalLink, Navigation, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

type Coords = { lat: number; lon: number };

// Reopening the same property shouldn't re-geocode. null = "looked up, no result".
const geocodeCache = new Map<string, Coords | null>();

// Free, keyless geocoding via OpenStreetMap's Nominatim. Low volume (one lookup
// per Location view), CORS-enabled. For scale we'd move to a keyed provider.
async function geocode(query: string): Promise<Coords | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const hit =
      Array.isArray(data) && data[0]
        ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        : null;
    geocodeCache.set(query, hit);
    return hit;
  } catch {
    return null;
  }
}

export function LocationTab({ rel }: { rel: Relationship }) {
  const city = rel.propertyCity;
  const state = rel.propertyState;
  const zip = rel.propertyZip;
  // Populated only when the viewer may see the exact street (own listing or owner published it).
  const exactAddress = rel.propertyAddress;

  const cityState = [city, state].filter(Boolean).join(", ");

  // Most precise query the viewer is allowed to see: full address, otherwise the ZIP area.
  const query = (exactAddress ? [exactAddress, cityState, zip] : [cityState, zip])
    .filter(Boolean)
    .join(", ");
  const areaQuery = [cityState, zip].filter(Boolean).join(", ");
  const hasLocation = Boolean(query);

  // Geocode most-specific first; fall back to the city/ZIP area if the exact
  // address can't be pinpointed (e.g. a brand-new or imprecise address).
  const queryChain = useMemo(
    () => [query, areaQuery].filter((q, i, a) => q && a.indexOf(q) === i),
    [query, areaQuery],
  );

  // undefined = still geocoding, null = no result, Coords = located.
  const [coords, setCoords] = useState<Coords | null | undefined>(undefined);
  // Whether we resolved the exact street (vs. fell back to the area).
  const [precise, setPrecise] = useState(false);

  useEffect(() => {
    if (!queryChain.length) {
      setCoords(null);
      return;
    }
    let cancelled = false;
    setCoords(undefined);
    (async () => {
      for (let i = 0; i < queryChain.length; i++) {
        const hit = await geocode(queryChain[i]);
        if (cancelled) return;
        if (hit) {
          setCoords(hit);
          setPrecise(i === 0 && !!exactAddress);
          return;
        }
      }
      if (!cancelled) setCoords(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [queryChain, exactAddress]);

  if (!hasLocation) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
        <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Location not provided</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The listing agent hasn't added a city, ZIP, or address for this property yet.
        </p>
      </div>
    );
  }

  // Tighter box for an exact pin, wider for a ZIP-area view.
  const latDelta = precise ? 0.004 : 0.045;
  const lonDelta = latDelta * 1.8;
  const osmSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - lonDelta}%2C${coords.lat - latDelta}%2C${coords.lon + lonDelta}%2C${coords.lat + latDelta}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`
    : "";

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

  const displayLine = exactAddress
    ? [exactAddress, cityState, zip].filter(Boolean).join(" · ")
    : [cityState || "Approximate area", zip ? `ZIP ${zip}` : null].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Location</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {exactAddress
            ? "Exact address shared by the listing agent."
            : "The listing agent kept the exact address private — this map shows the approximate area by ZIP code."}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative aspect-[16/9] w-full bg-muted">
          {coords ? (
            <iframe
              key={osmSrc}
              title="Property location map"
              src={osmSrc}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : coords === undefined ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Couldn't load the map preview.</p>
              <Button asChild size="sm" variant="outline" className="gap-1">
                <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <div className="flex min-w-0 items-start gap-2">
            {exactAddress ? (
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{rel.propertyName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{displayLine}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs">
              <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3.5 w-3.5" /> Directions
              </a>
            </Button>
          </div>
        </div>
      </div>

      {!exactAddress && (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            The exact street address is hidden until the listing agent chooses to share it
            (often once you connect). The map is centered on the property's ZIP code, not its
            precise location.
          </p>
        </div>
      )}
    </div>
  );
}

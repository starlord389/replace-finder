import { MapPin, Navigation } from "lucide-react";

interface LocationCardProps {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  yourCity?: string | null;
  yourState?: string | null;
}

export function LocationCard({ address, city, state, zip, yourCity, yourState }: LocationCardProps) {
  const fullAddress = [address, city, state, zip].filter(Boolean).join(", ");
  const yourLoc = [yourCity, yourState].filter(Boolean).join(", ");
  const theirLoc = [city, state].filter(Boolean).join(", ");

  // Use OSM static map embed (no API key needed); fall back to query-based search
  const query = encodeURIComponent(fullAddress || theirLoc || "");
  const sameMarket = yourState && state && yourState === state;
  const sameCity = yourCity && city && yourCity.toLowerCase() === city.toLowerCase();

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="aspect-[16/8] bg-muted">
        {query ? (
          <iframe
            title="Property location"
            className="h-full w-full"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=&query=${query}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location</h3>
        <p className="flex items-start gap-2 text-sm text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{fullAddress || theirLoc || "—"}</span>
        </p>
        {yourLoc && (
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {sameCity
              ? <>Same city as your relinquished property ({yourLoc}).</>
              : sameMarket
              ? <>Same state as your relinquished property ({yourLoc}).</>
              : <>Your relinquished property is in {yourLoc}.</>}
          </p>
        )}
      </div>
    </div>
  );
}

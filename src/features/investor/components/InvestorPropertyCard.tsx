import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InvestorProperty } from "@/features/investor/types";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function titleCase(value: string | null) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Property";
}

export function InvestorPropertyCard({
  property,
  saved,
  onToggleSaved,
  saving,
}: {
  property: InvestorProperty;
  saved: boolean;
  onToggleSaved: () => void;
  saving?: boolean;
}) {
  return (
    <Card className="group overflow-hidden border-[#e2e8f0] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {property.imageUrls[0] ? (
          <img src={property.imageUrls[0]} alt={property.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        ) : (
          <PropertyPhotoPlaceholder />
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/95 shadow-sm"
          aria-label={saved ? "Remove from saved properties" : "Save property"}
          onClick={onToggleSaved}
          disabled={saving}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
        </Button>
      </div>
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{titleCase(property.assetType)}</Badge>
            {property.strategyType && <Badge variant="outline">{titleCase(property.strategyType)}</Badge>}
          </div>
          <h2 className="line-clamp-1 text-lg font-semibold text-[#16284a]">{property.name}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {[property.city, property.state].filter(Boolean).join(", ") || "Location available on request"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-y py-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Price</p><p className="mt-0.5 font-semibold">{property.askingPrice ? money.format(property.askingPrice) : "Request"}</p></div>
          <div><p className="text-xs text-muted-foreground">Cap rate</p><p className="mt-0.5 font-semibold">{property.capRate == null ? "-" : `${property.capRate.toFixed(1)}%`}</p></div>
          <div><p className="text-xs text-muted-foreground">Occupancy</p><p className="mt-0.5 font-semibold">{property.occupancyRate == null ? "-" : `${property.occupancyRate.toFixed(0)}%`}</p></div>
        </div>
        <Button asChild className="w-full bg-[#16284a] text-white hover:bg-[#20385f]">
          <Link to={`/investor/properties/${property.id}`}>View opportunity</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

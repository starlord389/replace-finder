import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Calendar, Heart, MapPin, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestorInquiryDialog } from "@/features/investor/components/InvestorInquiryDialog";
import { useInvestorProperties } from "@/features/investor/hooks/useInvestorProperties";
import { useInvestorSavedProperties } from "@/features/investor/hooks/useInvestorSavedProperties";
import { investorErrorMessage } from "@/features/investor/errorMessage";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const formatValue = (value: number | null, suffix = "") => value == null ? "Not provided" : `${value.toLocaleString()}${suffix}`;

export default function InvestorPropertyDetail() {
  const { propertyId } = useParams();
  const { data: properties = [], isLoading } = useInvestorProperties();
  const { savedIds, toggle } = useInvestorSavedProperties();
  const property = properties.find((item) => item.id === propertyId);

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#16284a] border-t-transparent" /></div>;
  if (!property) return <div className="rounded-xl border bg-white p-10 text-center"><h1 className="text-xl font-semibold">Property unavailable</h1><p className="mt-2 text-sm text-muted-foreground">It may no longer be published in this workspace.</p><Button asChild className="mt-5"><Link to="/investor/marketplace">Back to marketplace</Link></Button></div>;

  const saved = savedIds.has(property.id);
  const toggleSaved = async () => {
    try {
      await toggle.mutateAsync({ propertyId: property.id, saved });
      toast.success(saved ? "Removed from saved properties." : "Property saved.");
    } catch (error: unknown) { toast.error(investorErrorMessage(error, "Could not update saved properties.")); }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-3"><Link to="/investor/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back to marketplace</Link></Button>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.4fr_1fr]">
          <div className="min-h-72 bg-slate-100">{property.imageUrls[0] ? <img src={property.imageUrls[0]} alt={property.name} className="h-full max-h-[540px] w-full object-cover" /> : <div className="flex h-full min-h-72 items-center justify-center"><Building2 className="h-16 w-16 text-slate-300" /></div>}</div>
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex flex-wrap gap-2"><Badge>{property.assetType?.replace(/_/g, " ") || "Property"}</Badge>{property.strategyType && <Badge variant="outline">{property.strategyType.replace(/_/g, " ")}</Badge>}</div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#16284a]">{property.name}</h1>
              <p className="mt-2 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{[property.address, property.city, property.state, property.zip].filter(Boolean).join(", ") || "Exact location available through the listing agent"}</p>
              <p className="mt-6 text-3xl font-bold text-[#16284a]">{property.askingPrice ? money.format(property.askingPrice) : "Pricing on request"}</p>
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm"><div><span className="text-muted-foreground">Cap rate</span><p className="font-semibold">{formatValue(property.capRate, "%")}</p></div><div><span className="text-muted-foreground">Occupancy</span><p className="font-semibold">{formatValue(property.occupancyRate, "%")}</p></div><div><span className="text-muted-foreground">Annual NOI</span><p className="font-semibold">{property.noi == null ? "Not provided" : money.format(property.noi)}</p></div><div><span className="text-muted-foreground">Units</span><p className="font-semibold">{formatValue(property.units)}</p></div></div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={toggleSaved} disabled={toggle.isPending}><Heart className={`mr-2 h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />{saved ? "Saved" : "Save property"}</Button><InvestorInquiryDialog property={property} triggerClassName="bg-[#16284a] text-white hover:bg-[#20385f]" /></div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card><CardHeader><CardTitle>Property overview</CardTitle></CardHeader><CardContent className="space-y-5"><p className="leading-7 text-muted-foreground">{property.description || "The listing agent has not added a detailed description yet."}</p>{property.recentRenovations && <div><h2 className="font-semibold">Recent improvements</h2><p className="mt-1 text-sm text-muted-foreground">{property.recentRenovations}</p></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Property facts</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex justify-between border-b pb-3"><span className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Year built</span><strong>{property.yearBuilt ?? "-"}</strong></div><div className="flex justify-between border-b pb-3"><span className="flex items-center gap-2 text-muted-foreground"><Ruler className="h-4 w-4" />Building area</span><strong>{property.buildingSquareFeet ? `${property.buildingSquareFeet.toLocaleString()} sf` : "-"}</strong></div><div className="flex justify-between border-b pb-3"><span className="text-muted-foreground">Gross rent roll</span><strong>{property.grossRentRoll == null ? "-" : money.format(property.grossRentRoll)}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">Operating expenses</span><strong>{property.totalOperatingExpenses == null ? "-" : money.format(property.totalOperatingExpenses)}</strong></div></CardContent></Card>
      </div>
    </div>
  );
}

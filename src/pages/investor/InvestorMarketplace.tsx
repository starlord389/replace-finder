import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvestorPropertyCard } from "@/features/investor/components/InvestorPropertyCard";
import { useInvestorProperties } from "@/features/investor/hooks/useInvestorProperties";
import { useInvestorSavedProperties } from "@/features/investor/hooks/useInvestorSavedProperties";
import { investorErrorMessage } from "@/features/investor/errorMessage";

const ALL = "__all";

export default function InvestorMarketplace() {
  const { data: properties = [], isLoading, error } = useInvestorProperties();
  const { savedIds, toggle } = useInvestorSavedProperties();
  const [search, setSearch] = useState("");
  const [state, setState] = useState(ALL);
  const [assetType, setAssetType] = useState(ALL);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const states = useMemo(() => Array.from(new Set(properties.map((p) => p.state).filter(Boolean) as string[])).sort(), [properties]);
  const assetTypes = useMemo(() => Array.from(new Set(properties.map((p) => p.assetType).filter(Boolean) as string[])).sort(), [properties]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      if (query && ![property.name, property.city, property.state, property.assetType].some((value) => value?.toLowerCase().includes(query))) return false;
      if (state !== ALL && property.state !== state) return false;
      if (assetType !== ALL && property.assetType !== assetType) return false;
      if (minPrice && (property.askingPrice == null || property.askingPrice < Number(minPrice))) return false;
      if (maxPrice && (property.askingPrice == null || property.askingPrice > Number(maxPrice))) return false;
      return true;
    });
  }, [assetType, maxPrice, minPrice, properties, search, state]);

  const toggleSaved = async (propertyId: string) => {
    try {
      await toggle.mutateAsync({ propertyId, saved: savedIds.has(propertyId) });
      toast.success(savedIds.has(propertyId) ? "Removed from saved properties." : "Property saved.");
    } catch (saveError: unknown) {
      toast.error(investorErrorMessage(saveError, "Could not update saved properties."));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#16284a]">Explore investment properties</h1>
        <p className="mt-2 text-muted-foreground">Browse the same published opportunities available across the 1031 ExchangeUp network.</p>
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#16284a]"><SlidersHorizontal className="h-4 w-4" />Find the right opportunity</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search properties" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All states</SelectItem>{states.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <Select value={assetType} onValueChange={setAssetType}><SelectTrigger><SelectValue placeholder="All asset types" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All asset types</SelectItem>{assetTypes.map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
          <Input type="number" min="0" placeholder="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input type="number" min="0" placeholder="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>
      {isLoading ? <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#16284a] border-t-transparent" /></div> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load the marketplace. The investor database migration may still need to be applied in Lovable.</div> : visible.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-12 text-center"><p className="font-semibold">No properties match these filters</p><p className="mt-1 text-sm text-muted-foreground">Try widening your location or price range.</p></div> : <><p className="text-sm text-muted-foreground">{visible.length} published opportunit{visible.length === 1 ? "y" : "ies"}</p><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((property) => <InvestorPropertyCard key={property.id} property={property} saved={savedIds.has(property.id)} saving={toggle.isPending} onToggleSaved={() => toggleSaved(property.id)} />)}</div></>}
    </div>
  );
}

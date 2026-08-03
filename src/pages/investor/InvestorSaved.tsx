import { Heart } from "lucide-react";
import { toast } from "sonner";
import { InvestorPropertyCard } from "@/features/investor/components/InvestorPropertyCard";
import { useInvestorProperties } from "@/features/investor/hooks/useInvestorProperties";
import { useInvestorSavedProperties } from "@/features/investor/hooks/useInvestorSavedProperties";
import { investorErrorMessage } from "@/features/investor/errorMessage";

export default function InvestorSaved() {
  const { data: properties = [], isLoading } = useInvestorProperties();
  const { savedIds, toggle } = useInvestorSavedProperties();
  const saved = properties.filter((property) => savedIds.has(property.id));
  const remove = async (propertyId: string) => { try { await toggle.mutateAsync({ propertyId, saved: true }); toast.success("Removed from saved properties."); } catch (error: unknown) { toast.error(investorErrorMessage(error, "Could not remove property.")); } };
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight text-[#16284a]">Saved properties</h1><p className="mt-2 text-muted-foreground">Your shortlist of investment opportunities.</p></div>{isLoading ? <div className="py-20 text-center">Loading…</div> : saved.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{saved.map((property) => <InvestorPropertyCard key={property.id} property={property} saved saving={toggle.isPending} onToggleSaved={() => remove(property.id)} />)}</div> : <div className="rounded-xl border border-dashed bg-white p-12 text-center"><Heart className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">No saved properties yet</p><p className="mt-1 text-sm text-muted-foreground">Use the heart on any property to add it to your shortlist.</p></div>}</div>;
}

import { Link } from "react-router-dom";
import { ArrowRight, Building2, Heart, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoDataControls } from "@/features/workspace/components/DemoDataControls";
import { InvestorPropertyCard } from "@/features/investor/components/InvestorPropertyCard";
import { useInvestorProperties } from "@/features/investor/hooks/useInvestorProperties";
import { useInvestorSavedProperties } from "@/features/investor/hooks/useInvestorSavedProperties";
import { useInvestorInquiries } from "@/features/investor/hooks/useInvestorInquiries";
import { toast } from "sonner";
import { investorErrorMessage } from "@/features/investor/errorMessage";

export default function InvestorDashboard() {
  const { data: properties = [], isLoading } = useInvestorProperties();
  const { savedIds, toggle } = useInvestorSavedProperties();
  const { data: inquiries = [] } = useInvestorInquiries();
  const recent = properties.slice(0, 3);
  const responded = inquiries.filter((item) => item.status === "responded").length;
  const toggleSaved = async (propertyId: string) => {
    try { await toggle.mutateAsync({ propertyId, saved: savedIds.has(propertyId) }); }
    catch (error: unknown) { toast.error(investorErrorMessage(error, "Could not update saved properties.")); }
  };

  return (
    <div className="space-y-7">
      <div className="rounded-2xl bg-[#16284a] p-6 text-white sm:p-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Investor workspace</p><h1 className="mt-2 text-3xl font-bold">Find your next replacement property</h1><p className="mt-2 max-w-2xl text-blue-100">Review published opportunities, keep a focused shortlist, and connect directly with the agents representing the properties that fit.</p><Button asChild className="mt-6 bg-white text-[#16284a] hover:bg-blue-50"><Link to="/investor/marketplace"><Search className="mr-2 h-4 w-4" />Explore properties</Link></Button></div>
      <DemoDataControls />
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><Building2 className="h-5 w-5 text-[#16284a]" /><p className="mt-3 text-3xl font-bold">{isLoading ? "—" : properties.length}</p><p className="text-sm text-muted-foreground">Published opportunities</p></CardContent></Card><Card><CardContent className="p-5"><Heart className="h-5 w-5 text-rose-500" /><p className="mt-3 text-3xl font-bold">{savedIds.size}</p><p className="text-sm text-muted-foreground">Saved properties</p></CardContent></Card><Card><CardContent className="p-5"><MessageCircle className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-3xl font-bold">{responded}</p><p className="text-sm text-muted-foreground">Agent responses</p></CardContent></Card></div>
      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold text-[#16284a]">Recently added</h2><p className="text-sm text-muted-foreground">Fresh published opportunities from across the network.</p></div><Button asChild variant="ghost"><Link to="/investor/marketplace">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>{recent.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{recent.map((property) => <InvestorPropertyCard key={property.id} property={property} saved={savedIds.has(property.id)} saving={toggle.isPending} onToggleSaved={() => toggleSaved(property.id)} />)}</div> : <Card><CardHeader><CardTitle className="text-base">No published properties yet</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">New network opportunities will appear here as agents publish them.</CardContent></Card>}</section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, Handshake, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";

export default function InvestorLaunchpad() {
  const { user } = useAuth();
  const { data: listings = [] } = useAgentListings(user?.id, "investor");
  const { data: relationships = [] } = useUnifiedRelationships("investor");
  const hasListing = listings.length > 0;
  const hasActive = listings.some((item) => item.status !== "draft");
  const hasMatch = relationships.some((item) => item.mySide === "buyer");
  const hasConnection = relationships.some((item) => item.connectionId);
  const steps = [
    { done: hasListing, icon: Building2, title: "List your current property", body: "Enter the property and financial information used to calculate equity and current return on equity.", href: "/investor/exchanges/new", action: "Create listing" },
    { done: hasActive, icon: CheckCircle2, title: "Publish the exchange", body: "Publishing places your property in the exchange network and runs automatic matching.", href: "/investor/listings", action: "Open exchanges" },
    { done: hasMatch, icon: TrendingUp, title: "Review qualified matches", body: "You will only see properties within the 75% LTV ceiling that improve projected return on equity.", href: "/investor/matches", action: "Review matches" },
    { done: hasConnection, icon: Handshake, title: "Connect with the listing agent", body: "Open a matched property and start a direct, private conversation with its listing agent.", href: "/investor/pipeline", action: "Open pipeline" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Launchpad</h1><p className="mt-1 text-sm text-muted-foreground">The same exchange workflow agents use, centered on properties you own.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(({ done, icon: Icon, title, body, href, action }) => (
          <Card key={title} className={done ? "border-emerald-200" : undefined}>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-primary" />{done && <span className="text-xs font-semibold text-emerald-700">Complete</span>}</div><CardTitle className="mt-3 text-base">{title}</CardTitle></CardHeader>
            <CardContent><p className="min-h-10 text-sm text-muted-foreground">{body}</p><Button asChild variant={done ? "outline" : "default"} size="sm" className="mt-4"><Link to={href}>{action}<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, Building2, Handshake, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import { DemoDataControls } from "@/features/workspace/components/DemoDataControls";

function money(value: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function InvestorDashboard() {
  const { user, profileName } = useAuth();
  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(user?.id, "investor");
  const { data: relationships = [], isLoading: matchesLoading } = useUnifiedRelationships("investor");
  const buyerMatches = relationships.filter((item) => item.mySide === "buyer");
  const activeListings = listings.filter((item) => item.status !== "draft").length;
  const connected = buyerMatches.filter((item) => item.connectionId).length;
  const topMatches = [...buyerMatches].sort((a, b) => b.score - a.score).slice(0, 4);
  const recentListings = listings.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Investor / Property Owner</p>
          <h1 className="text-2xl font-bold text-foreground">
            {profileName ? `Welcome back, ${profileName.split(" ")[0]}` : "Your exchange dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your listed properties, review automatic matches, and ask your agent to connect with the other side.
          </p>
        </div>
        <Button asChild>
          <Link to="/investor/exchanges/new"><Plus className="mr-2 h-4 w-4" /> New listing</Link>
        </Button>
      </div>

      <DemoDataControls />

      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-sm font-semibold text-foreground">Exchange IQ™ is monitoring in the background</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your active properties and criteria are compared against the network continuously. You'll be alerted here
          and by email the moment a better opportunity appears - no action needed in between.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><Building2 className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{listingsLoading ? "-" : activeListings}</p><p className="text-xs text-muted-foreground">Properties monitored</p></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingUp className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{matchesLoading ? "-" : buyerMatches.length}</p><p className="text-xs text-muted-foreground">Opportunities detected</p></CardContent></Card>
        <Card><CardContent className="p-4"><Handshake className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold">{matchesLoading ? "-" : connected}</p><p className="text-xs text-muted-foreground">Agent connections</p></CardContent></Card>
      </div>


      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle className="text-lg">My exchanges</CardTitle><CardDescription>Your relinquished properties and current status.</CardDescription></div>
            <Button variant="ghost" size="sm" asChild><Link to="/investor/listings">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent>
            {recentListings.length ? (
              <ul className="divide-y rounded-lg border">
                {recentListings.map((listing) => (
                  <li key={listing.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{listing.propertyName || "Untitled property"}</p><p className="text-xs text-muted-foreground">{[listing.city, listing.state].filter(Boolean).join(", ")} · {money(listing.askingPrice)}</p></div>
                    <Button variant="ghost" size="sm" asChild><Link to={`/investor/matches?listing=${listing.id}`}>Open</Link></Button>
                  </li>
                ))}
              </ul>
            ) : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">List your first property to begin matching.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle className="text-lg">Top matches</CardTitle><CardDescription>Only properties that improve projected return on equity.</CardDescription></div>
            <Button variant="ghost" size="sm" asChild><Link to="/investor/matches">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent>
            {topMatches.length ? (
              <ul className="divide-y rounded-lg border">
                {topMatches.map((match) => (
                  <li key={match.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{match.propertyName}</p><p className="text-xs text-muted-foreground">{[match.propertyCity, match.propertyState].filter(Boolean).join(", ")} · {match.roeImprovementPp != null ? `+${match.roeImprovementPp.toFixed(1)} pts ROE` : "Higher projected ROE"}</p></div>
                    <Button variant="ghost" size="sm" asChild><Link to={match.openHref}>{Math.round(match.score)} score</Link></Button>
                  </li>
                ))}
              </ul>
            ) : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Qualified matches will appear after an exchange is published.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

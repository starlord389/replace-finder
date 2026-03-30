import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, ChevronRight } from "lucide-react";
import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

interface MatchedProperty {
  id: string;
  property_id: string;
  request_id: string;
  match_result_id: string;
  granted_at: string;
  inventory_properties: Tables<"inventory_properties"> | null;
  inventory_financials?: Tables<"inventory_financials"> | null;
  match_result?: {
    client_response: string | null;
    client_viewed_at: string | null;
  } | null;
}

export default function MatchList() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: accessData } = await supabase
        .from("matched_property_access")
        .select("*, inventory_properties(*)")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false });

      const matchData = (accessData ?? []) as unknown as MatchedProperty[];

      if (matchData.length > 0) {
        const propertyIds = matchData.map((m) => m.property_id).filter(Boolean);
        const matchResultIds = matchData.map((m) => m.match_result_id).filter(Boolean);

        const [finsRes, mrRes] = await Promise.all([
          propertyIds.length > 0
            ? supabase.from("inventory_financials").select("*").in("property_id", propertyIds)
            : Promise.resolve({ data: [] }),
          matchResultIds.length > 0
            ? supabase.from("match_results").select("id, client_response, client_viewed_at").in("id", matchResultIds)
            : Promise.resolve({ data: [] }),
        ]);

        const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
        const mrMap = new Map((mrRes.data ?? []).map((r: any) => [r.id, r]));

        matchData.forEach((m) => {
          m.inventory_financials = finMap.get(m.property_id) ?? null;
          m.match_result = mrMap.get(m.match_result_id) ?? null;
        });
      }

      setMatches(matchData);
      setLoading(false);
    })();
  }, [user]);

  const currency = (v: number | null) => (v ? `$${Number(v).toLocaleString()}` : "—");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Matches</h1>
      <p className="mt-1 text-sm text-muted-foreground">Properties matched to your exchange requests.</p>

      {matches.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No matched properties yet. Once your exchange requests are processed, matches will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => {
            const prop = match.inventory_properties;
            const fin = match.inventory_financials;
            const mr = match.match_result;
            if (!prop) return null;

            return (
              <Link
                key={match.id}
                to={`/dashboard/matches/${match.id}`}
                className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {prop.name || prop.address || "Property"}
                      </h5>
                      <MatchBadge matchResult={mr} />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{[prop.city, prop.state].filter(Boolean).join(", ") || "—"}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {prop.asset_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium text-foreground">{ASSET_TYPE_LABELS[prop.asset_type] ?? prop.asset_type}</p>
                    </div>
                  )}
                  {prop.strategy_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Strategy</p>
                      <p className="text-sm font-medium text-foreground">{STRATEGY_TYPE_LABELS[prop.strategy_type] ?? prop.strategy_type}</p>
                    </div>
                  )}
                  {fin?.asking_price && (
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-sm font-medium text-foreground">{currency(fin.asking_price)}</p>
                    </div>
                  )}
                  {fin?.cap_rate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Cap Rate</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {Number(fin.cap_rate).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchBadge({ matchResult }: { matchResult?: { client_response: string | null; client_viewed_at: string | null } | null }) {
  if (!matchResult) return null;
  if (matchResult.client_response === "interested") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5 py-0">Interested</Badge>;
  }
  if (matchResult.client_response === "passed") {
    return <Badge className="bg-muted text-muted-foreground hover:bg-muted text-[10px] px-1.5 py-0">Passed</Badge>;
  }
  if (!matchResult.client_viewed_at) {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5 py-0">New</Badge>;
  }
  return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px] px-1.5 py-0">Awaiting response</Badge>;
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Camera, Building2 } from "lucide-react";
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
  inventory_images?: Tables<"inventory_images">[];
  match_result?: {
    total_score: number;
    client_response: string | null;
    client_viewed_at: string | null;
  } | null;
}

function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score);
  const color =
    rounded >= 85
      ? "bg-green-600"
      : rounded >= 70
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full ${color} text-sm font-bold text-white shadow-lg`}>
      {rounded}
    </div>
  );
}

function ResponseBadge({ matchResult }: { matchResult?: MatchedProperty["match_result"] }) {
  if (!matchResult) return null;
  if (matchResult.client_response === "interested") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">Interested</Badge>;
  }
  if (matchResult.client_response === "passed") {
    return <Badge className="bg-muted text-muted-foreground hover:bg-muted text-[10px]">Passed</Badge>;
  }
  if (!matchResult.client_viewed_at) {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">New</Badge>;
  }
  return null;
}

function currency(v: number | null) {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function currencyFull(v: number | null) {
  return v ? `$${Number(v).toLocaleString()}` : "—";
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

        const [finsRes, mrRes, imgRes] = await Promise.all([
          propertyIds.length > 0
            ? supabase.from("inventory_financials").select("*").in("property_id", propertyIds)
            : Promise.resolve({ data: [] }),
          matchResultIds.length > 0
            ? supabase.from("match_results").select("id, total_score, client_response, client_viewed_at").in("id", matchResultIds)
            : Promise.resolve({ data: [] }),
          propertyIds.length > 0
            ? supabase.from("inventory_images").select("*").in("property_id", propertyIds).order("sort_order")
            : Promise.resolve({ data: [] }),
        ]);

        const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
        const mrMap = new Map((mrRes.data ?? []).map((r: any) => [r.id, r]));
        const imgMap = new Map<string, any[]>();
        (imgRes.data ?? []).forEach((img: any) => {
          if (!imgMap.has(img.property_id)) imgMap.set(img.property_id, []);
          imgMap.get(img.property_id)!.push(img);
        });

        matchData.forEach((m) => {
          m.inventory_financials = finMap.get(m.property_id) ?? null;
          m.match_result = mrMap.get(m.match_result_id) ?? null;
          m.inventory_images = imgMap.get(m.property_id) ?? [];
        });
      }

      // Sort: unresponded first, then by date
      matchData.sort((a, b) => {
        const aResponded = !!a.match_result?.client_response;
        const bResponded = !!b.match_result?.client_response;
        if (aResponded !== bResponded) return aResponded ? 1 : -1;
        return new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime();
      });

      setMatches(matchData);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Matches</h1>
      <p className="mt-1 text-sm text-muted-foreground">Properties matched to your exchange requests.</p>

      {matches.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No matched properties yet. Once your exchange requests are processed, matches will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => {
            const prop = match.inventory_properties;
            const fin = match.inventory_financials;
            const mr = match.match_result;
            const imgs = match.inventory_images ?? [];
            if (!prop) return null;

            const coverImg = imgs.length > 0
              ? supabase.storage.from("inventory-images").getPublicUrl(imgs[0].storage_path).data.publicUrl
              : null;

            return (
              <Link
                key={match.id}
                to={`/dashboard/matches/${match.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Photo */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {coverImg ? (
                    <img
                      src={coverImg}
                      alt={prop.name || "Property"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                      <Building2 className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Match score */}
                  {mr && <ScoreBadge score={mr.total_score} />}

                  {/* Photo count */}
                  {imgs.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                      <Camera className="h-3 w-3" /> {imgs.length}
                    </div>
                  )}

                  {/* Response badge */}
                  <div className="absolute left-2 top-2">
                    <ResponseBadge matchResult={mr} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Price */}
                  <p className="text-xl font-bold text-foreground">
                    {fin?.asking_price ? currencyFull(fin.asking_price) : "Price TBD"}
                  </p>

                  {/* Metrics row */}
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                    {fin?.cap_rate && (
                      <span>{Number(fin.cap_rate).toFixed(1)}% cap</span>
                    )}
                    {fin?.cap_rate && fin?.noi && <span className="text-border">·</span>}
                    {fin?.noi && (
                      <span>{currency(fin.noi)} NOI</span>
                    )}
                    {(fin?.cap_rate || fin?.noi) && (prop.units || prop.square_footage) && <span className="text-border">·</span>}
                    {prop.units ? (
                      <span>{prop.units} units</span>
                    ) : prop.square_footage ? (
                      <span>{Number(prop.square_footage).toLocaleString()} SF</span>
                    ) : null}
                    {(prop.units || prop.square_footage) && prop.year_built && <span className="text-border">·</span>}
                    {prop.year_built && (
                      <span>Built {prop.year_built}</span>
                    )}
                  </div>

                  {/* Name */}
                  <p className="mt-2 font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {prop.name || prop.address || "Property"}
                  </p>

                  {/* Location */}
                  <p className="mt-0.5 text-sm text-muted-foreground truncate">
                    {[prop.city, prop.state].filter(Boolean).join(", ") || "—"}
                  </p>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {prop.asset_type && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {ASSET_TYPE_LABELS[prop.asset_type]}
                      </span>
                    )}
                    {prop.strategy_type && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {STRATEGY_TYPE_LABELS[prop.strategy_type]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  clientId: string;
}

interface MatchRow {
  matchId: string;
  status: string;
  score: number;
  exchangeId: string;
  propertyName: string | null;
  city: string | null;
  state: string | null;
}

async function fetchMatches(clientId: string): Promise<MatchRow[]> {
  const { data: exchanges } = await supabase
    .from("exchanges")
    .select("id")
    .eq("client_id", clientId);
  const ids = (exchanges ?? []).map((e) => e.id);
  if (ids.length === 0) return [];

  const { data: matches } = await supabase
    .from("matches")
    .select("id, status, total_score, buyer_exchange_id, seller_property_id")
    .in("buyer_exchange_id", ids)
    .order("total_score", { ascending: false });

  if (!matches || matches.length === 0) return [];

  const propIds = Array.from(new Set(matches.map((m) => m.seller_property_id).filter(Boolean)));
  const { data: props } = await supabase
    .from("pledged_properties")
    .select("id, property_name, city, state")
    .in("id", propIds);
  const propMap = new Map((props ?? []).map((p: any) => [p.id, p]));

  return matches.map((m: any) => {
    const p: any = propMap.get(m.seller_property_id);
    return {
      matchId: m.id,
      status: m.status,
      score: Number(m.total_score ?? 0),
      exchangeId: m.buyer_exchange_id,
      propertyName: p?.property_name ?? null,
      city: p?.city ?? null,
      state: p?.state ?? null,
    };
  });
}

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  interested: "Interested",
  connected: "Connected",
  closed: "Closed",
  declined: "Declined",
};

export function ClientMatchesTab({ clientId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["client-matches", clientId],
    queryFn: () => fetchMatches(clientId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No matches yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Matched replacement properties for this client's listings will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((m) => {
        const loc = [m.city, m.state].filter(Boolean).join(", ");
        return (
          <Link key={m.matchId} to={`/agent/workspace/${m.exchangeId}?match=${m.matchId}`}>
            <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {m.propertyName || "Untitled property"}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {STATUS_LABEL[m.status] || m.status}
                    </Badge>
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{Math.round(m.score)}</p>
                  <p className="text-[10px] text-muted-foreground">fit score</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight, Plus, Search, MoreVertical, MapPin, ExternalLink,
  Eye, Pencil, Clock, Building2,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { ASSET_TYPE_LABELS, EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS } from "@/lib/constants";
import type { Enums } from "@/integrations/supabase/types";
import { getClientAccent } from "@/features/matches/lib/clientAccent";


interface ExchangeCard {
  id: string;
  status: string;
  created_at: string;
  identification_deadline: string | null;
  closing_deadline: string | null;
  exchange_proceeds: number | null;
  client_id: string | null;
  client_name: string | null;
  property_id: string | null;
  property_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  asset_type: string | null;
  units: number | null;
  year_built: number | null;
  asking_price: number | null;
  cap_rate: number | null;
  cover_url: string | null;
  match_count: number;
}


function fmtPrice(v: number | null) {
  if (!v) return "Price TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

async function fetchExchangeCards(agentId: string): Promise<ExchangeCard[]> {
  const { data: exchanges, error } = await supabase
    .from("exchanges")
    .select("id, status, created_at, identification_deadline, closing_deadline, exchange_proceeds, relinquished_property_id, client_id")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!exchanges || exchanges.length === 0) return [];

  const exchangeIds = exchanges.map((e) => e.id);
  const propertyIds = exchanges.map((e) => e.relinquished_property_id).filter(Boolean) as string[];
  const clientIds = Array.from(new Set(exchanges.map((e) => e.client_id).filter(Boolean)));

  const [propsRes, finsRes, imgsRes, matchesRes, clientsRes] = await Promise.all([
    propertyIds.length
      ? supabase.from("pledged_properties").select("id, property_name, address, city, state, asset_type, units, year_built").in("id", propertyIds)
      : Promise.resolve({ data: [] as any[] }),
    propertyIds.length
      ? supabase.from("property_financials").select("property_id, asking_price, cap_rate").in("property_id", propertyIds)
      : Promise.resolve({ data: [] as any[] }),
    propertyIds.length
      ? supabase.from("property_images").select("property_id, storage_path").in("property_id", propertyIds).order("sort_order")
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("matches").select("buyer_exchange_id").in("buyer_exchange_id", exchangeIds),
    clientIds.length
      ? supabase.from("agent_clients").select("id, client_name").in("id", clientIds as string[])
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const propMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
  const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
  const clientMap = new Map((clientsRes.data ?? []).map((c: any) => [c.id, c.client_name]));

  const coverByProp = new Map<string, string>();
  for (const img of imgsRes.data ?? []) {
    if (!coverByProp.has(img.property_id)) {
      const { data: signed } = supabase.storage.from("property-images").getPublicUrl(img.storage_path);
      coverByProp.set(img.property_id, signed?.publicUrl ?? "");
    }
  }

  const matchCount = new Map<string, number>();
  for (const m of matchesRes.data ?? []) {
    matchCount.set(m.buyer_exchange_id, (matchCount.get(m.buyer_exchange_id) ?? 0) + 1);
  }

  return exchanges.map((e) => {
    const prop: any = e.relinquished_property_id ? propMap.get(e.relinquished_property_id) : null;
    const fin: any = e.relinquished_property_id ? finMap.get(e.relinquished_property_id) : null;
    return {
      id: e.id,
      status: e.status as string,
      created_at: e.created_at,
      identification_deadline: e.identification_deadline,
      closing_deadline: e.closing_deadline,
      exchange_proceeds: e.exchange_proceeds,
      client_id: e.client_id ?? null,
      client_name: e.client_id ? (clientMap.get(e.client_id) ?? null) : null,
      property_id: e.relinquished_property_id,

      property_name: prop?.property_name ?? null,
      address: prop?.address ?? null,
      city: prop?.city ?? null,
      state: prop?.state ?? null,
      asset_type: prop?.asset_type ?? null,
      units: prop?.units ?? null,
      year_built: prop?.year_built ?? null,
      asking_price: fin?.asking_price ?? null,
      cap_rate: fin?.cap_rate ?? null,
      cover_url: e.relinquished_property_id ? (coverByProp.get(e.relinquished_property_id) ?? null) : null,
      match_count: matchCount.get(e.id) ?? 0,
    };
  });
}

export default function AgentExchanges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: exchanges = [], isLoading, error } = useQuery({
    queryKey: ["agent-exchange-cards", user?.id],
    queryFn: () => fetchExchangeCards(user!.id),
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    let rows = exchanges;
    if (statusFilter !== "all") rows = rows.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.client_name?.toLowerCase().includes(q) ||
          e.property_name?.toLowerCase().includes(q) ||
          e.address?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [exchanges, search, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: exchanges.length };
    for (const e of exchanges) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [exchanges]);

  const activeCount = (counts.active ?? 0) + (counts.in_identification ?? 0) + (counts.in_closing ?? 0);
  const draftCount = counts.draft ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load exchanges: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchanges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active · {draftCount} draft
          </p>
        </div>
        <Button onClick={() => navigate("/agent/exchanges/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Exchange
        </Button>
      </div>

      {exchanges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">No exchanges yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create an exchange for a client to pledge their property and start receiving matches.
            </p>
            <Button className="mt-4" onClick={() => navigate("/agent/exchanges/new")}>
              <Plus className="mr-2 h-4 w-4" /> Create First Exchange
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client, property, address, city…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all ?? 0})</SelectItem>
                <SelectItem value="draft">Draft ({counts.draft ?? 0})</SelectItem>
                <SelectItem value="active">Active ({counts.active ?? 0})</SelectItem>
                <SelectItem value="in_identification">In Identification ({counts.in_identification ?? 0})</SelectItem>
                <SelectItem value="in_closing">In Closing ({counts.in_closing ?? 0})</SelectItem>
                <SelectItem value="completed">Completed ({counts.completed ?? 0})</SelectItem>
                <SelectItem value="cancelled">Cancelled ({counts.cancelled ?? 0})</SelectItem>
                <SelectItem value="expired">Expired ({counts.expired ?? 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const loc = [e.city, e.state].filter(Boolean).join(", ");
              const nextDeadline = e.identification_deadline || e.closing_deadline;
              const daysLeft = nextDeadline ? differenceInDays(new Date(nextDeadline), new Date()) : null;
              return (
                <Card
                  key={e.id}
                  className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/agent/exchanges/${e.id}`)}
                >
                  <div className="relative aspect-[16/10] bg-muted">
                    {e.cover_url ? (
                      <img
                        src={e.cover_url}
                        alt={e.property_name || "Property"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <Badge className={`${EXCHANGE_STATUS_COLORS[e.status] || "bg-muted text-muted-foreground"} text-[10px]`}>
                        {EXCHANGE_STATUS_LABELS[e.status] || e.status}
                      </Badge>
                    </div>
                    {daysLeft != null && (
                      <div className="absolute left-2 bottom-2">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          daysLeft < 7 ? "bg-destructive text-destructive-foreground"
                          : daysLeft < 21 ? "bg-amber-500 text-white"
                          : "bg-green-600 text-white"
                        }`}>
                          <Clock className="h-3 w-3" /> {daysLeft}d left
                        </span>
                      </div>
                    )}
                    <div className="absolute right-2 top-2" onClick={(ev) => ev.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/agent/exchanges/${e.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View exchange
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/agent/exchanges/${e.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit details
                            </Link>
                          </DropdownMenuItem>
                          {e.match_count > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/agent/matches?exchange=${e.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" /> View matches
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-lg font-bold text-foreground">{fmtPrice(e.asking_price ?? e.exchange_proceeds)}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {e.cap_rate && <span>{Number(e.cap_rate).toFixed(1)}% cap</span>}
                      {e.cap_rate && e.units && <span className="text-border">·</span>}
                      {e.units && <span>{e.units} units</span>}
                      {(e.cap_rate || e.units) && e.year_built && <span className="text-border">·</span>}
                      {e.year_built && <span>Built {e.year_built}</span>}
                    </div>
                    <p className="mt-2 truncate font-semibold text-foreground">
                      {e.property_name || e.address || (e.status === "draft" ? "Draft — no property yet" : "Untitled property")}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {e.asset_type && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {ASSET_TYPE_LABELS[e.asset_type as Enums<"asset_type">]}
                          </span>
                        )}
                        {e.match_count > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            {e.match_count} match{e.match_count > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                      {e.client_name && (
                        <span className="truncate text-muted-foreground">
                          for {e.client_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No exchanges match your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}

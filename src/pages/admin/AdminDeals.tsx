import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { resolveListingName } from "@/lib/listingDisplay";
import { Loader2, Search, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type Match = Tables<"matches">;
type Connection = Tables<"exchange_connections">;

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function money(n: number | null) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "—";
}
function pretty(s: string) {
  return s.replace(/_/g, " ");
}

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  in_identification: "bg-amber-100 text-amber-800 border-amber-200",
  in_closing: "bg-blue-100 text-blue-800 border-blue-200",
  under_contract: "bg-blue-100 text-blue-800 border-blue-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-muted text-muted-foreground",
};

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[value] || "bg-muted text-muted-foreground"}`}>
      {pretty(value)}
    </span>
  );
}

export default function AdminDeals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [agentName, setAgentName] = useState<Map<string, string>>(new Map());
  const [clientName, setClientName] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Live data only. exchanges/pledged_properties carry is_demo; matches and
      // exchange_connections don't, so scope them to live exchange ids.
      const ex = await supabase
        .from("exchanges")
        .select("*")
        .eq("is_demo", false)
        .order("created_at", { ascending: false });
      const liveExchanges = ex.data ?? [];
      const liveExchangeIds = liveExchanges.map((e) => e.id);
      // Non-empty sentinel so the .in() filters match nothing (not everything)
      // when there are no live exchanges yet.
      const scopeIds = liveExchangeIds.length
        ? liveExchangeIds
        : ["00000000-0000-0000-0000-000000000000"];

      const [pr, mt, cn, profiles, clients] = await Promise.all([
        supabase.from("pledged_properties").select("*").eq("is_demo", false).order("created_at", { ascending: false }),
        supabase.from("matches").select("*").in("buyer_exchange_id", scopeIds).order("created_at", { ascending: false }),
        supabase.from("exchange_connections").select("*").in("buyer_exchange_id", scopeIds).order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("agent_clients").select("id, client_name"),
      ]);
      if (ex.error) toast({ title: "Failed to load deals.", description: ex.error.message, variant: "destructive" });
      setExchanges(liveExchanges);
      setProperties(pr.data ?? []);
      setMatches(mt.data ?? []);
      setConnections(cn.data ?? []);
      setAgentName(new Map((profiles.data ?? []).map((p) => [p.id, p.full_name || p.email || "Unknown"])));
      setClientName(new Map((clients.data ?? []).map((c) => [c.id, c.client_name])));
      setLoading(false);
    })();
  }, []);

  const agent = useCallback(
    (id: string | null) => (id ? agentName.get(id) ?? "Unknown" : "—"),
    [agentName],
  );

  const term = search.trim().toLowerCase();
  const fExchanges = useMemo(
    () => exchanges.filter((e) => !term || agent(e.agent_id).toLowerCase().includes(term) || (clientName.get(e.client_id) ?? "").toLowerCase().includes(term) || e.status.toLowerCase().includes(term)),
    [exchanges, term, agent, clientName],
  );
  const fProperties = useMemo(
    () => properties.filter((p) => !term || (p.property_name ?? "").toLowerCase().includes(term) || (p.address ?? "").toLowerCase().includes(term) || (p.city ?? "").toLowerCase().includes(term) || (p.state ?? "").toLowerCase().includes(term) || agent(p.agent_id).toLowerCase().includes(term)),
    [properties, term, agent],
  );
  const fConnections = useMemo(
    () => connections.filter((c) => !term || agent(c.buyer_agent_id).toLowerCase().includes(term) || agent(c.seller_agent_id).toLowerCase().includes(term) || c.status.toLowerCase().includes(term)),
    [connections, term, agent],
  );
  const fMatches = useMemo(
    () => matches.filter((m) => !term || (m.status ?? "").toLowerCase().includes(term) || (m.boot_status ?? "").toLowerCase().includes(term)),
    [matches, term],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deal Oversight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every live exchange, property, match, and connection across all agents (demo data excluded).
          </p>
        </div>
        <ReseedStagingButton />
      </div>


      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by agent, client, property, or status…" className="pl-9" aria-label="Search deals" />
      </div>

      <Tabs defaultValue="exchanges">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="exchanges">Exchanges ({fExchanges.length}/{exchanges.length})</TabsTrigger>
          <TabsTrigger value="properties">Properties ({fProperties.length}/{properties.length})</TabsTrigger>
          <TabsTrigger value="matches">Matches ({fMatches.length}/{matches.length})</TabsTrigger>
          <TabsTrigger value="connections">Connections ({fConnections.length}/{connections.length})</TabsTrigger>
        </TabsList>

        {/* Exchanges */}
        <TabsContent value="exchanges" className="mt-4">
          <TableCard empty={fExchanges.length === 0} emptyLabel="No exchanges found.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[120px]">Proceeds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fExchanges.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/deals/exchanges/${e.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</TableCell>
                    <TableCell className="text-sm">{agent(e.agent_id)}</TableCell>
                    <TableCell className="text-sm">{clientName.get(e.client_id) ?? "—"}</TableCell>
                    <TableCell><StatusPill value={e.status} /></TableCell>
                    <TableCell className="text-sm">{money(e.exchange_proceeds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Properties */}
        <TabsContent value="properties" className="mt-4">
          <TableCard empty={fProperties.length === 0} emptyLabel="No properties found.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Asset type</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fProperties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</TableCell>
                    <TableCell className="text-sm font-medium">{resolveListingName(p, true)}</TableCell>
                    <TableCell className="text-sm">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{p.asset_type ? pretty(p.asset_type) : "—"}</TableCell>
                    <TableCell className="text-sm">{agent(p.agent_id)}</TableCell>
                    <TableCell><StatusPill value={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches" className="mt-4">
          <TableCard empty={fMatches.length === 0} emptyLabel="No matches found.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Created</TableHead>
                  <TableHead className="w-[110px]">Total score</TableHead>
                  <TableHead>Score breakdown</TableHead>
                  <TableHead className="w-[140px]">Boot</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fMatches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{Math.round(m.total_score)}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {/* Only the dimensions the live matching engine actually writes.
                          timing/scale_fit/debt_fit are reserved columns it never
                          populates, so showing them here would read a misleading 0. */}
                      asset {Math.round(m.asset_score)} · fin {Math.round(m.financial_score)} · geo {Math.round(m.geo_score)} · price {Math.round(m.price_score)} · strategy {Math.round(m.strategy_score)}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{pretty(m.boot_status)}</TableCell>
                    <TableCell><StatusPill value={m.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections" className="mt-4">
          <TableCard empty={fConnections.length === 0} emptyLabel="No connections found.">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Started</TableHead>
                  <TableHead>Buyer agent</TableHead>
                  <TableHead>Seller agent</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[140px]">Facilitation fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fConnections.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/deals/connections/${c.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                    <TableCell className="text-sm">{agent(c.buyer_agent_id)}</TableCell>
                    <TableCell className="text-sm">{agent(c.seller_agent_id)}</TableCell>
                    <TableCell><StatusPill value={c.status} /></TableCell>
                    <TableCell className="text-sm">
                      {c.facilitation_fee_amount != null ? money(c.facilitation_fee_amount) : "—"}
                      {c.facilitation_fee_status && (
                        <span className="ml-1 text-xs text-muted-foreground capitalize">({pretty(c.facilitation_fee_status)})</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TableCard({ empty, emptyLabel, children }: { empty: boolean; emptyLabel: string; children: React.ReactNode }) {
  if (empty) {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{emptyLabel}</CardContent></Card>;
  }
  return <Card><div className="overflow-x-auto">{children}</div></Card>;
}

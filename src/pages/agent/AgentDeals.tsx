import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AgentListingsGrid } from "@/features/agent/components/AgentListingsGrid";
import { ClientMatchesTab } from "@/features/clients/components/ClientMatchesTab";
import { ClientDealTab } from "@/features/clients/components/ClientDealTab";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

interface ClientOption {
  id: string;
  client_name: string;
}

const VALID_TABS = ["listings", "matches", "deals"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function AgentDeals() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientOption[]>([]);

  const tab: TabKey = (() => {
    const t = searchParams.get("tab");
    return (VALID_TABS as readonly string[]).includes(t ?? "") ? (t as TabKey) : "matches";
  })();
  const clientFilter = searchParams.get("client"); // null = all

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("agent_clients")
        .select("id, client_name")
        .eq("agent_id", user.id)
        .order("client_name");
      if (!cancelled) setClients(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams);
    if (next === "matches") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  function setClient(next: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!next) params.delete("client");
    else params.set("client", next);
    setSearchParams(params, { replace: true });
  }

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientFilter) ?? null,
    [clients, clientFilter],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-sm text-muted-foreground">
            {selectedClient
              ? `Filtered to ${selectedClient.client_name}`
              : "Every listing, match, and active deal across your clients."}
          </p>
        </div>
        <Button asChild size="sm">
          <Link
            to={
              clientFilter
                ? `/agent/exchanges/new?client=${clientFilter}`
                : "/agent/exchanges/new"
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {/* Client filter chip row */}
      {clients.length > 0 && (
        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setClient(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !clientFilter
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All clients
          </button>
          {clients.map((c) => {
            const accent = getClientAccent(c.id);
            const active = clientFilter === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setClient(c.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
                {c.client_name}
              </button>
            );
          })}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="deals">Active Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-0">
          <AgentListingsGrid clientId={clientFilter} />
        </TabsContent>
        <TabsContent value="matches" className="mt-0">
          <ClientMatchesTab clientId={clientFilter} />
        </TabsContent>
        <TabsContent value="deals" className="mt-0">
          <ClientDealTab clientId={clientFilter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ClientWorkspaceHeader } from "@/features/clients/components/ClientWorkspaceHeader";
import { ClientListingsTab } from "@/features/clients/components/ClientListingsTab";
import { ClientMatchesTab } from "@/features/clients/components/ClientMatchesTab";
import { ClientDealTab } from "@/features/clients/components/ClientDealTab";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";

interface ClientRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  status: string;
}

const VALID_TABS = ["listings", "matches", "deal"] as const;
type TabKey = (typeof VALID_TABS)[number];

export default function AgentClientWorkspace() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);

  const tab = (() => {
    const t = searchParams.get("tab");
    return (VALID_TABS as readonly string[]).includes(t ?? "") ? (t as TabKey) : "matches";
  })();

  useEffect(() => {
    if (!user || !clientId) return;
    let cancelled = false;
    const run = async () => {
      const { data, error } = await supabase
        .from("agent_clients")
        .select("id, client_name, client_email, client_phone, client_company, status")
        .eq("id", clientId)
        .eq("agent_id", user.id)
        .single();

      if (cancelled) return;

      if (error || !data) {
        toast.error("Client not found");
        navigate("/agent/clients");
        return;
      }
      setClient(data);

      const { count } = await supabase
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("agent_id", user.id);
      if (!cancelled) setListingCount(count ?? 0);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [clientId, user, navigate]);

  const { data: allRels = [] } = useUnifiedRelationships();

  const counts = useMemo(() => {
    const forClient = allRels.filter((r) => r.clientId === clientId);
    const deals = forClient.filter(
      (r) => r.connectionId != null && r.stage !== "closed_lost",
    ).length;
    return {
      listings: listingCount,
      matches: forClient.length,
      deals,
    };
  }, [allRels, clientId, listingCount]);

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams);
    if (next === "matches") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  if (loading || !client || !clientId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ClientWorkspaceHeader
        clientId={clientId}
        name={client.client_name}
        email={client.client_email}
        phone={client.client_phone}
        company={client.client_company}
        status={client.status}
        counts={counts}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">
            Listings
            <span className="ml-1.5 text-[10px] opacity-70">{counts.listings}</span>
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches
            <span className="ml-1.5 text-[10px] opacity-70">{counts.matches}</span>
          </TabsTrigger>
          <TabsTrigger value="deal">
            Deal
            <span className="ml-1.5 text-[10px] opacity-70">{counts.deals}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-0">
          <ClientListingsTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="matches" className="mt-0">
          <ClientMatchesTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="deal" className="mt-0">
          <ClientDealTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

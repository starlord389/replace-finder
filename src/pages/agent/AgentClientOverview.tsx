import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, Plus, User, List, Sparkles, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClientPropertyCards } from "@/features/clients/components/ClientPropertyCards";
import { ClientProfileTab } from "@/features/clients/components/ClientProfileTab";
import { ClientMatchesTab } from "@/features/clients/components/ClientMatchesTab";
import { ClientActivityTab } from "@/features/clients/components/ClientActivityTab";
import { ClientDangerZoneTab } from "@/features/clients/components/ClientDangerZoneTab";

interface ClientRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  status: string;
}

export default function AgentClientOverview() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";
  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !clientId) return;
    let cancelled = false;
    (async () => {
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
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId, user, navigate]);

  if (loading || !client || !clientId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "profile") next.delete("tab"); else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 px-2 text-xs">
          <Link to="/agent/clients">
            <ArrowLeft className="mr-1 h-3 w-3" /> All clients
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold text-foreground">{client.client_name}</h1>
              <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-[10px]">
                {client.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {client.client_email && (
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {client.client_email}</span>
              )}
              {client.client_phone && (
                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {client.client_phone}</span>
              )}
              {client.client_company && (
                <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {client.client_company}</span>
              )}
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to={`/agent/exchanges/new?client=${clientId}`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New listing
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile"><User className="mr-1.5 h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="listings"><List className="mr-1.5 h-3.5 w-3.5" />Listings</TabsTrigger>
          <TabsTrigger value="matches"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Matches</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="mr-1.5 h-3.5 w-3.5" />Activity</TabsTrigger>
          <TabsTrigger value="danger"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ClientProfileTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <ClientPropertyCards clientId={clientId} />
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <ClientMatchesTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ClientActivityTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="danger" className="mt-4">
          <ClientDangerZoneTab
            clientId={clientId}
            clientName={client.client_name}
            status={client.status}
            onStatusChange={(s) => setClient({ ...client, status: s })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

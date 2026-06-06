import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Pencil, Phone, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { ClientPropertyCards } from "@/features/clients/components/ClientPropertyCards";
import { toast } from "sonner";

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
    return () => {
      cancelled = true;
    };
  }, [clientId, user, navigate]);

  if (loading || !client || !clientId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const accent = getClientAccent(clientId);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-xl border border-l-[4px] bg-card p-5",
          accent.borderLeft,
        )}
      >
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 h-7 px-2 text-xs">
          <Link to="/agent/clients">
            <ArrowLeft className="mr-1 h-3 w-3" /> All clients
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", accent.dot)} />
              <h1 className="truncate text-2xl font-bold text-foreground">
                {client.client_name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  accent.soft,
                  accent.fg,
                )}
              >
                {client.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {client.client_email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {client.client_email}
                </span>
              )}
              {client.client_phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {client.client_phone}
                </span>
              )}
              {client.client_company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {client.client_company}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/agent/clients/${clientId}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit client
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`/agent/exchanges/new?client=${clientId}`}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New listing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Listed properties
        </h2>
        <ClientPropertyCards clientId={clientId} />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Mail, Pencil, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

interface ClientRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  status: string;
  referred_by_platform: boolean;
  created_at: string;
}

export default function AgentClientWorkspace() {
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
        .select(
          "id, client_name, client_email, client_phone, client_company, status, referred_by_platform, created_at",
        )
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
  const createdLabel = client.created_at
    ? new Date(client.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 h-7 px-2 text-xs">
        <Link to="/agent/clients">
          <ArrowLeft className="mr-1 h-3 w-3" /> All clients
        </Link>
      </Button>

      <div className={cn("rounded-xl border border-l-[4px] bg-card p-5", accent.borderLeft)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", accent.dot)} />
              <h1 className="truncate text-2xl font-bold text-foreground">{client.client_name}</h1>
              <Badge
                variant={client.status === "active" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {client.status}
              </Badge>
              {client.referred_by_platform && (
                <Badge variant="outline" className="text-[10px]">
                  Platform Referral
                </Badge>
              )}
            </div>
            {createdLabel && (
              <p className="mt-1 text-xs text-muted-foreground">Added {createdLabel}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/agent/clients/${clientId}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit client
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`/agent/deals?client=${clientId}`}>
                Open in Deals <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Email"
            value={client.client_email}
            icon={<Mail className="h-3.5 w-3.5" />}
          />
          <Field
            label="Phone"
            value={client.client_phone}
            icon={<Phone className="h-3.5 w-3.5" />}
          />
          <Field
            label="Company"
            value={client.client_company}
            icon={<Building2 className="h-3.5 w-3.5" />}
          />
          <Field label="Status" value={client.status} />
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
        Listings, matches, and active deals for this client live in the{" "}
        <Link
          to={`/agent/deals?client=${clientId}`}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Deals
        </Link>{" "}
        workspace.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
        {value ? (
          <>
            {icon}
            {value}
          </>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </p>
    </div>
  );
}

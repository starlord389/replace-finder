import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  clientId: string;
}

interface ActivityEvent {
  id: string;
  ts: string;
  icon: "client" | "exchange" | "invite_sent" | "invite_accepted";
  title: string;
  description?: string;
}

async function fetchActivity(clientId: string): Promise<ActivityEvent[]> {
  const [{ data: client }, { data: exchanges }, { data: invites }] = await Promise.all([
    supabase.from("agent_clients").select("created_at, client_name").eq("id", clientId).single(),
    supabase.from("exchanges").select("id, status, created_at").eq("client_id", clientId),
    supabase.from("client_invites").select("id, status, created_at, accepted_at, email").eq("client_id", clientId),
  ]);

  const events: ActivityEvent[] = [];

  if (client) {
    events.push({
      id: `client-${clientId}`,
      ts: client.created_at,
      icon: "client",
      title: "Client added",
      description: client.client_name,
    });
  }

  for (const ex of exchanges ?? []) {
    events.push({
      id: `ex-${ex.id}`,
      ts: ex.created_at,
      icon: "exchange",
      title: "Listing created",
      description: `Status: ${ex.status}`,
    });
  }

  for (const inv of invites ?? []) {
    events.push({
      id: `inv-${inv.id}`,
      ts: inv.created_at,
      icon: "invite_sent",
      title: "Platform invite sent",
      description: inv.email,
    });
    if (inv.accepted_at) {
      events.push({
        id: `inv-acc-${inv.id}`,
        ts: inv.accepted_at,
        icon: "invite_accepted",
        title: "Invite accepted",
        description: inv.email,
      });
    }
  }

  return events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

function iconFor(kind: ActivityEvent["icon"]) {
  switch (kind) {
    case "client": return <UserPlus className="h-4 w-4" />;
    case "exchange": return <FileText className="h-4 w-4" />;
    case "invite_sent": return <Mail className="h-4 w-4" />;
    case "invite_accepted": return <CheckCircle2 className="h-4 w-4" />;
  }
}

export function ClientActivityTab({ clientId }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["client-activity", clientId],
    queryFn: () => fetchActivity(clientId),
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
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {data.map((e) => (
            <li key={e.id} className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {iconFor(e.icon)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                {e.description && (
                  <p className="text-xs text-muted-foreground">{e.description}</p>
                )}
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {new Date(e.ts).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

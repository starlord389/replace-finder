import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users, Mail, Phone, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  status: string;
  referred_by_platform: boolean;
  exchangeCount?: number;
}

export default function AgentClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("agent_clients")
        .select("id, client_name, client_email, client_phone, client_company, status, referred_by_platform")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Get exchange counts per client
      const { data: exchanges } = await supabase
        .from("exchanges")
        .select("client_id")
        .eq("agent_id", user.id);

      const countMap: Record<string, number> = {};
      exchanges?.forEach((e) => { countMap[e.client_id] = (countMap[e.client_id] || 0) + 1; });

      setClients(data.map((c) => ({ ...c, exchangeCount: countMap[c.id] || 0 })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.client_name.toLowerCase().includes(q) ||
      (c.client_email?.toLowerCase().includes(q) ?? false) ||
      (c.client_company?.toLowerCase().includes(q) ?? false)
    );
  });

  const activeCount = clients.filter((c) => c.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active client{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link to="/agent/clients/new"><Plus className="mr-2 h-4 w-4" /> Add Client</Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">No clients yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first client to start managing their 1031 exchange.
            </p>
            <Button asChild className="mt-4">
              <Link to="/agent/clients/new"><Plus className="mr-2 h-4 w-4" /> Add Your First Client</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            {filtered.map((c) => (
              <Link key={c.id} to={`/agent/clients/${c.id}`}>
                <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{c.client_name}</p>
                        <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {c.status}
                        </Badge>
                        {c.referred_by_platform && (
                          <Badge variant="outline" className="text-[10px]">Platform Referral</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {c.client_email && (
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {c.client_email}</span>
                        )}
                        {c.client_phone && (
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.client_phone}</span>
                        )}
                        {c.client_company && (
                          <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.client_company}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-foreground">{c.exchangeCount}</p>
                      <p className="text-[10px] text-muted-foreground">exchange{c.exchangeCount !== 1 ? "s" : ""}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No clients match your search.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

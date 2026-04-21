import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Check, Search, Users } from "lucide-react";
import { toast } from "sonner";

interface Props {
  selectedClientId: string;
  onChange: (clientId: string) => void;
  onNext: () => void;
  lockedClientName?: string;
}

interface Client {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  status: string;
}

export default function StepSelectClient({ selectedClientId, onChange, onNext, lockedClientName }: Props) {
  if (lockedClientName) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Client</h2>
          <p className="text-sm text-muted-foreground">The client is locked for an existing exchange and cannot be changed.</p>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{lockedClientName}</p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end pt-4">
          <Button onClick={onNext}>Continue</Button>
        </div>
      </div>
    );
  }

  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("agent_clients")
        .select("id, client_name, client_email, client_phone, client_company, status")
        .eq("agent_id", user.id)
        .order("client_name", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load clients:", error);
        toast.error("Failed to load your clients: " + error.message);
        setClients([]);
      } else {
        setClients(data || []);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  const activeClients = useMemo(() => clients.filter(c => c.status === "active"), [clients]);
  const inactiveClients = useMemo(() => clients.filter(c => c.status !== "active"), [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...activeClients, ...inactiveClients];
    if (!q) return base;
    return base.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      (c.client_email?.toLowerCase().includes(q) ?? false) ||
      (c.client_company?.toLowerCase().includes(q) ?? false) ||
      (c.client_phone?.toLowerCase().includes(q) ?? false)
    );
  }, [activeClients, inactiveClients, search]);

  const handleAddClient = async () => {
    if (!user || !newClient.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("agent_clients").insert({
      agent_id: user.id,
      client_name: newClient.name.trim(),
      client_email: newClient.email.trim() || null,
      client_phone: newClient.phone.trim() || null,
      client_company: newClient.company.trim() || null,
    }).select("id, client_name, client_email, client_phone, client_company, status").single();
    setSaving(false);
    if (error || !data) {
      console.error("Failed to add client:", error);
      toast.error("Failed to add client: " + (error?.message || "Unknown error"));
      return;
    }
    setClients(prev => [...prev, data]);
    onChange(data.id);
    setShowNew(false);
    setNewClient({ name: "", email: "", phone: "", company: "" });
    toast.success("Client added");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasAnyClients = clients.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Select a Client</h2>
        <p className="text-sm text-muted-foreground">
          {hasAnyClients
            ? `Choose which client this exchange is for (${activeClients.length} active${inactiveClients.length ? `, ${inactiveClients.length} inactive` : ""}).`
            : "You don't have any clients yet. Add one below to continue."}
        </p>
      </div>

      {hasAnyClients && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company, or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {hasAnyClients ? (
        <div className="grid gap-3">
          {filtered.map(c => {
            const isSelected = selectedClientId === c.id;
            const isInactive = c.status !== "active";
            return (
              <Card
                key={c.id}
                className={`cursor-pointer transition-colors ${isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"} ${isInactive ? "opacity-70" : ""}`}
                onClick={() => onChange(c.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {isSelected ? <Check className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{c.client_name}</p>
                      {isInactive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {[c.client_email, c.client_phone].filter(Boolean).join(" · ") || "No contact info"}
                    </p>
                  </div>
                  {c.client_company && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">{c.client_company}</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No clients match "{search}".
            </p>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-base font-semibold text-foreground">No clients found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first client to start this exchange.
            </p>
          </CardContent>
        </Card>
      )}

      {!showNew ? (
        <Button variant="outline" className="w-full" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add a New Client
        </Button>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-4">
            <h3 className="font-medium text-foreground">New Client</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name *</Label>
                <Input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddClient} disabled={saving || !newClient.name.trim()}>
                {saving ? "Adding…" : "Add & Select"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={!selectedClientId}>Continue</Button>
      </div>
    </div>
  );
}

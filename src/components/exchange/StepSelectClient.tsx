import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  selectedClientId: string;
  onChange: (clientId: string) => void;
  onNext: () => void;
}

interface Client {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
}

export default function StepSelectClient({ selectedClientId, onChange, onNext }: Props) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("agent_clients").select("id, client_name, client_email, client_phone, client_company")
      .eq("agent_id", user.id).eq("status", "active").order("client_name")
      .then(({ data }) => { setClients(data || []); setLoading(false); });
  }, [user]);

  const handleAddClient = async () => {
    if (!user || !newClient.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("agent_clients").insert({
      agent_id: user.id, client_name: newClient.name.trim(),
      client_email: newClient.email || null, client_phone: newClient.phone || null,
      client_company: newClient.company || null,
    }).select("id, client_name, client_email, client_phone, client_company").single();
    setSaving(false);
    if (error) { toast.error("Failed to add client"); return; }
    setClients(prev => [...prev, data]);
    onChange(data.id);
    setShowNew(false);
    setNewClient({ name: "", email: "", phone: "", company: "" });
    toast.success("Client added");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Select a Client</h2>
        <p className="text-sm text-muted-foreground">Choose which client this exchange is for.</p>
      </div>

      <div className="grid gap-3">
        {clients.map(c => (
          <Card key={c.id} className={`cursor-pointer transition-colors ${selectedClientId === c.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"}`}
            onClick={() => onChange(c.id)}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedClientId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {selectedClientId === c.id ? <Check className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{c.client_name}</p>
                <p className="text-sm text-muted-foreground truncate">{[c.client_email, c.client_phone].filter(Boolean).join(" · ")}</p>
              </div>
              {c.client_company && <span className="text-xs text-muted-foreground">{c.client_company}</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      {!showNew ? (
        <Button variant="outline" className="w-full" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add a New Client
        </Button>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-4">
            <h3 className="font-medium text-foreground">New Client</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Name *</Label><Input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input type="tel" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Company</Label><Input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddClient} disabled={saving || !newClient.name.trim()}>{saving ? "Adding…" : "Add & Select"}</Button>
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

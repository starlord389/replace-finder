import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Send, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Exchange {
  id: string;
  status: string;
  created_at: string;
}

export default function AgentClientDetail() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !user) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from("agent_clients")
        .select("*")
        .eq("id", id)
        .eq("agent_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Client not found");
        navigate("/agent/clients");
        return;
      }

      setName(data.client_name);
      setEmail(data.client_email ?? "");
      setPhone(data.client_phone ?? "");
      setCompany(data.client_company ?? "");
      setNotes(data.notes ?? "");
      setClientUserId(data.client_user_id);
      setStatus(data.status);

      const { data: exs } = await supabase
        .from("exchanges")
        .select("id, status, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      setExchanges(exs ?? []);
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);

    if (isNew) {
      const { error } = await supabase.from("agent_clients").insert({
        agent_id: user.id,
        client_name: name.trim(),
        client_email: email.trim() || null,
        client_phone: phone.trim() || null,
        client_company: company.trim() || null,
        notes: notes.trim() || null,
      });
      setSaving(false);
      if (error) { toast.error("Failed to add client"); return; }
      toast.success("Client added successfully");
      navigate("/agent/clients");
    } else {
      const { error } = await supabase.from("agent_clients").update({
        client_name: name.trim(),
        client_email: email.trim() || null,
        client_phone: phone.trim() || null,
        client_company: company.trim() || null,
        notes: notes.trim() || null,
      }).eq("id", id);
      setSaving(false);
      if (error) { toast.error("Failed to update client"); return; }
      toast.success("Client updated");
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    const { error } = await supabase.from("agent_clients").update({ status: "inactive" }).eq("id", id);
    if (error) { toast.error("Failed to deactivate"); return; }
    toast.success("Client deactivated");
    navigate("/agent/clients");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agent/clients"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients</Link>
      </Button>

      <h1 className="text-2xl font-bold text-foreground">{isNew ? "Add New Client" : name}</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this client's exchange goals, timeline, etc."
              />
            </div>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : isNew ? "Add Client" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Edit-only sections */}
      {!isNew && (
        <>
          {/* Exchanges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exchanges</CardTitle>
            </CardHeader>
            <CardContent>
              {exchanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exchanges yet for this client.</p>
              ) : (
                <div className="space-y-2">
                  {exchanges.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between rounded border p-3">
                      <div>
                        <Badge variant="secondary" className="text-[10px]">{ex.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created {new Date(ex.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/agent/exchanges/${ex.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/agent/exchanges/new">New Exchange for This Client</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Invite */}
          {!clientUserId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite to Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Invite {name} to create an account so they can view their exchange progress.
                </p>
                <Button variant="outline" onClick={() => toast.info("Client invitations coming soon")}>
                  <Send className="mr-2 h-4 w-4" /> Invite {name}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Deactivate */}
          {status === "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <UserMinus className="mr-2 h-4 w-4" /> Deactivate Client
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the client as inactive. You can reactivate them later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate}>Deactivate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// This route creates the internal client record needed for listings and matches.
// Giving that client a login remains a separate, optional action on their profile.
export default function AgentClientDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("agent_clients")
      .insert({
        agent_id: user.id,
        client_name: name.trim(),
        client_email: email.trim() || null,
        client_phone: phone.trim() || null,
        notes: notes.trim() || null,
        is_demo: isDemo,
      })
      .select("id")
      .single();
    setSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to add client");
      return;
    }

    toast.success("Client added. You can now create their listing.");
    navigate(`/agent/clients/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agent/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create the client record you need to add listings and manage their exchange.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any notes about this client's exchange goals, timeline, etc."
              />
            </div>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Adding client…" : "Add Client"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Client workspace access is optional</CardTitle>
              <CardDescription className="mt-1">
                Adding a client here does not create an account or send an email. After saving, you can invite them to their own investor workspace from their client profile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

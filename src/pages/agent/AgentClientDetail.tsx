import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { inviteInvestorClient } from "@/features/representation/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Add-a-client form. Existing clients are viewed/edited via AgentClientOverview
// (the /agent/clients/:clientId tabs); this route is only ever "/agent/clients/new".
export default function AgentClientDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const result = await inviteInvestorClient({
        name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim(), isDemo,
      });
      toast.success(result.emailWarning ? "Client added, but the invitation email needs attention." : "Client added and invitation sent.");
      navigate("/agent/clients");
    } catch (error: any) {
      toast.error(error.message ?? "Failed to invite client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agent/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Link>
      </Button>

      <div><h1 className="text-2xl font-bold text-foreground">Invite a Client</h1><p className="mt-1 text-sm text-muted-foreground">Your client receives an investor workspace. Once accepted, you can collaborate on assigned exchanges and recommend matches.</p></div>

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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
              {saving ? "Sending invitation…" : "Invite Client"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

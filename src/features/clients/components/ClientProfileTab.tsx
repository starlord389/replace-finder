import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  clientId: string;
}

export function ClientProfileTab({ clientId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("agent_clients")
        .select("client_name, client_email, client_phone, notes")
        .eq("id", clientId)
        .single();
      if (cancelled) return;
      if (data) {
        setName(data.client_name ?? "");
        setEmail(data.client_email ?? "");
        setPhone(data.client_phone ?? "");
        setNotes(data.notes ?? "");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    const { error } = await supabase.from("agent_clients").update({
      client_name: name.trim(),
      client_email: email.trim() || null,
      client_phone: phone.trim() || null,
    }).eq("id", clientId);
    setSavingInfo(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Contact info saved");
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const { error } = await supabase.from("agent_clients").update({
      notes: notes.trim() || null,
    }).eq("id", clientId);
    setSavingNotes(false);
    if (error) { toast.error("Failed to save notes"); return; }
    toast.success("Notes saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <CardDescription>The basics for reaching this client.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveInfo} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={savingInfo || !name.trim()}>
              {savingInfo ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>Private notes about exchange goals, timeline, preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Targeting $5M stabilized multifamily in Texas. Prefers assumable debt."
          />
          <Button onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? "Saving…" : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

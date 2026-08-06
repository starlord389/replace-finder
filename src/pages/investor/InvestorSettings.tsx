import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmsPreferencesCard } from "@/components/compliance/SmsPreferencesCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvestorSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", company: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, company").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setForm({ fullName: data?.full_name ?? "", phone: data?.phone ?? "", company: data?.company ?? "" });
        setLoading(false);
      });
  }, [user]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.fullName.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Account settings saved.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your investor/property-owner account. Listing-specific replacement preferences are managed when you create or edit a listing.</p></div>
      <Card><CardHeader><CardTitle className="text-lg">Account profile</CardTitle></CardHeader><CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <form onSubmit={save} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="company">Company or ownership entity</Label><Input id="company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </form>
        )}
      </CardContent></Card>
      <SmsPreferencesCard
        phone={form.phone}
        messageDescription="your account, exchange activity, property matches, inquiries, and related service notices"
      />
    </div>
  );
}

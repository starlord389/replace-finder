import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ASSET_TYPE_LABELS } from "@/lib/constants";

export default function AgentSettings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageAddress, setBrokerageAddress] = useState("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, email, phone, brokerage_name, brokerage_address, bio, specializations")
      .eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setEmail(data.email ?? "");
          setPhone(data.phone ?? "");
          setBrokerageName(data.brokerage_name ?? "");
          setBrokerageAddress(data.brokerage_address ?? "");
          setBio(data.bio ?? "");
          setSpecializations(data.specializations ?? []);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleSpecialization = (value: string) => {
    setSpecializations((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      brokerage_name: brokerageName.trim() || null,
      brokerage_address: brokerageAddress.trim() || null,
      bio: bio.trim() || null,
      specializations: specializations.length ? specializations : null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Settings saved");
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
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Brokerage Name</Label>
              <Input value={brokerageName} onChange={(e) => setBrokerageName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Brokerage Address</Label>
              <Input value={brokerageAddress} onChange={(e) => setBrokerageAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Describe your market focus, client profile, and 1031 exchange experience."
              />
            </div>
            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => {
                  const selected = specializations.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSpecialization(key)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select the property types you most often represent so your profile is complete for Launchpad setup.
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

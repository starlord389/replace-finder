import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { ASSET_TYPE_LABELS } from "@/lib/constants";

export default function AgentProfile() {
  const { user, profileName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageAddress, setBrokerageAddress] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, brokerage_name, brokerage_address, license_state, license_number, years_experience, bio, specializations, profile_photo_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
          setBrokerageName(data.brokerage_name ?? "");
          setBrokerageAddress(data.brokerage_address ?? "");
          setLicenseState(data.license_state ?? "");
          setLicenseNumber(data.license_number ?? "");
          setYearsExperience(data.years_experience != null ? String(data.years_experience) : "");
          setBio(data.bio ?? "");
          setSpecializations(data.specializations ?? []);
          setPhotoUrl(data.profile_photo_url ?? null);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleSpecialization = (value: string) => {
    setSpecializations((c) => (c.includes(value) ? c.filter((v) => v !== value) : [...c, value]));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("agent-avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed: " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("agent-avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    await supabase.from("profiles").update({ profile_photo_url: url }).eq("id", user.id);
    setPhotoUrl(url);
    setUploading(false);
    toast.success("Photo updated");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const yrs = yearsExperience.trim() ? Number(yearsExperience) : null;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        brokerage_name: brokerageName.trim() || null,
        brokerage_address: brokerageAddress.trim() || null,
        license_state: licenseState.trim() || null,
        license_number: licenseNumber.trim() || null,
        years_experience: yrs && !Number.isNaN(yrs) ? yrs : null,
        bio: bio.trim() || null,
        specializations: specializations.length ? specializations : null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Profile saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = (fullName || profileName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is what other agents see when you connect on an exchange.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo</CardTitle>
          <CardDescription>A clear headshot helps build trust with counterparts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {photoUrl && <AvatarImage src={photoUrl} alt={fullName || "Avatar"} />}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <label className="inline-flex cursor-pointer">
                <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <span>
                    <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                    {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
                  </span>
                </Button>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, max ~5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public Information</CardTitle>
          <CardDescription>Shown to other agents when you share an active connection.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
                <Label>License State</Label>
                <Input value={licenseState} onChange={(e) => setLicenseState(e.target.value)} placeholder="e.g. CA" />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Describe your market focus, typical clients, and 1031 experience."
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

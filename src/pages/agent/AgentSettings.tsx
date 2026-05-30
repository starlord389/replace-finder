import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import { useNotificationPrefs } from "@/features/notifications/hooks/useNotificationPrefs";
import { Bell, Lock, User, Database, Download, Trash2, UploadCloud } from "lucide-react";

export default function AgentSettings() {
  const { user, profileName, signOut } = useAuth();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageAddress, setBrokerageAddress] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Security state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Account state
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: prefs, update: updatePrefs } = useNotificationPrefs();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email, phone, brokerage_name, brokerage_address, license_state, license_number, years_experience, bio, specializations, profile_photo_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setEmail(data.email ?? "");
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
    setSpecializations((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const yrs = yearsExperience.trim() ? Number(yearsExperience) : null;
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      brokerage_name: brokerageName.trim() || null,
      brokerage_address: brokerageAddress.trim() || null,
      license_state: licenseState.trim() || null,
      license_number: licenseNumber.trim() || null,
      years_experience: yrs && !Number.isNaN(yrs) ? yrs : null,
      bio: bio.trim() || null,
      specializations: specializations.length ? specializations : null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile saved");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, clients, exchanges, properties, connections] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("agent_clients").select("*").eq("agent_id", user.id),
        supabase.from("exchanges").select("*").eq("agent_id", user.id),
        supabase.from("pledged_properties").select("*").eq("agent_id", user.id),
        supabase.from("exchange_connections").select("*").or(`buyer_agent_id.eq.${user.id},seller_agent_id.eq.${user.id}`),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        clients: clients.data,
        exchanges: exchanges.data,
        pledged_properties: properties.data,
        connections: connections.data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1031exchangeup-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") { toast.error("Type DELETE to confirm"); return; }
    toast.info("Account deletion request submitted. Our team will follow up within 24h.");
    if (user) {
      await supabase.from("support_tickets").insert({
        user_id: user.id,
        category: "account",
        subject: "Account deletion request",
        message: `User ${user.email} has requested account deletion via Settings.`,
        status: "open",
      });
    }
    setDeleteConfirm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = (fullName || profileName || user?.email || "?").charAt(0).toUpperCase();

  const NOTIFICATION_TYPES: Array<{
    key: keyof NonNullable<typeof prefs>;
    label: string;
    description: string;
  }> = [
    { key: "notify_new_match", label: "New matches", description: "When the system finds a new property match for one of your exchanges." },
    { key: "notify_connection_request", label: "Incoming connection requests", description: "When another agent requests a connection on one of your listings." },
    { key: "notify_connection_accepted", label: "Connection accepted", description: "When an agent accepts your connection request." },
    { key: "notify_new_message", label: "New messages", description: "When someone sends you a message in an active connection." },
    { key: "notify_deadline_reminder", label: "Deadline reminders", description: "When your 45-day or 180-day exchange deadlines are approaching." },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, notifications, and account.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile"><User className="mr-1.5 h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Lock className="mr-1.5 h-3.5 w-3.5" />Security</TabsTrigger>
          <TabsTrigger value="account"><Database className="mr-1.5 h-3.5 w-3.5" />Account</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4 space-y-4">
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
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Shown to other agents when you share an active connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">In-app Notifications</CardTitle>
              <CardDescription>
                Choose which events trigger a notification in the bell menu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {NOTIFICATION_TYPES.map((item) => {
                  const checked = prefs?.[item.key] ?? true;
                  return (
                    <li key={item.key} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={Boolean(checked)}
                        onCheckedChange={(v) => updatePrefs.mutate({ [item.key]: v } as any)}
                      />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Email notifications are coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>At least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={changingPassword || !newPassword}>
                  {changingPassword ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>Sign out of this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => signOut()}>
                Sign out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Your Data</CardTitle>
              <CardDescription>
                Download a JSON file with your profile, clients, exchanges, properties, and connections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} disabled={exporting} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting…" : "Download Data Export"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanent actions that cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will submit a deletion request to our team. Your data will be removed within 30 days.
                      Active connections and clients will be notified. Type <span className="font-mono font-bold">DELETE</span> to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE to confirm"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Submit Deletion Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

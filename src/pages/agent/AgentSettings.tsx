import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNotificationPrefs, type NotificationPrefs } from "@/features/notifications/hooks/useNotificationPrefs";
import { Bell, Lock, User, Database, Download, Trash2, UploadCloud } from "lucide-react";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const BIO_MAX = 1000;

const profileSchema = z.object({
  fullName: z.string().trim().max(100, "Keep this under 100 characters").default(""),
  phone: z.string().trim().max(30, "Keep this under 30 characters").default(""),
  brokerageName: z.string().trim().max(120, "Keep this under 120 characters").default(""),
  brokerageAddress: z.string().trim().max(200, "Keep this under 200 characters").default(""),
  licenseState: z.string().trim().max(20, "Keep this under 20 characters").default(""),
  licenseNumber: z.string().trim().max(50, "Keep this under 50 characters").default(""),
  yearsExperience: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{1,2}$/.test(v) && Number(v) <= 99), "Enter a whole number between 0 and 99")
    .default(""),
  bio: z.string().trim().max(BIO_MAX, `Bio must be ${BIO_MAX} characters or less`).default(""),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AgentSettings() {
  const { user, profileName, signOut } = useAuth();
  const { isDemo } = useWorkspaceMode();

  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Account state
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: prefs, update: updatePrefs } = useNotificationPrefs();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "", phone: "", brokerageName: "", brokerageAddress: "",
      licenseState: "", licenseNumber: "", yearsExperience: "", bio: "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, email, phone, brokerage_name, brokerage_address, license_state, license_number, years_experience, bio, profile_photo_url")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("Couldn't load your profile. Please refresh.");
          setLoading(false);
          return;
        }
        if (data) {
          setEmail(data.email ?? "");
          setPhotoUrl(data.profile_photo_url ?? null);
          profileForm.reset({
            fullName: data.full_name ?? "",
            phone: data.phone ?? "",
            brokerageName: data.brokerage_name ?? "",
            brokerageAddress: data.brokerage_address ?? "",
            licenseState: data.license_state ?? "",
            licenseNumber: data.license_number ?? "",
            yearsExperience: data.years_experience != null ? String(data.years_experience) : "",
            bio: data.bio ?? "",
          });
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, profileForm]);

  const bioValue = profileForm.watch("bio");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image is too large. Please choose a file under 5MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
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

    // Clean up any previous avatars so storage doesn't accumulate orphans.
    const { data: existing } = await supabase.storage.from("agent-avatars").list(user.id);
    const stale = (existing ?? [])
      .map((f) => `${user.id}/${f.name}`)
      .filter((p) => p !== path);
    if (stale.length) await supabase.storage.from("agent-avatars").remove(stale);

    setPhotoUrl(url);
    setUploading(false);
    toast.success("Photo updated");
  };

  const handleSaveProfile = async (values: ProfileForm) => {
    if (!user) return;
    const yrs = values.yearsExperience.trim() ? Number(values.yearsExperience) : null;
    const { error } = await supabase.from("profiles").update({
      full_name: values.fullName.trim() || null,
      phone: values.phone.trim() || null,
      brokerage_name: values.brokerageName.trim() || null,
      brokerage_address: values.brokerageAddress.trim() || null,
      license_state: values.licenseState.trim() || null,
      license_number: values.licenseNumber.trim() || null,
      years_experience: yrs,
      bio: values.bio.trim() || null,
    }).eq("id", user.id);
    if (error) { toast.error("Failed to save"); return; }
    profileForm.reset(values); // mark form as pristine after a successful save
    toast.success("Profile saved");
  };

  const handleChangePassword = async (values: PasswordForm) => {
    if (!user?.email) { toast.error("No account email on file"); return; }
    // Re-authenticate with the current password before allowing a change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    });
    if (reauthError) {
      passwordForm.setError("currentPassword", { message: "Current password is incorrect" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: values.newPassword });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    passwordForm.reset();
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, clients, exchanges, properties, connections] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("agent_clients").select("*").eq("agent_id", user.id).eq("is_demo", isDemo),
        supabase.from("exchanges").select("*").eq("agent_id", user.id).eq("is_demo", isDemo),
        supabase.from("pledged_properties").select("*").eq("agent_id", user.id).eq("is_demo", isDemo),
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
    if (user) {
      await supabase.from("support_tickets").insert({
        user_id: user.id,
        category: "account",
        subject: "Account deletion request",
        message: `User ${user.email} has requested account deletion via Settings.`,
        status: "open",
      });
    }
    toast.info("Deletion request submitted. Your data will be removed within 30 days.");
    setDeleteConfirm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = (profileForm.getValues("fullName") || profileName || user?.email || "?").charAt(0).toUpperCase();

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
                  {photoUrl && <AvatarImage src={photoUrl} alt={profileForm.getValues("fullName") || "Avatar"} />}
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
                  <p className="mt-2 text-xs text-muted-foreground">JPG or PNG, max 5MB.</p>
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
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <Label htmlFor="settings-email">Email</Label>
                      <Input id="settings-email" value={email} disabled className="bg-muted" />
                    </FormItem>
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl><Input type="tel" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="yearsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl><Input type="number" min={0} max={99} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="brokerageName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brokerage Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="brokerageAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brokerage Address</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="licenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License State</FormLabel>
                          <FormControl><Input placeholder="e.g. CA" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            maxLength={BIO_MAX}
                            placeholder="Describe your market focus, client profile, and 1031 exchange experience."
                            {...field}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormMessage />
                          <span className="ml-auto text-xs text-muted-foreground">
                            {(bioValue ?? "").length}/{BIO_MAX}
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? "Saving…" : "Save Changes"}
                  </Button>
                </form>
              </Form>
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
                        <Label htmlFor={`notif-${item.key}`} className="text-sm font-medium text-foreground">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        id={`notif-${item.key}`}
                        checked={Boolean(checked)}
                        onCheckedChange={(v) => updatePrefs.mutate({ [item.key]: v } as Partial<NotificationPrefs>)}
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
              <CardDescription>Confirm your current password, then set a new one (at least 8 characters).</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Sign Out</CardTitle>
              <CardDescription>Sign out of your account on this device.</CardDescription>
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
                    aria-label="Type DELETE to confirm account deletion"
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

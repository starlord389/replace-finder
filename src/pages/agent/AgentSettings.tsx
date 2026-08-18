import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmsPreferencesCard } from "@/components/compliance/SmsPreferencesCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAvatarUploader } from "@/components/profile/ProfileAvatarUploader";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNotificationPrefs, type NotificationPrefs } from "@/features/notifications/hooks/useNotificationPrefs";
import { Bell, Lock, User, Database, Download, Trash2 } from "lucide-react";

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
  profileHeadline: z.string().trim().max(160, "Keep this under 160 characters").default(""),
  specializations: z.string().trim().max(500, "Keep this under 500 characters").default(""),
  serviceAreas: z.string().trim().max(500, "Keep this under 500 characters").default(""),
  completedExchanges: z.string().trim().refine(
    (v) => v === "" || (/^\d{1,6}$/.test(v) && Number(v) <= 100000),
    "Enter a whole number between 0 and 100,000",
  ).default(""),
  transactionVolume: z.string().trim().refine(
    (v) => {
      if (v === "") return true;
      const amount = Number(v.replace(/[$,]/g, ""));
      return !Number.isNaN(amount) && amount >= 0 && amount <= 1_000_000_000_000_000;
    },
    "Enter a valid dollar amount",
  ).default(""),
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
  const [loading, setLoading] = useState(true);

  // Account state
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const { data: prefs, update: updatePrefs } = useNotificationPrefs();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "", phone: "", brokerageName: "", brokerageAddress: "",
      licenseState: "", licenseNumber: "", yearsExperience: "", profileHeadline: "",
      specializations: "", serviceAreas: "", completedExchanges: "", transactionVolume: "", bio: "",
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
      .select("full_name, email, phone, brokerage_name, brokerage_address, license_state, license_number, years_experience, bio, profile_photo_url, profile_headline, specializations, service_areas, completed_1031_exchanges, career_transaction_volume")
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
            profileHeadline: data.profile_headline ?? "",
            specializations: (data.specializations ?? []).join(", "),
            serviceAreas: (data.service_areas ?? []).join(", "),
            completedExchanges: data.completed_1031_exchanges != null ? String(data.completed_1031_exchanges) : "",
            transactionVolume: data.career_transaction_volume != null ? String(data.career_transaction_volume) : "",
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
  const phoneValue = profileForm.watch("phone");

  const handleSaveProfile = async (values: ProfileForm) => {
    if (!user) return;
    const yrs = values.yearsExperience.trim() ? Number(values.yearsExperience) : null;
    const completed = values.completedExchanges.trim() ? Number(values.completedExchanges) : null;
    const volume = values.transactionVolume.trim() ? Number(values.transactionVolume.replace(/[$,]/g, "")) : null;
    const asList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
    const { error } = await supabase.from("profiles").update({
      full_name: values.fullName.trim() || null,
      phone: values.phone.trim() || null,
      brokerage_name: values.brokerageName.trim() || null,
      brokerage_address: values.brokerageAddress.trim() || null,
      license_state: values.licenseState.trim() || null,
      license_number: values.licenseNumber.trim() || null,
      years_experience: yrs,
      profile_headline: values.profileHeadline.trim() || null,
      specializations: asList(values.specializations),
      service_areas: asList(values.serviceAreas),
      completed_1031_exchanges: completed,
      career_transaction_volume: volume,
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
      // exchange_connections has no is_demo column, so scope it to the current
      // workspace via the exchanges on each side - otherwise a Live export would
      // leak demo deals (and vice-versa).
      const exchangeIds = new Set((exchanges.data ?? []).map((e) => e.id));
      const scopedConnections = (connections.data ?? []).filter(
        (c) =>
          exchangeIds.has(c.buyer_exchange_id) ||
          (c.seller_exchange_id != null && exchangeIds.has(c.seller_exchange_id)),
      );
      const payload = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        clients: clients.data,
        exchanges: exchanges.data,
        pledged_properties: properties.data,
        connections: scopedConnections,
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
      const { data: ticket } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          category: "account",
          subject: "Account deletion request",
          message: `User ${user.email} has requested account deletion via Settings.`,
          status: "open",
        })
        .select("id")
        .maybeSingle();

      if (ticket?.id) {
        supabase.functions
          .invoke("notify-admin-signup", { body: { kind: "support_ticket", recordId: ticket.id } })
          .catch((err) => console.warn("admin ticket notify failed", err));
      }

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

  const NOTIFICATION_TYPES: Array<{
    key: keyof NonNullable<typeof prefs>;
    label: string;
    description: string;
  }> = [
    { key: "notify_new_match", label: "New opportunities", description: "When ExchangeUp™ detects a new opportunity for one of your properties or clients." },
    { key: "notify_connection_request", label: "New agent conversations", description: "When a verified agent starts a conversation about one of your listings." },
    { key: "notify_new_message", label: "New messages", description: "When the agent on the other side sends a message in an active conversation." },
    { key: "notify_connection_accepted", label: "Conversation updates", description: "Important updates to an active agent conversation." },
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
              <CardTitle className="text-base">Profile photo</CardTitle>
              <CardDescription>
                Recommended. Your photo appears to represented clients and verified agents when a relationship or deal gives them profile access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <ProfileAvatarUploader
                  userId={user.id}
                  name={profileForm.getValues("fullName") || profileName || user.email || "Agent"}
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional profile</CardTitle>
              <CardDescription>
                Help clients understand who will represent them. Every professional statistic is optional and clearly labeled as self-reported.
              </CardDescription>
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
                    name="profileHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional headline <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl><Input maxLength={160} placeholder="1031 exchange advisor for multifamily owners in South Florida" {...field} /></FormControl>
                        <FormDescription>A one-line introduction shown at the top of your profile.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="specializations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialties <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="1031 exchanges, multifamily, NNN" {...field} /></FormControl>
                          <FormDescription>Separate specialties with commas.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="serviceAreas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Markets served <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input placeholder="Tampa, Orlando, Central Florida" {...field} /></FormControl>
                          <FormDescription>Separate markets with commas.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="completedExchanges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completed 1031 exchanges <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input type="number" min={0} max={100000} placeholder="25" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="transactionVolume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Career transaction volume <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl><Input inputMode="decimal" placeholder="50000000" {...field} /></FormControl>
                          <FormDescription>Enter the approximate total in US dollars.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-900">
                    Completed exchanges and transaction volume are displayed as self-reported. Only add figures you can substantiate.
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About you <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
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
        <TabsContent value="notifications" className="mt-4 space-y-4">
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
          <SmsPreferencesCard
            phone={phoneValue}
            messageDescription="your account, client exchanges, property matches, connection requests, deadlines, and related service notices"
          />
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

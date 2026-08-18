import { useEffect, useMemo, useState } from "react";
import { Handshake, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProfileAvatarUploader } from "@/components/profile/ProfileAvatarUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmsPreferencesCard } from "@/components/compliance/SmsPreferencesCard";
import { NotificationPreferencesCard } from "@/features/notifications/components/NotificationPreferencesCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type ProfileForm = {
  fullName: string;
  phone: string;
  company: string;
  profileHeadline: string;
  bio: string;
  specializations: string;
  serviceAreas: string;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  phone: "",
  company: "",
  profileHeadline: "",
  bio: "",
  specializations: "",
  serviceAreas: "",
};

function asList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

export default function InvestorSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("full_name, phone, company, profile_photo_url, profile_headline, bio, specializations, service_areas")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("We couldn't load your profile. Please refresh.");
        setForm({
          fullName: data?.full_name ?? "",
          phone: data?.phone ?? "",
          company: data?.company ?? "",
          profileHeadline: data?.profile_headline ?? "",
          bio: data?.bio ?? "",
          specializations: (data?.specializations ?? []).join(", "),
          serviceAreas: (data?.service_areas ?? []).join(", "),
        });
        setPhotoUrl(data?.profile_photo_url ?? null);
        setLoading(false);
      });
  }, [user]);

  const completion = useMemo(() => {
    const values = [photoUrl, form.fullName, form.company, form.profileHeadline, form.bio, form.specializations, form.serviceAreas];
    return Math.round((values.filter((value) => Boolean(value?.trim())).length / values.length) * 100);
  }, [form, photoUrl]);

  function update(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!form.fullName.trim()) return toast.error("Please add your name.");
    if (form.profileHeadline.length > 160) return toast.error("Keep your headline under 160 characters.");
    if (form.bio.length > 1000) return toast.error("Keep your bio under 1,000 characters.");

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.fullName.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      profile_headline: form.profileHeadline.trim() || null,
      bio: form.bio.trim() || null,
      specializations: asList(form.specializations),
      service_areas: asList(form.serviceAreas),
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile & settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduce yourself to the agents you choose to work with and manage your account preferences.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="grid gap-5 p-5 sm:grid-cols-[1fr_220px] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4 text-primary" />Make the first introduction feel personal</div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              When you request representation, the agent sees this profile and the specific exchange you want help with. A photo, short introduction, and investment focus help them respond with useful context.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs"><span className="font-medium">Profile completion</span><span>{completion}%</span></div>
            <Progress value={completion} className="mt-2 h-2" />
            <p className="mt-2 text-[11px] text-muted-foreground">Only your name is required. Everything else is optional.</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={save} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile photo</CardTitle>
            <CardDescription>Recommended so your agent knows there is a real person behind the request.</CardDescription>
          </CardHeader>
          <CardContent>
            {user && <ProfileAvatarUploader userId={user.id} name={form.fullName || user.email || "Property owner"} photoUrl={photoUrl} onPhotoChange={setPhotoUrl} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About you</CardTitle>
            <CardDescription>This is the profile your connected or requested agent will see.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
                  <div className="space-y-2"><Label htmlFor="company">Company or ownership entity <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="company" value={form.company} onChange={(event) => update("company", event.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Short introduction <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input id="headline" maxLength={160} placeholder="Multifamily owner exploring my next 1031 exchange" value={form.profileHeadline} onChange={(event) => update("profileHeadline", event.target.value)} />
                  <p className="text-xs text-muted-foreground">{form.profileHeadline.length}/160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About your investment goals <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea id="bio" rows={4} maxLength={1000} placeholder="Share the kind of help you value, your experience, or what you are hoping to accomplish in your next exchange." value={form.bio} onChange={(event) => update("bio", event.target.value)} />
                  <p className="text-xs text-muted-foreground">{form.bio.length}/1,000 characters</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="focus">Investment focus <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="focus" placeholder="Multifamily, industrial, NNN" value={form.specializations} onChange={(event) => update("specializations", event.target.value)} /><p className="text-xs text-muted-foreground">Separate interests with commas.</p></div>
                  <div className="space-y-2"><Label htmlFor="markets">Markets of interest <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="markets" placeholder="Tampa, Atlanta, Southeast" value={form.serviceAreas} onChange={(event) => update("serviceAreas", event.target.value)} /><p className="text-xs text-muted-foreground">Separate markets with commas.</p></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="flex max-w-xl items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Profile details are shown only where platform permissions allow. Agents see the exchange you ask them to manage and other exchanges already assigned to them—not unrelated holdings.</p>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>

      <Card><CardHeader><CardTitle className="text-lg">Agent representation</CardTitle></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium">Manage who represents your exchanges</p><p className="mt-1 text-xs text-muted-foreground">Invite your agent, request a referral, and control exchange access.</p></div><Button asChild variant="outline"><Link to="/investor/representation"><Handshake className="mr-2 h-4 w-4" />Open My Agent</Link></Button></CardContent></Card>
      <div id="notifications"><NotificationPreferencesCard /></div>
      <SmsPreferencesCard phone={form.phone} messageDescription="your account, exchange activity, property matches, inquiries, and related service notices" />
    </div>
  );
}

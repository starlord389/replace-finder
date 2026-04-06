import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ASSET_TYPE_LABELS, US_STATES } from "@/lib/constants";
import { Briefcase, Home, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Enums } from "@/integrations/supabase/types";

type Step = "choose" | "agent" | "referral";

export default function Signup() {
  const [step, setStep] = useState<Step>("choose");

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {step === "choose" && <RoleSelection onSelect={setStep} />}
        {step === "agent" && <AgentSignupForm onBack={() => setStep("choose")} />}
        {step === "referral" && <ReferralForm onBack={() => setStep("choose")} />}
      </div>
    </div>
  );
}

function RoleSelection({ onSelect }: { onSelect: (step: Step) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Join 1031 ExchangeUp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How would you like to use the platform?
        </p>
      </div>
      <div className="grid gap-4">
        <Card
          className="cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-md"
          onClick={() => onSelect("agent")}
        >
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">I'm a Real Estate Agent</h3>
              <p className="text-sm text-muted-foreground">
                Manage 1031 exchanges for your clients. List properties, find matches, and coordinate deals.
              </p>
              <Button size="sm" className="mt-3">Sign Up as Agent</Button>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-md"
          onClick={() => onSelect("referral")}
        >
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Home className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">I'm a Property Owner</h3>
              <p className="text-sm text-muted-foreground">
                Looking to do a 1031 exchange? We'll connect you with a qualified agent in our network.
              </p>
              <Button size="sm" variant="outline" className="mt-3">Get Connected</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

function AgentSignupForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    mlsNumber: "",
    licenseState: "",
    brokerageName: "",
    brokerageAddress: "",
    bio: "",
    yearsExperience: "",
    specializations: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const toggleSpec = (val: string) => {
    setForm((p) => ({
      ...p,
      specializations: p.specializations.includes(val)
        ? p.specializations.filter((s) => s !== val)
        : [...p.specializations, val],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.mlsNumber.trim()) e.mlsNumber = "MLS number is required";
    if (!form.licenseState) e.licenseState = "License state is required";
    if (!form.brokerageName.trim()) e.brokerageName = "Brokerage name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, phone: form.phone, role: "agent" },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").update({
        role: "agent",
        mls_number: form.mlsNumber,
        license_state: form.licenseState,
        brokerage_name: form.brokerageName,
        brokerage_address: form.brokerageAddress || null,
        bio: form.bio || null,
        years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        specializations: form.specializations.length > 0 ? form.specializations : null,
        phone: form.phone,
        verification_status: "pending",
      }).eq("id", data.user.id);

      await supabase.from("user_roles").upsert(
        { user_id: data.user.id, role: "agent" as Enums<"app_role"> },
        { onConflict: "user_id,role" }
      );
    }

    setLoading(false);
    toast({
      title: "Account created",
      description: "Check your email to verify your account, then sign in.",
    });
    navigate("/login");
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="text-sm text-destructive">{errors[key]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Agent Account</h1>
          <p className="text-sm text-muted-foreground">
            Fill in your details to get started on the platform.
          </p>
        </div>
      </div>

      {/* Section 1: Account */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account</h2>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Smith" />
          {fieldError("fullName")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
          {fieldError("email")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" />
          {fieldError("phone")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" minLength={8} />
          {fieldError("password")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="••••••••" />
          {fieldError("confirmPassword")}
        </div>
      </div>

      {/* Section 2: Professional Info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Professional Info</h2>
        <div className="space-y-2">
          <Label htmlFor="mlsNumber">MLS Number *</Label>
          <Input id="mlsNumber" value={form.mlsNumber} onChange={(e) => set("mlsNumber", e.target.value)} placeholder="Your MLS ID" />
          <p className="text-xs text-muted-foreground">Your MLS ID number for verification</p>
          {fieldError("mlsNumber")}
        </div>
        <div className="space-y-2">
          <Label>License State *</Label>
          <Select value={form.licenseState} onValueChange={(v) => set("licenseState", v)}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">The state where you hold your real estate license</p>
          {fieldError("licenseState")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="brokerageName">Brokerage Name *</Label>
          <Input id="brokerageName" value={form.brokerageName} onChange={(e) => set("brokerageName", e.target.value)} placeholder="ABC Realty" />
          {fieldError("brokerageName")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="brokerageAddress">Brokerage Address</Label>
          <Input id="brokerageAddress" value={form.brokerageAddress} onChange={(e) => set("brokerageAddress", e.target.value)} placeholder="123 Main St, Suite 100" />
        </div>
      </div>

      {/* Section 3: Specializations */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Specializations (optional)</h2>
        <div className="space-y-2">
          <Label>Property Types You Work With</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
              <Badge
                key={key}
                variant={form.specializations.includes(key) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleSpec(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Years of Experience</Label>
          <Input id="yearsExperience" type="number" min={0} max={99} value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} placeholder="10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Brief Bio</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Tell other agents about your experience and market focus..." maxLength={500} rows={3} />
          <p className="text-xs text-muted-foreground">{form.bio.length}/500 characters</p>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create Agent Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

function ReferralForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    propertyType: "",
    estimatedValue: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.location.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("referrals").insert({
      owner_name: form.name,
      owner_email: form.email,
      owner_phone: form.phone,
      property_location: form.location,
      property_type: form.propertyType || null,
      estimated_value: form.estimatedValue ? parseFloat(form.estimatedValue.replace(/[^0-9.]/g, "")) : null,
      notes: form.notes || null,
      status: "pending",
    });

    setLoading(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thanks, {form.name.split(" ")[0]}!</h1>
          <p className="mt-2 text-muted-foreground">
            We'll connect you with a qualified agent in your area within 24 hours. Check your email for next steps.
          </p>
        </div>
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Get Connected with an Agent</h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your property and we'll match you with a qualified agent in your area.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="refName">Full Name *</Label>
          <Input id="refName" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refEmail">Email *</Label>
          <Input id="refEmail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refPhone">Phone *</Label>
          <Input id="refPhone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refLocation">Property Location *</Label>
          <Input id="refLocation" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, State or address" required />
        </div>
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select value={form.propertyType} onValueChange={(v) => set("propertyType", v)}>
            <SelectTrigger><SelectValue placeholder="Select type (optional)" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="refValue">Estimated Property Value</Label>
          <Input id="refValue" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} placeholder="$" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refNotes">Anything else you'd like us to know?</Label>
          <Textarea id="refNotes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Request Agent Referral"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

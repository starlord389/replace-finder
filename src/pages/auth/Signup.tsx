import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ASSET_TYPE_LABELS, US_STATES } from "@/lib/constants";
import { Briefcase, Home, ArrowLeft, CheckCircle2, Mail, Phone, Search, Handshake, Clock, Shield } from "lucide-react";

type Step = "choose" | "agent" | "referral";

export default function Signup() {
  const [step, setStep] = useState<Step>("choose");

  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f7fb] px-4 py-12">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-lg">
          {step === "choose" && <RoleSelection onSelect={setStep} />}
          {step === "agent" && <AgentSignupForm onBack={() => setStep("choose")} />}
          {step === "referral" && <ReferralForm onBack={() => setStep("choose")} />}
        </div>
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
          className="cursor-pointer border-2 border-transparent bg-white/90 transition-all hover:border-[#16284a]/35 hover:shadow-md"
          onClick={() => onSelect("agent")}
        >
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e3f1e4] text-[#43a047]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">I'm a Real Estate Agent</h3>
              <p className="text-sm text-muted-foreground">
                Manage 1031 exchanges for your clients. List properties, find matches, and coordinate deals.
              </p>
              <Button size="sm" className="mt-3 bg-[#43a047] text-white hover:bg-[#3a8c3e]">Sign Up as Agent</Button>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer border-2 border-transparent bg-white/90 transition-all hover:border-[#16284a]/35 hover:shadow-md"
          onClick={() => onSelect("referral")}
        >
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e3f1e4] text-[#43a047]">
              <Home className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">I'm a Property Owner</h3>
              <p className="text-sm text-muted-foreground">
                Looking to do a 1031 exchange? We'll connect you with a qualified agent in our network.
              </p>
              <Button size="sm" variant="outline" className="mt-3 border-[#e8edf3] text-[#16284a] hover:bg-[#eef3fb] hover:text-[#16284a]">Get Connected</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#16284a] hover:underline">Sign in</Link>
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
    professionalId: "",
    licenseState: "",
    brokerageName: "",
    attested: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.professionalId.trim()) e.professionalId = "License or MLS number is required";
    if (!form.licenseState) e.licenseState = "License state is required";
    if (!form.brokerageName.trim()) e.brokerageName = "Brokerage name is required";
    if (!form.attested) e.attested = "You must confirm your license is valid to continue";
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
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          role: "agent",
          mls_number: form.professionalId.trim(),
          license_state: form.licenseState,
          brokerage_name: form.brokerageName.trim(),
          verification_path: "self_certification",
          self_certified_at: new Date().toISOString(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);
    if (data.user) {
      setSubmittedEmail(form.email.trim());
      toast({
        title: "Check your email",
        description: "Confirm your email to unlock your agent workspace.",
      });
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="text-sm text-destructive">{errors[key]}</p> : null;

  if (submittedEmail) {
    return <PostSignupVerify email={submittedEmail} onBack={onBack} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Agent Account</h1>
          <p className="text-sm text-muted-foreground">
            Enter the essentials now and finish the rest of your profile later.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8edf3] bg-white/70 p-4">
        <p className="text-sm font-medium text-foreground">Fast setup for active agents</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We only ask for the details needed to create your workspace, confirm your role, and get you into the platform quickly.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account</h2>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Jane Smith" className="focus-visible:ring-[#43a047]" />
          {fieldError("fullName")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work Email *</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="focus-visible:ring-[#43a047]" />
          {fieldError("email")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile Phone *</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" className="focus-visible:ring-[#43a047]" />
          {fieldError("phone")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" minLength={8} className="focus-visible:ring-[#43a047]" />
          {fieldError("password")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="••••••••" className="focus-visible:ring-[#43a047]" />
          {fieldError("confirmPassword")}
        </div>
      </div>

      {/* Section 2: Professional Info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Professional Verification</h2>
        <div className="space-y-2">
          <Label htmlFor="professionalId">License or MLS Number *</Label>
          <Input
            id="professionalId"
            value={form.professionalId}
            onChange={(e) => set("professionalId", e.target.value)}
            placeholder="CA-DRE-123456 or MLS ID"
            className="focus-visible:ring-[#43a047]"
          />
          <p className="text-xs text-muted-foreground">Use whichever identifier you actively practice under.</p>
          {fieldError("professionalId")}
        </div>
        <div className="space-y-2">
          <Label>License State *</Label>
          <Select value={form.licenseState} onValueChange={(v) => set("licenseState", v)}>
            <SelectTrigger className="focus:ring-[#43a047]"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">The state where you hold your real estate license</p>
          {fieldError("licenseState")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="brokerageName">Brokerage Name *</Label>
          <Input id="brokerageName" value={form.brokerageName} onChange={(e) => set("brokerageName", e.target.value)} placeholder="ABC Realty" className="focus-visible:ring-[#43a047]" />
          <p className="text-xs text-muted-foreground">Brokerage address, bio, specialties, and experience can be completed later in Settings.</p>
          {fieldError("brokerageName")}
        </div>
      </div>

      <div className="rounded-xl border border-[#e8edf3] bg-white/50 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="attested"
            checked={form.attested}
            className="border-[#e8edf3] data-[state=checked]:border-[#43a047] data-[state=checked]:bg-[#43a047] data-[state=checked]:text-white"
            onCheckedChange={(checked) => {
              setForm((prev) => ({ ...prev, attested: checked === true }));
              if (errors.attested && checked === true) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.attested;
                  return next;
                });
              }
            }}
          />
          <div className="space-y-1">
            <Label htmlFor="attested" className="cursor-pointer">
              I certify that my real estate license is active and the details above are accurate.
            </Label>
            <p className="text-xs text-muted-foreground">
              Suspended accounts are reserved for compliance issues, not routine signup review.
            </p>
            {fieldError("attested")}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#43a047] text-white hover:bg-[#3a8c3e]" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#16284a] hover:underline">Sign in</Link>
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

    if (!error) {
      // Fire-and-forget acknowledgement email — never block the UI on it.
      const firstName = form.name.trim().split(/\s+/)[0] || undefined;
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "referral-acknowledgement",
            recipientEmail: form.email.trim(),
            idempotencyKey: `referral-ack-${form.email.trim().toLowerCase()}-${Date.now()}`,
            templateData: { firstName, location: form.location.trim() },
          },
        })
        .catch((err) => console.warn("referral ack email failed", err));
    }

    setLoading(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }

  };

  if (submitted) {
    const firstName = form.name.split(" ")[0];
    return (
      <div className="space-y-8">
        {/* Hero confirmation */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-[#e8edf3]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e3f1e4] text-[#43a047]">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#16284a]">
            You're in, {firstName}.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Your request has been received. A member of our concierge team is already reviewing your
            property details to hand-pick a qualified 1031 exchange specialist in your area.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#eef3fb] px-4 py-1.5 text-sm font-medium text-[#16284a]">
            <Mail className="h-4 w-4" />
            Confirmation sent to <span className="font-semibold">{form.email}</span>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#e8edf3]">
          <h2 className="text-lg font-semibold text-[#16284a]">What happens next</h2>
          <ol className="mt-5 space-y-5">
            {[
              {
                icon: Search,
                title: "We match you (within 24 hours)",
                desc: "Our team reviews your goals, location, and timeline to identify the best-fit specialist from our vetted network.",
              },
              {
                icon: Phone,
                title: "Your agent reaches out",
                desc: "Expect a call or email introducing your dedicated 1031 exchange advisor — no pressure, no obligation.",
              },
              {
                icon: Handshake,
                title: "You start your exchange with confidence",
                desc: "Your advisor guides you through identifying replacement properties, timelines, and qualified intermediaries.",
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3fb] text-[#16284a]">
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#16284a]">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* About the platform */}
        <div className="rounded-2xl bg-gradient-to-br from-[#16284a] to-[#1e3a6a] p-8 text-white shadow-sm">
          <h2 className="text-lg font-semibold">About 1031ExchangeUP</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            We're a private matching platform connecting property owners with elite 1031 exchange
            specialists. Unlike public marketplaces, every match is hand-vetted so your details stay
            confidential and your options stay high-quality.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Shield, label: "Confidential" },
              { icon: Clock, label: "24-hour match" },
              { icon: Handshake, label: "Vetted network" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
                <b.icon className="h-4 w-4" />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Helpful tip */}
        <div className="rounded-xl bg-[#fff8e6] p-4 text-sm text-[#7a5a00] ring-1 ring-[#f5e3a8]">
          <strong>Heads up:</strong> Check your spam folder for our confirmation email from{" "}
          <span className="font-medium">1031exchangeup.com</span> and add us to your contacts so you
          don't miss your agent introduction.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full border-[#e8edf3] text-[#16284a] hover:bg-[#eef3fb] hover:text-[#16284a]">
              Back to Home
            </Button>
          </Link>
          <a href="mailto:hello@1031exchangeup.com" className="flex-1">
            <Button className="w-full bg-[#16284a] text-white hover:bg-[#1e3a6a]">
              Contact our team
            </Button>
          </a>
        </div>
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
          <Input id="refName" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" required className="focus-visible:ring-[#43a047]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refEmail">Email *</Label>
          <Input id="refEmail" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required className="focus-visible:ring-[#43a047]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refPhone">Phone *</Label>
          <Input id="refPhone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" required className="focus-visible:ring-[#43a047]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refLocation">Property Location *</Label>
          <Input id="refLocation" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, State or address" required className="focus-visible:ring-[#43a047]" />
        </div>
        <div className="space-y-2">
          <Label>Property Type</Label>
          <Select value={form.propertyType} onValueChange={(v) => set("propertyType", v)}>
            <SelectTrigger className="focus:ring-[#43a047]"><SelectValue placeholder="Select type (optional)" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="refValue">Estimated Property Value</Label>
          <Input id="refValue" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} placeholder="$" className="focus-visible:ring-[#43a047]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refNotes">Anything else you'd like us to know?</Label>
          <Textarea id="refNotes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="focus-visible:ring-[#43a047]" />
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#43a047] text-white hover:bg-[#3a8c3e]" disabled={loading}>
        {loading ? "Submitting…" : "Request Agent Referral"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#16284a] hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

function PostSignupVerify({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const cooldownTimer = useRef<number | null>(null);

  // Stop the countdown if the user navigates away mid-cooldown.
  useEffect(() => {
    return () => {
      if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
    };
  }, []);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend email", description: error.message, variant: "destructive" });
      return;
    }
    setLastSentAt(new Date());
    setCooldown(60);
    if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
    cooldownTimer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    toast({ title: "Verification email sent", description: `We resent the confirmation link to ${email}.` });
  };

  return (
    <Card className="border-[#e8edf3] bg-white/90">
      <CardContent className="space-y-6 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f1e4] text-[#43a047]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Confirm your email to enter your workspace</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            Click it from this same browser so your session can complete automatically.
          </p>
        </div>

        <div className="rounded-xl border border-[#e8edf3] bg-white/70 p-4 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Didn't get the email?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Check your spam or promotions folder.</li>
            <li>Make sure <span className="font-medium text-foreground">{email}</span> is spelled correctly.</li>
            <li>Open the link in this browser — opening it elsewhere can break the secure handshake.</li>
            <li>Wait a minute, then resend below.</li>
          </ul>
          {lastSentAt && (
            <p className="mt-3 text-xs">Last sent at {lastSentAt.toLocaleTimeString()}.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="bg-[#43a047] text-white hover:bg-[#3a8c3e]"
          >
            {resending
              ? "Resending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend verification email"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/login")}
            className="border-[#e8edf3] text-[#16284a] hover:bg-[#eef3fb] hover:text-[#16284a]"
          >
            I've Confirmed My Email
          </Button>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={onBack}
          className="text-[#56657a] hover:text-[#16284a]"
        >
          Use a different email
        </Button>
      </CardContent>
    </Card>
  );
}


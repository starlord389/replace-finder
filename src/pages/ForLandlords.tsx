import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight, BadgeCheck, CheckCircle2, EyeOff, Handshake, Loader2,
  ShieldCheck, Timer, TrendingUp, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const HERO_PROOF_POINTS = [
  "No public listing, no sign in the yard",
  "Buyers on a 180-day legal deadline",
  "Free — we connect, your agent sells",
] as const;

const WHY_CARDS = [
  {
    icon: Timer,
    stat: "180 days",
    title: "Our buyers are legally on the clock.",
    body: "Every buyer in the network is completing a 1031 exchange — the IRS gives them 45 days to identify a property and 180 to close. They aren't browsing. They have to buy.",
  },
  {
    icon: EyeOff,
    stat: "Off-market",
    title: "Sell without telling the world.",
    body: "No listing photos circulating, no tire-kickers touring your building, no tenants or competitors wondering what's going on. Your property is shown only to buyers it actually fits.",
  },
  {
    icon: TrendingUp,
    stat: "Equity in hand",
    title: "These buyers bring real money.",
    body: "1031 buyers are re-investing proceeds from a property they already sold. The equity is sitting in escrow waiting to be deployed — not a maybe-loan, not a lowball.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us about your property",
    body: "Two minutes, six fields, no obligation. Location, property type, and a rough value is all we need to get started.",
  },
  {
    step: "02",
    title: "We pair you with a licensed agent",
    body: "We match you with a vetted agent from our network who knows your market and works with 1031 buyers every day. They'll reach out to talk through your goals.",
  },
  {
    step: "03",
    title: "Your property meets motivated buyers",
    body: "Your agent lists the property privately on the network, where it's automatically scored against every active buyer's requirements. You stay in control the whole way.",
  },
] as const;

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Why we work through agents",
    body: "Real estate law only lets licensed agents transact and collect referral fees — so our network is agents-only. Instead of signing you up, we connect you with a professional who can actually close.",
  },
  {
    icon: UserCheck,
    title: "Vetted, not random",
    body: "Every agent in the network is licensed and verified. The one we refer you to works your market and your property type — not whoever paid for the lead.",
  },
  {
    icon: Handshake,
    title: "You're never locked in",
    body: "Talking to the agent we connect you with is free and commitment-free. You decide if, when, and how your property goes in front of the network.",
  },
] as const;

const PROPERTY_TYPES = [
  "Multifamily",
  "Retail",
  "Office",
  "Industrial",
  "Mixed-use",
  "Land",
  "Other",
] as const;

type ReferralFormState = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyLocation: string;
  propertyType: string;
  estimatedValue: string;
};

const INITIAL_FORM_STATE: ReferralFormState = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  propertyLocation: "",
  propertyType: "",
  estimatedValue: "",
};

export default function ForLandlords() {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "For Property Owners — 1031 Exchange Up";
  }, []);

  function updateField(field: keyof ReferralFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function scrollToForm() {
    document.getElementById("referral-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ownerName = formState.ownerName.trim();
    const ownerEmail = formState.ownerEmail.trim();
    const ownerPhone = formState.ownerPhone.trim();
    const propertyLocation = formState.propertyLocation.trim();
    const propertyType = formState.propertyType.trim();

    if (ownerName.length < 2 || !ownerEmail) {
      toast({
        title: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (ownerName.length > 120 || ownerPhone.length > 40 || propertyLocation.length > 160) {
      toast({
        title: "One of your entries is too long.",
        variant: "destructive",
      });
      return;
    }

    // "$2,500,000" / "2.5m" / "2500000" all become a number; anything else is dropped
    let estimatedValue: number | null = null;
    const rawValue = formState.estimatedValue.trim().toLowerCase();
    if (rawValue) {
      const millions = /^[$\s]*([\d.]+)\s*m$/.exec(rawValue);
      const plain = Number(rawValue.replace(/[$,\s]/g, ""));
      if (millions) estimatedValue = Math.round(parseFloat(millions[1]) * 1_000_000);
      else if (Number.isFinite(plain) && plain > 0) estimatedValue = Math.round(plain);
    }

    setSubmitting(true);

    const { error } = await supabase.from("referrals").insert({
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone || null,
      property_location: propertyLocation || null,
      property_type: propertyType || null,
      estimated_value: estimatedValue,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't submit your details.",
        description: "Please check your entries and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    setFormState(INITIAL_FORM_STATE);
  }

  return (
    <div className="bg-[#f4f2ee]">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-[#ddd8cf] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d6a63]">
            For property owners &amp; landlords
          </p>
          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[#1d1d1d] sm:text-[3.4rem]">
            Sell your property without ever listing it.
          </h1>
          <p className="mx-auto mt-5 max-w-[36rem] text-base leading-7 text-[#5f5a53] sm:text-lg sm:leading-8">
            Our private network is full of 1031 exchange buyers who are legally
            required to buy a property like yours — soon. Tell us about your
            property and we'll connect you with a licensed agent who puts it in
            front of them, off-market.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={scrollToForm}
              className="h-12 rounded-full bg-[#1d1d1d] px-7 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Get connected with an agent
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2.5">
            {HERO_PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-medium text-[#4d4943]">
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#fadc6a]/80 text-[#1d1d1d]">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Why this beats listing ─────────────────────────── */}
      <section className="px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-3">
            {WHY_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-[26px] border border-[#e4ded4] bg-white p-6 shadow-[0_14px_34px_rgba(38,34,28,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f1e8] text-[#1d1d1d]">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#1d1d1d] px-3 py-1 text-xs font-bold tracking-[-0.01em] text-white">
                    {card.stat}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug tracking-[-0.035em] text-[#1d1d1d]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5a53]">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-[#ddd8cf] bg-white/88 p-7 shadow-[0_22px_54px_rgba(38,34,28,0.08)] sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
              How it works
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1d] sm:text-[2.5rem]">
              From a 2-minute form to motivated buyers.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <span className="text-[2.6rem] font-bold leading-none tracking-[-0.05em] text-[#e8e1d7]">
                  {item.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.035em] text-[#1d1d1d]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#5f5a53]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / why agents ─────────────────────────────── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl rounded-[34px] bg-[#1d1d1d] p-7 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b8b2a6]">
              The honest part
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[2.5rem]">
              You can't join the network. That's the point.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fadc6a] text-[#1d1d1d]">
                  <point.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.035em] text-white">
                  {point.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#b8b2a6]">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Referral form ──────────────────────────────────── */}
      <section id="referral-form" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-[#ddd8cf] bg-white/88 p-7 shadow-[0_22px_54px_rgba(38,34,28,0.08)] sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
                Get started
              </p>
              <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1d] sm:text-[2.4rem]">
                Tell us about your property.
              </h2>
              <p className="mt-4 max-w-[26rem] text-sm leading-7 text-[#5f5a53] sm:text-base">
                We'll review your details and connect you with a licensed agent
                in our network who knows your market — usually within one
                business day.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Free for property owners — no fees, ever",
                  "No obligation to list or sell",
                  "Your details stay private",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-6 text-[#4d4943]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1d1d1d] text-white">
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[26px] border border-[#d9ead4] bg-[#f3fbf0] px-6 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3a7340] text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.035em] text-[#27402b]">
                    You're in good hands.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#365339]">
                    Thanks — we've received your property details. An agent from
                    our network will reach out within one business day to talk
                    through your options.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ref-name" className="text-[#1d1d1d]">
                        Your Name <span className="text-[#7d766e]">*</span>
                      </Label>
                      <Input
                        id="ref-name"
                        value={formState.ownerName}
                        onChange={(e) => updateField("ownerName", e.target.value)}
                        placeholder="Jane Smith"
                        className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref-email" className="text-[#1d1d1d]">
                        Email <span className="text-[#7d766e]">*</span>
                      </Label>
                      <Input
                        id="ref-email"
                        type="email"
                        value={formState.ownerEmail}
                        onChange={(e) => updateField("ownerEmail", e.target.value)}
                        placeholder="jane@email.com"
                        className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ref-phone" className="text-[#1d1d1d]">
                        Phone Number
                      </Label>
                      <Input
                        id="ref-phone"
                        type="tel"
                        value={formState.ownerPhone}
                        onChange={(e) => updateField("ownerPhone", e.target.value)}
                        placeholder="(555) 000-0000"
                        className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref-location" className="text-[#1d1d1d]">
                        Property Location
                      </Label>
                      <Input
                        id="ref-location"
                        value={formState.propertyLocation}
                        onChange={(e) => updateField("propertyLocation", e.target.value)}
                        placeholder="City, State"
                        className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ref-type" className="text-[#1d1d1d]">
                        Property Type
                      </Label>
                      <select
                        id="ref-type"
                        value={formState.propertyType}
                        onChange={(e) => updateField("propertyType", e.target.value)}
                        className="flex h-11 w-full rounded-[14px] border border-[#d8d4cb] bg-white px-3 text-sm text-[#1d1d1d] outline-none transition focus:border-[#1d1d1d]"
                      >
                        <option value="">Select a type</option>
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref-value" className="text-[#1d1d1d]">
                        Estimated Value
                      </Label>
                      <Input
                        id="ref-value"
                        value={formState.estimatedValue}
                        onChange={(e) => updateField("estimatedValue", e.target.value)}
                        placeholder="e.g. $2,500,000"
                        className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-[#ddd8cf] pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <p className="max-w-[19rem] text-xs leading-5 text-[#7b756e]">
                      By submitting, you agree that a licensed agent from our
                      network may contact you about your property. No fees, no
                      obligation.
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 rounded-full bg-[#1d1d1d] px-7 text-sm font-medium text-white transition-colors hover:bg-black sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Connect me with an agent
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

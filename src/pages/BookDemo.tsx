import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const introPoints = [
  "Get a tailored walkthrough of how 1031 Exchange Up supports your exchange process from discovery to decision-making.",
  "See how replacement opportunities, deadlines, and advisor collaboration can stay organized in one place.",
] as const;

const highlightCards = [
  {
    emphasis: "3x faster",
    headline: "to shortlist replacement opportunities.",
    description:
      "Teams can move from initial discovery to a cleaner internal review process without scattered notes and spreadsheets.",
    company: "Northline Exchange",
    badge: "NE",
  },
  {
    emphasis: "98% faster",
    headline: "team alignment before identification deadlines.",
    description:
      "Keep investors, advisors, and internal stakeholders centered around one organized view of the exchange workflow.",
    company: "Summit 1031 Group",
    badge: "S1",
  },
] as const;

const benefitPoints = [
  "Review how investors and advisors can stay aligned without scattered email threads.",
  "Understand how your team can compare replacement opportunities more efficiently.",
  "Get answers on onboarding, implementation, and how the platform fits your workflow.",
] as const;

const timelineOptions = [
  "As soon as possible",
  "This week",
  "This month",
  "Just researching",
] as const;

type DemoFormState = {
  fullName: string;
  workEmail: string;
  company: string;
  role: string;
  phone: string;
  timeline: string;
  useCase: string;
};

const INITIAL_FORM_STATE: DemoFormState = {
  fullName: "",
  workEmail: "",
  company: "",
  role: "",
  phone: "",
  timeline: "",
  useCase: "",
};

function ExchangeLogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="100 60 312 392"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="126"
        y="86"
        width="52"
        height="340"
        rx="26"
        ry="26"
        fill="#1A1A1A"
        transform="rotate(20 256 256)"
      />
      <rect
        x="334"
        y="86"
        width="52"
        height="340"
        rx="26"
        ry="26"
        fill="#1A1A1A"
        transform="rotate(-20 256 256)"
      />
      <circle cx="382" cy="124" r="34" fill="#FADC6A" />
    </svg>
  );
}

function ProofCardBadge({
  badge,
  variant,
}: {
  badge: string;
  variant: "dark" | "accent";
}) {
  if (variant === "accent") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7cf67] text-[11px] font-semibold tracking-[-0.03em] text-[#1d1d1d] shadow-[0_6px_18px_rgba(38,34,28,0.08)]">
        {badge}
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1d1d1d] text-[11px] font-semibold tracking-[-0.03em] text-white shadow-[0_6px_18px_rgba(38,34,28,0.08)]">
      {badge}
    </span>
  );
}

export default function BookDemo() {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof DemoFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      fullName: formState.fullName.trim(),
      workEmail: formState.workEmail.trim(),
      company: formState.company.trim(),
      role: formState.role.trim(),
      phone: formState.phone.trim(),
      timeline: formState.timeline.trim(),
      useCase: formState.useCase.trim(),
    };

    if (!payload.fullName || !payload.workEmail || !payload.company || !payload.role || !payload.useCase) {
      toast({
        title: "Please fill in the required fields.",
        description: "Name, email, company, role, and your message are required.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.workEmail)) {
      toast({
        title: "Enter a valid work email.",
        variant: "destructive",
      });
      return;
    }

    if (payload.fullName.length > 120 || payload.company.length > 160 || payload.role.length > 120) {
      toast({
        title: "One of your entries is too long.",
        description: "Please shorten your name, company, or role and try again.",
        variant: "destructive",
      });
      return;
    }

    if (payload.phone.length > 40) {
      toast({
        title: "Phone number is too long.",
        variant: "destructive",
      });
      return;
    }

    if (payload.timeline.length > 80 || payload.useCase.length > 5000) {
      toast({
        title: "Your timeline or message is too long.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("demo_requests").insert({
      full_name: payload.fullName,
      work_email: payload.workEmail,
      company: payload.company,
      role: payload.role,
      phone: payload.phone || null,
      timeline: payload.timeline || null,
      use_case: payload.useCase,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't submit your request.",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    setFormState(INITIAL_FORM_STATE);
    toast({
      title: "Demo request submitted.",
      description: "Our sales team will follow up within one business day.",
    });
  }

  return (
    <section className="bg-[#f4f2ee] px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,0.84fr)] lg:items-start">
          <div className="rounded-[34px] border border-[#ddd8cf] bg-white/82 p-7 shadow-[0_18px_42px_rgba(38,34,28,0.06)] backdrop-blur-sm sm:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#e4dfd5] bg-white px-4 py-2 text-sm font-medium tracking-[-0.02em] text-[#1d1d1d] shadow-[0_8px_24px_rgba(38,34,28,0.05)]">
              <ExchangeLogoMark className="h-8 w-8 shrink-0" />
              <span>1031 Exchange Up</span>
            </div>

            <h1 className="mt-8 max-w-xl text-[2.45rem] font-semibold tracking-[-0.05em] text-[#1d1d1d] sm:text-[3rem]">
              Talk to our sales team.
            </h1>

            <div className="mt-6 space-y-4">
              {introPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-7 text-[#5f5a53] sm:text-[15px]">
                  <CheckCircle2 className="mt-1 h-[18px] w-[18px] shrink-0 text-[#1d1d1d]" />
                  <p>{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {highlightCards.map((card, index) => (
                <article
                  key={card.company}
                  className="relative flex min-h-[234px] flex-col justify-between overflow-hidden rounded-[24px] border border-[#e4ded4] bg-[#fbfaf7] p-5 shadow-[0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(219,214,205,0.5)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 right-0 h-28 w-28 opacity-70"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(221,216,207,0.65) 1px, transparent 1px), linear-gradient(90deg, rgba(221,216,207,0.65) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                      maskImage: "linear-gradient(135deg, transparent 18%, black 72%)",
                      WebkitMaskImage:
                        "linear-gradient(135deg, transparent 18%, black 72%)",
                    }}
                  />
                  <div>
                    <p className="max-w-[14rem] text-[1.12rem] font-medium leading-8 tracking-[-0.045em] text-[#1d1d1d] sm:text-[1.24rem]">
                      <span className="font-semibold text-[#111111]">{card.emphasis}</span>{" "}
                      <span className="font-normal text-[#3f3b36]">{card.headline}</span>
                    </p>
                    <p className="mt-4 max-w-[15rem] text-sm leading-6 text-[#66615b]">
                      {card.description}
                    </p>
                  </div>

                  <div className="relative z-[1] mt-6 flex items-center gap-3">
                    <ProofCardBadge
                      badge={card.badge}
                      variant={index === 0 ? "dark" : "accent"}
                    />
                    <p className="text-[1.02rem] font-semibold tracking-[-0.035em] text-[#1d1d1d]">
                      {card.company}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="mt-9 space-y-3">
              {benefitPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-6 text-[#4d4943]">
                  <span className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#4d79ff]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pt-4">
            <div className="mx-auto w-full max-w-[530px] lg:ml-auto">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
                Request a Demo
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1d]">
                Contact our sales team
              </h2>
              <p className="mt-3 max-w-[34rem] text-sm leading-6 text-[#5f5a53]">
                Share a few details and we&apos;ll tailor the conversation to your
                exchange process, team structure, and rollout goals.
              </p>

              {submitted && (
                <div className="mt-6 rounded-[20px] border border-[#d9ead4] bg-[#f3fbf0] px-4 py-4 text-sm leading-6 text-[#365339]">
                  Thanks for reaching out. Our sales team will follow up shortly to
                  schedule your demo.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="demo-work-email" className="text-[#1d1d1d]">
                    Company Email <span className="text-[#7d766e]">*</span>
                  </Label>
                  <Input
                    id="demo-work-email"
                    type="email"
                    value={formState.workEmail}
                    onChange={(event) => updateField("workEmail", event.target.value)}
                    placeholder="name@company.com"
                    className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-full-name" className="text-[#1d1d1d]">
                      Your Name <span className="text-[#7d766e]">*</span>
                    </Label>
                    <Input
                      id="demo-full-name"
                      value={formState.fullName}
                      onChange={(event) => updateField("fullName", event.target.value)}
                      placeholder="John Doe"
                      className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-phone" className="text-[#1d1d1d]">
                      Phone Number
                    </Label>
                    <Input
                      id="demo-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="(555) 000-0000"
                      className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-company" className="text-[#1d1d1d]">
                      Company <span className="text-[#7d766e]">*</span>
                    </Label>
                    <Input
                      id="demo-company"
                      value={formState.company}
                      onChange={(event) => updateField("company", event.target.value)}
                      placeholder="Your company"
                      className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-role" className="text-[#1d1d1d]">
                      Role <span className="text-[#7d766e]">*</span>
                    </Label>
                    <Input
                      id="demo-role"
                      value={formState.role}
                      onChange={(event) => updateField("role", event.target.value)}
                      placeholder="Investor, advisor, team lead..."
                      className="h-11 rounded-[14px] border-[#d8d4cb] bg-white text-[#1d1d1d] placeholder:text-[#918c84]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-timeline" className="text-[#1d1d1d]">
                    Timeline
                  </Label>
                  <select
                    id="demo-timeline"
                    value={formState.timeline}
                    onChange={(event) => updateField("timeline", event.target.value)}
                    className="flex h-11 w-full rounded-[14px] border border-[#d8d4cb] bg-white px-3 text-sm text-[#1d1d1d] outline-none transition focus:border-[#1d1d1d]"
                  >
                    <option value="">Select a timeline</option>
                    {timelineOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-use-case" className="text-[#1d1d1d]">
                    How can we help? <span className="text-[#7d766e]">*</span>
                  </Label>
                  <Textarea
                    id="demo-use-case"
                    value={formState.useCase}
                    onChange={(event) => updateField("useCase", event.target.value)}
                    placeholder="Tell us a bit about your process, team, or what you want to cover in the demo."
                    className="min-h-[144px] rounded-[18px] border-[#d8d4cb] bg-white px-4 py-3 text-sm leading-6 text-[#1d1d1d] placeholder:text-[#918c84]"
                  />
                </div>

                <div className="flex flex-col gap-4 border-t border-[#ddd8cf] pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-[19rem] space-y-2 text-xs leading-5 text-[#7b756e]">
                    <p>
                      By submitting, you agree that our team may contact you
                      about your demo request and the 1031 Exchange Up platform.
                    </p>
                    <p className="flex items-start gap-2 text-[#6f695f]">
                      <LifeBuoy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d1d1d]" />
                      <span>
                        Need help instead?{" "}
                        <Link to={ROUTES.contact} className="underline underline-offset-4">
                          Contact support
                        </Link>{" "}
                        or{" "}
                        <a
                          href="mailto:support@1031exchangeup.com"
                          className="underline underline-offset-4"
                        >
                          email us
                        </a>
                        .
                      </span>
                    </p>
                  </div>

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
                        Book My Demo
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

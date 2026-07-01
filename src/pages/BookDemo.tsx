import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LifeBuoy, Loader2 } from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const introPoints = [
  "See how agents can manage active 1031 clients, replacement criteria, and deal activity without juggling spreadsheets or inbox threads.",
  "Walk through how replacement-property matches, match scoring, and client requirements stay organized in one shared workspace.",
] as const;

const highlightCards = [
  {
    emphasis: "1031 agent",
    headline: "“It helps me find replacement properties that actually match what my client is looking for.”",
    description:
      "Sarah uses 1031 Exchange Up to search private replacement opportunities and focus on the ones that fit her client's exchange goals.",
    quote:
      "Instead of sending random options, I can bring my client a tighter list of properties that make sense for their situation.",
    company: "Sarah M., Commercial Agent",
  },
  {
    emphasis: "1031 agent",
    headline: "“It helped me narrow a long list of options down to the properties that actually fit.”",
    description:
      "Daniel uses the workspace to compare replacement opportunities against each client's target markets, budget, and asset preferences.",
    quote:
      "Instead of guessing which properties to send first, I can quickly see which options make the most sense for the client.",
    company: "Daniel R., Real Estate Agent",
  },
] as const;

const benefitPoints = [
  "Create an exchange profile around the client's relinquished property, target markets, budget, debt needs, and timeline.",
  "Compare off-market replacement properties side by side with fit scores and financial context.",
  "Open private connections, coordinate offers, and keep activity tied to the right client exchange.",
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

export default function BookDemo() {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof DemoFormState, value: string) {
    // Editing after a successful submit means a new request — clear the banner.
    setSubmitted(false);
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
    <section className="bg-[#f4f7fb] px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,0.84fr)] lg:items-start">
          <div className="relative overflow-hidden rounded-[34px] border border-[#e8edf3] bg-white/88 p-7 shadow-[0_22px_54px_rgba(14,42,77,0.08)] backdrop-blur-sm sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[-7rem] top-[-8rem] h-64 w-64 rounded-full bg-[#eef3fb]/55 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[-9rem] left-[-8rem] h-72 w-72 rounded-full bg-[#eef3fb]/70 blur-3xl"
            />
            <div className="relative">
            <h1 className="max-w-xl text-[2.45rem] font-semibold tracking-[-0.05em] text-[#16284a] sm:text-[3rem]">
              Talk to our sales team.
            </h1>

            <div className="mt-6 space-y-3 rounded-[26px] border border-[#e8edf3] bg-[#eef3fb]/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] sm:p-5">
              {introPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-7 text-[#56657a] sm:text-[15px]">
                  <span className="mt-1 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#e3f1e4] text-[#2f7a33]">
                    <CheckCircle2 className="h-[13px] w-[13px]" />
                  </span>
                  <p>{point}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {highlightCards.map((card, index) => (
                <article
                  key={card.company}
                  className="group relative flex min-h-[258px] flex-col justify-between overflow-hidden rounded-[26px] border border-[#e8edf3] bg-white p-5 shadow-[0_14px_34px_rgba(14,42,77,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[-34px] top-[-34px] h-28 w-28 rounded-full opacity-80"
                    style={{
                      background:
                        index === 0
                          ? "radial-gradient(circle, rgba(238,243,251,0.8), transparent 70%)"
                          : "radial-gradient(circle, rgba(238,243,251,0.8), transparent 70%)",
                    }}
                  />
                  <div>
                    <div className="inline-flex rounded-full bg-[#eef3fb] px-3 py-1.5 text-[13px] font-semibold tracking-[-0.03em] text-[#16284a]">
                      {card.emphasis}
                    </div>
                    <p className="mt-4 max-w-[14rem] text-[1.1rem] font-medium leading-7 tracking-[-0.045em] text-[#16284a] sm:text-[1.2rem]">
                      {card.headline}
                    </p>
                    <p className="mt-4 max-w-[15rem] text-sm leading-6 text-[#56657a]">
                      “{card.quote}”
                    </p>
                  </div>

                  <div className="relative z-[1] mt-6 border-t border-[#e8edf3] pt-4">
                    <p className="text-[1.02rem] font-semibold tracking-[-0.035em] text-[#16284a]">
                      {card.company}
                    </p>
                    <p className="mt-1.5 text-xs font-medium leading-5 text-[#8794a6]">
                      {card.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="mt-9 space-y-3 rounded-[26px] border border-[#e8edf3] bg-[#eef3fb]/88 p-5">
              {benefitPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-6 text-[#56657a]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#43a047] text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            </div>
          </div>

          <div className="lg:pt-4">
            <div className="mx-auto w-full max-w-[530px] lg:ml-auto">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8794a6]">
                Request a Demo
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#16284a]">
                Contact our sales team
              </h2>
              <p className="mt-3 max-w-[34rem] text-sm leading-6 text-[#56657a]">
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
                  <Label htmlFor="demo-work-email" className="text-[#16284a]">
                    Company Email <span className="text-[#8794a6]">*</span>
                  </Label>
                  <Input
                    id="demo-work-email"
                    type="email"
                    value={formState.workEmail}
                    onChange={(event) => updateField("workEmail", event.target.value)}
                    placeholder="name@company.com"
                    className="h-11 rounded-[14px] border-[#e8edf3] bg-white text-[#16284a] placeholder:text-[#9fb0c8]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-full-name" className="text-[#16284a]">
                      Your Name <span className="text-[#8794a6]">*</span>
                    </Label>
                    <Input
                      id="demo-full-name"
                      value={formState.fullName}
                      onChange={(event) => updateField("fullName", event.target.value)}
                      placeholder="John Doe"
                      className="h-11 rounded-[14px] border-[#e8edf3] bg-white text-[#16284a] placeholder:text-[#9fb0c8]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-phone" className="text-[#16284a]">
                      Phone Number
                    </Label>
                    <Input
                      id="demo-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="(555) 000-0000"
                      className="h-11 rounded-[14px] border-[#e8edf3] bg-white text-[#16284a] placeholder:text-[#9fb0c8]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demo-company" className="text-[#16284a]">
                      Company <span className="text-[#8794a6]">*</span>
                    </Label>
                    <Input
                      id="demo-company"
                      value={formState.company}
                      onChange={(event) => updateField("company", event.target.value)}
                      placeholder="Your company"
                      className="h-11 rounded-[14px] border-[#e8edf3] bg-white text-[#16284a] placeholder:text-[#9fb0c8]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-role" className="text-[#16284a]">
                      Role <span className="text-[#8794a6]">*</span>
                    </Label>
                    <Input
                      id="demo-role"
                      value={formState.role}
                      onChange={(event) => updateField("role", event.target.value)}
                      placeholder="Investor, advisor, team lead..."
                      className="h-11 rounded-[14px] border-[#e8edf3] bg-white text-[#16284a] placeholder:text-[#9fb0c8]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-timeline" className="text-[#16284a]">
                    Timeline
                  </Label>
                  <select
                    id="demo-timeline"
                    value={formState.timeline}
                    onChange={(event) => updateField("timeline", event.target.value)}
                    className="flex h-11 w-full rounded-[14px] border border-[#e8edf3] bg-white px-3 text-sm text-[#16284a] outline-none transition focus:border-[#43a047]"
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
                  <Label htmlFor="demo-use-case" className="text-[#16284a]">
                    How can we help? <span className="text-[#8794a6]">*</span>
                  </Label>
                  <Textarea
                    id="demo-use-case"
                    value={formState.useCase}
                    onChange={(event) => updateField("useCase", event.target.value)}
                    placeholder="Tell us a bit about your process, team, or what you want to cover in the demo."
                    className="min-h-[144px] rounded-[18px] border-[#e8edf3] bg-white px-4 py-3 text-sm leading-6 text-[#16284a] placeholder:text-[#9fb0c8]"
                  />
                </div>

                <div className="flex flex-col gap-4 border-t border-[#e8edf3] pt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-[19rem] space-y-2 text-xs leading-5 text-[#8794a6]">
                    <p>
                      By submitting, you agree that our team may contact you
                      about your demo request and the 1031 Exchange Up platform.
                    </p>
                    <p className="flex items-start gap-2 text-[#8794a6]">
                      <LifeBuoy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16284a]" />
                      <span>
                        Need help instead?{" "}
                        <a
                          href="mailto:support@1031exchangeup.com"
                          className="underline underline-offset-4"
                        >
                          Email support
                        </a>
                        .
                      </span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 rounded-full bg-[#43a047] px-7 text-sm font-medium text-white transition-colors hover:bg-[#3a8c3e] sm:w-auto"
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

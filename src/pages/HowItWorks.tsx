import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  Building2, Target, Zap, Handshake, ArrowRight,
  BarChart3, Shield, DollarSign
} from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("animate-fade-in-up");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    children.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);
  return ref;
}

const steps = [
  {
    icon: Building2,
    step: "01",
    title: "Pledge Your Client's Property",
    color: "bg-blue-50 text-blue-600",
    paragraphs: [
      "When your client is ready to do a 1031 exchange, you add their relinquished property to the network. You'll enter the full property details — location, asset type, physical characteristics, financials, and debt position.",
      "This property immediately becomes visible to every other agent in the network as a potential replacement property for their clients. The more properties pledged, the better the matching for everyone.",
    ],
  },
  {
    icon: Target,
    step: "02",
    title: "Define Replacement Criteria",
    color: "bg-indigo-50 text-indigo-600",
    paragraphs: [
      "Next, you define exactly what your client is looking for in a replacement property. Target asset types, geographic preferences, price range, cap rate requirements, and debt replacement needs.",
      "The system uses these criteria to score every property in the network. You can be as broad or as specific as you want — the scoring algorithm handles the ranking.",
    ],
  },
  {
    icon: Zap,
    step: "03",
    title: "Automatic 8-Dimension Matching",
    color: "bg-violet-50 text-violet-600",
    paragraphs: [
      "The moment you activate an exchange, the matching engine runs automatically. It scores every active property in the network against your criteria across 8 dimensions: price fit, geography, asset type, investment strategy, financials, timing, debt fit, and scale.",
      "Every match also gets an automatic boot calculation — showing estimated cash boot, mortgage boot, total exposure, and tax impact. You see the full financial picture before making any decisions.",
    ],
  },
  {
    icon: Handshake,
    step: "04",
    title: "Connect and Close the Exchange",
    color: "bg-emerald-50 text-emerald-600",
    paragraphs: [
      "When you find a match you want to pursue, click 'Start Exchange.' The listing agent's identity is hidden until both sides agree to connect — no cold calls, no unsolicited pitches.",
      "Once connected, the platform becomes your exchange workspace. Both agents' contact info is revealed, in-platform messaging opens, and you track the deal through milestones: under contract, inspection, financing, and closing.",
    ],
  },
];

const faqs = [
  {
    q: "What is a 1031 exchange?",
    a: "A 1031 exchange (named after Section 1031 of the Internal Revenue Code) allows real estate investors to defer capital gains taxes by selling an investment property and reinvesting the proceeds into a like-kind replacement property within specific time frames.",
  },
  {
    q: "Who can use this platform?",
    a: "1031ExchangeUp is built for licensed real estate agents. Agents manage exchanges on behalf of their clients. Clients can be invited to view their exchange status and matches in a read-only view.",
  },
  {
    q: "How does matching work?",
    a: "The system automatically scores every active property against your client's replacement criteria across 8 dimensions: price, geography, asset type, strategy, financials, timing, debt fit, and scale. Matches scoring 65 or above appear in your dashboard with full financial analysis.",
  },
  {
    q: "What does it cost?",
    a: "Free to join. Free to match. The platform charges a facilitation fee only when an exchange is completed. No subscriptions, no upfront costs, no listing fees.",
  },
  {
    q: "How is agent identity protected?",
    a: "When you view a match, you see the full property details and financial analysis — but the listing agent's name, brokerage, and contact info are hidden. Both agents must agree to connect before identities are revealed.",
  },
];

export default function HowItWorks() {
  const root = useReveal();

  return (
    <div ref={root} className="overflow-hidden">
      {/* Header */}
      <section className="px-4 pb-16 pt-28 sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          <p data-reveal className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
            How It Works
          </p>
          <h1 data-reveal className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 delay-100 sm:text-5xl">
            From pledge to close, fully automated
          </h1>
          <p data-reveal className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 delay-200">
            The platform handles matching, scoring, boot calculations, and
            exchange coordination. You focus on your clients.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-20">
          {steps.map((step, i) => (
            <div key={step.step} data-reveal className={`delay-${(i % 2 + 1) * 100}`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-300">STEP {step.step}</span>
                  <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
                </div>
              </div>
              <div className="mt-5 space-y-4 pl-16">
                {step.paragraphs.map((p, j) => (
                  <p key={j} className="text-[15px] leading-relaxed text-gray-500">{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring dimensions */}
      <section className="bg-gray-50/60 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div data-reveal className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
              Matching Engine
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              8 dimensions of matching
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Every property is scored across eight weighted dimensions to find
              the strongest matches for your client.
            </p>
          </div>
          <div data-reveal className="mt-14 grid gap-3 delay-200 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Price Fit", weight: "20%", icon: DollarSign },
              { label: "Geography", weight: "15%", icon: Target },
              { label: "Asset Type", weight: "15%", icon: Building2 },
              { label: "Strategy", weight: "10%", icon: BarChart3 },
              { label: "Financials", weight: "10%", icon: BarChart3 },
              { label: "Timing", weight: "10%", icon: Zap },
              { label: "Debt Fit", weight: "10%", icon: Shield },
              { label: "Scale Fit", weight: "10%", icon: Building2 },
            ].map((d) => (
              <div
                key={d.label}
                className="rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">{d.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div data-reveal className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
          </div>
          <div data-reveal className="mt-14 divide-y divide-gray-100 delay-200">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between text-[15px] font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 text-gray-300 transition-transform group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-4xl">
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center sm:px-16 sm:py-20"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="relative mt-4 text-gray-400">
              Join the network and start matching your clients with replacement
              properties today.
            </p>
            <Link
              to="/signup"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100"
            >
              Join the Network
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

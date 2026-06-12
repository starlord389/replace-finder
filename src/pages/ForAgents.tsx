import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Clock3, EyeOff, Gauge, Handshake,
  MessageSquare, Network, ShieldCheck, Timer, UserX,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";
import { Button } from "@/components/ui/button";

const LOGO_BRANDS = [
  { name: "Compass", src: "/logos/compass.svg", height: 22 },
  { name: "Churchill Properties", src: "/logos/churchill.svg", height: 44 },
  { name: "Keller Williams Realty", src: "/logos/keller-williams.svg", height: 40 },
  { name: "eXp Realty", src: "/logos/exp-realty.svg", height: 34 },
] as const;

const HERO_PROOF_POINTS = [
  "Off-market inventory only",
  "Scored for your client's exchange",
  "Free for founding agents",
] as const;

const PAIN_CARDS = [
  {
    icon: Clock3,
    stat: "45 days",
    title: "The identification window is unforgiving.",
    body: "From the day your client's sale closes, the IRS gives them 45 days to identify replacements. Public listings move too slowly — and everyone else can see them too.",
  },
  {
    icon: UserX,
    stat: "1 dead upleg",
    title: "A failed replacement kills the whole exchange.",
    body: "When the upleg falls through, your client eats the tax bill and you lose the second side of the deal. The cost of weak inventory is brutal on both of you.",
  },
  {
    icon: Network,
    stat: "Your phone book",
    title: "Today, your network is whoever you happen to know.",
    body: "Blast emails, old contacts, listing sites everyone's already scraped. Great exchanges die for one reason: the right counterparty never heard about the deal.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pledge your client's property",
    body: "Add your 1031 client, their relinquished property, and their replacement criteria. The listing stays off-market and anonymous — only surfaced to exchanges it actually fits.",
  },
  {
    step: "02",
    title: "The match engine works the network",
    body: "Every active property in the network is scored against your client's exchange across eight factors — price, geography, asset type, strategy, debt, timing, scale, and returns.",
  },
  {
    step: "03",
    title: "Talk directly. Close the deal.",
    body: "Client's interested? One click opens a private line to the listing agent. No intro requests, no middlemen — work the deal from conversation to close in one workspace.",
  },
] as const;

const FEATURES = [
  {
    icon: EyeOff,
    title: "Off-market network",
    body: "Inventory your client's competition will never see on a listing site — pledged by verified agents before the seller ever goes public.",
  },
  {
    icon: Gauge,
    title: "8-factor match scores",
    body: "Every match comes with a full scoring breakdown you can show your client — not a black box, a defensible recommendation.",
  },
  {
    icon: MessageSquare,
    title: "Direct agent messaging",
    body: "Private, in-app conversations with the agent on the other side. The moment your client says yes, you're talking.",
  },
  {
    icon: Timer,
    title: "Deadline & pipeline tracking",
    body: "45-day and 180-day clocks, client pipeline, and deal stages in one place — purpose-built for 1031 work, not a generic CRM.",
  },
] as const;

const AGENTS_ONLY_POINTS = [
  {
    icon: ShieldCheck,
    title: "Licensed agents only — by design",
    body: "Only licensed agents can collect a referral fee, so only licensed agents get accounts. Every counterparty you meet here can actually transact.",
  },
  {
    icon: Handshake,
    title: "You stay agent of record",
    body: "We're the network, not the middleman. Your client, your listing, your commission — on both sides of the exchange when you bring them.",
  },
  {
    icon: Network,
    title: "Owner referrals flow to you",
    body: "When property owners find us directly, we refer them to agents in the network. Membership compounds: more agents, more inventory, more warm leads.",
  },
] as const;

export default function ForAgents() {
  useEffect(() => {
    document.title = "For Agents — 1031 Exchange Up";
  }, []);

  return (
    <div className="bg-[#f4f2ee]">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div>
            <p className="inline-flex rounded-full border border-[#ddd8cf] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6d6a63]">
              For licensed agents &amp; brokers
            </p>
            <h1 className="mt-5 max-w-xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.05em] text-[#1d1d1d] sm:text-[3.4rem]">
              Where 1031 agents find each other.
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-7 text-[#5f5a53] sm:text-lg sm:leading-8">
              List your client's property off-market, get replacement matches
              scored for their exact exchange, and talk directly to the agent
              on the other side — while the 45-day clock is still your friend.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="h-12 rounded-full bg-[#1d1d1d] px-7 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                <Link to={ROUTES.signup}>
                  Join free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-[#d8d4cb] bg-white/80 px-7 text-sm font-semibold text-[#1d1d1d] hover:bg-white"
              >
                <Link to={ROUTES.bookDemo}>Book a demo</Link>
              </Button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
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

          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#fadc6a]/30 blur-3xl"
            />
            <div className="relative overflow-hidden rounded-[28px] border border-[#ddd8cf] bg-white p-2 shadow-[0_30px_70px_rgba(38,34,28,0.14)]">
              <img
                src="/agent-dashboard-preview.png"
                alt="The 1031 Exchange Up agent workspace showing scored property matches"
                className="w-full rounded-[22px]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo strip ─────────────────────────────────────── */}
      <section className="border-y border-[#e7e2d8] bg-white/60 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#8a847b]">
            Trusted by agents from
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-5 opacity-80">
            {LOGO_BRANDS.map((brand) => (
              <img
                key={brand.name}
                src={brand.src}
                alt={brand.name}
                style={{ height: brand.height }}
                className="w-auto"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
              The problem
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1d] sm:text-[2.5rem]">
              Listed inventory is where exchanges go to die.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PAIN_CARDS.map((card) => (
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
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-[#ddd8cf] bg-white/88 p-7 shadow-[0_22px_54px_rgba(38,34,28,0.08)] sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
              How it works
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1d] sm:text-[2.5rem]">
              From pledge to close, in one workspace.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative">
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

      {/* ── Features ───────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
              The toolkit
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1d] sm:text-[2.5rem]">
              Everything a 1031 agent actually needs.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-5 rounded-[26px] border border-[#e4ded4] bg-white p-6 shadow-[0_14px_34px_rgba(38,34,28,0.06)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fadc6a]/70 text-[#1d1d1d]">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.03em] text-[#1d1d1d]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f5a53]">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agents only ────────────────────────────────────── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-6xl rounded-[34px] bg-[#1d1d1d] p-7 sm:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#b8b2a6]">
              Why agents only
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[2.5rem]">
              A network where every member can transact.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {AGENTS_ONLY_POINTS.map((point) => (
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

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.05em] text-[#1d1d1d] sm:text-[2.8rem]">
            Founding agents join free.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5f5a53]">
            Be in the network before your market's other agents are. Set up
            your first client and see scored matches the same day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-12 rounded-full bg-[#1d1d1d] px-8 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              <Link to={ROUTES.signup}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-12 rounded-full px-6 text-sm font-semibold text-[#4d4943] hover:bg-white/70 hover:text-[#1d1d1d]"
            >
              <Link to={ROUTES.bookDemo}>Talk to us first</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

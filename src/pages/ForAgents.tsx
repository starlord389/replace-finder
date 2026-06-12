import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { Link } from "react-router-dom";
import {
  CheckCircle2, Clock3, EyeOff, Gauge, Handshake,
  MessageSquare, Network, ShieldCheck, Timer, UserX,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";

const LOGO_BRANDS = [
  { name: "Compass", src: "/logos/compass.svg", height: 26, mobileHeight: 20 },
  { name: "Churchill Properties", src: "/logos/churchill.svg", height: 56, mobileHeight: 44 },
  { name: "Keller Williams Realty", src: "/logos/keller-williams.svg", height: 52, mobileHeight: 40 },
  { name: "eXp Realty", src: "/logos/exp-realty.svg", height: 44, mobileHeight: 34 },
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

/* Matches the homepage template's type + motion system (Grovia):
   h1 weight 400 / -0.065em / lh 0.96, pill CTAs at 46px with layered
   shadows, 52s logo marquee with masked edges, soft reveal-on-scroll. */
const PAGE_STYLE = `
  [data-agents-page] .fa-eyebrow {
    display: inline-flex;
    width: fit-content;
    padding: 6px 13px;
    border: 1px solid rgba(29, 29, 29, 0.12);
    border-radius: 999px;
    background: rgba(29, 29, 29, 0.04);
    font-size: 11px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #1d1d1d;
  }

  [data-agents-page] h1 {
    margin: 0;
    font-size: clamp(38px, 5.2vw, 64px);
    font-weight: 400;
    line-height: 0.98;
    letter-spacing: -0.065em;
    color: #161616;
  }

  [data-agents-page] .fa-section-title {
    margin: 0;
    font-size: clamp(28px, 3.4vw, 42px);
    font-weight: 400;
    line-height: 1.04;
    letter-spacing: -0.055em;
    color: #161616;
  }

  [data-agents-page] .fa-subheadline {
    font-size: clamp(14px, 2.4vw, 17px);
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: -0.025em;
    color: rgba(86, 82, 75, 0.9);
  }

  [data-agents-page] .fa-pill {
    display: inline-flex;
    min-height: 46px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: -0.025em;
    text-decoration: none;
    color: #1d1d1d;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: inset 0 0 0 1px rgba(218, 211, 201, 0.95), 0 10px 22px rgba(80, 71, 58, 0.08);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  [data-agents-page] .fa-pill:hover {
    transform: translateY(-1px);
    box-shadow: inset 0 0 0 1px rgba(218, 211, 201, 0.95), 0 14px 28px rgba(80, 71, 58, 0.12);
  }

  [data-agents-page] .fa-pill[data-primary="true"] {
    color: #ffffff;
    background: #1d1d1d;
    padding: 0 6px 0 20px;
    box-shadow: 0 12px 24px rgba(29, 29, 29, 0.18);
  }

  [data-agents-page] .fa-pill[data-primary="true"]:hover {
    background: #000000;
    box-shadow: 0 16px 30px rgba(29, 29, 29, 0.24);
  }

  [data-agents-page] .fa-pill [data-pill-arrow] {
    display: inline-flex;
    height: 34px;
    width: 34px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #ffffff;
    color: #1d1d1d;
  }

  /* ── Hero render composition (mirrors homepage layered cards) ── */
  [data-agents-page] [data-hero-visual] {
    position: relative;
  }

  [data-agents-page] [data-hero-visual] [data-hero-card="main"] {
    display: block;
    width: 92%;
    border-radius: 18px;
    box-shadow: 0 34px 70px rgba(38, 34, 28, 0.18), 0 6px 18px rgba(38, 34, 28, 0.08);
  }

  [data-agents-page] [data-hero-visual] [data-hero-card="kpi"] {
    position: absolute;
    right: -2%;
    bottom: -9%;
    width: 56%;
    border-radius: 14px;
    box-shadow: 0 28px 56px rgba(38, 34, 28, 0.22), 0 4px 14px rgba(38, 34, 28, 0.1);
    transform: rotate(3.5deg);
  }

  /* ── Logo marquee (same recipe as homepage slider) ── */
  @keyframes faLogoMarquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  [data-agents-page] [data-logo-viewport] {
    overflow: hidden;
    width: min(1000px, calc(100vw - 80px));
    margin: 0 auto;
    mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  }

  [data-agents-page] [data-logo-track] {
    display: flex;
    align-items: center;
    width: max-content;
    animation: faLogoMarquee 52s linear infinite;
  }

  [data-agents-page] [data-logo-group] {
    display: flex;
    align-items: center;
    gap: 80px;
    padding-right: 80px;
  }

  [data-agents-page] [data-logo-item] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 68px;
    flex: none;
  }

  [data-agents-page] [data-logo-item] img {
    height: var(--brand-h, 32px);
    width: auto;
    max-height: 100%;
    display: block;
    filter: grayscale(1) contrast(0.92) brightness(1.05);
    opacity: 0.62;
    pointer-events: none;
  }

  @media (max-width: 809.98px) {
    [data-agents-page] [data-logo-viewport] {
      width: calc(100vw - 40px);
    }

    [data-agents-page] [data-logo-group] {
      gap: 52px;
      padding-right: 52px;
    }

    [data-agents-page] [data-logo-item] {
      height: 54px;
    }

    [data-agents-page] [data-logo-item] img {
      height: var(--brand-h-mobile, 24px);
    }
  }

  /* ── Cards ── */
  [data-agents-page] .fa-card {
    border-radius: 26px;
    border: 1px solid #e4ded4;
    background: #ffffff;
    box-shadow: 0 14px 34px rgba(38, 34, 28, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  [data-agents-page] .fa-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 46px rgba(38, 34, 28, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  /* ── Reveal on scroll ── */
  [data-agents-page] [data-reveal] {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    transition-delay: var(--reveal-delay, 0s);
  }

  [data-agents-page] [data-reveal].is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    [data-agents-page] [data-reveal] {
      opacity: 1;
      transform: none;
      transition: none;
    }

    [data-agents-page] [data-logo-track] {
      animation: none;
    }

    [data-agents-page] .fa-card,
    [data-agents-page] .fa-pill {
      transition: none;
    }
  }
`;

function PillLink({
  to,
  primary,
  children,
}: {
  to: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="fa-pill" data-primary={primary ? "true" : undefined}>
      {children}
      {primary && (
        <span data-pill-arrow>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      )}
    </Link>
  );
}

export default function ForAgents() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "For Agents — 1031 Exchange Up";
  }, []);

  // Smooth scrolling to match the homepage template feel
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  // Reveal-on-scroll
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} data-agents-page className="bg-[#f4f2ee]">
      <style>{PAGE_STYLE}</style>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
          <div>
            <p className="fa-eyebrow" data-reveal>
              For licensed agents &amp; brokers
            </p>
            <h1 className="mt-5 max-w-xl" data-reveal style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}>
              Where 1031 agents find each other.
            </h1>
            <p className="fa-subheadline mt-5 max-w-[33rem]" data-reveal style={{ "--reveal-delay": "0.12s" } as React.CSSProperties}>
              List your client's property off-market, get replacement matches
              scored for their exact exchange, and talk directly to the agent
              on the other side — while the 45-day clock is still your friend.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5" data-reveal style={{ "--reveal-delay": "0.18s" } as React.CSSProperties}>
              <PillLink to={ROUTES.signup} primary>
                Join free
              </PillLink>
              <PillLink to={ROUTES.bookDemo}>Book a Demo</PillLink>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5" data-reveal style={{ "--reveal-delay": "0.24s" } as React.CSSProperties}>
              {HERO_PROOF_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-[13.5px] font-semibold tracking-[-0.02em] text-[#4d4943]">
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#fadc6a]/80 text-[#1d1d1d]">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div data-hero-visual data-reveal style={{ "--reveal-delay": "0.15s" } as React.CSSProperties}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#fadc6a]/25 blur-3xl"
            />
            <img
              data-hero-card="main"
              src="/agent-dashboard-preview.png"
              alt="The 1031 Exchange Up agent workspace"
              loading="eager"
            />
            <img
              data-hero-card="kpi"
              src="/landing-hero-kpi-render.png"
              alt="Match score breakdown for a replacement property"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ── Logo marquee ───────────────────────────────────── */}
      <section className="px-4 pb-14 pt-10 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a847b]" data-reveal>
          Trusted by agents from
        </p>
        <div className="mt-4" data-logo-viewport data-reveal>
          <div data-logo-track>
            {[0, 1].map((group) => (
              <div key={group} data-logo-group aria-hidden={group === 1 ? "true" : undefined}>
                {LOGO_BRANDS.map((brand) => (
                  <span
                    key={`${group}-${brand.name}`}
                    data-logo-item
                    style={{ "--brand-h": `${brand.height}px`, "--brand-h-mobile": `${brand.mobileHeight}px` } as React.CSSProperties}
                  >
                    <img src={brand.src} alt={group === 0 ? brand.name : ""} loading="lazy" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain ───────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="fa-eyebrow" data-reveal>The problem</p>
            <h2 className="fa-section-title mt-4" data-reveal style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}>
              Listed inventory is where exchanges go to die.
            </h2>
          </div>

          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {PAIN_CARDS.map((card, i) => (
              <article
                key={card.title}
                className="fa-card p-6"
                data-reveal
                style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f1e8] text-[#1d1d1d]">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#1d1d1d] px-3 py-1 text-xs font-bold tracking-[-0.01em] text-white">
                    {card.stat}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug tracking-[-0.04em] text-[#1d1d1d]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5f5a53]">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-16">
        <div
          className="mx-auto max-w-6xl rounded-[34px] border border-[#ddd8cf] bg-white/88 p-7 shadow-[0_22px_54px_rgba(38,34,28,0.08)] backdrop-blur-sm sm:p-12"
          data-reveal
        >
          <div className="max-w-2xl">
            <p className="fa-eyebrow">How it works</p>
            <h2 className="fa-section-title mt-4">
              From pledge to close, in one workspace.
            </h2>
          </div>

          <div className="mt-11 grid gap-9 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} data-reveal style={{ "--reveal-delay": `${0.08 + i * 0.08}s` } as React.CSSProperties}>
                <span className="block text-[2.8rem] font-semibold leading-none tracking-[-0.05em] text-[#e8e1d7]">
                  {item.step}
                </span>
                <h3 className="mt-3.5 text-lg font-semibold tracking-[-0.04em] text-[#1d1d1d]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#5f5a53]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="fa-eyebrow" data-reveal>The toolkit</p>
            <h2 className="fa-section-title mt-4" data-reveal style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}>
              Everything a 1031 agent actually needs.
            </h2>
          </div>

          <div className="mt-11 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <article
                key={feature.title}
                className="fa-card flex gap-5 p-6"
                data-reveal
                style={{ "--reveal-delay": `${(i % 2) * 0.08}s` } as React.CSSProperties}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fadc6a]/70 text-[#1d1d1d]">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.035em] text-[#1d1d1d]">
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
      <section className="px-4 pb-14 sm:px-6 sm:pb-16">
        <div
          className="mx-auto max-w-6xl rounded-[34px] bg-[#1d1d1d] p-7 sm:p-12"
          data-reveal
        >
          <div className="max-w-2xl">
            <p className="fa-eyebrow !border-white/15 !bg-white/5 !text-[#b8b2a6]">
              Why agents only
            </p>
            <h2 className="fa-section-title mt-4 !text-white">
              A network where every member can transact.
            </h2>
          </div>

          <div className="mt-11 grid gap-9 md:grid-cols-3">
            {AGENTS_ONLY_POINTS.map((point, i) => (
              <div key={point.title} data-reveal style={{ "--reveal-delay": `${0.08 + i * 0.08}s` } as React.CSSProperties}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fadc6a] text-[#1d1d1d]">
                  <point.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
                  {point.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[#b8b2a6]">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-4 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="fa-section-title !text-[2.2rem] sm:!text-[2.9rem]" data-reveal>
            Founding agents join free.
          </h2>
          <p className="fa-subheadline mx-auto mt-4 max-w-xl" data-reveal style={{ "--reveal-delay": "0.06s" } as React.CSSProperties}>
            Be in the network before your market's other agents are. Set up
            your first client and see scored matches the same day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5" data-reveal style={{ "--reveal-delay": "0.12s" } as React.CSSProperties}>
            <PillLink to={ROUTES.signup} primary>
              Get Started
            </PillLink>
            <PillLink to={ROUTES.bookDemo}>Talk to us first</PillLink>
          </div>
        </div>
      </section>
    </div>
  );
}

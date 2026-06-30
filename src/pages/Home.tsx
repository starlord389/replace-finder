import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Users, Clock, Cpu, BadgeCheck } from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";

/* ─────────────────────────────────────────────────────────────────────────
   NEW BRAND — navy + green "AI-powered matchmaking" landing page.
   Built on the `new-branding` branch to the boss's mockup. Scoped under
   [data-nb] so it can't leak into the rest of the (still warm) site.
   ───────────────────────────────────────────────────────────────────────── */

const NB_STYLE = `
  [data-nb] { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0e2a4d; -webkit-font-smoothing: antialiased; }
  [data-nb] h1, [data-nb] h2, [data-nb] h3 { letter-spacing: -0.02em; }

  /* buttons */
  [data-nb] .nb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 24px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background .18s ease, box-shadow .18s ease, transform .12s ease, color .18s ease; white-space: nowrap; }
  [data-nb] .nb-btn-green { background: #43a047; color: #fff; box-shadow: 0 6px 18px rgba(67,160,71,.32); }
  [data-nb] .nb-btn-green:hover { background: #3a8c3e; box-shadow: 0 8px 22px rgba(67,160,71,.4); }
  [data-nb] .nb-btn-ghost { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.4); }
  [data-nb] .nb-btn-ghost:hover { background: rgba(255,255,255,.16); }
  [data-nb] .nb-btn-outline { background: #fff; color: #0e2a4d; border: 1.5px solid #0e2a4d; }
  [data-nb] .nb-btn-outline:hover { background: #0e2a4d; color: #fff; }

  /* nav */
  [data-nb] .nb-nav { position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid #e8edf3; }
  [data-nb] .nb-navlink { font-size: 15px; font-weight: 600; color: #33405a; transition: color .15s ease; }
  [data-nb] .nb-navlink:hover { color: #43a047; }
  [data-nb] .nb-logo { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: #0e2a4d; display: inline-flex; align-items: center; }
  [data-nb] .nb-logo .up { color: #43a047; }

  /* hero */
  [data-nb] .nb-hero { position: relative; overflow: hidden; background:
      radial-gradient(120% 120% at 80% 0%, #16407a 0%, rgba(22,64,122,0) 55%),
      linear-gradient(135deg, #0b2545 0%, #0e2a4d 55%, #0a2038 100%); }
  [data-nb] .nb-hero::after { content:''; position:absolute; inset:0; background:
      repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 2px, transparent 2px 60px),
      linear-gradient(180deg, transparent 55%, rgba(4,14,30,.55) 100%);
      pointer-events:none; }
  [data-nb] .nb-hero-h1 { font-size: clamp(30px, 3.4vw, 44px); font-weight: 800; line-height: 1.12; color: #fff; }
  [data-nb] .nb-hero-sub { font-size: 17px; line-height: 1.6; color: rgba(255,255,255,.8); }
  [data-nb] .nb-badge { display:inline-flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; color: rgba(255,255,255,.82); }
  [data-nb] .nb-badge svg { width:15px; height:15px; color:#5cc15f; }

  /* hero network graphic */
  [data-nb] .nb-net { position: relative; width: 100%; max-width: 460px; margin-left: auto; aspect-ratio: 1 / 1; }
  [data-nb] .nb-net-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 116px; height: 116px; border-radius: 999px; background: #fff; box-shadow: 0 12px 40px rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; font-size: 14px; line-height: 1.15; z-index: 3; }
  [data-nb] .nb-node { position: absolute; transform: translate(-50%,-50%); z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 6px; width: 132px; }
  [data-nb] .nb-node-av { width: 64px; height: 64px; border-radius: 999px; border: 3px solid #fff; background-size: cover; background-position: center; box-shadow: 0 8px 22px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; }
  [data-nb] .nb-node-av svg { width: 28px; height: 28px; color: #fff; }
  [data-nb] .nb-node-tag { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; color: #5cc15f; }
  [data-nb] .nb-node-lbl { font-size: 10.5px; font-weight: 500; line-height: 1.25; color: rgba(255,255,255,.72); text-align: center; }
  [data-nb] .nb-prop { position: absolute; transform: translate(-50%,-50%); z-index: 2; width: 58px; height: 58px; border-radius: 999px; border: 3px solid rgba(255,255,255,.85); background-size: cover; background-position: center; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  [data-nb] .nb-net-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  [data-nb] .nb-net-svg line { stroke: rgba(92,193,95,.55); stroke-width: 1.4; stroke-dasharray: 4 4; }

  /* section scaffolding */
  [data-nb] .nb-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-h2 { font-size: clamp(26px, 2.8vw, 34px); font-weight: 800; color: #0e2a4d; line-height: 1.15; }
  [data-nb] .nb-lead { font-size: 16.5px; line-height: 1.6; color: #56657a; }
  [data-nb] .nb-card { background: #fff; border: 1px solid #e8edf3; border-radius: 14px; box-shadow: 0 2px 10px rgba(14,42,77,.05); }

  @media (max-width: 1023px) {
    [data-nb] .nb-net { margin: 0 auto; max-width: 380px; }
  }
`;

const NAV_LINKS = [
  { label: "How It Works", href: "#how" },
  { label: "Who It's For", href: "#who" },
  { label: "Resources", href: "#resources" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

function Logo() {
  return (
    <span className="nb-logo">
      1031ExchangeUp<span className="up">↑</span>
    </span>
  );
}

function NbNav() {
  return (
    <nav className="nb-nav">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link to={ROUTES.home}><Logo /></Link>
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nb-navlink">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.login} className="nb-btn nb-btn-outline hidden h-10 px-4 sm:inline-flex">Log In</Link>
          <Link to={ROUTES.signup} className="nb-btn nb-btn-green h-10 px-5">Join Free</Link>
        </div>
      </div>
    </nav>
  );
}

const HERO_BADGES = [
  { icon: Cpu, label: "AI Powered" },
  { icon: BadgeCheck, label: "Free for Founding Members" },
  { icon: Users, label: "Built by Investor-Friendly Agents" },
  { icon: Clock, label: "Takes Less Than 5 Minutes" },
];

/* People + property nodes positioned around the central hub (x/y in %). */
const NET_NODES = [
  { tag: "BUYER", lbl: "Looking for Replacement Property", x: 50, y: 12, color: "#3f72b8" },
  { tag: "AGENT", lbl: "Investor-Focused Real Estate Agent", x: 13, y: 44, color: "#43a047" },
  { tag: "SELLER", lbl: "1031 Exchange Property Owner", x: 87, y: 44, color: "#c98a3a" },
];
const NET_PROPS = [
  { x: 24, y: 86, photo: "/landing-prop-office.jpg" },
  { x: 50, y: 92, photo: "/landing-prop-retail.jpg" },
  { x: 76, y: 86, photo: "/landing-prop-industrial.jpg" },
];

function HeroNetwork() {
  return (
    <div className="nb-net">
      <svg className="nb-net-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {[...NET_NODES, ...NET_PROPS].map((n, i) => (
          <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} />
        ))}
      </svg>
      {NET_NODES.map((n) => (
        <div key={n.tag} className="nb-node" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="nb-node-av" style={{ background: n.color }}><Users /></span>
          <span className="nb-node-tag">{n.tag}</span>
          <span className="nb-node-lbl">{n.lbl}</span>
        </div>
      ))}
      {NET_PROPS.map((p, i) => (
        <div key={i} className="nb-prop" style={{ left: `${p.x}%`, top: `${p.y}%`, backgroundImage: `url(${p.photo})` }} />
      ))}
      <div className="nb-net-center">1031<br />ExchangeUp</div>
    </div>
  );
}

function NbHero() {
  return (
    <section className="nb-hero">
      <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <h1 className="nb-hero-h1 max-w-[600px]">
            The AI-Powered Matchmaking Platform for 1031 Exchange Buyers, Sellers &amp; Investor-Friendly Real Estate Agents.
          </h1>
          <p className="nb-hero-sub mt-5 max-w-[520px]">
            Finally, a better way to connect exchange buyers, replacement properties, and investor-friendly
            agents—all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Join the Network (Free)</Link>
            <button type="button" className="nb-btn nb-btn-ghost"><Play className="h-4 w-4" />Watch 2-Minute Demo</button>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
            {HERO_BADGES.map((b) => (
              <span key={b.label} className="nb-badge"><b.icon />{b.label}</span>
            ))}
          </div>
        </div>
        <HeroNetwork />
      </div>
    </section>
  );
}

/* ── Section stubs — fleshed out next; kept minimal so the page compiles
      and the hero/nav can be reviewed first. ── */
function SectionStub({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
      <p className="nb-eyebrow">{eyebrow}</p>
      <h2 className="nb-h2 mt-2">{title}</h2>
      <p className="nb-lead mt-3">Section coming together…</p>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "1031ExchangeUp — AI-Powered 1031 Exchange Matchmaking";
  }, []);

  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <NbNav />
      <NbHero />
      <SectionStub id="problem" eyebrow="The Problem" title="The 1031 Exchange Process Is Broken" />
      <SectionStub id="meet" eyebrow="Meet" title="Meet 1031ExchangeUp" />
      <SectionStub id="how" eyebrow="How It Works" title="How It Works" />
      <SectionStub id="who" eyebrow="Who It's For" title="Who It's Built For" />
      <SectionStub id="why" eyebrow="Why Join" title="Why Join 1031ExchangeUp?" />
      <SectionStub id="different" eyebrow="Why We're Different" title="Why We're Different" />
      <SectionStub id="resources" eyebrow="Resources" title="Educational Resources" />
      <SectionStub id="faq" eyebrow="FAQ" title="Frequently Asked Questions" />
    </div>
  );
}

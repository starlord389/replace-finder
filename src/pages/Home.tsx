import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { SECTIONS_CSS, LandingSections } from "./HomeSections";

/* ─────────────────────────────────────────────────────────────────────────
   NEW BRAND — navy + green "AI-powered matchmaking" landing page.
   Hero matched to the boss mockup: real dusk skyline photo, grey-backdrop
   headshots, multifamily property web, green-UP logo, outline demo button,
   four-badge row, grey role pills. Scoped under [data-nb].
   ───────────────────────────────────────────────────────────────────────── */

const NB_STYLE = `
  [data-nb] *, [data-nb] *::before, [data-nb] *::after { box-sizing: border-box; }
  [data-nb] { --nb-navy: #16284a; --nb-green: #43a047; --nb-green-bright: #5cc15f;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #16284a; -webkit-font-smoothing: antialiased; }
  [data-nb] h1, [data-nb] h2, [data-nb] h3 { letter-spacing: -0.02em; }

  /* hero shell */
  [data-nb] .nb-hero { position: relative; overflow: hidden; background: #0b1f3d; }
  [data-nb] .nb-hero-inner { position: relative; z-index: 10; }
  [data-nb] .nb-hero-h1 { font-size: clamp(30px, 3.4vw, 46px); font-weight: 800; line-height: 1.1; color: #fff; }
  [data-nb] .nb-hero-sub { font-size: 17px; line-height: 1.6; color: rgba(255,255,255,.82); }

  /* ===== top nav + logo ===== */
  [data-nb] .nb-nav { position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid #e8edf3; }
  [data-nb] .nb-nav-inner { margin: 0 auto; max-width: 1240px; height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
  @media (max-width: 640px) { [data-nb] .nb-nav-inner { padding: 0 20px; } }
  [data-nb] .nb-logo { display: inline-flex; align-items: center; font-size: 23px; font-weight: 800; line-height: 1; letter-spacing: -0.01em; white-space: nowrap; color: var(--nb-navy); text-decoration: none; }
  [data-nb] .nb-logo-num, [data-nb] .nb-logo-word { color: var(--nb-navy); }
  [data-nb] .nb-logo-up { color: var(--nb-green); text-transform: uppercase; font-weight: 800; letter-spacing: 0.01em; margin-left: 1px; }
  [data-nb] .nb-logo-arrow { display: inline-block; width: 0.82em; height: 0.82em; margin-left: 1px; transform: translateY(-0.12em); flex: 0 0 auto; }
  [data-nb] .nb-logo-arrow svg { display: block; width: 100%; height: 100%; }
  [data-nb] .nb-nav-links { display: none; align-items: center; gap: 34px; }
  @media (min-width: 1024px) { [data-nb] .nb-nav-links { display: flex; } }
  [data-nb] .nb-navlink { font-size: 15px; font-weight: 600; color: #33405a; text-decoration: none; transition: color .15s ease; }
  [data-nb] .nb-navlink:hover { color: #43a047; }
  [data-nb] .nb-nav-actions { display: flex; align-items: center; gap: 12px; }
  [data-nb] .nb-nav-btn { display: inline-flex; align-items: center; justify-content: center; height: 42px; border-radius: 8px; font-size: 15px; font-weight: 700; line-height: 1; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
  [data-nb] .nb-nav-btn-login { display: none; padding: 0 18px; background: #fff; color: #16284a; border: 1.5px solid #16284a; }
  [data-nb] .nb-nav-btn-login:hover { background: #16284a; color: #fff; }
  @media (min-width: 480px) { [data-nb] .nb-nav-btn-login { display: inline-flex; } }
  [data-nb] .nb-nav-btn-join { padding: 0 22px; background: #43a047; color: #fff; border: 1.5px solid #43a047; }
  [data-nb] .nb-nav-btn-join:hover { background: #3a8c3e; border-color: #3a8c3e; }

  /* ===== hero skyline backdrop (.nb-sky) ===== */
  [data-nb] .nb-sky { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  [data-nb] .nb-sky > * { position: absolute; inset: 0; width: 100%; height: 100%; }
  [data-nb] .nb-sky-base { background: #0a1c37; }
  [data-nb] .nb-sky-photo { background-image: url(/hero-skyline.jpg); background-size: cover; background-position: center 42%; }
  [data-nb] .nb-sky-overlay { background: linear-gradient(95deg, rgba(11,28,55,.93) 0%, rgba(11,28,55,.84) 30%, rgba(11,28,55,.62) 56%, rgba(12,34,66,.34) 80%, rgba(13,38,72,.2) 100%), radial-gradient(120% 130% at 0% 30%, rgba(8,22,44,.5) 0%, rgba(8,22,44,0) 55%); }
  [data-nb] .nb-sky-vignette { background: linear-gradient(180deg, rgba(8,20,40,.25) 0%, transparent 22%, transparent 68%, rgba(6,16,34,.65) 100%); }
  [data-nb] .nb-sky-net { left: auto; right: 0; width: 56%; opacity: .9; }
  [data-nb] .nb-sky-net svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  @keyframes nb-sky-pulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
  [data-nb] .nb-sky-net .nb-pulse { animation: nb-sky-pulse 4.5s ease-in-out infinite; }
  [data-nb] .nb-sky-net .nb-pulse:nth-of-type(3n) { animation-duration: 6s; animation-delay: 1.2s; }
  [data-nb] .nb-sky-net .nb-pulse:nth-of-type(3n+1) { animation-duration: 5.2s; animation-delay: .6s; }

  /* ===== hero matchmaking network graphic (.nb-net) ===== */
  [data-nb] .nb-net { position: relative; width: 100%; max-width: 560px; margin-left: auto; aspect-ratio: 1.06 / 1; }
  [data-nb] .nb-net-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; overflow: visible; pointer-events: none; }
  [data-nb] .nb-cw-line { stroke: #2ed3c6; fill: none; stroke-width: .4; stroke-linecap: round; filter: drop-shadow(0 0 1.3px rgba(46,211,198,.85)); }
  [data-nb] .nb-cw-line.main { stroke-width: .55; }
  [data-nb] .nb-cw-dot { fill: #6ff0e2; filter: drop-shadow(0 0 2px rgba(110,240,226,.95)); }
  [data-nb] .nb-net-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 134px; height: 134px; border-radius: 999px; background: #fff; box-shadow: 0 16px 50px rgba(4,14,30,.5), 0 0 0 8px rgba(255,255,255,.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; z-index: 4; }
  [data-nb] .nb-hub-1031 { font-size: 28px; font-weight: 800; color: #16284a; line-height: 1; letter-spacing: -.02em; }
  [data-nb] .nb-hub-ex { margin-top: 1px; font-size: 16px; font-weight: 800; color: #16284a; line-height: 1; letter-spacing: -.01em; display: inline-flex; align-items: center; }
  [data-nb] .nb-hub-ex .up { color: #43a047; text-transform: uppercase; }
  [data-nb] .nb-hub-arrow { width: 10px; height: 10px; margin-left: 1px; transform: translateY(-2px); }
  [data-nb] .nb-cap { position: absolute; transform: translate(-50%,-50%); z-index: 3; display: flex; align-items: center; }
  [data-nb] .nb-cap.rev { flex-direction: row-reverse; }
  [data-nb] .nb-cap-photo { width: 76px; height: 76px; border-radius: 999px; border: 3px solid #fff; background-color: #1b3a63; background-size: cover; background-position: center top; box-shadow: 0 8px 24px rgba(4,14,30,.5); flex: 0 0 auto; position: relative; z-index: 2; }
  [data-nb] .nb-cap-txt { background: rgba(255,255,255,.96); border: 1px solid rgba(120,160,200,.45); box-shadow: 0 6px 18px rgba(4,14,30,.28); border-radius: 999px; padding: 8px 16px 8px 26px; margin-left: -16px; max-width: 152px; }
  [data-nb] .nb-cap.rev .nb-cap-txt { padding: 8px 26px 8px 16px; margin-left: 0; margin-right: -16px; text-align: right; }
  [data-nb] .nb-cap-role { display: block; font-size: 12px; font-weight: 800; letter-spacing: .1em; color: #16284a; line-height: 1.1; }
  [data-nb] .nb-cap-desc { display: block; margin-top: 2px; font-size: 10px; font-weight: 500; line-height: 1.25; color: #5b6b7e; }
  [data-nb] .nb-prop { position: absolute; transform: translate(-50%,-50%); z-index: 2; border-radius: 999px; border: 3px solid rgba(255,255,255,.92); background-color: #14305a; background-size: cover; background-position: center; box-shadow: 0 8px 22px rgba(4,14,30,.45); }
  [data-nb] .nb-prop::after { content: ''; position: absolute; inset: 0; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(46,211,198,.35); }
  @media (max-width: 1023px) { [data-nb] .nb-net { margin: 0 auto; max-width: 470px; } }
  @media (max-width: 480px) { [data-nb] .nb-net-center { width: 108px; height: 108px; } [data-nb] .nb-hub-1031 { font-size: 22px; } [data-nb] .nb-cap-photo { width: 64px; height: 64px; } }

  /* ===== hero CTAs + trust badges ===== */
  [data-nb] .nb-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
  [data-nb] .nb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; height: 50px; padding: 0 26px; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; line-height: 1; letter-spacing: .01em; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background .18s ease, box-shadow .18s ease, transform .12s ease; white-space: nowrap; }
  [data-nb] .nb-btn:active { transform: translateY(1px); }
  [data-nb] .nb-btn-green { background: #43a047; color: #fff; box-shadow: 0 8px 20px rgba(67,160,71,.34); }
  [data-nb] .nb-btn-green:hover { background: #3a8c3e; box-shadow: 0 10px 26px rgba(67,160,71,.44); }
  [data-nb] .nb-btn-demo { display: inline-flex; align-items: center; gap: 12px; height: 50px; padding: 0 22px; border-radius: 10px; background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.55); color: #fff; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: .01em; cursor: pointer; white-space: nowrap; transition: background .14s ease, border-color .14s ease, transform .12s ease; }
  [data-nb] .nb-btn-demo:hover { background: rgba(255,255,255,.13); border-color: rgba(255,255,255,.85); }
  [data-nb] .nb-btn-demo:active { transform: scale(.985); }
  [data-nb] .nb-play { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: transparent; border: 1.5px solid rgba(255,255,255,.85); flex: 0 0 auto; }
  [data-nb] .nb-play svg { display: block; width: 9px; height: 9px; }
  [data-nb] .nb-badges { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px 18px; margin-top: 36px; }
  [data-nb] .nb-badge { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  [data-nb] .nb-badge-ico { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex: 0 0 auto; color: var(--nb-green-bright); }
  [data-nb] .nb-badge-ico svg { display: block; width: 20px; height: 20px; }
  [data-nb] .nb-badge-txt { font-size: 12px; font-weight: 600; line-height: 1.25; color: #fff; white-space: nowrap; }

  /* ===== section scaffolding (stubs) ===== */
  [data-nb] .nb-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-h2 { font-size: clamp(26px, 2.8vw, 34px); font-weight: 800; color: #16284a; line-height: 1.15; }
  [data-nb] .nb-lead { font-size: 16.5px; line-height: 1.6; color: #56657a; }
`;

const NAV_LINKS = [
  { label: "How It Works", href: "#how" },
  { label: "Who It's For", href: "#who" },
  { label: "Resources", href: "#resources" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
];

const NODES = [
  { tag: "BUYER", lbl: ["Looking for", "Replacement Property"], x: 44, y: 16, rev: false, photo: "/headshot-buyer.jpg" },
  { tag: "AGENT", lbl: ["Investor Focused", "Real Estate Agent"], x: 17, y: 49, rev: true, photo: "/headshot-agent.jpg" },
  { tag: "SELLER", lbl: ["1031 Exchange", "Property Owner"], x: 84, y: 49, rev: false, photo: "/headshot-seller.jpg" },
];
const NET_PROPS = [
  { x: 75, y: 19, size: 54, photo: "/mf-1.jpg" },
  { x: 92, y: 64, size: 48, photo: "/mf-2.jpg" },
  { x: 70, y: 86, size: 62, photo: "/mf-3.jpg" },
  { x: 48, y: 92, size: 56, photo: "/mf-4.jpg" },
  { x: 25, y: 84, size: 58, photo: "/mf-5.jpg" },
  { x: 10, y: 72, size: 46, photo: "/mf-6.jpg" },
];
/* dense radial "circuit" spokes around the hub (teal glow) */
const SPOKES = Array.from({ length: 20 }, (_, i) => {
  const a = (i * 18 + 5) * (Math.PI / 180);
  const r1 = 9.5 + (i % 2) * 1.5;
  const r2 = 24 + ((i * 11) % 16);
  const bend = (i % 3 === 0) ? 4 : 0;
  return {
    x1: 50 + Math.cos(a) * r1, y1: 50 + Math.sin(a) * r1,
    mx: 50 + Math.cos(a + bend * 0.01) * (r1 + r2) / 2, my: 50 + Math.sin(a - bend * 0.01) * (r1 + r2) / 2,
    x2: 50 + Math.cos(a) * r2, y2: 50 + Math.sin(a) * r2,
  };
});

function LogoArrow() {
  return (
    <span className="nb-logo-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <polyline points="3,17 9.5,11 13.5,14 21,5.5" stroke="#43a047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="21,5.5 14.6,5.7 21,12.1" fill="#43a047" />
      </svg>
    </span>
  );
}

function NbNav() {
  return (
    <nav className="nb-nav">
      <div className="nb-nav-inner">
        <Link to={ROUTES.home} className="nb-logo" aria-label="1031ExchangeUP home">
          <span className="nb-logo-num">1031</span><span className="nb-logo-word">Exchange</span><span className="nb-logo-up">UP</span><LogoArrow />
        </Link>
        <div className="nb-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nb-navlink">{l.label}</a>
          ))}
        </div>
        <div className="nb-nav-actions">
          <Link to={ROUTES.login} className="nb-nav-btn nb-nav-btn-login">Log In</Link>
          <Link to={ROUTES.signup} className="nb-nav-btn nb-nav-btn-join">Join Free</Link>
        </div>
      </div>
    </nav>
  );
}

function SkyBackdrop() {
  return (
    <div className="nb-sky" aria-hidden="true">
      <div className="nb-sky-base" />
      <div className="nb-sky-photo" />
      <div className="nb-sky-overlay" />
      <div className="nb-sky-vignette" />
      <div className="nb-sky-net">
        <svg viewBox="0 0 580 520" preserveAspectRatio="xMaxYMin slice" xmlns="http://www.w3.org/2000/svg">
          <g stroke="rgba(95,193,170,.5)" strokeWidth="1" fill="none">
            <line x1="70" y1="70" x2="200" y2="40" /><line x1="200" y1="40" x2="320" y2="110" /><line x1="320" y1="110" x2="450" y2="60" /><line x1="450" y1="60" x2="520" y2="150" /><line x1="200" y1="40" x2="150" y2="170" /><line x1="150" y1="170" x2="320" y2="110" /><line x1="320" y1="110" x2="280" y2="230" /><line x1="280" y1="230" x2="450" y2="200" /><line x1="450" y1="60" x2="490" y2="280" /><line x1="70" y1="70" x2="60" y2="200" /><line x1="60" y1="200" x2="150" y2="170" /><line x1="490" y1="280" x2="450" y2="200" />
          </g>
          <g fill="#5cc1aa">
            <circle className="nb-pulse" cx="70" cy="70" r="2.6" /><circle className="nb-pulse" cx="200" cy="40" r="3.4" /><circle className="nb-pulse" cx="320" cy="110" r="2.8" /><circle className="nb-pulse" cx="450" cy="60" r="3.2" /><circle className="nb-pulse" cx="520" cy="150" r="2.4" /><circle className="nb-pulse" cx="150" cy="170" r="2.6" /><circle className="nb-pulse" cx="60" cy="200" r="2.2" /><circle className="nb-pulse" cx="280" cy="230" r="3" /><circle className="nb-pulse" cx="450" cy="200" r="2.6" /><circle className="nb-pulse" cx="490" cy="280" r="2.4" />
          </g>
          <g fill="rgba(95,193,170,.16)">
            <circle cx="200" cy="40" r="7" /><circle cx="450" cy="60" r="6.5" /><circle cx="280" cy="230" r="6" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function HeroNetwork() {
  return (
    <div className="nb-net">
      <svg className="nb-net-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {SPOKES.map((s, i) => (
          <g key={`s-${i}`}>
            <polyline className="nb-cw-line" points={`${s.x1},${s.y1} ${s.mx},${s.my} ${s.x2},${s.y2}`} vectorEffect="non-scaling-stroke" />
            <circle className="nb-cw-dot" cx={s.x2} cy={s.y2} r="0.7" />
            <circle className="nb-cw-dot" cx={s.mx} cy={s.my} r="0.45" />
          </g>
        ))}
        {[...NODES, ...NET_PROPS].map((n, i) => (
          <g key={`m-${i}`}>
            <line className="nb-cw-line main" x1="50" y1="50" x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
            <circle className="nb-cw-dot" cx={50 + (n.x - 50) * 0.55} cy={50 + (n.y - 50) * 0.55} r="0.8" />
          </g>
        ))}
      </svg>

      {NET_PROPS.map((p, i) => (
        <div key={`p-${i}`} className="nb-prop" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundImage: `url(${p.photo})` }} />
      ))}

      {NODES.map((n) => (
        <div key={n.tag} className={`nb-cap${n.rev ? " rev" : ""}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="nb-cap-photo" style={{ backgroundImage: `url(${n.photo})` }} />
          <span className="nb-cap-txt">
            <span className="nb-cap-role">{n.tag}</span>
            <span className="nb-cap-desc">{n.lbl[0]}<br />{n.lbl[1]}</span>
          </span>
        </div>
      ))}

      <div className="nb-net-center">
        <span className="nb-hub-1031">1031</span>
        <span className="nb-hub-ex">Exchange<span className="up">UP</span>
          <svg className="nb-hub-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="3,17 9.5,11 13.5,14 21,5.5" stroke="#43a047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><polygon points="21,5.5 14.6,5.7 21,12.1" fill="#43a047" /></svg>
        </span>
      </div>
    </div>
  );
}

const BADGES = [
  { txt: ["AI Powered"], svg: (<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" /><path d="M10 4v2M14 4v2M10 18v2M14 18v2M4 10h2M4 14h2M18 10h2M18 14h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["Free for", "Founding Members"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" strokeWidth="1.8" /><path d="M9 13.2 7.5 21l4.5-2.6L16.5 21 15 13.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>) },
  { txt: ["Built by", "Investor-Friendly Agents"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" /><path d="M15.5 14.4c2.7.2 5 1.9 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["Takes Less Than", "5 Minutes"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
];

function NbHero() {
  return (
    <section className="nb-hero">
      <SkyBackdrop />
      <div className="nb-hero-inner mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
        <div>
          <h1 className="nb-hero-h1 max-w-[600px]">
            The AI-Powered Matchmaking Platform for 1031 Exchange Buyers, Sellers &amp; Investor-Friendly Real Estate Agents.
          </h1>
          <p className="nb-hero-sub mt-5 max-w-[510px]">
            Finally, a better way to connect exchange buyers, replacement properties, and investor-friendly
            agents—all in one place.
          </p>

          <div className="nb-cta-row" style={{ marginTop: 32 }}>
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Join the Network (Free)</Link>
            <button type="button" className="nb-btn-demo">
              <span>Watch 2-Minute Demo</span>
              <span className="nb-play" aria-hidden="true">
                <svg viewBox="0 0 12 12"><polygon points="3.2,2.2 9.6,6 3.2,9.8" fill="#ffffff" /></svg>
              </span>
            </button>
          </div>

          <div className="nb-badges">
            {BADGES.map((b, i) => (
              <div key={i} className="nb-badge">
                <span className="nb-badge-ico" aria-hidden="true">{b.svg}</span>
                <span className="nb-badge-txt">{b.txt.map((t, j) => (<span key={j}>{t}{j < b.txt.length - 1 ? <br /> : null}</span>))}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroNetwork />
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "1031ExchangeUP — AI-Powered 1031 Exchange Matchmaking";
  }, []);

  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <style>{SECTIONS_CSS}</style>
      <NbNav />
      <NbHero />
      <LandingSections />
    </div>
  );
}

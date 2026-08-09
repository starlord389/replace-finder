import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { SECTIONS_CSS, LandingSections, HowItWorksFlow, Sec_agents, Sec_investors } from "./HomeSections";

/* ─────────────────────────────────────────────────────────────────────────
   NEW BRAND — navy + green Exchange IQ™ matchmaking landing page.
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
  [data-nb] .nb-nav-burger { display: none; width: 42px; height: 42px; border-radius: 8px; border: 1.5px solid #e8edf3; background: #fff; color: #16284a; align-items: center; justify-content: center; cursor: pointer; flex: 0 0 auto; }
  [data-nb] .nb-nav-burger svg { display: block; width: 20px; height: 20px; }
  @media (max-width: 1023.98px) { [data-nb] .nb-nav-burger { display: inline-flex; } }
  [data-nb] .nb-nav-mobile { border-top: 1px solid #e8edf3; background: #fff; padding: 8px 20px 16px; display: flex; flex-direction: column; }
  [data-nb] .nb-nav-mlink { padding: 12px 4px; font-size: 15px; font-weight: 600; color: #33405a; text-decoration: none; border-bottom: 1px solid #f2f5fa; }
  [data-nb] .nb-nav-mlink:last-child { border-bottom: none; }
  @media (max-width: 480px) {
    [data-nb] .nb-nav-inner { padding: 0 14px; }
    [data-nb] .nb-logo { font-size: 18px; }
    [data-nb] .nb-logo-tm { font-size: 0.5em; }
    [data-nb] .nb-nav-actions { gap: 8px; }
    [data-nb] .nb-nav-btn-join { padding: 0 14px; font-size: 14px; height: 40px; }
    [data-nb] .nb-nav-burger { width: 40px; height: 40px; }
  }
  [data-nb] .nb-logo-tm { font-size: 0.45em; font-weight: 400; margin-left: 1px; opacity: 0.85; }

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

  /* ===== hero network graphic removed — replaced by infographic in section 2 ===== */
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
  [data-nb] .nb-badges { display: flex; flex-wrap: nowrap; align-items: flex-start; gap: 14px; margin-top: 36px; }
  [data-nb] .nb-badge { display: flex; align-items: center; gap: 9px; flex: 0 0 auto; }
  [data-nb] .nb-badge-ico { display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; flex: 0 0 auto; color: var(--nb-green-bright); }
  [data-nb] .nb-badge-ico svg { display: block; width: 23px; height: 23px; }
  [data-nb] .nb-badge-txt { font-size: 13px; font-weight: 600; line-height: 1.3; color: #fff; white-space: nowrap; }

  /* ===== section scaffolding (stubs) ===== */
  [data-nb] .nb-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-h2 { font-size: clamp(26px, 2.8vw, 34px); font-weight: 800; color: #16284a; line-height: 1.15; }
  [data-nb] .nb-lead { font-size: 16.5px; line-height: 1.6; color: #56657a; }
  [data-nb] section[id] { scroll-margin-top: 84px; }

  /* ===== logo marquee ===== */
  [data-nb] .nb-mq { background: #fff; padding: 46px 20px 42px; }
  [data-nb] .nb-mq-label { text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #8794a6; margin: 0 0 26px; }
  @keyframes nb-mq-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  [data-nb] .nb-mq-viewport { overflow: hidden; width: min(1040px, calc(100vw - 80px)); margin: 0 auto; -webkit-mask-image: linear-gradient(to right, transparent, #000 9%, #000 91%, transparent); mask-image: linear-gradient(to right, transparent, #000 9%, #000 91%, transparent); }
  [data-nb] .nb-mq-track { display: flex; align-items: center; width: max-content; animation: nb-mq-scroll 52s linear infinite; }
  [data-nb] .nb-mq-group { display: flex; align-items: center; gap: 74px; padding-right: 74px; }
  [data-nb] .nb-mq-logo { display: inline-flex; align-items: center; justify-content: center; height: 58px; flex: none; }
  [data-nb] .nb-mq-logo img { height: var(--brand-h, 32px); width: auto; max-height: 100%; display: block; filter: grayscale(1); opacity: .55; pointer-events: none; }
  @media (max-width: 809.98px) {
    [data-nb] .nb-mq-viewport { width: calc(100vw - 36px); }
    [data-nb] .nb-mq-group { gap: 48px; padding-right: 48px; }
    [data-nb] .nb-mq-logo { height: 46px; }
    [data-nb] .nb-mq-logo img { height: var(--brand-h-mobile, 24px); }
  }

  /* ===== mobile centering (hero) ===== */
  @media (max-width: 1023.98px) {
    [data-nb] .nb-hero-h1, [data-nb] .nb-hero-sub { margin-left: auto; margin-right: auto; text-align: center; }
    [data-nb] .nb-cta-row { justify-content: center; }
    [data-nb] .nb-badges { justify-content: center; }
  }
  /* badges stay on ONE row everywhere — shrink + allow internal wrap on phones */
  @media (max-width: 640px) {
    [data-nb] .nb-badges { gap: 6px; justify-content: space-between; }
    [data-nb] .nb-badge { gap: 4px; min-width: 0; flex: 1 1 0; align-items: flex-start; }
    [data-nb] .nb-badge-ico { width: 14px; height: 14px; margin-top: 1px; }
    [data-nb] .nb-badge-ico svg { width: 14px; height: 14px; }
    [data-nb] .nb-badge-txt { font-size: 8.5px; white-space: normal; line-height: 1.25; }
    [data-nb] .nb-badge-txt br { display: none; }
    [data-nb] .nb-badge-txt > span::after { content: " "; }
  }

  /* ===== audience cards directly under the hero ===== */
  [data-nb] .nb-aud { background: #fff; padding: 44px 20px 8px; }
  [data-nb] .nb-aud-grid { margin: 0 auto; max-width: 1240px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  @media (max-width: 900px) { [data-nb] .nb-aud-grid { grid-template-columns: 1fr; } }
  [data-nb] .nb-aud-card { border: 1px solid #e8edf3; border-radius: 16px; background: #fff; padding: 24px 22px; box-shadow: 0 2px 12px rgba(14,42,77,.06); text-align: left; width: 100%; cursor: pointer; transition: border-color .18s ease, box-shadow .18s ease, transform .12s ease; }
  [data-nb] .nb-aud-card:hover { border-color: #43a047; box-shadow: 0 8px 24px rgba(14,42,77,.1); }
  [data-nb] .nb-aud-card.is-open { border-color: #43a047; box-shadow: 0 10px 28px rgba(67,160,71,.18); }
  [data-nb] .nb-aud-card:active { transform: translateY(1px); }
  [data-nb] .nb-aud-ico { width: 44px; height: 44px; border-radius: 12px; background: #eef6ef; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  [data-nb] .nb-aud-ico svg { width: 22px; height: 22px; stroke: #43a047; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  [data-nb] .nb-aud-tag { font-size: 12px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-aud-txt { margin-top: 8px; font-size: 16px; line-height: 1.5; font-weight: 600; color: #16284a; }
  [data-nb] .nb-aud-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 940px; }
  @media (max-width: 900px) { [data-nb] .nb-aud-grid-2 { grid-template-columns: 1fr; } }
  [data-nb] .nb-aud-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 15px; font-weight: 800; color: #43a047; text-decoration: none; }
  [data-nb] .nb-aud-chevron { display: inline-flex; width: 16px; height: 16px; transition: transform .2s ease; }
  [data-nb] .nb-aud-card.is-open .nb-aud-chevron { transform: rotate(180deg); }
  [data-nb] .nb-aud-dropdown { margin: 20px auto 0; max-width: 1240px; animation: nb-dropdown-in .35s ease both; }
  @keyframes nb-dropdown-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  [data-nb] .nb-aud-dropdown > section { padding: 40px 0 !important; }
  @media (min-width: 640px) { [data-nb] .nb-aud-dropdown > section { padding: 48px 0 !important; } }
  [data-nb] .nb-aud-dropdown > section:first-child { margin-top: 0; }
  [data-nb] .nb-hero-link { display: inline-flex; align-items: center; gap: 8px; color: #c4d2e6; font-size: 14.5px; font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.25); padding-bottom: 2px; transition: color .15s ease, border-color .15s ease; }
  [data-nb] .nb-hero-link:hover { color: #fff; border-color: rgba(255,255,255,.65); }

  /* ===== four-step monitoring strip ===== */
  /* ===== how it works network diagram (section 2) ===== */
  [data-nb] .nb-diagram { background: #0b1f3d; padding: 56px 20px 64px; text-align: center; }
  [data-nb] .nb-diagram-inner { margin: 0 auto; max-width: 1080px; }
  [data-nb] .nb-diagram-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-diagram-h2 { margin: 10px auto 0; font-size: clamp(26px, 2.8vw, 36px); font-weight: 800; color: #fff; line-height: 1.15; max-width: 680px; }
  [data-nb] .nb-diagram-lead { margin: 12px auto 0; font-size: 16.5px; line-height: 1.6; color: rgba(255,255,255,.75); max-width: 640px; }
  [data-nb] .nb-diagram-flow { margin: 28px auto 0; max-width: 960px; background: #fff; border-radius: 20px; padding: 38px 28px 32px; box-shadow: 0 18px 50px rgba(0,0,0,.18); }
  [data-nb] .nb-diagram-flow .nb-diagram-eyebrow { margin-bottom: 0; }
  [data-nb] .nb-diagram-flow .nb-how-flow { margin-top: 28px; }
  @media (max-width: 640px) { [data-nb] .nb-diagram-flow { padding: 28px 18px 24px; } [data-nb] .nb-diagram-flow .nb-how-flow { margin-top: 22px; } }
  [data-nb] .nb-net { margin: 30px auto 0; display: block; width: 100%; max-width: 960px; height: auto; }
  [data-nb] .nb-net-legend { margin: 18px auto 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 26px; }
  [data-nb] .nb-net-legend span { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: rgba(255,255,255,.8); }
  [data-nb] .nb-net-dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
  @media (max-width: 640px) { [data-nb] .nb-diagram { padding: 40px 16px 48px; } }
`;




const NAV_LINKS = [
  { label: "How It Works", href: "#steps" },
  { label: "For Agents", href: "#agents" },
  { label: "For Investors", href: "#investors" },
  { label: "Resources", href: "#resources" },
  { label: "FAQ", href: "#faq" },
];

const LOGO_BRANDS = [
  { name: "Compass", src: "/logos/compass.svg", height: 22, mobileHeight: 16 },
  { name: "Aluxety Real Estate", src: "/logos/aluxety.png", height: 34, mobileHeight: 26 },
  { name: "Churchill Properties", src: "/logos/churchill.svg", height: 52, mobileHeight: 40 },
  { name: "Keller Williams Realty", src: "/logos/keller-williams.svg", height: 48, mobileHeight: 36 },
  { name: "Lyv Realty", src: "/logos/lyv-realty.png", height: 46, mobileHeight: 34 },
  { name: "eXp Realty", src: "/logos/exp-realty.svg", height: 40, mobileHeight: 30 },
];




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
  const [open, setOpen] = useState(false);
  return (
    <nav className="nb-nav">
      <div className="nb-nav-inner">
        <Link to={ROUTES.home} className="nb-logo" aria-label="1031ExchangeUP™ home">
          <span className="nb-logo-num">1031</span><span className="nb-logo-word">Exchange</span><span className="nb-logo-up">UP</span><LogoArrow /><sup className="nb-logo-tm">™</sup>
        </Link>
        <div className="nb-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nb-navlink">{l.label}</a>
          ))}
        </div>
        <div className="nb-nav-actions">
          <Link to={ROUTES.login} className="nb-nav-btn nb-nav-btn-login">Log In</Link>
          <Link to={ROUTES.signup} className="nb-nav-btn nb-nav-btn-join">Join Free</Link>
          <button
            type="button"
            className="nb-nav-burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="nb-nav-mobile">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nb-nav-mlink" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to={ROUTES.login} className="nb-nav-mlink" onClick={() => setOpen(false)}>Log In</Link>
        </div>
      )}
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
    </div>
  );
}




const BADGES = [
  { txt: ["Free for Agents", "& Investors"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="m8.5 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
  { txt: ["Continuous Monitoring", "with Exchange IQ™"], svg: (<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" /><path d="M10 4v2M14 4v2M10 18v2M14 18v2M4 10h2M4 14h2M18 10h2M18 14h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["No Obligation", "to Exchange"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" /><path d="M15.5 14.4c2.7.2 5 1.9 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["Register a Property", "in Minutes"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
];


const AUDIENCE_CARDS = [
  {
    key: "investor" as const,
    tag: "I Own Investment Property",
    txt: "Add it once. ExchangeUp™ keeps monitoring for a smarter place for your equity.",
    cta: "Show details",
    svg: (<svg viewBox="0 0 24 24"><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M5.6 10v10h12.8V10" /><rect x="10" y="14.5" width="4" height="5.5" /></svg>),
  },
  {
    key: "agent" as const,
    tag: "I’m a Real Estate Agent",
    txt: "Your database may already hold your next transaction. Add clients and properties — monitored continuously.",
    cta: "Show details",
    svg: (<svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13.5" rx="2.2" /><path d="M8 7V5.2A2.2 2.2 0 0 1 10.2 3h3.6A2.2 2.2 0 0 1 16 5.2V7" /><line x1="2.5" y1="12.6" x2="21.5" y2="12.6" /></svg>),
  },
];




function NbAudienceCards() {
  const [open, setOpen] = useState<"agent" | "investor" | null>(null);
  const toggle = (key: "agent" | "investor") => setOpen((prev) => (prev === key ? null : key));

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "agents" || hash === "investors") {
        const key = hash === "agents" ? "agent" : "investor";
        setOpen(key);
        // wait for the dropdown to render, then scroll to its section
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <section className="nb-aud" aria-label="Choose your path">
      <div className="nb-aud-grid nb-aud-grid-2">
        {AUDIENCE_CARDS.map((c) => {
          const isOpen = open === c.key;
          return (
            <button
              key={c.tag}
              type="button"
              className={`nb-aud-card ${isOpen ? "is-open" : ""}`}
              onClick={() => toggle(c.key)}
              aria-expanded={isOpen}
            >
              <span className="nb-aud-ico" aria-hidden="true">{c.svg}</span>
              <div className="nb-aud-tag">{c.tag}</div>
              <p className="nb-aud-txt">{c.txt}</p>
              <span className="nb-aud-link">
                {isOpen ? "Hide details" : c.cta}
                <span className="nb-aud-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {open === "investor" && (
        <div className="nb-aud-dropdown">
          <Sec_investors />
        </div>
      )}
      {open === "agent" && (
        <div className="nb-aud-dropdown">
          <Sec_agents />
        </div>
      )}
    </section>
  );
}



function NbHero() {
  return (
    <section className="nb-hero">
      <SkyBackdrop />
      <div className="nb-hero-inner mx-auto max-w-[1240px] px-5 py-16 text-center sm:px-8 lg:py-24">
        <h1 className="nb-hero-h1 mx-auto max-w-[620px]">
          Finding Your 1031 Replacement Property Just Got A LOT Easier.
        </h1>
        <p className="nb-hero-sub mx-auto mt-5 max-w-[540px]">
          Register your property. Our data-driven AI continuously monitors investment opportunities in our network and alerts you when it finds a smarter property to exchange into.
        </p>

        <div className="nb-cta-row justify-center" style={{ marginTop: 32 }}>
          <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Find My Replacement Property</Link>
          <a href="#steps" className="nb-btn-demo">See How It Works</a>
        </div>

        <div className="nb-badges justify-center">
          {BADGES.map((b, i) => (
            <div key={i} className="nb-badge">
              <span className="nb-badge-ico" aria-hidden="true">{b.svg}</span>
              <span className="nb-badge-txt">{b.txt.map((t, j) => (<span key={j}>{t}{j < b.txt.length - 1 ? <br /> : null}</span>))}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function NbMonitorSteps() {
  const hub = { cx: 450, cy: 300, r: 104 };
  const orbitRadius = 255;
  const nodeOffset = 46;
  const labels = [
    "Investor A",
    "Investor B",
    "Investor C",
    "Investor D",
    "Investor E",
    "Investor F",
  ];
  const angles = [270, 330, 30, 90, 150, 210]; // degrees from 3 o'clock counter-clockwise

  const nodes = labels.map((label, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    const cx = hub.cx + orbitRadius * Math.cos(rad);
    const cy = hub.cy + orbitRadius * Math.sin(rad);
    const dx = hub.cx - cx;
    const dy = hub.cy - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    // perpendicular unit vector to offset the return-opportunity arrow
    const px = -uy;
    const py = ux;
    const outOffset = 12;
    return {
      label,
      cx,
      cy,
      // inward arrow: investor lists property into the network
      inSx: cx + ux * nodeOffset,
      inSy: cy + uy * nodeOffset,
      inEx: hub.cx - ux * hub.r,
      inEy: hub.cy - uy * hub.r,
      // outward arrow: exchange-up opportunities flow back to the investor
      outSx: hub.cx - ux * (hub.r - 8),
      outSy: hub.cy - uy * (hub.r - 8),
      outEx: cx + ux * nodeOffset + px * outOffset,
      outEy: cy + uy * nodeOffset + py * outOffset,
    };
  });

  return (
    <section id="steps" className="nb-diagram" aria-label="How the network works">
      <div className="nb-diagram-inner">
        <div className="nb-diagram-flow">
          <p className="nb-diagram-eyebrow">How It Works</p>
          <HowItWorksFlow />
        </div>
        <h2 className="nb-diagram-h2">Every property added makes the network smarter.</h2>
        <p className="nb-diagram-lead">
          Real estate agents and property owners all feed the growing network — and every new property makes it more useful for everyone. <span style={{ color: "#43a047" }}>Exchange IQ™</span> monitors continuously and alerts the investor or agent when a better fit appears.
        </p>

        <svg
          className="nb-net"
          viewBox="0 0 900 620"
          role="img"
          aria-label="Real estate agents and property owners each add their property to the 1031 ExchangeUP network and receive matched opportunities back from it."
        >
          <defs>
            <marker id="nbArrowIn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#43a047" />
            </marker>
            <marker id="nbArrowOut" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#ffffff" />
            </marker>
          </defs>

          {nodes.map((n) => (
            <g key={n.label}>
              <line
                x1={n.inSx} y1={n.inSy} x2={n.inEx} y2={n.inEy}
                stroke="#43a047" strokeWidth="2.5" strokeLinecap="round"
                markerEnd="url(#nbArrowIn)"
              />
              <line
                x1={n.outSx} y1={n.outSy} x2={n.outEx} y2={n.outEy}
                stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray="6 4"
                markerEnd="url(#nbArrowOut)"
              />
              <rect x={n.cx - 112} y={n.cy - 28} width="224" height="56" rx="18" fill="#ffffff" />
              <text x={n.cx} y={n.cy + 6} textAnchor="middle" fontSize="25" fontWeight="800" fill="#0b1f3d">{n.label}</text>
            </g>
          ))}

          <circle cx={hub.cx} cy={hub.cy} r={hub.r} fill="#ffffff" />
          <circle cx={hub.cx} cy={hub.cy} r={hub.r + 14} fill="none" stroke="rgba(67,160,71,.45)" strokeWidth="2" />
          <text x={hub.cx} y={hub.cy - 18} textAnchor="middle" fontSize="30" fontWeight="800" fill="#0b1f3d">1031</text>
          <text x={hub.cx} y={hub.cy + 14} textAnchor="middle" fontSize="26" fontWeight="800" fill="#0b1f3d">
            Exchange<tspan fill="#43a047">UP</tspan><tspan fontSize="14" dy="-8">™</tspan>
          </text>
          <text x={hub.cx} y={hub.cy + 46} textAnchor="middle" fontSize="15" fontWeight="700" fill="#43a047" letterSpacing="1.5">
            MONITORING ACTIVE
          </text>
        </svg>

        <div className="nb-net-legend">
          <span><i className="nb-net-dot" style={{ background: "#43a047" }} /> Investors list properties</span>
          <span><i className="nb-net-dot" style={{ background: "#ffffff" }} /> Opportunities to exchange up flow back</span>
        </div>
      </div>
    </section>
  );
}



function NbLogoMarquee() {
  return (
    <section className="nb-mq">
      <p className="nb-mq-label">Trusted by Real Estate Agents & Brokers</p>
      <div className="nb-mq-viewport">
        <div className="nb-mq-track">
          {[0, 1].map((group) => (
            <div className="nb-mq-group" key={group} aria-hidden={group === 1 ? "true" : undefined}>
              {LOGO_BRANDS.map((brand) => (
                <span
                  key={`${group}-${brand.name}`}
                  className="nb-mq-logo"
                  style={{ ["--brand-h" as string]: `${brand.height}px`, ["--brand-h-mobile" as string]: `${brand.mobileHeight}px` }}
                >
                  <img src={brand.src} alt={group === 0 ? brand.name : ""} loading="lazy" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "1031ExchangeUp™ — Finding Your 1031 Replacement Property Just Got A LOT Easier";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Register your property. Our data-driven AI continuously monitors investment opportunities in our network and alerts you when it finds a smarter property to exchange into.",
      );
    }
  }, []);

  // Scroll to the hash target once sections have mounted (deep links like /#steps).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
      if (tries++ < 20) window.setTimeout(tick, 100);
    };
    tick();
  }, []);


  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <style>{SECTIONS_CSS}</style>
      <NbNav />
      <NbHero />
      <NbMonitorSteps />
      <NbWhyNow />
      <NbAudienceCards />

      <NbLogoMarquee />
      <LandingSections />
    </div>
  );
}

const WHY_NOW_CSS = `
  [data-nb] .nb-now { background: #eef3fb; border-top: 1px solid #e3eaf4; border-bottom: 1px solid #e3eaf4; }
  [data-nb] .nb-now-inner { margin: 0 auto; max-width: 1240px; padding: 46px 20px; display: grid; gap: 22px; align-items: center; }
  @media (min-width: 900px) { [data-nb] .nb-now-inner { grid-template-columns: 1fr 1fr; padding: 54px 32px; gap: 40px; } }
  [data-nb] .nb-now-h { font-size: clamp(23px, 2.4vw, 31px); font-weight: 800; letter-spacing: -.02em; color: #16284a; line-height: 1.15; }
  [data-nb] .nb-now-p { margin-top: 12px; font-size: 16px; line-height: 1.6; color: #56657a; }
  [data-nb] .nb-now-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  [data-nb] .nb-now-li { display: flex; align-items: flex-start; gap: 10px; font-size: 15.5px; line-height: 1.45; color: #33405a; font-weight: 600; }
  [data-nb] .nb-now-x { flex: none; width: 20px; height: 20px; border-radius: 999px; background: #43a047; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
`;

function NbWhyNow() {
  return (
    <section id="why-now" className="nb-now" aria-label="Why start monitoring now">
      <style>{WHY_NOW_CSS}</style>
      <div className="nb-now-inner">
        <div>
          <h2 className="nb-now-h">Don’t Wait for the 45-Day Clock to Start.</h2>
          <p className="nb-now-p">
            ExchangeUp™ can monitor for smarter opportunities long before you decide to sell. Add your property today and
            let the system continuously evaluate opportunities as the network changes.
          </p>
        </div>
        <ul className="nb-now-list">
          {[
            "You don’t need to be actively selling.",
            "You don’t need to already be in a 1031 exchange.",
            "You don’t need to keep coming back to search.",
            "We monitor the opportunity landscape continuously.",
          ].map((t) => (
            <li className="nb-now-li" key={t}>
              <span className="nb-now-x" aria-hidden="true">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


export { NB_STYLE, SkyBackdrop };



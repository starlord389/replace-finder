import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

/* ─────────────────────────────────────────────────────────────────────────
   NEW BRAND — navy + green "AI-powered matchmaking" landing page.
   Hero assembled from four focused passes (skyline backdrop, matchmaking
   network graphic, nav/logo, CTAs + trust badges). Scoped under [data-nb].
   Person headshots are placeholders pending real photos.
   ───────────────────────────────────────────────────────────────────────── */

const NB_STYLE = `
  [data-nb] { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #16284a; -webkit-font-smoothing: antialiased; }
  [data-nb] h1, [data-nb] h2, [data-nb] h3 { letter-spacing: -0.02em; }

  /* hero shell */
  [data-nb] .nb-hero { position: relative; overflow: hidden; background: #0b1f3d; }
  [data-nb] .nb-hero-inner { position: relative; z-index: 10; }
  [data-nb] .nb-hero-h1 { font-size: clamp(30px, 3.4vw, 44px); font-weight: 800; line-height: 1.12; color: #fff; }
  [data-nb] .nb-hero-sub { font-size: 17px; line-height: 1.6; color: rgba(255,255,255,.8); }

  /* ===== top nav + logo ===== */
  [data-nb] .nb-nav { position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid #e8edf3; }
  [data-nb] .nb-nav-inner { margin: 0 auto; max-width: 1200px; height: 68px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; }
  @media (max-width: 640px) { [data-nb] .nb-nav-inner { padding: 0 20px; } }
  [data-nb] .nb-logo { display: inline-flex; align-items: center; gap: 3px; font-size: 22px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; color: #16284a; white-space: nowrap; text-decoration: none; }
  [data-nb] .nb-logo .up { color: #16284a; }
  [data-nb] .nb-logo-arrow { width: 16px; height: 16px; flex: none; color: #43a047; margin-left: 1px; }
  [data-nb] .nb-nav-links { display: none; align-items: center; gap: 34px; }
  @media (min-width: 1024px) { [data-nb] .nb-nav-links { display: flex; } }
  [data-nb] .nb-navlink { font-size: 15px; font-weight: 600; color: #33405a; text-decoration: none; transition: color .15s ease; }
  [data-nb] .nb-navlink:hover { color: #43a047; }
  [data-nb] .nb-nav-actions { display: flex; align-items: center; gap: 12px; }
  [data-nb] .nb-nav-btn { display: inline-flex; align-items: center; justify-content: center; height: 40px; border-radius: 8px; font-size: 15px; font-weight: 700; line-height: 1; text-decoration: none; white-space: nowrap; cursor: pointer; transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
  [data-nb] .nb-nav-btn-login { display: none; padding: 0 18px; background: #fff; color: #16284a; border: 1.5px solid #16284a; }
  [data-nb] .nb-nav-btn-login:hover { background: #16284a; color: #fff; }
  @media (min-width: 480px) { [data-nb] .nb-nav-btn-login { display: inline-flex; } }
  [data-nb] .nb-nav-btn-join { padding: 0 20px; background: #43a047; color: #fff; border: 1.5px solid #43a047; }
  [data-nb] .nb-nav-btn-join:hover { background: #3a8c3e; border-color: #3a8c3e; }

  /* ===== hero skyline backdrop (.nb-sky) ===== */
  [data-nb] .nb-sky { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  [data-nb] .nb-sky > * { position: absolute; inset: 0; width: 100%; height: 100%; }
  [data-nb] .nb-sky-base { background: radial-gradient(80% 70% at 78% 8%, rgba(36,84,140,.55) 0%, rgba(36,84,140,0) 60%), radial-gradient(60% 50% at 60% 90%, rgba(20,60,100,.4) 0%, rgba(20,60,100,0) 70%), linear-gradient(180deg, #0b1f3d 0%, #0c2548 48%, #0a1c37 100%); }
  [data-nb] .nb-sky-city svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  [data-nb] .nb-sky-overlay { background: linear-gradient(95deg, rgba(11,31,61,.92) 0%, rgba(11,31,61,.86) 32%, rgba(11,31,61,.7) 58%, rgba(12,37,72,.46) 80%, rgba(14,42,80,.34) 100%), radial-gradient(120% 130% at 0% 30%, rgba(8,22,44,.55) 0%, rgba(8,22,44,0) 55%); }
  [data-nb] .nb-sky-vignette { background: radial-gradient(130% 120% at 50% 40%, rgba(0,0,0,0) 55%, rgba(5,14,30,.4) 100%), linear-gradient(180deg, transparent 60%, rgba(5,14,30,.6) 100%); }
  [data-nb] .nb-sky-net { left: auto; right: 0; width: 58%; }
  [data-nb] .nb-sky-net svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  @keyframes nb-sky-pulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
  [data-nb] .nb-sky-net .nb-pulse { animation: nb-sky-pulse 4.5s ease-in-out infinite; }
  [data-nb] .nb-sky-net .nb-pulse:nth-of-type(3n) { animation-duration: 6s; animation-delay: 1.2s; }
  [data-nb] .nb-sky-net .nb-pulse:nth-of-type(3n+1) { animation-duration: 5.2s; animation-delay: .6s; }

  /* ===== hero matchmaking network graphic (.nb-net) ===== */
  [data-nb] .nb-net { position: relative; width: 100%; max-width: 520px; margin-left: auto; aspect-ratio: 1 / 1; --nb-line: rgba(95,193,170,.5); --nb-line-soft: rgba(95,193,170,.28); }
  [data-nb] .nb-net::before { content: ''; position: absolute; left: 50%; top: 50%; width: 78%; height: 78%; transform: translate(-50%,-50%); border-radius: 999px; background: radial-gradient(circle, rgba(95,193,170,.22) 0%, rgba(95,193,170,0) 62%); filter: blur(6px); z-index: 0; pointer-events: none; }
  [data-nb] .nb-net-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; overflow: visible; pointer-events: none; }
  [data-nb] .nb-net-line { stroke: var(--nb-line); stroke-width: .55; stroke-dasharray: 1.6 1.8; stroke-linecap: round; fill: none; filter: drop-shadow(0 0 1.4px rgba(95,193,170,.55)); }
  [data-nb] .nb-net-line.soft { stroke: var(--nb-line-soft); }
  [data-nb] .nb-net-dot { fill: #5cc15f; filter: drop-shadow(0 0 2px rgba(92,193,95,.7)); }
  [data-nb] .nb-net-dot.j { fill: rgba(95,193,170,.85); }
  [data-nb] .nb-net-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 112px; height: 112px; border-radius: 999px; background: #fff; box-shadow: 0 14px 44px rgba(4,14,30,.42), 0 0 0 6px rgba(255,255,255,.10); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; z-index: 4; }
  [data-nb] .nb-net-center .nb-hub-brand { font-weight: 800; font-size: 14px; line-height: 1.05; color: #16284a; letter-spacing: -.01em; }
  [data-nb] .nb-net-center .nb-hub-arrow { display: inline-flex; align-items: center; justify-content: center; margin-top: 4px; width: 20px; height: 20px; border-radius: 999px; background: rgba(67,160,71,.12); }
  [data-nb] .nb-net-center .nb-hub-arrow svg { width: 12px; height: 12px; color: #43a047; }
  [data-nb] .nb-node { position: absolute; transform: translate(-50%,-50%); z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 7px; width: 150px; text-align: center; }
  [data-nb] .nb-node-av { width: 78px; height: 78px; border-radius: 999px; border: 3px solid #fff; background-color: #1b3a63; background-size: cover; background-position: center; box-shadow: 0 10px 26px rgba(4,14,30,.40); position: relative; }
  [data-nb] .nb-node-av::after { content: ''; position: absolute; inset: -3px; border-radius: 999px; box-shadow: 0 0 0 1px rgba(95,193,170,.35); }
  [data-nb] .nb-node-meta { line-height: 1.2; }
  [data-nb] .nb-node-tag { display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #16284a; background: rgba(255,255,255,.94); border-radius: 999px; padding: 2px 9px; margin: 0 auto 4px; width: fit-content; box-shadow: 0 2px 8px rgba(4,14,30,.18); }
  [data-nb] .nb-node-lbl { display: block; font-size: 9.5px; font-weight: 500; line-height: 1.3; color: rgba(255,255,255,.78); max-width: 130px; margin: 0 auto; }
  [data-nb] .nb-prop { position: absolute; transform: translate(-50%,-50%); z-index: 2; border-radius: 999px; border: 3px solid rgba(255,255,255,.92); background-color: #14305a; background-size: cover; background-position: center; box-shadow: 0 8px 22px rgba(4,14,30,.40); }
  [data-nb] .nb-prop::after { content: ''; position: absolute; inset: 0; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(95,193,170,.30); }
  @media (max-width: 1023px) { [data-nb] .nb-net { margin: 0 auto; max-width: 420px; } }
  @media (max-width: 480px) { [data-nb] .nb-net-center { width: 96px; height: 96px; } [data-nb] .nb-net-center .nb-hub-brand { font-size: 12px; } [data-nb] .nb-node-av { width: 66px; height: 66px; } }

  /* ===== hero CTAs + trust badges ===== */
  [data-nb] .nb-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
  [data-nb] .nb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 9px; height: 48px; padding: 0 26px; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px; line-height: 1; letter-spacing: .01em; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background .18s ease, box-shadow .18s ease, transform .12s ease, color .18s ease, border-color .18s ease; white-space: nowrap; }
  [data-nb] .nb-btn:active { transform: translateY(1px); }
  [data-nb] .nb-btn-green { background: #43a047; color: #fff; box-shadow: 0 8px 20px rgba(67,160,71,.34); }
  [data-nb] .nb-btn-green:hover { background: #3a8c3e; box-shadow: 0 10px 26px rgba(67,160,71,.44); }
  [data-nb] .nb-btn-demo { background: rgba(255,255,255,.06); color: #fff; border-color: rgba(255,255,255,.32); padding: 0 8px 0 22px; gap: 14px; }
  [data-nb] .nb-btn-demo:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.5); }
  [data-nb] .nb-play { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; background: #43a047; box-shadow: 0 3px 8px rgba(67,160,71,.45); flex: 0 0 auto; transition: background .18s ease; }
  [data-nb] .nb-btn-demo:hover .nb-play { background: #5cc15f; }
  [data-nb] .nb-play svg { width: 12px; height: 12px; display: block; margin-left: 1px; }
  [data-nb] .nb-badges { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px 30px; margin-top: 38px; }
  [data-nb] .nb-badge { display: inline-flex; align-items: center; gap: 10px; }
  [data-nb] .nb-badge-ico { display: inline-flex; align-items: center; justify-content: center; width: 17px; flex: 0 0 auto; }
  [data-nb] .nb-badge-ico svg { width: 17px; height: 17px; display: block; color: #5cc15f; }
  [data-nb] .nb-badge-txt { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 600; line-height: 1.28; color: rgba(255,255,255,.8); }
  @media (max-width: 480px) { [data-nb] .nb-btn-green, [data-nb] .nb-btn-demo { width: 100%; } [data-nb] .nb-badges { gap: 16px 24px; } }

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

const NET_NODES = [
  { tag: "BUYER", lbl: "Looking for Replacement Property", x: 48, y: 15, photo: "/headshot-buyer.jpg" },
  { tag: "AGENT", lbl: "Investor-Focused Real Estate Agent", x: 17, y: 45, photo: "/headshot-agent.jpg" },
  { tag: "SELLER", lbl: "1031 Exchange Property Owner", x: 83, y: 45, photo: "/headshot-seller.jpg" },
];
const NET_PROPS = [
  { x: 78, y: 20, size: 52, photo: "/landing-prop-retail.jpg", soft: true },
  { x: 91, y: 66, size: 46, photo: "/landing-prop-office.jpg", soft: true },
  { x: 70, y: 87, size: 62, photo: "/landing-prop-industrial.jpg", soft: true },
  { x: 47, y: 92, size: 56, photo: "/landing-prop-retail.jpg", soft: true },
  { x: 24, y: 83, size: 60, photo: "/landing-prop-office.jpg", soft: true },
  { x: 11, y: 70, size: 44, photo: "/landing-prop-industrial.jpg", soft: true },
];

function NbNav() {
  return (
    <nav className="nb-nav">
      <div className="nb-nav-inner">
        <Link to={ROUTES.home} className="nb-logo" aria-label="1031ExchangeUp home">
          <span>1031Exchange</span><span className="up">Up</span>
          <svg className="nb-logo-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 11.5L11 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 4.5H11V10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
      <div className="nb-sky-city">
        <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="nbBldgFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a63" /><stop offset="100%" stopColor="#102a4d" />
            </linearGradient>
            <linearGradient id="nbBldgNear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#142e54" /><stop offset="100%" stopColor="#0a1d39" />
            </linearGradient>
            <linearGradient id="nbWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c2447" stopOpacity="0.55" /><stop offset="100%" stopColor="#0a1c37" stopOpacity="0" />
            </linearGradient>
            <filter id="nbWindowGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>
          <g fill="url(#nbBldgFar)" opacity="0.85">
            <rect x="40" y="320" width="46" height="200" /><rect x="96" y="300" width="34" height="220" /><rect x="150" y="345" width="58" height="175" /><rect x="225" y="285" width="40" height="235" /><rect x="300" y="330" width="50" height="190" /><rect x="372" y="360" width="44" height="160" /><rect x="470" y="310" width="38" height="210" /><rect x="540" y="338" width="56" height="182" /><rect x="640" y="300" width="42" height="220" /><rect x="720" y="350" width="48" height="170" /><rect x="800" y="318" width="36" height="202" /><rect x="880" y="340" width="54" height="180" /><rect x="980" y="306" width="40" height="214" /><rect x="1060" y="348" width="50" height="172" /><rect x="1140" y="330" width="44" height="190" />
          </g>
          <g fill="url(#nbBldgNear)">
            <rect x="0" y="300" width="64" height="220" /><rect x="70" y="250" width="52" height="270" /><rect x="128" y="290" width="70" height="230" /><rect x="206" y="210" width="48" height="310" /><rect x="226" y="178" width="8" height="36" /><rect x="262" y="278" width="60" height="242" /><rect x="330" y="240" width="44" height="280" /><rect x="384" y="300" width="66" height="220" /><rect x="462" y="226" width="50" height="294" /><rect x="522" y="272" width="58" height="248" /><rect x="590" y="194" width="46" height="326" /><rect x="610" y="170" width="6" height="30" /><rect x="648" y="262" width="62" height="258" /><rect x="720" y="296" width="48" height="224" /><rect x="778" y="234" width="54" height="286" /><rect x="842" y="284" width="68" height="236" /><rect x="920" y="246" width="46" height="274" /><rect x="976" y="208" width="52" height="312" /><rect x="996" y="180" width="7" height="32" /><rect x="1038" y="288" width="60" height="232" /><rect x="1108" y="252" width="50" height="268" /><rect x="1168" y="296" width="48" height="224" />
          </g>
          <g fill="#ffd79a" filter="url(#nbWindowGlow)">
            <rect x="82" y="272" width="4" height="5" opacity="0.85" /><rect x="94" y="272" width="4" height="5" opacity="0.5" /><rect x="82" y="290" width="4" height="5" opacity="0.7" /><rect x="106" y="290" width="4" height="5" opacity="0.9" /><rect x="94" y="312" width="4" height="5" opacity="0.6" /><rect x="218" y="236" width="4" height="5" opacity="0.9" /><rect x="230" y="236" width="4" height="5" opacity="0.6" /><rect x="218" y="256" width="4" height="5" opacity="0.75" /><rect x="242" y="256" width="4" height="5" opacity="0.5" /><rect x="230" y="284" width="4" height="5" opacity="0.85" /><rect x="218" y="312" width="4" height="5" opacity="0.55" /><rect x="340" y="262" width="4" height="5" opacity="0.8" /><rect x="356" y="262" width="4" height="5" opacity="0.55" /><rect x="348" y="288" width="4" height="5" opacity="0.9" /><rect x="340" y="316" width="4" height="5" opacity="0.65" /><rect x="472" y="248" width="4" height="5" opacity="0.85" /><rect x="490" y="248" width="4" height="5" opacity="0.55" /><rect x="472" y="272" width="4" height="5" opacity="0.7" /><rect x="490" y="296" width="4" height="5" opacity="0.9" /><rect x="600" y="220" width="4" height="5" opacity="0.9" /><rect x="616" y="220" width="4" height="5" opacity="0.6" /><rect x="600" y="246" width="4" height="5" opacity="0.75" /><rect x="616" y="272" width="4" height="5" opacity="0.5" /><rect x="608" y="304" width="4" height="5" opacity="0.8" /><rect x="790" y="258" width="4" height="5" opacity="0.85" /><rect x="808" y="258" width="4" height="5" opacity="0.55" /><rect x="790" y="286" width="4" height="5" opacity="0.7" /><rect x="808" y="312" width="4" height="5" opacity="0.9" /><rect x="986" y="232" width="4" height="5" opacity="0.9" /><rect x="1004" y="232" width="4" height="5" opacity="0.6" /><rect x="986" y="260" width="4" height="5" opacity="0.75" /><rect x="1004" y="288" width="4" height="5" opacity="0.55" /><rect x="1118" y="276" width="4" height="5" opacity="0.8" /><rect x="1136" y="276" width="4" height="5" opacity="0.5" /><rect x="1126" y="302" width="4" height="5" opacity="0.85" />
          </g>
          <rect x="0" y="500" width="1200" height="20" fill="url(#nbWater)" />
        </svg>
      </div>
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
          <g fill="rgba(95,193,170,.32)">
            <circle cx="380" cy="30" r="1.4" /><circle cx="110" cy="120" r="1.4" /><circle cx="540" cy="220" r="1.4" /><circle cx="240" cy="160" r="1.4" /><circle cx="400" cy="250" r="1.4" />
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
        {[...NET_NODES, ...NET_PROPS].map((n, i) => (
          <line key={`l-${i}`} className={`nb-net-line${(n as { soft?: boolean }).soft ? " soft" : ""}`} x1="50" y1="50" x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
        ))}
        {[...NET_NODES, ...NET_PROPS].map((n, i) => (
          <g key={`d-${i}`}>
            <circle className="nb-net-dot" cx={50 + (n.x - 50) * 0.4} cy={50 + (n.y - 50) * 0.4} r="0.9" />
            <circle className="nb-net-dot j" cx={50 + (n.x - 50) * 0.72} cy={50 + (n.y - 50) * 0.72} r="0.7" />
          </g>
        ))}
      </svg>
      {NET_PROPS.map((p, i) => (
        <div key={`p-${i}`} className="nb-prop" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundImage: `url(${p.photo})` }} />
      ))}
      {NET_NODES.map((n) => (
        <div key={n.tag} className="nb-node" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="nb-node-av" style={{ backgroundImage: `url(${n.photo})` }} />
          <span className="nb-node-meta">
            <span className="nb-node-tag">{n.tag}</span>
            <span className="nb-node-lbl">{n.lbl}</span>
          </span>
        </div>
      ))}
      <div className="nb-net-center">
        <span className="nb-hub-brand">1031<br />ExchangeUp</span>
        <span className="nb-hub-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="19" x2="12" y2="5" /><polyline points="6 11 12 5 18 11" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function NbHero() {
  return (
    <section className="nb-hero">
      <SkyBackdrop />
      <div className="nb-hero-inner mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <h1 className="nb-hero-h1 max-w-[600px]">
            The AI-Powered Matchmaking Platform for 1031 Exchange Buyers, Sellers &amp; Investor-Friendly Real Estate Agents.
          </h1>
          <p className="nb-hero-sub mt-5 max-w-[520px]">
            Finally, a better way to connect exchange buyers, replacement properties, and investor-friendly
            agents—all in one place.
          </p>

          <div className="nb-cta-row" style={{ marginTop: 32 }}>
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Join the Network (Free)</Link>
            <button type="button" className="nb-btn nb-btn-demo">
              Watch 2-Minute Demo
              <span className="nb-play" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 1.3 10 6 2.5 10.7V1.3Z" fill="#fff" /></svg>
              </span>
            </button>
          </div>

          <div className="nb-badges">
            <span className="nb-badge">
              <span className="nb-badge-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3.5l1.6 4.6 4.6 1.6-4.6 1.6L12 16l-1.6-4.7L5.8 9.7l4.6-1.6L12 3.5Z" />
                  <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
                </svg>
              </span>
              <span className="nb-badge-txt">AI Powered</span>
            </span>
            <span className="nb-badge">
              <span className="nb-badge-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.6l2.3 1.7 2.9-.2 .9 2.7 2.4 1.6-1 2.7 1 2.7-2.4 1.6-.9 2.7-2.9-.2L12 21.4l-2.3-1.7-2.9.2-.9-2.7L3.5 15.6l1-2.7-1-2.7L5.9 8.6l.9-2.7 2.9.2L12 2.6Z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span className="nb-badge-txt">Free for<br />Founding Members</span>
            </span>
            <span className="nb-badge">
              <span className="nb-badge-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
                  <circle cx="10" cy="7.5" r="3" />
                  <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
                  <path d="M15.5 4.7a3 3 0 0 1 0 5.6" />
                </svg>
              </span>
              <span className="nb-badge-txt">Built by<br />Investor-Friendly Agents</span>
            </span>
            <span className="nb-badge">
              <span className="nb-badge-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 1.8" />
                </svg>
              </span>
              <span className="nb-badge-txt">Takes Less Than<br />5 Minutes</span>
            </span>
          </div>
        </div>

        <HeroNetwork />
      </div>
    </section>
  );
}

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

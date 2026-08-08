import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { SECTIONS_CSS, LandingSections } from "./HomeSections";

/* ─────────────────────────────────────────────────────────────────────────
   NEW BRAND — navy + green Exchange IQ matchmaking landing page.
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
    [data-nb] .nb-nav-actions { gap: 8px; }
    [data-nb] .nb-nav-btn-join { padding: 0 14px; font-size: 14px; height: 40px; }
    [data-nb] .nb-nav-burger { width: 40px; height: 40px; }
  }

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
  [data-nb] .nb-cw-line { stroke: #33d6c9; fill: none; stroke-width: .9; stroke-linecap: round; opacity: .8; filter: drop-shadow(0 0 1.5px rgba(51,214,201,.9)); }
  [data-nb] .nb-web-line { stroke: #33d6c9; fill: none; stroke-width: .7; stroke-linecap: round; opacity: .5; filter: drop-shadow(0 0 1.1px rgba(51,214,201,.8)); }
  [data-nb] .nb-cw-dot { fill: #7ff0e4; filter: drop-shadow(0 0 1.8px rgba(51,214,201,.95)); }
  [data-nb] .nb-net-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 134px; height: 134px; border-radius: 999px; background: #fff; box-shadow: 0 16px 50px rgba(4,14,30,.5), 0 0 0 8px rgba(255,255,255,.1); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; z-index: 4; }
  [data-nb] .nb-hub-1031 { font-size: 28px; font-weight: 800; color: #16284a; line-height: 1; letter-spacing: -.02em; }
  [data-nb] .nb-hub-ex { margin-top: 1px; font-size: 16px; font-weight: 800; color: #16284a; line-height: 1; letter-spacing: -.01em; display: inline-flex; align-items: center; }
  [data-nb] .nb-hub-ex .up { color: #43a047; text-transform: uppercase; }
  [data-nb] .nb-hub-arrow { width: 10px; height: 10px; margin-left: 1px; transform: translateY(-2px); }
  [data-nb] .nb-cap { position: absolute; transform: translate(-50%,-50%); z-index: 3; width: max-content; display: inline-flex; align-items: center; gap: 11px; background: rgba(255,255,255,.97); border: 1px solid rgba(150,190,225,.5); border-radius: 999px; padding: 6px 18px 6px 6px; box-shadow: 0 12px 26px rgba(4,14,30,.4); }
  [data-nb] .nb-cap-desc { white-space: nowrap; }
  [data-nb] .nb-cap.rev { flex-direction: row-reverse; padding: 6px 6px 6px 18px; }
  [data-nb] .nb-cap-ico { width: 46px; height: 46px; border-radius: 999px; background: #16284a; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
  [data-nb] .nb-cap-ico svg { width: 23px; height: 23px; stroke: #5cc15f; stroke-width: 1.9; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  [data-nb] .nb-cap-txt { max-width: 132px; }
  [data-nb] .nb-cap.rev .nb-cap-txt { text-align: right; }
  [data-nb] .nb-cap-role { display: block; font-size: 11.5px; font-weight: 800; letter-spacing: .09em; color: #16284a; line-height: 1.1; }
  [data-nb] .nb-cap-desc { display: block; margin-top: 2px; font-size: 10px; font-weight: 500; line-height: 1.25; color: #56657a; }
  [data-nb] .nb-prop { position: absolute; transform: translate(-50%,-50%); z-index: 2; border-radius: 999px; border: 3px solid rgba(255,255,255,.92); background-color: #14305a; background-size: cover; background-position: center; box-shadow: 0 8px 22px rgba(4,14,30,.45); }
  [data-nb] .nb-prop::after { content: ''; position: absolute; inset: 0; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(46,211,198,.35); }
  @media (max-width: 1023px) { [data-nb] .nb-net { margin: 0 auto; max-width: 470px; } }
  @media (max-width: 480px) {
    [data-nb] .nb-net-center { width: 102px; height: 102px; box-shadow: 0 12px 34px rgba(4,14,30,.5), 0 0 0 6px rgba(255,255,255,.1); }
    [data-nb] .nb-hub-1031 { font-size: 21px; }
    [data-nb] .nb-hub-ex { font-size: 13px; }
    [data-nb] .nb-cap { gap: 8px; padding: 4px 12px 4px 4px; }
    [data-nb] .nb-cap.rev { padding: 4px 4px 4px 12px; }
    [data-nb] .nb-cap-ico { width: 36px; height: 36px; }
    [data-nb] .nb-cap-ico svg { width: 18px; height: 18px; }
    [data-nb] .nb-cap-txt { max-width: 92px; }
    [data-nb] .nb-cap-role { font-size: 9.5px; }
    [data-nb] .nb-cap-desc { font-size: 8px; }
    [data-nb] .nb-prop { transform: translate(-50%,-50%) scale(.78); }
  }

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
  [data-nb] .nb-aud-card { border: 1px solid #e8edf3; border-radius: 16px; background: #fff; padding: 24px 22px; box-shadow: 0 2px 12px rgba(14,42,77,.06); }
  [data-nb] .nb-aud-ico { width: 44px; height: 44px; border-radius: 12px; background: #eef6ef; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  [data-nb] .nb-aud-ico svg { width: 22px; height: 22px; stroke: #43a047; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  [data-nb] .nb-aud-tag { font-size: 12px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: #43a047; }
  [data-nb] .nb-aud-txt { margin-top: 8px; font-size: 16px; line-height: 1.5; font-weight: 600; color: #16284a; }
  [data-nb] .nb-aud-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 940px; }
  @media (max-width: 900px) { [data-nb] .nb-aud-grid-2 { grid-template-columns: 1fr; } }
  [data-nb] .nb-aud-link { display: inline-flex; margin-top: 16px; font-size: 15px; font-weight: 800; color: #43a047; text-decoration: none; }
  [data-nb] .nb-hero-link { display: inline-flex; align-items: center; gap: 8px; color: #c4d2e6; font-size: 14.5px; font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.25); padding-bottom: 2px; transition: color .15s ease, border-color .15s ease; }
  [data-nb] .nb-hero-link:hover { color: #fff; border-color: rgba(255,255,255,.65); }

  /* ===== four-step monitoring strip ===== */
  [data-nb] .nb-steps { background: #f7f9fc; border-bottom: 1px solid #e8edf3; padding: 40px 20px 44px; }
  [data-nb] .nb-steps-inner { margin: 0 auto; max-width: 1240px; }
  [data-nb] .nb-steps-kicker { text-align: center; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #43a047; margin: 0 0 22px; }
  [data-nb] .nb-steps-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; align-items: stretch; }
  [data-nb] .nb-step { position: relative; background: #fff; border: 1px solid #e8edf3; border-radius: 14px; padding: 20px 18px; box-shadow: 0 2px 12px rgba(14,42,77,.06); text-align: left; }
  [data-nb] .nb-step-n { font-size: 11px; font-weight: 800; letter-spacing: .1em; color: #9fb0c8; }
  [data-nb] .nb-step-ico { width: 40px; height: 40px; border-radius: 11px; background: #eef6ef; display: flex; align-items: center; justify-content: center; margin: 10px 0 12px; }
  [data-nb] .nb-step-ico svg { width: 20px; height: 20px; stroke: #43a047; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  [data-nb] .nb-step-t { font-size: 15.5px; font-weight: 800; color: #16284a; letter-spacing: -.01em; line-height: 1.25; }
  [data-nb] .nb-step-d { margin-top: 6px; font-size: 13.5px; line-height: 1.45; color: #56657a; }
  [data-nb] .nb-steps-tag { margin: 22px auto 0; text-align: center; font-size: 15px; font-weight: 800; color: #16284a; letter-spacing: -.01em; }
  @media (max-width: 900px) { [data-nb] .nb-steps-row { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (max-width: 480px) { [data-nb] .nb-steps-row { grid-template-columns: 1fr; gap: 10px; } [data-nb] .nb-step { padding: 16px 16px; } }
`;



const NAV_LINKS = [
  { label: "How It Works", href: "#how" },
  { label: "For Agents", href: "#agents" },
  { label: "Resources", href: "#resources" },
  { label: "For Investors", href: "#investors" },
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

const NODES = [
  { tag: "INVESTOR", lbl: ["Exchanging an", "Owned Property"], x: 44, y: 16, rev: false },
  { tag: "AGENT", lbl: ["Investor-Focused", "Real Estate Agent"], x: 17, y: 49, rev: true },
  { tag: "PROPERTY", lbl: ["Matched", "Replacement Property"], x: 84, y: 49, rev: false },
];

const ROLE_ICON: Record<string, JSX.Element> = {
  INVESTOR: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><line x1="20.5" y1="20.5" x2="15.4" y2="15.4" /></svg>
  ),
  AGENT: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="7" width="19" height="13.5" rx="2.2" /><path d="M8 7V5.2A2.2 2.2 0 0 1 10.2 3h3.6A2.2 2.2 0 0 1 16 5.2V7" /><line x1="2.5" y1="12.6" x2="21.5" y2="12.6" /></svg>
  ),
  PROPERTY: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M5.6 10v10h12.8V10" /><rect x="10" y="14.5" width="4" height="5.5" /></svg>
  ),
};
const NET_PROPS = [
  { x: 75, y: 19, size: 54, photo: "/mf-1.jpg" },
  { x: 92, y: 64, size: 48, photo: "/mf-2.jpg" },
  { x: 70, y: 86, size: 62, photo: "/mf-3.jpg" },
  { x: 48, y: 92, size: 56, photo: "/mf-4.jpg" },
  { x: 25, y: 84, size: 58, photo: "/mf-5.jpg" },
  { x: 10, y: 72, size: 46, photo: "/mf-6.jpg" },
];
/* dense teal "circuit" web fanning out from the hub edge */
const WEB = Array.from({ length: 34 }, (_, i) => {
  const a = (i / 34) * Math.PI * 2 + 0.12;
  const r1 = 12.5;
  const r2 = 15.5 + ((i * 13) % 15);
  return {
    x1: 50 + Math.cos(a) * r1, y1: 50 + Math.sin(a) * r1,
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
  const [open, setOpen] = useState(false);
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

function HeroNetwork() {
  return (
    <div className="nb-net">
      <svg className="nb-net-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {/* dense teal circuit web fanning from the hub edge */}
        {WEB.map((w, i) => (
          <g key={`w-${i}`}>
            <line className="nb-web-line" x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} vectorEffect="non-scaling-stroke" />
            <circle className="nb-cw-dot" cx={w.x2} cy={w.y2} r="0.5" />
          </g>
        ))}
        {/* connectors from the hub to each person + property */}
        {[...NODES, ...NET_PROPS].map((n, i) => (
          <g key={`m-${i}`}>
            <line className="nb-cw-line" x1="50" y1="50" x2={n.x} y2={n.y} vectorEffect="non-scaling-stroke" />
            <circle className="nb-cw-dot" cx={50 + (n.x - 50) * 0.5} cy={50 + (n.y - 50) * 0.5} r="0.7" />
          </g>
        ))}
      </svg>

      {NET_PROPS.map((p, i) => (
        <div key={`p-${i}`} className="nb-prop" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, backgroundImage: `url(${p.photo})` }} />
      ))}

      {NODES.map((n) => (
        <div key={n.tag} className={`nb-cap${n.rev ? " rev" : ""}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="nb-cap-ico">{ROLE_ICON[n.tag]}</span>
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
  { txt: ["Free for Everyone", "Investors & Agents"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="m8.5 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
  { txt: ["Continuous Monitoring", "with Exchange IQ"], svg: (<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" /><rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" /><path d="M10 4v2M14 4v2M10 18v2M14 18v2M4 10h2M4 14h2M18 10h2M18 14h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["No Obligation", "to Exchange"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" /><path d="M15.5 14.4c2.7.2 5 1.9 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>) },
  { txt: ["Register a Property", "in Minutes"], svg: (<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
];


const AUDIENCE_CARDS = [
  {
    tag: "I Own Investment Property",
    txt: "Add it once. ExchangeUp keeps monitoring for a smarter place for your equity.",
    cta: "Monitor My Property",
    to: ROUTES.forInvestors,
    svg: (<svg viewBox="0 0 24 24"><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M5.6 10v10h12.8V10" /><rect x="10" y="14.5" width="4" height="5.5" /></svg>),
  },
  {
    tag: "I’m a Real Estate Agent",
    txt: "Your database may already hold your next transaction. Add clients and properties — monitored continuously.",
    cta: "Monitor My Database",
    to: ROUTES.forAgents,
    svg: (<svg viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="13.5" rx="2.2" /><path d="M8 7V5.2A2.2 2.2 0 0 1 10.2 3h3.6A2.2 2.2 0 0 1 16 5.2V7" /><line x1="2.5" y1="12.6" x2="21.5" y2="12.6" /></svg>),
  },
];




function NbAudienceCards() {
  return (
    <section className="nb-aud" aria-label="Choose your path">
      <div className="nb-aud-grid nb-aud-grid-2">
        {AUDIENCE_CARDS.map((c) => (
          <div className="nb-aud-card" key={c.tag}>
            <span className="nb-aud-ico" aria-hidden="true">{c.svg}</span>
            <div className="nb-aud-tag">{c.tag}</div>
            <p className="nb-aud-txt">{c.txt}</p>
            <Link to={c.to} className="nb-aud-link">{c.cta} →</Link>
          </div>
        ))}
      </div>
    </section>
  );
}



function NbHero() {
  return (
    <section className="nb-hero">
      <SkyBackdrop />
      <div className="nb-hero-inner mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
        <div>
          <h1 className="nb-hero-h1 max-w-[620px]">
            Finding Your 1031 Replacement Property Just Got a Lot Easier.
          </h1>
          <p className="nb-hero-sub mt-5 max-w-[540px]">
            Register your property. Our data-driven AI continuously monitors investment opportunities in our network and alerts you when it finds a smarter property to exchange into.
          </p>

          <div className="nb-cta-row" style={{ marginTop: 32 }}>
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Find My Replacement Property</Link>
            <a href="#steps" className="nb-btn-demo">See How It Works</a>
          </div>

          <NbMonitorPanel />

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


const MONITOR_STEPS = [
  {
    t: "Add Your Property",
    d: "What you own — or, for agents, a client and their criteria. Minutes, and free.",
    svg: (<svg viewBox="0 0 24 24"><path d="M3.5 11.5 12 4l8.5 7.5" /><path d="M5.6 10v10h12.8V10" /><path d="M12 13v5M9.5 15.5h5" /></svg>),
  },
  {
    t: "Set Your Goals",
    d: "Tell us what a better position looks like for you. Change it any time.",
    svg: (<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.6" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" /></svg>),
  },
  {
    t: "We Keep Watching",
    d: "Exchange IQ continuously evaluates the network as properties, investors and criteria change.",
    svg: (<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>),
  },
  {
    t: "Get Alerted",
    d: "When a relevant opportunity appears, you and your agent are alerted with the numbers.",
    svg: (<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>),
  },
];



function NbMonitorSteps() {
  return (
    <section id="steps" className="nb-steps" aria-label="How monitoring works">
      <div className="nb-steps-inner">
        <p className="nb-steps-kicker">Add → Set → Monitor → Alert</p>
        <div className="nb-steps-row">
          {MONITOR_STEPS.map((s, i) => (
            <div className="nb-step" key={s.t}>
              <div className="nb-step-n">STEP {i + 1}</div>
              <span className="nb-step-ico" aria-hidden="true">{s.svg}</span>
              <div className="nb-step-t">{s.t}</div>
              <p className="nb-step-d">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="nb-steps-tag">Add it once. We keep watching.</p>
      </div>
    </section>
  );
}


function NbLogoMarquee() {
  return (
    <section className="nb-mq">
      <p className="nb-mq-label">A growing network of 1031-focused agents and investors</p>
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
    document.title = "1031ExchangeUp — Finding Your 1031 Replacement Property Just Got a Lot Easier";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Register your property. Our data-driven AI continuously monitors investment opportunities in our network and alerts you when it finds a smarter property to exchange into.",
      );
    }
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
            ExchangeUp can monitor for smarter opportunities long before you decide to sell. Add your property today and
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


export { NB_STYLE, SkyBackdrop, HeroNetwork };



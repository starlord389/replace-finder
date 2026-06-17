import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Lenis from "lenis";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

/* ───────────────────────── Content ───────────────────────── */

const HERO = {
  eyebrow: "Built for real estate agents & brokers",
  headline: "Find your client's next replacement property.",
  subheadline:
    "An off-market marketplace of verified 1031 exchange replacement properties — so your client can find the next one before the old one ever gets listed.",
};

const LOGO_BRANDS = [
  { name: "Compass", src: "/logos/compass.svg", height: 22, mobileHeight: 16 },
  { name: "Aluxety Real Estate", src: "/logos/aluxety.png", height: 34, mobileHeight: 26 },
  { name: "Churchill Properties", src: "/logos/churchill.svg", height: 52, mobileHeight: 40 },
  { name: "Keller Williams Realty", src: "/logos/keller-williams.svg", height: 48, mobileHeight: 36 },
  { name: "Lyv Realty", src: "/logos/lyv-realty.png", height: 46, mobileHeight: 34 },
  { name: "eXp Realty", src: "/logos/exp-realty.svg", height: 40, mobileHeight: 30 },
] as const;

/* ───────────────────── Styling (faithful to the Framer template) ─────────────────────
   Headings: Albert Sans 400, tight tracking, near-black. Body: Geist.
   Cream #f4f2ee background, layered card shadows, 52s logo marquee,
   reveal-on-scroll. All scoped under [data-landing].                       */

const PAGE_STYLE = `
  [data-landing] {
    position: relative;
    font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1d1d1d;
    background-color: #f4f2ee;
  }

  /* Top-of-page background, spanning the first ~1024px and fading smoothly to
     nothing (no hard edge) — matches the template's stripe + BG-texture layers:
     70px white vertical stripes strongest at the left/right edges, fading toward
     the horizontal center; plus a faint grain via overlay blend. Both fade out
     vertically so the stripes trail past the logo strip and disappear. */
  [data-landing] .lp-bg,
  [data-landing] .lp-grain {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1024px;
    z-index: 0;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  }
  [data-landing] .lp-bg::before {
    content: "";
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.55) 0px, rgba(255, 255, 255, 0) 70px);
    -webkit-mask-image: linear-gradient(to right, #000 0%, transparent 40%, transparent 60%, #000 100%);
    mask-image: linear-gradient(to right, #000 0%, transparent 40%, transparent 60%, #000 100%);
  }
  [data-landing] .lp-grain {
    background-image: url("/landing-grain.png");
    background-size: 128px 128px;
    background-repeat: repeat;
    mix-blend-mode: overlay;
  }
  [data-landing] .lp-content { position: relative; z-index: 1; }

  [data-landing] h1, [data-landing] .lp-h2, [data-landing] .lp-display {
    font-family: "Albert Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  [data-landing] h1 {
    margin: 14px 0 0;
    font-size: clamp(36px, 8vw, 56px);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.05em;
    color: #000;
  }

  [data-landing] .lp-h2 {
    margin: 0;
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 400;
    line-height: 1.02;
    letter-spacing: -0.05em;
    color: #0d0d0d;
  }

  [data-landing] .lp-eyebrow {
    display: inline-flex;
    width: fit-content;
    padding: 6px 14px;
    border: 1px solid rgba(29, 29, 29, 0.12);
    border-radius: 999px;
    background: rgba(29, 29, 29, 0.04);
    font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #1d1d1d;
  }

  [data-landing] .lp-sub {
    font-size: clamp(15px, 1.4vw, 18px);
    font-weight: 400;
    line-height: 1.55;
    letter-spacing: -0.01em;
    color: #605f5f;
  }

  /* Pill CTAs — secondary ("Book a Demo") is a plain transparent text button,
     primary ("Get Started") is a black pill with a white circle-arrow, matching the template. */
  [data-landing] .lp-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 20px;
    border-radius: 999px;
    font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1;
    text-decoration: none;
    color: #1d1d1d;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(29, 29, 29, 0.14);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  [data-landing] .lp-pill:hover { background: rgba(255, 255, 255, 0.9); }
  /* Secondary CTA ("Book a Demo") — outlined pill: visible border, transparent
     center, Geist 16/500 text. */
  [data-landing] .lp-pill:not([data-primary="true"]) {
    font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    font-weight: 500;
    background: transparent;
    border: 1px solid rgba(29, 29, 29, 0.22);
    padding: 0 22px;
  }
  [data-landing] .lp-pill:not([data-primary="true"]):hover {
    background: rgba(29, 29, 29, 0.05);
    border-color: rgba(29, 29, 29, 0.32);
  }
  [data-landing] .lp-pill[data-primary="true"] {
    color: #fff;
    background: #1d1d1d;
    border-color: #1d1d1d;
    padding: 0 6px 0 18px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  [data-landing] .lp-pill[data-primary="true"]:hover {
    background: #000;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2), 0 0 0 5px rgba(29, 29, 29, 0.08);
  }
  /* Circle with the arrow-slide hover (arrow exits top-right, a fresh one
     slides in from bottom-left) — matches the template's button. */
  [data-landing] .lp-pill-arrow {
    position: relative;
    display: inline-flex;
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: #fff;
    overflow: hidden;
  }
  [data-landing] .lp-pill-arrow .lp-arrow {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 14px;
    height: 14px;
    color: #1d1d1d;
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }
  [data-landing] .lp-pill-arrow .lp-arrow-b { transform: translate(-150%, 150%); }
  [data-landing] .lp-pill[data-primary="true"]:hover .lp-arrow-a { transform: translate(150%, -150%); }
  [data-landing] .lp-pill[data-primary="true"]:hover .lp-arrow-b { transform: translate(0, 0); }

  /* Hero marketing visuals — crisp, frosted-glass product UI, layered & branded.
     Designed for restraint: generous whitespace, real photos, one highlight. */
  [data-landing] .lp-hero-visual { position: relative; padding-bottom: 12%; }
  [data-landing] .lp-card {
    background: rgba(255, 255, 255, 0.82);
    -webkit-backdrop-filter: blur(26px);
    backdrop-filter: blur(26px);
    border: 1.5px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 32px 64px rgba(38, 34, 28, 0.15), 0 4px 14px rgba(38, 34, 28, 0.05);
    font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
    color: #1d1d1d;
  }
  [data-landing] .lp-card-main {
    position: relative; width: 100%; border-radius: 24px; padding: 24px 24px 18px;
    transform: rotate(-1.5deg);
  }
  [data-landing] .lp-card-detail {
    position: absolute; right: -4%; bottom: -4%; width: 60%;
    border-radius: 20px; padding: 20px; transform: rotate(3deg);
    background: rgba(255, 255, 255, 0.92);
  }

  /* Card 1 — matches list */
  [data-landing] .lp-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  [data-landing] .lp-card-title { font-size: 17px; font-weight: 700; letter-spacing: -0.025em; }
  [data-landing] .lp-card-sort { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 500; color: #8a847b; }
  [data-landing] .lp-rows { display: flex; flex-direction: column; gap: 2px; }
  [data-landing] .lp-row { display: flex; align-items: center; gap: 13px; padding: 11px 12px; border-radius: 14px; }
  [data-landing] .lp-row-hot { background: #fcec8f; }
  [data-landing] .lp-photo { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; flex: none; }
  [data-landing] .lp-row-main { flex: 1; min-width: 0; }
  [data-landing] .lp-row-title { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #1d1d1d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-row-sub { margin-top: 2px; font-size: 12px; color: #8a847b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-score { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px; font-size: 12.5px; font-weight: 700; flex: none; }
  [data-landing] .lp-score-high { background: rgba(22, 163, 74, 0.13); color: #15803d; }
  [data-landing] .lp-score-mid { background: rgba(202, 138, 4, 0.15); color: #a16207; }
  [data-landing] .lp-card-foot { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 12.5px; font-weight: 500; color: #8a847b; }

  /* Card 2 — clean weekly chart */
  [data-landing] .lp-chart-head { display: flex; align-items: baseline; justify-content: space-between; }
  [data-landing] .lp-chart-label { font-size: 12px; font-weight: 500; color: #8a847b; }
  [data-landing] .lp-chart-delta { font-size: 11.5px; font-weight: 600; color: #e2683d; }
  [data-landing] .lp-chart-big { margin-top: 3px; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
  [data-landing] .lp-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 7px; height: 84px; margin-top: 16px; }
  [data-landing] .lp-col { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 7px; }
  [data-landing] .lp-bar2 { display: flex; flex-direction: column; width: 100%; max-width: 13px; border-radius: 6px; overflow: hidden; }
  [data-landing] .lp-seg-b { background: #74cfe6; }
  [data-landing] .lp-seg-c { background: #f4a09a; }
  [data-landing] .lp-seg-y { background: #f6c544; }
  [data-landing] .lp-day { font-size: 10px; font-weight: 500; color: #a39d93; }

  @media (max-width: 809.98px) {
    [data-landing] .lp-card-detail { right: 0; bottom: 0; width: 66%; }
  }

  /* ── How It Works — dashboard showcase + expand-on-hover step cards ── */
  [data-landing] .hiw-dash {
    position: relative; z-index: 1;
    border-radius: 24px; overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 40px 80px rgba(38, 34, 28, 0.15), 0 8px 24px rgba(38, 34, 28, 0.06);
  }
  [data-landing] .hiw-dash img { display: block; width: 100%; height: auto; }
  [data-landing] .hiw-row { position: relative; z-index: 2; margin-top: -120px; display: flex; gap: 12px; height: 360px; }
  [data-landing] .hiw-card {
    position: relative; overflow: hidden; flex: 1 1 0; min-width: 0;
    display: flex; flex-direction: column; justify-content: space-between;
    border-radius: 24px; border: 1px solid #e7e1d7; background: rgba(255, 255, 255, 0.9);
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    padding: 26px; cursor: pointer;
    transition: flex-grow 0.55s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease, box-shadow 0.3s ease;
  }
  [data-landing] .hiw-card-active { flex-grow: 2.7; background: #fff; box-shadow: 0 24px 54px rgba(38, 34, 28, 0.1); }
  [data-landing] .hiw-num { font-family: "Albert Sans", sans-serif; font-size: 30px; font-weight: 500; letter-spacing: -0.03em; color: #d8d0c2; }
  [data-landing] .hiw-card-text { position: relative; z-index: 2; max-width: 100%; transition: max-width 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
  [data-landing] .hiw-card-active .hiw-card-text { max-width: calc(100% - 252px); }
  [data-landing] .hiw-title { font-family: "Albert Sans", sans-serif; font-size: 22px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.12; color: #1d1d1d; }
  [data-landing] .hiw-body { margin-top: 12px; font-size: 13.5px; line-height: 1.55; color: #6b655c; max-width: 21rem; }
  [data-landing] .hiw-card-preview {
    position: absolute; top: 26px; right: 26px; width: 226px;
    opacity: 0; transform: translateX(14px);
    transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }
  [data-landing] .hiw-card-active .hiw-card-preview { opacity: 1; transform: translateX(0); }

  /* preview mini-cards */
  [data-landing] .hiw-pv { background: #fff; border: 1px solid #ece6db; border-radius: 16px; box-shadow: 0 16px 38px rgba(38, 34, 28, 0.1); padding: 16px; font-family: "Plus Jakarta Sans", sans-serif; }
  [data-landing] .hiw-pv-title { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .hiw-pv-sub { font-size: 10.5px; color: #8a847b; margin: 2px 0 13px; }
  [data-landing] .hiw-pv-field { margin-bottom: 9px; }
  [data-landing] .hiw-pv-field label { display: block; font-size: 9.5px; font-weight: 600; color: #8a847b; margin-bottom: 4px; }
  [data-landing] .hiw-pv-input { font-size: 11.5px; padding: 8px 10px; border-radius: 9px; background: #f5f2ec; color: #4a453d; }
  [data-landing] .hiw-pv-hl { background: #fcec8f; color: #5a471b; font-weight: 600; }
  [data-landing] .hiw-pv-match { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 11px; margin-bottom: 6px; }
  [data-landing] .hiw-pv-match-hot { background: #fcec8f; }
  [data-landing] .hiw-pv-score { width: 26px; height: 26px; border-radius: 999px; background: rgba(22,163,74,0.14); color: #15803d; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .hiw-pv-mt { font-size: 11.5px; font-weight: 600; }
  [data-landing] .hiw-pv-mm { font-size: 9.5px; color: #8a847b; margin-top: 1px; }
  [data-landing] .hiw-pv-chat { font-size: 11px; line-height: 1.4; background: #f5f2ec; padding: 9px 11px; border-radius: 11px; border-top-left-radius: 3px; margin-bottom: 10px; color: #4a453d; }
  [data-landing] .hiw-pv-offer { background: #fcec8f; padding: 11px; border-radius: 11px; }
  [data-landing] .hiw-pv-offer-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #7a5a0a; }
  [data-landing] .hiw-pv-offer-row { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
  [data-landing] .hiw-pv-offer-row b { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
  [data-landing] .hiw-pv-sent { margin-left: auto; font-size: 9px; font-weight: 700; background: rgba(29,29,29,0.12); padding: 3px 8px; border-radius: 999px; }

  @media (max-width: 809.98px) {
    [data-landing] .hiw-row { flex-direction: column; height: auto; margin-top: 16px; }
    [data-landing] .hiw-card { flex: none; gap: 18px; }
    [data-landing] .hiw-card-text, [data-landing] .hiw-card-active .hiw-card-text { max-width: 100%; }
    [data-landing] .hiw-card-preview { position: relative; top: auto; right: auto; opacity: 1; transform: none; width: 100%; max-width: 280px; margin-top: 4px; }
  }

  /* Logo marquee */
  @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  [data-landing] .lp-marquee-viewport {
    overflow: hidden;
    width: min(1040px, calc(100vw - 80px));
    margin: 0 auto;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 9%, #000 91%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 9%, #000 91%, transparent);
  }
  [data-landing] .lp-marquee-track {
    display: flex;
    align-items: center;
    width: max-content;
    animation: lpMarquee 52s linear infinite;
  }
  [data-landing] .lp-marquee-group { display: flex; align-items: center; gap: 76px; padding-right: 76px; }
  [data-landing] .lp-logo { display: inline-flex; align-items: center; justify-content: center; height: 66px; flex: none; }
  [data-landing] .lp-logo img {
    height: var(--brand-h, 32px); width: auto; max-height: 100%; display: block;
    filter: grayscale(1) contrast(0.92) brightness(1.04); opacity: 0.6; pointer-events: none;
  }
  @media (max-width: 809.98px) {
    [data-landing] .lp-marquee-viewport { width: calc(100vw - 36px); }
    [data-landing] .lp-marquee-group { gap: 50px; padding-right: 50px; }
    [data-landing] .lp-logo { height: 52px; }
    [data-landing] .lp-logo img { height: var(--brand-h-mobile, 24px); }
  }

  /* On-load entrance: hero elements fade + rise in, staggered (matches the
     template's appear animation). Plays on mount via CSS keyframes so it always
     fires on first paint. */
  @keyframes lpFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  [data-landing] .lp-in {
    opacity: 0;
    animation: lpFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--in-delay, 0s);
  }

  /* Reveal on scroll (below-the-fold sections) */
  [data-landing] [data-reveal] {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
    transition-delay: var(--reveal-delay, 0s);
  }
  [data-landing] [data-reveal].is-visible { opacity: 1; transform: translateY(0); }
`;

/* ───────────────────────── Primitives ───────────────────────── */

function PillLink({ to, primary, children }: { to: string; primary?: boolean; children: ReactNode }) {
  return (
    <Link to={to} className="lp-pill" data-primary={primary ? "true" : undefined}>
      {children}
      {primary && (
        <span className="lp-pill-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lp-arrow lp-arrow-a" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lp-arrow lp-arrow-b" aria-hidden="true">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      )}
    </Link>
  );
}

function revealStyle(delay: number): CSSProperties {
  return { ["--reveal-delay" as string]: `${delay}s` };
}

function inDelay(delay: number): CSSProperties {
  return { ["--in-delay" as string]: `${delay}s` };
}

/* ───────────────────────── Sections ───────────────────────── */

function Hero() {
  return (
    <section className="px-5 pb-10 pt-28 sm:px-8 sm:pt-[176px]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <p className="lp-eyebrow lp-in" style={inDelay(0)}>{HERO.eyebrow}</p>
          <h1 className="lp-in max-w-[440px]" style={inDelay(0.08)}>{HERO.headline}</h1>
          <p className="lp-sub lp-in mt-6 max-w-[34rem]" style={inDelay(0.16)}>
            {HERO.subheadline}
          </p>
          <div className="lp-in mt-9 flex flex-wrap items-center gap-3" style={inDelay(0.24)}>
            <PillLink to={ROUTES.signup} primary>Get Started</PillLink>
            <PillLink to={ROUTES.bookDemo}>Book a Demo</PillLink>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

type HeroMatch = { score: number; cls: string; photo: string; title: string; sub: string; hot?: boolean };
const HERO_MATCHES: HeroMatch[] = [
  { score: 92, cls: "lp-score-high", photo: "/landing-prop-office.jpg", title: "Harbor Point Office Park", sub: "Boston, MA · $4.2M · 6.8% cap", hot: true },
  { score: 88, cls: "lp-score-high", photo: "/landing-prop-retail.jpg", title: "Back Bay Retail Center", sub: "Newton, MA · $3.75M · 7.2% cap" },
  { score: 74, cls: "lp-score-mid", photo: "/landing-prop-industrial.jpg", title: "Merrimack Logistics", sub: "Lowell, MA · $5.1M · 5.9% cap" },
];

// Weekly match-activity chart: each day stacks 3 segments (px heights).
const HERO_CHART = [
  { d: "M", b: 10, c: 14, y: 22 },
  { d: "T", b: 16, c: 18, y: 30 },
  { d: "W", b: 12, c: 16, y: 26 },
  { d: "T", b: 18, c: 20, y: 34 },
  { d: "F", b: 10, c: 14, y: 24 },
  { d: "S", b: 8, c: 12, y: 18 },
  { d: "S", b: 10, c: 12, y: 20 },
] as const;

function HeroVisual() {
  return (
    <div className="lp-hero-visual lp-in" style={inDelay(0.2)}>
      {/* Card 1 — scored off-market matches */}
      <div className="lp-card lp-card-main">
        <div className="lp-card-head">
          <div className="lp-card-title">Property matches</div>
          <span className="lp-card-sort">Sort by Score ▾</span>
        </div>
        <div className="lp-rows">
          {HERO_MATCHES.map((m) => (
            <div key={m.title} className={`lp-row${m.hot ? " lp-row-hot" : ""}`}>
              <img className="lp-photo" src={m.photo} alt="" loading="eager" />
              <div className="lp-row-main">
                <div className="lp-row-title">{m.title}</div>
                <div className="lp-row-sub">{m.sub}</div>
              </div>
              <span className={`lp-score ${m.cls}`}>{m.score}</span>
            </div>
          ))}
        </div>
        <div className="lp-card-foot">All matches →</div>
      </div>

      {/* Card 2 — weekly match activity chart */}
      <div className="lp-card lp-card-detail">
        <div className="lp-chart-head">
          <span className="lp-chart-label">New matches</span>
          <span className="lp-chart-delta">+5 this week</span>
        </div>
        <div className="lp-chart-big">21</div>
        <div className="lp-chart">
          {HERO_CHART.map((col, i) => (
            <div className="lp-col" key={i}>
              <div className="lp-bar2">
                <span className="lp-seg-b" style={{ height: col.b }} />
                <span className="lp-seg-c" style={{ height: col.c }} />
                <span className="lp-seg-y" style={{ height: col.y }} />
              </div>
              <span className="lp-day">{col.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoMarquee() {
  return (
    <section className="px-5 pb-12 pt-14 sm:px-8">
      <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a847b]" data-reveal>
        Trusted by agents from
      </p>
      <div className="lp-marquee-viewport" data-reveal>
        <div className="lp-marquee-track">
          {[0, 1].map((group) => (
            <div className="lp-marquee-group" key={group} aria-hidden={group === 1 ? "true" : undefined}>
              {LOGO_BRANDS.map((brand) => (
                <span
                  key={`${group}-${brand.name}`}
                  className="lp-logo"
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

const HIW_STEPS = [
  {
    num: "01",
    title: "Add your client's property",
    body: "Enter the property your client currently holds. It anchors every replacement the system scores.",
    preview: (
      <div className="hiw-pv">
        <div className="hiw-pv-title">New exchange</div>
        <div className="hiw-pv-sub">Step 1 of 3</div>
        <div className="hiw-pv-field">
          <label>Relinquished property</label>
          <div className="hiw-pv-input">Cambridge, MA office</div>
        </div>
        <div className="hiw-pv-field">
          <label>Asset type</label>
          <div className="hiw-pv-input hiw-pv-hl">Office · stabilized</div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "Filter and find your match",
    body: "Filter by ROI target, location, asset type, or cap rate. Every off-market property is auto-scored against your client's exchange.",
    preview: (
      <div className="hiw-pv">
        <div className="hiw-pv-title">Match found</div>
        <div className="hiw-pv-sub">Auto-scored against the network</div>
        <div className="hiw-pv-match hiw-pv-match-hot">
          <span className="hiw-pv-score">92</span>
          <div><div className="hiw-pv-mt">Harbor Point Office</div><div className="hiw-pv-mm">$4.2M · Boston, MA</div></div>
        </div>
        <div className="hiw-pv-match">
          <span className="hiw-pv-score">88</span>
          <div><div className="hiw-pv-mt">Back Bay Retail</div><div className="hiw-pv-mm">$3.75M · Newton, MA</div></div>
        </div>
      </div>
    ),
  },
  {
    num: "03",
    title: "Connect and offer",
    body: "Open a private line with the listing agent, submit an offer, and lock it in before the old property lists.",
    preview: (
      <div className="hiw-pv">
        <div className="hiw-pv-title">Private connection</div>
        <div className="hiw-pv-sub">With Alex Chen</div>
        <div className="hiw-pv-chat">Financials attached. Open to offers.</div>
        <div className="hiw-pv-offer">
          <div className="hiw-pv-offer-label">Offer submitted</div>
          <div className="hiw-pv-offer-row"><b>$4.15M</b><span className="hiw-pv-sent">Sent</span></div>
        </div>
      </div>
    ),
  },
] as const;

function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="process" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="hiw-dash" data-reveal>
          <img src="/landing-dashboard-render.png" alt="The 1031 Exchange Up agent dashboard" loading="lazy" />
        </div>
        <div className="hiw-row" data-reveal>
          {HIW_STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`hiw-card${active === i ? " hiw-card-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="hiw-num">{s.num}</span>
              <div className="hiw-card-text">
                <h3 className="hiw-title">{s.title}</h3>
                <p className="hiw-body">{s.body}</p>
              </div>
              <div className="hiw-card-preview">{s.preview}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "1031 Exchange Up — Off-market 1031 replacement properties for agents";
  }, []);

  // Smooth scroll, matching the template feel.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  // Reveal on scroll.
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
    <div ref={rootRef} data-landing className="min-h-screen">
      <style>{PAGE_STYLE}</style>
      <div className="lp-bg" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-content">
        <Hero />
        <LogoMarquee />
        <HowItWorks />
      </div>
    </div>
  );
}

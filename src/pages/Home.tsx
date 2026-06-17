import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
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

  /* Hero marketing visuals — crisp, frosted-glass UI cards, layered & branded */
  [data-landing] .lp-hero-visual { position: relative; padding-bottom: 8%; }
  [data-landing] .lp-card {
    background: rgba(255, 255, 255, 0.72);
    -webkit-backdrop-filter: blur(22px);
    backdrop-filter: blur(22px);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 30px 60px rgba(38, 34, 28, 0.16), 0 6px 18px rgba(38, 34, 28, 0.07);
    font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
    color: #1d1d1d;
  }
  [data-landing] .lp-card-main { position: relative; width: 100%; border-radius: 22px; padding: 18px 18px 14px; }
  [data-landing] .lp-card-detail {
    position: absolute; right: -5%; bottom: -8%; width: 66%;
    border-radius: 18px; padding: 15px; transform: rotate(-3deg);
    background: rgba(255, 255, 255, 0.85);
  }
  [data-landing] .lp-card-head, [data-landing] .lp-detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  [data-landing] .lp-card-title { font-size: 15px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
  [data-landing] .lp-card-sub { margin-top: 2px; font-size: 11px; color: #8a847b; }
  [data-landing] .lp-card-pill { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px; background: rgba(29,29,29,0.05); font-size: 10px; font-weight: 600; color: #56524b; white-space: nowrap; }
  [data-landing] .lp-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin: 13px 0; }
  [data-landing] .lp-stat { background: rgba(255,255,255,0.6); border: 1px solid rgba(29,29,29,0.06); border-radius: 12px; padding: 8px 9px; }
  [data-landing] .lp-stat:first-child { background: linear-gradient(135deg, #fff4c2, #ffe98a); border-color: rgba(214,178,40,0.3); }
  [data-landing] .lp-stat span { display: block; font-size: 8px; font-weight: 700; letter-spacing: 0.05em; color: #9a948b; text-transform: uppercase; }
  [data-landing] .lp-stat b { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
  [data-landing] .lp-rows { display: flex; flex-direction: column; gap: 5px; }
  [data-landing] .lp-row { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 12px; }
  [data-landing] .lp-row-hot { background: linear-gradient(135deg, rgba(255,244,166,0.95), rgba(255,233,138,0.9)); }
  [data-landing] .lp-score { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 800; flex: none; }
  [data-landing] .lp-score-high { background: linear-gradient(135deg, #34d36b, #16a34a); }
  [data-landing] .lp-score-good { background: linear-gradient(135deg, #6fcf73, #36a93f); }
  [data-landing] .lp-score-mid { background: linear-gradient(135deg, #f7b955, #ef9a2a); }
  [data-landing] .lp-score-lg { width: 40px; height: 40px; font-size: 16px; }
  [data-landing] .lp-thumb { width: 34px; height: 34px; border-radius: 9px; flex: none; }
  [data-landing] .lp-thumb[data-v="1"] { background: linear-gradient(135deg, #5a7a84, #2c3e44); }
  [data-landing] .lp-thumb[data-v="2"] { background: linear-gradient(135deg, #c98b6a, #9c5b3b); }
  [data-landing] .lp-thumb[data-v="3"] { background: linear-gradient(135deg, #7d8aa6, #4a5772); }
  [data-landing] .lp-thumb[data-v="4"] { background: linear-gradient(135deg, #87a98f, #50745a); }
  [data-landing] .lp-row-main { flex: 1; min-width: 0; }
  [data-landing] .lp-row-title { font-size: 12px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-row-meta { font-size: 10px; color: #8a847b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-tag { font-size: 9px; font-weight: 700; color: #5a471b; background: rgba(255,255,255,0.7); border: 1px solid rgba(214,178,40,0.4); padding: 3px 7px; border-radius: 999px; white-space: nowrap; flex: none; }
  [data-landing] .lp-card-foot { margin-top: 10px; font-size: 11px; font-weight: 600; color: #56524b; }
  [data-landing] .lp-chips { display: flex; gap: 5px; margin: 9px 0 11px; }
  [data-landing] .lp-chips span { font-size: 9px; font-weight: 600; color: #56524b; background: rgba(29,29,29,0.05); padding: 3px 8px; border-radius: 999px; }
  [data-landing] .lp-bd-label { font-size: 8px; font-weight: 700; letter-spacing: 0.07em; color: #9a948b; text-transform: uppercase; margin-bottom: 8px; }
  [data-landing] .lp-bars { display: flex; flex-direction: column; gap: 6px; }
  [data-landing] .lp-bar { display: grid; grid-template-columns: 56px 1fr 18px; align-items: center; gap: 8px; }
  [data-landing] .lp-bar-label { font-size: 9px; font-weight: 600; color: #56524b; }
  [data-landing] .lp-bar-track { height: 6px; border-radius: 999px; background: rgba(29,29,29,0.08); overflow: hidden; }
  [data-landing] .lp-bar-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #34d36b, #16a34a); }
  [data-landing] .lp-bar-val { font-size: 9px; font-weight: 700; text-align: right; }
  [data-landing] .lp-detail-foot { display: flex; gap: 22px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(29,29,29,0.08); }
  [data-landing] .lp-detail-foot span { display: block; font-size: 8px; font-weight: 700; letter-spacing: 0.05em; color: #9a948b; text-transform: uppercase; }
  [data-landing] .lp-detail-foot b { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
  @media (max-width: 809.98px) {
    [data-landing] .lp-card-detail { right: 0; bottom: -5%; width: 72%; }
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

type HeroMatch = { score: number; cls: string; v: string; title: string; meta: string; tag?: string; hot?: boolean };
const HERO_MATCHES: HeroMatch[] = [
  { score: 92, cls: "lp-score-high", v: "1", title: "Harbor Point Office Park", meta: "$4.2M · 6.8% cap · Boston, MA", tag: "No-Boot", hot: true },
  { score: 88, cls: "lp-score-good", v: "2", title: "Back Bay Retail Center", meta: "$3.75M · 7.2% cap · Newton, MA" },
  { score: 74, cls: "lp-score-mid", v: "3", title: "Merrimack Logistics", meta: "$5.1M · 5.9% cap · Lowell, MA" },
  { score: 71, cls: "lp-score-mid", v: "4", title: "Seaport Landing Apartments", meta: "$6.8M · 5.4% cap · Quincy, MA" },
];

const HERO_BARS = [
  { label: "Price", v: 94 },
  { label: "Geography", v: 96 },
  { label: "Asset Type", v: 100 },
  { label: "Strategy", v: 88 },
  { label: "Financial", v: 90 },
  { label: "Timing", v: 85 },
] as const;

function HeroVisual() {
  return (
    <div className="lp-hero-visual lp-in" style={inDelay(0.2)}>
      {/* Main card — scored off-market matches */}
      <div className="lp-card lp-card-main">
        <div className="lp-card-head">
          <div>
            <div className="lp-card-title">Property matches</div>
            <div className="lp-card-sub">Sarah Chen exchange · sorted by score</div>
          </div>
          <span className="lp-card-pill">Sort by Score ▾</span>
        </div>
        <div className="lp-stat-row">
          <div className="lp-stat"><span>Strong matches</span><b>5</b></div>
          <div className="lp-stat"><span>Total matches</span><b>21</b></div>
          <div className="lp-stat"><span>No-boot</span><b>12</b></div>
        </div>
        <div className="lp-rows">
          {HERO_MATCHES.map((m) => (
            <div key={m.title} className={`lp-row${m.hot ? " lp-row-hot" : ""}`}>
              <span className={`lp-score ${m.cls}`}>{m.score}</span>
              <span className="lp-thumb" data-v={m.v} />
              <div className="lp-row-main">
                <div className="lp-row-title">{m.title}</div>
                <div className="lp-row-meta">{m.meta}</div>
              </div>
              {m.tag && <span className="lp-tag">{m.tag}</span>}
            </div>
          ))}
        </div>
        <div className="lp-card-foot">See all matches →</div>
      </div>

      {/* Detail card — match score breakdown */}
      <div className="lp-card lp-card-detail">
        <div className="lp-detail-head">
          <div>
            <div className="lp-card-title">Harbor Point Office Park</div>
            <div className="lp-card-sub">Boston, MA</div>
          </div>
          <span className="lp-score lp-score-high lp-score-lg">92</span>
        </div>
        <div className="lp-chips"><span>Office</span><span>Stabilized</span><span>No-Boot</span></div>
        <div className="lp-bd-label">Match score breakdown</div>
        <div className="lp-bars">
          {HERO_BARS.map((b) => (
            <div key={b.label} className="lp-bar">
              <span className="lp-bar-label">{b.label}</span>
              <span className="lp-bar-track"><span className="lp-bar-fill" style={{ width: `${b.v}%` }} /></span>
              <span className="lp-bar-val">{b.v}</span>
            </div>
          ))}
        </div>
        <div className="lp-detail-foot">
          <div><span>Asking price</span><b>$4.2M</b></div>
          <div><span>Cap rate</span><b>6.8%</b></div>
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
      </div>
    </div>
  );
}

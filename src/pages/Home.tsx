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
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.24);
  }
  [data-landing] .lp-pill-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: #fff;
    color: #1d1d1d;
  }

  /* Hero layered renders */
  [data-landing] .lp-hero-visual { position: relative; }
  [data-landing] .lp-hero-main {
    display: block;
    width: 90%;
    border-radius: 16px;
    box-shadow: 0 34px 70px rgba(38, 34, 28, 0.16), 0 6px 18px rgba(38, 34, 28, 0.07);
  }
  [data-landing] .lp-hero-kpi {
    position: absolute;
    right: -2%;
    bottom: -10%;
    width: 54%;
    border-radius: 14px;
    box-shadow: 0 28px 56px rgba(38, 34, 28, 0.2), 0 4px 14px rgba(38, 34, 28, 0.1);
    transform: rotate(-3deg);
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
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

        <div className="lp-hero-visual lp-in" style={inDelay(0.2)}>
          <img className="lp-hero-main" src="/landing-hero-list-render.png" alt="1031 Exchange Up property matches dashboard" loading="eager" />
          <img className="lp-hero-kpi" src="/landing-hero-kpi-render.png" alt="Match score breakdown for a replacement property" loading="eager" />
        </div>
      </div>
    </section>
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

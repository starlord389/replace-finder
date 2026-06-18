import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import Lenis from "lenis";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────────────────
   Shared landing kit — the base design tokens + primitives behind every
   public marketing page (Home, For Landlords, …). The values here are copied
   verbatim from the homepage (src/pages/Home.tsx) so any page that mounts a
   [data-landing] wrapper and renders LANDING_BASE_CSS shares ONE design
   system: Albert Sans headings, Geist body, cream #f4f2ee background, the
   pill CTAs, the top stripe/grain texture, and the on-scroll reveal.

   Page-specific section styles live in each page's own <style> block.
   ───────────────────────────────────────────────────────────────────────── */

export const LANDING_BASE_CSS = `
  [data-landing] {
    position: relative;
    font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1d1d1d;
    background-color: #f4f2ee;
  }

  /* Top-of-page background, spanning the first ~1024px and fading smoothly to
     nothing (no hard edge): 70px white vertical stripes strongest at the
     left/right edges, fading toward the horizontal center; plus a faint grain
     via overlay blend. Both fade out vertically. */
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

  /* Gray bordered eyebrow — used at the top of a hero. */
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

  /* Pill CTAs — secondary is an outlined text button, primary is a black pill
     with a white circle-arrow that slides on hover. Matches the template. */
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
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  [data-landing] .lp-pill:hover { background: rgba(255, 255, 255, 0.9); }
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

  /* On-load entrance: fade + rise in, staggered. Plays on mount. */
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

  @media (prefers-reduced-motion: reduce) {
    [data-landing] .lp-in,
    [data-landing] [data-reveal] { animation: none; opacity: 1; transform: none; }
  }
`;

/* ───────────────────────── Primitives ───────────────────────── */

function PillArrow() {
  return (
    <span className="lp-pill-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lp-arrow lp-arrow-a" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lp-arrow lp-arrow-b" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </span>
  );
}

/** Pill CTA. Renders a router <Link> when `to` is given, otherwise a <button>
 *  (use `onClick` for scroll-to-section actions). `primary` adds the dark fill
 *  + sliding arrow. */
export function Pill({
  to,
  onClick,
  primary,
  type = "button",
  children,
}: {
  to?: string;
  onClick?: () => void;
  primary?: boolean;
  type?: "button" | "submit";
  children: ReactNode;
}) {
  const dataPrimary = primary ? "true" : undefined;
  if (to) {
    return (
      <Link to={to} className="lp-pill" data-primary={dataPrimary}>
        {children}
        {primary && <PillArrow />}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className="lp-pill" data-primary={dataPrimary}>
      {children}
      {primary && <PillArrow />}
    </button>
  );
}

export function revealStyle(delay: number): CSSProperties {
  return { ["--reveal-delay" as string]: `${delay}s` };
}

export function inDelay(delay: number): CSSProperties {
  return { ["--in-delay" as string]: `${delay}s` };
}

/** The top stripe + grain texture layers. Render once inside a [data-landing]
 *  wrapper, before .lp-content. */
export function LandingBackdrop() {
  return (
    <>
      <div className="lp-bg" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
    </>
  );
}

/** Lenis smooth scroll + on-scroll reveal observer, scoped to `rootRef`.
 *  Returns the Lenis instance ref so callers can scroll to a section
 *  programmatically (e.g. a hero CTA that jumps to the form). */
export function useLandingMotion(rootRef: RefObject<HTMLElement>) {
  const lenisRef = useRef<Lenis | null>(null);

  // Smooth scroll, matching the template feel.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null; };
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
  }, [rootRef]);

  return lenisRef;
}

/** Smoothly scroll to an element id, using Lenis when available. */
export function scrollToId(lenis: Lenis | null, id: string, offset = -88) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Lenis from "lenis";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Sparkles, MessageSquare, Settings, Pencil,
  Link2, Plus, SlidersHorizontal, Calendar, ChevronDown, Share2,
  LayoutGrid, Paperclip, Lightbulb,
} from "lucide-react";
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
  [data-landing] .lp-hero-visual { position: relative; left: -40px; width: 530px; max-width: 100%; margin: 0 auto; padding-bottom: 12%; }
  [data-landing] .lp-card {
    background: rgba(255, 255, 255, 0.89);
    -webkit-backdrop-filter: blur(18px) saturate(1.3);
    backdrop-filter: blur(18px) saturate(1.3);
    border: 2px solid rgba(255, 255, 255, 0.97);
    box-shadow: 0 32px 64px rgba(38, 34, 28, 0.15), 0 4px 14px rgba(38, 34, 28, 0.05);
    font-family: "Plus Jakarta Sans", -apple-system, sans-serif;
    color: #1d1d1d;
  }
  [data-landing] .lp-card-main {
    position: relative; width: 100%; border-radius: 24px; padding: 24px 24px 18px;
    transform: rotate(-2.5deg);
  }
  /* Detail card tilts INVERSE to the main card (main leans left, detail leans right) */
  [data-landing] .lp-card-detail {
    position: absolute; right: -5%; bottom: -11%; width: 56%;
    border-radius: 20px; padding: 20px; transform: rotate(5deg);
    background: rgba(255, 255, 255, 0.85);
  }

  /* Card 1 — matches list */
  [data-landing] .lp-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  [data-landing] .lp-card-title { font-size: 17px; font-weight: 700; letter-spacing: -0.025em; }
  [data-landing] .lp-card-sort { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 500; color: #8a847b; }
  [data-landing] .lp-rows { display: flex; flex-direction: column; gap: 2px; }
  [data-landing] .lp-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 15px; }
  [data-landing] .lp-row-hot { background: #fdf3b0; }
  [data-landing] .lp-photo { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; flex: none; filter: saturate(1.22) contrast(1.06); }
  [data-landing] .lp-row-main { flex: 1; min-width: 0; }
  [data-landing] .lp-row-title { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #1d1d1d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-row-sub { margin-top: 2px; font-size: 12px; color: #8a847b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .lp-score { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px; font-size: 12.5px; font-weight: 700; flex: none; }
  [data-landing] .lp-score-high { background: #d7efdf; color: #2f7d52; }
  [data-landing] .lp-score-mid { background: #ffe4cc; color: #b4541f; }
  [data-landing] .lp-card-foot { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 12.5px; font-weight: 500; color: #8a847b; }

  /* Card 2 — clean weekly chart */
  [data-landing] .lp-chart-head { display: flex; align-items: baseline; justify-content: space-between; }
  [data-landing] .lp-chart-label { font-size: 12px; font-weight: 500; color: #8a847b; }
  [data-landing] .lp-chart-delta { font-size: 11.5px; font-weight: 600; color: #e2683d; }
  [data-landing] .lp-chart-big { margin-top: 3px; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
  [data-landing] .lp-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 7px; height: 90px; margin-top: 16px; }
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
  /* The dashboard render floats, then DISSOLVES at the bottom into the page
     background (#f4f2ee) so the step-card container appears to rise out of it
     — matching the Grovia template. Mask handles the fade (no hard edge). */
  /* Dashboard render is NARROWER than the tray (863 vs 1040, like the published
     version): a plain rounded image, no fade, no shadow. The wider opaque tray
     below overlaps its bottom, so it appears to tuck into the cards. */
  [data-landing] .hiw-dash {
    position: relative; z-index: 1;
    width: 863px; max-width: 100%; margin: 0 auto;
    border-radius: 26px; overflow: hidden;
    /* Frosted-glass marketing card, like the template: a translucent white
       surface with a soft white rim + float — that's where the "white border"
       reads from, not a heavy stroke. */
    background: rgba(255, 255, 255, 0.5);
    -webkit-backdrop-filter: blur(30px) saturate(1.25);
    backdrop-filter: blur(30px) saturate(1.25);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 24px 52px rgba(38, 34, 28, 0.12), 0 3px 10px rgba(38, 34, 28, 0.05);
  }
  [data-landing] .hiw-dash img { display: block; width: 100%; height: auto; }
  /* Soft fade where the dashboard meets the tray — the render dissolves into the
     page background just before the cards rise (matches the template's gradient). */
  [data-landing] .hiw-dash::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 124px; height: 56px;
    background: linear-gradient(to bottom, rgba(244, 242, 238, 0) 0%, rgba(244, 242, 238, 1) 100%);
    pointer-events: none; z-index: 2;
  }
  /* A cream TRAY (same family as the page background) holding three SEPARATE
     white card tiles with gaps between them — the Grovia bento layout.
     Only a tiny sliver of the dashboard overlaps behind the tray's top edge. */
  [data-landing] .hiw-row {
    position: relative; z-index: 2; margin-top: -124px;
    display: flex; gap: 8px; height: 360px; padding: 8px;
    border-radius: 24px; background: rgb(240, 236, 230);
  }
  [data-landing] .hiw-card {
    position: relative; overflow: hidden; flex: 1 1 0; min-width: 0;
    display: flex; flex-direction: column; justify-content: space-between;
    background: rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 24px; cursor: pointer;
    transition: flex-grow 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.35s ease, box-shadow 0.35s ease, background 0.35s ease;
  }
  [data-landing] .hiw-card-active {
    flex-grow: 2.29; background: rgba(255, 255, 255, 0.9); transform: translateY(-2px);
    box-shadow: 0 20px 44px rgba(40, 35, 28, 0.12), 0 3px 12px rgba(40, 35, 28, 0.05);
  }
  /* Number / title / body — exact computed values from the published Framer
     cards (title = Albert Sans 26/400; number + body = neutral grey, 18 / 16). */
  [data-landing] .hiw-num { font-family: 'Geist', sans-serif; font-size: 18px; font-weight: 400; line-height: 1.4; letter-spacing: -0.03em; color: rgb(174, 174, 174); }
  [data-landing] .hiw-card-text { position: relative; z-index: 2; max-width: 100%; transition: max-width 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
  [data-landing] .hiw-card-active .hiw-card-text { max-width: calc(100% - 262px); }
  [data-landing] .hiw-title { font-family: 'Albert Sans', sans-serif; font-size: 26px; font-weight: 400; letter-spacing: -0.04em; line-height: 1.3; color: #000; }
  [data-landing] .hiw-body { margin-top: 14px; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.4; letter-spacing: -0.03em; color: rgb(96, 95, 95); max-width: 20rem; }
  /* Preview is a fixed 222×292 card anchored top-right (not full-height) */
  [data-landing] .hiw-card-preview {
    position: absolute; top: 24px; right: 24px; width: 222px; height: 292px;
    opacity: 0; transform: translateX(28px) scale(0.96); transform-origin: right center;
    transition: opacity 0.28s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    pointer-events: none;
  }
  [data-landing] .hiw-card-active .hiw-card-preview { opacity: 1; transform: translateX(0) scale(1); }

  /* preview = pastel gradient surface + frosted glass panel (like the template) */
  [data-landing] .hiw-pv {
    position: relative; width: 100%; height: 100%; border-radius: 18px; overflow: hidden;
    font-family: "Plus Jakarta Sans", sans-serif; color: #1d1d1d;
    background:
      radial-gradient(ellipse 70% 55% at 12% 88%, #ecc88c 0%, transparent 58%),
      radial-gradient(ellipse 60% 55% at 86% 14%, #e6bca8 0%, transparent 56%),
      radial-gradient(ellipse 55% 50% at 95% 92%, #c7d2b5 0%, transparent 58%),
      linear-gradient(135deg, #fbf4e6 0%, #f7efe2 50%, #f1ebde 100%);
  }
  [data-landing] .hiw-pv-glass {
    position: absolute; inset: 14px;
    background: rgba(255, 255, 255, 0.82);
    -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
    border-radius: 14px; box-shadow: 0 12px 26px rgba(40, 35, 28, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.55);
    padding: 14px; display: flex; flex-direction: column; gap: 9px; overflow: hidden;
  }
  [data-landing] .hiw-pv-title { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .hiw-pv-sub { font-size: 10px; color: rgba(97,97,97,0.78); margin-top: -6px; }
  [data-landing] .hiw-pv-field label { display: block; font-size: 9.5px; font-weight: 600; color: rgba(29,29,29,0.8); margin-bottom: 4px; }
  [data-landing] .hiw-pv-input { font-size: 11px; padding: 8px 10px; border-radius: 9px; background: rgba(255,255,255,0.86); box-shadow: inset 0 0 0 1px rgba(214,210,205,0.55); color: rgba(97,97,97,0.85); }
  [data-landing] .hiw-pv-hl { background: #fbeaa0; box-shadow: inset 0 0 0 1px rgba(227,168,46,0.4); color: #6b5a18; font-weight: 700; }
  [data-landing] .hiw-pv-match { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 11px; background: rgba(255,255,255,0.9); box-shadow: inset 0 0 0 1px rgba(214,210,205,0.5); }
  [data-landing] .hiw-pv-match-hot { background: #fbeaa0; box-shadow: inset 0 0 0 1px rgba(227,168,46,0.35); }
  [data-landing] .hiw-pv-score { width: 26px; height: 26px; border-radius: 999px; background: #7fae8c; color: #fff; font-size: 10.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .hiw-pv-mt { font-size: 11px; font-weight: 700; }
  [data-landing] .hiw-pv-mm { font-size: 9px; color: rgba(97,97,97,0.75); margin-top: 1px; }
  [data-landing] .hiw-pv-chat { font-size: 10.5px; line-height: 1.35; background: rgba(255,255,255,0.9); box-shadow: inset 0 0 0 1px rgba(214,210,205,0.55); padding: 8px 10px; border-radius: 10px; border-top-left-radius: 2px; color: #1d1d1d; }
  [data-landing] .hiw-pv-offer { margin-top: auto; background: #fbeaa0; box-shadow: inset 0 0 0 1px rgba(227,168,46,0.4); padding: 10px 12px; border-radius: 12px; }
  [data-landing] .hiw-pv-offer-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #7a5a0a; }
  [data-landing] .hiw-pv-offer-row { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
  [data-landing] .hiw-pv-offer-row b { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
  [data-landing] .hiw-pv-sent { margin-left: auto; font-size: 9px; font-weight: 700; background: rgba(29,29,29,0.12); padding: 3px 8px; border-radius: 999px; }

  @media (max-width: 809.98px) {
    [data-landing] .hiw-row { flex-direction: column; height: auto; margin-top: 18px; }
    [data-landing] .hiw-card { flex: none; gap: 18px; }
    [data-landing] .hiw-card-text, [data-landing] .hiw-card-active .hiw-card-text { max-width: 100%; }
    [data-landing] .hiw-card-preview { position: relative; inset: auto; opacity: 1; transform: none; width: 100%; max-width: 280px; height: 248px; margin-top: 4px; }
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
        <div className="lg:relative lg:left-10">
          <p className="lp-eyebrow lp-in" style={inDelay(0)}>{HERO.eyebrow}</p>
          <h1 className="lp-in max-w-[440px]" style={inDelay(0.08)}>{HERO.headline}</h1>
          <p className="lp-sub lp-in mt-6 max-w-[27rem]" style={inDelay(0.16)}>
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
    <section className="px-5 pb-10 pt-14 sm:px-8">
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
        <div className="hiw-pv-glass">
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
      </div>
    ),
  },
  {
    num: "02",
    title: "Filter and find your match",
    body: "Filter by ROI target, location, asset type, or cap rate. Every off-market property is auto-scored against your client's exchange.",
    preview: (
      <div className="hiw-pv">
        <div className="hiw-pv-glass">
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
      </div>
    ),
  },
  {
    num: "03",
    title: "Connect and offer",
    body: "Open a private line with the listing agent, submit an offer, and lock it in before the old property lists.",
    preview: (
      <div className="hiw-pv">
        <div className="hiw-pv-glass">
          <div className="hiw-pv-title">Private connection</div>
          <div className="hiw-pv-sub">With Alex Chen</div>
          <div className="hiw-pv-chat">Financials attached. Open to offers.</div>
          <div className="hiw-pv-offer">
            <div className="hiw-pv-offer-label">Offer submitted</div>
            <div className="hiw-pv-offer-row"><b>$4.15M</b><span className="hiw-pv-sent">Sent</span></div>
          </div>
        </div>
      </div>
    ),
  },
] as const;

/* ───────── Pipeline marketing board (replaces the flat dashboard render) ─────────
   A designed app-window mockup of the agent Pipeline — kanban columns of
   exchange deals moving through stages — in the spirit of the template's board,
   but built natively so it stays crisp and on-brand.                          */

const PIPELINE_STYLE = `
  [data-landing] .pb {
    display: flex; width: 100%; height: 604px; overflow: hidden;
    background: transparent; color: #1d1d1d; text-align: left;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* Sidebar */
  [data-landing] .pb-side { width: 186px; flex: none; display: flex; flex-direction: column; padding: 18px 14px 16px; background: rgba(255, 255, 255, 0.5); border-right: 1px solid rgba(255, 255, 255, 0.6); }
  [data-landing] .pb-brand { display: flex; align-items: center; gap: 8px; padding: 0 2px; margin-bottom: 20px; }
  [data-landing] .pb-brand-logo { width: 26px; height: 26px; flex: none; border-radius: 8px; background: #1d1d1d; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pb-brand-logo svg { width: 14px; height: 14px; }
  [data-landing] .pb-brand-name { font-size: 12px; font-weight: 700; letter-spacing: -0.02em; }
  [data-landing] .pb-brand-badge { margin-left: auto; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9a7b15; background: #fcf1cf; padding: 2px 5px; border-radius: 999px; }
  [data-landing] .pb-navlabel { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #bbb4a9; margin: 16px 10px 7px; }
  [data-landing] .pb-nav { display: flex; flex-direction: column; gap: 1px; }
  [data-landing] .pb-nav-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; font-size: 12px; font-weight: 500; color: #6b655c; }
  [data-landing] .pb-nav-item svg { width: 15px; height: 15px; flex: none; color: #b0a99e; stroke-width: 2; }
  /* Exchange list (like the template's project list) */
  [data-landing] .pb-proj { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 9px; font-size: 12px; font-weight: 500; color: #6b655c; }
  [data-landing] .pb-proj-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
  [data-landing] .pb-proj.is-active { background: #fbeaa0; color: #6b5a18; font-weight: 600; }
  /* Widget — glowing bulb */
  [data-landing] .pb-widget { margin-top: auto; position: relative; border-radius: 14px; padding: 30px 12px 13px; text-align: center; background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #fbf2dc 100%); border: 1px solid rgba(241,233,216,0.8); overflow: hidden; }
  [data-landing] .pb-widget-bulb { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 999px; background: radial-gradient(circle, rgba(255,214,90,0.9) 0%, rgba(255,214,90,0) 68%); display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pb-widget-bulb svg { width: 15px; height: 15px; color: #e0a106; }
  [data-landing] .pb-widget-title { margin-top: 16px; font-size: 10.5px; font-weight: 700; color: #1d1d1d; }
  [data-landing] .pb-widget-text { margin-top: 4px; font-size: 9px; line-height: 1.45; color: #a39d93; }

  /* Main */
  [data-landing] .pb-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  [data-landing] .pb-top { display: flex; align-items: center; gap: 9px; padding: 17px 22px 0; }
  [data-landing] .pb-title { font-size: 21px; font-weight: 700; letter-spacing: -0.04em; }
  [data-landing] .pb-title-ico { display: inline-flex; gap: 6px; margin-left: 3px; }
  [data-landing] .pb-title-ico span { width: 22px; height: 22px; border-radius: 7px; background: rgba(255,255,255,0.65); border: 1px solid rgba(214,210,205,0.5); display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pb-title-ico svg { width: 11px; height: 11px; color: #8a847b; }
  [data-landing] .pb-top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  [data-landing] .pb-invite { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: #6b655c; }
  [data-landing] .pb-invite svg { width: 13px; height: 13px; color: #8a847b; }

  /* Toolbar */
  [data-landing] .pb-toolbar { display: flex; align-items: center; gap: 8px; padding: 15px 22px 0; }
  [data-landing] .pb-pill { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(214,210,205,0.55); background: rgba(255,255,255,0.5); font-size: 11.5px; font-weight: 600; color: #6b655c; white-space: nowrap; }
  [data-landing] .pb-pill svg { width: 13px; height: 13px; color: #a39d93; }
  [data-landing] .pb-chev { width: 11px; height: 11px; }
  [data-landing] .pb-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  [data-landing] .pb-iconbtn { width: 30px; height: 30px; border-radius: 999px; border: 1px solid rgba(214,210,205,0.55); background: rgba(255,255,255,0.5); display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pb-iconbtn svg { width: 14px; height: 14px; color: #8a847b; }
  [data-landing] .pb-share { color: #1d1d1d; }

  /* Avatars */
  [data-landing] .pb-avatars { display: inline-flex; align-items: center; }
  [data-landing] .pb-av { width: 24px; height: 24px; border-radius: 999px; margin-left: -7px; border: 2px solid #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; }
  [data-landing] .pb-av:first-child { margin-left: 0; }
  [data-landing] .pb-av-more { background: #fcdce4; color: #c0457a; }

  /* Board */
  [data-landing] .pb-board { flex: 1; display: flex; gap: 16px; padding: 18px 22px 0; overflow: hidden; }
  [data-landing] .pb-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  [data-landing] .pb-col-head { display: flex; align-items: center; gap: 7px; padding-bottom: 9px; margin-bottom: 13px; border-bottom: 2px solid #e1dccf; }
  [data-landing] .pb-col-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
  [data-landing] .pb-col-title { font-size: 12px; font-weight: 600; color: #4a453d; }
  [data-landing] .pb-col-count { font-size: 9.5px; font-weight: 700; color: #a39d93; background: rgba(255, 255, 255, 0.8); padding: 1px 7px; border-radius: 999px; }
  [data-landing] .pb-col-cards { display: flex; flex-direction: column; gap: 13px; }

  /* Deal card — Grovia style: tag, title, photo-or-text, avatars + meta footer */
  [data-landing] .pb-deal { background: #fff; border-radius: 14px; padding: 13px; box-shadow: 0 1px 2px rgba(40,35,28,.04), 0 6px 18px rgba(40,35,28,.05); }
  /* Card being dragged: a dashed placeholder marks its old slot, card lifts off it */
  [data-landing] .pb-drag { position: relative; margin-top: 2px; }
  [data-landing] .pb-placeholder { position: absolute; inset: 0; border: 2px dashed #d4cdbf; border-radius: 14px; z-index: 0; }
  [data-landing] .pb-deal.is-lifted { position: relative; z-index: 3; transform: rotate(-3deg) translate(-4px, -15px); box-shadow: 0 22px 44px rgba(40,35,28,.2); }
  [data-landing] .pb-tag { display: inline-flex; font-size: 8.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
  [data-landing] .pb-tag.tone-peach { color: #9d7a4d; background: #f4e8d6; }
  [data-landing] .pb-tag.tone-red { color: #b06a5c; background: #f6e3df; }
  [data-landing] .pb-tag.tone-green { color: #6f9070; background: #e4ede0; }
  [data-landing] .pb-deal-title { margin-top: 9px; font-size: 13px; font-weight: 700; letter-spacing: -0.015em; color: #1d1d1d; line-height: 1.25; }
  [data-landing] .pb-deal-text { margin-top: 6px; font-size: 10px; line-height: 1.5; color: #8a847b; }
  [data-landing] .pb-deal-photo { margin-top: 11px; height: 94px; border-radius: 11px; background-size: cover; background-position: center; }
  [data-landing] .pb-deal-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
  [data-landing] .pb-deal-foot .pb-av { width: 20px; height: 20px; font-size: 7.5px; }
  [data-landing] .pb-meta { display: inline-flex; align-items: center; gap: 11px; }
  [data-landing] .pb-meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 500; color: #a39d93; }
  [data-landing] .pb-meta-item svg { width: 11px; height: 11px; }
`;

const PB_NAV = [
  { Icon: LayoutDashboard, label: "Dashboard" },
  { Icon: Users, label: "My Clients" },
  { Icon: Sparkles, label: "Matches" },
  { Icon: MessageSquare, label: "Messages" },
  { Icon: Settings, label: "Settings" },
];

const PB_EXCHANGES = [
  { name: "Boston Office Park", dot: "#d9a838", active: true },
  { name: "Cambridge Lab", dot: "#e2945a" },
  { name: "Seaport Retail", dot: "#a07bd0" },
  { name: "Quincy Industrial", dot: "#d4736b" },
];

type PbDealData = {
  tag: string; tone: "peach" | "red" | "green"; title: string;
  photo?: string; text?: string; lifted?: boolean;
  matches: number; docs: number; avatars: string[];
};

const PB_COLS: Array<{ title: string; count: number; dot: string; deals: PbDealData[] }> = [
  {
    title: "New matches", count: 4, dot: "#aba499",
    deals: [
      { tag: "New", tone: "peach", title: "Kendall Square Lab", text: "$6.8M · Cambridge · 6.2% cap. Stabilized lab/office steps from MIT.", matches: 5, docs: 2, avatars: ["RC", "MJ"] },
      { tag: "Hot match", tone: "red", lifted: true, title: "Harbor Point Office", photo: "/landing-prop-office.jpg", matches: 8, docs: 4, avatars: ["AK", "TS"] },
    ],
  },
  {
    title: "In review", count: 3, dot: "#e09a4a",
    deals: [
      { tag: "Strong fit", tone: "peach", title: "Back Bay Retail Center", photo: "/landing-prop-retail.jpg", matches: 6, docs: 3, avatars: ["BL", "DV"] },
      { tag: "New", tone: "peach", title: "Seaport Self-Storage", text: "$2.9M · Boston · 7.1% cap. Value-add storage, 92% occupied.", matches: 3, docs: 1, avatars: ["JT"] },
    ],
  },
  {
    title: "Offers out", count: 2, dot: "#74ab83",
    deals: [
      { tag: "Offer sent", tone: "green", title: "Merrimack Logistics", photo: "/landing-prop-industrial.jpg", matches: 4, docs: 6, avatars: ["JA", "KP"] },
      { tag: "Closing", tone: "green", title: "Quincy Flex Park", text: "$3.3M · Quincy · 6.4% cap. Under LOI, scheduled to close Q3.", matches: 2, docs: 5, avatars: ["RM"] },
    ],
  },
];

const PB_AV_COLORS = ["#8a86bf", "#7fae8c", "#d6a868", "#cf877b", "#7ea7bd", "#a98cbe", "#c98aa6"];
const avColor = (s: string) => PB_AV_COLORS[s.charCodeAt(0) % PB_AV_COLORS.length];

function PbDeal({ d }: { d: PbDealData }) {
  return (
    <div className={`pb-deal${d.lifted ? " is-lifted" : ""}`}>
      <span className={`pb-tag tone-${d.tone}`}>{d.tag}</span>
      <div className="pb-deal-title">{d.title}</div>
      {d.photo ? (
        <div className="pb-deal-photo" style={{ backgroundImage: `url(${d.photo})` }} />
      ) : (
        <div className="pb-deal-text">{d.text}</div>
      )}
      <div className="pb-deal-foot">
        <div className="pb-avatars">
          {d.avatars.map((a) => <span key={a} className="pb-av" style={{ background: avColor(a) }} />)}
        </div>
        <div className="pb-meta">
          <span className="pb-meta-item"><MessageSquare />{d.matches}</span>
          <span className="pb-meta-item"><Paperclip />{d.docs}</span>
        </div>
      </div>
    </div>
  );
}

function PipelineBoard() {
  return (
    <div className="pb">
      <aside className="pb-side">
        <nav className="pb-nav">
          {PB_NAV.map(({ Icon, label }) => (
            <div key={label} className="pb-nav-item"><Icon /><span>{label}</span></div>
          ))}
        </nav>
        <div className="pb-navlabel">Exchanges</div>
        <nav className="pb-nav">
          {PB_EXCHANGES.map((e) => (
            <div key={e.name} className={`pb-proj${e.active ? " is-active" : ""}`}>
              <span className="pb-proj-dot" style={{ background: e.dot }} /><span>{e.name}</span>
            </div>
          ))}
        </nav>
        <div className="pb-widget">
          <span className="pb-widget-bulb"><Lightbulb /></span>
          <div className="pb-widget-title">Deadline radar</div>
          <div className="pb-widget-text">3 exchanges have ID deadlines within 30 days.</div>
        </div>
      </aside>
      <div className="pb-main">
        <div className="pb-top">
          <span className="pb-title">Boston Office Park</span>
          <span className="pb-title-ico"><span><Pencil /></span><span><Link2 /></span></span>
          <div className="pb-top-right">
            <span className="pb-invite"><Plus />Invite</span>
            <div className="pb-avatars">
              {["AK", "TS", "MR", "DV"].map((a) => <span key={a} className="pb-av" style={{ background: avColor(a) }} />)}
              <span className="pb-av pb-av-more">+2</span>
            </div>
          </div>
        </div>
        <div className="pb-toolbar">
          <span className="pb-pill"><SlidersHorizontal />Filter<ChevronDown className="pb-chev" /></span>
          <span className="pb-pill"><Calendar />This month<ChevronDown className="pb-chev" /></span>
          <div className="pb-toolbar-right">
            <span className="pb-pill pb-share"><Share2 />Share</span>
            <span className="pb-iconbtn"><LayoutGrid /></span>
          </div>
        </div>
        <div className="pb-board">
          {PB_COLS.map((col) => (
            <div key={col.title} className="pb-col">
              <div className="pb-col-head" style={{ borderBottomColor: col.dot }}>
                <span className="pb-col-dot" style={{ background: col.dot }} />
                <span className="pb-col-title">{col.title}</span>
                <span className="pb-col-count">{col.count}</span>
              </div>
              <div className="pb-col-cards">
                {col.deals.map((d) =>
                  d.lifted ? (
                    <div key={d.title} className="pb-drag"><span className="pb-placeholder" /><PbDeal d={d} /></div>
                  ) : (
                    <PbDeal key={d.title} d={d} />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="process" className="px-5 pt-14 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
      <div className="mx-auto max-w-[1040px]">
        <div className="hiw-dash" data-reveal>
          <PipelineBoard />
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
      <style>{PIPELINE_STYLE}</style>
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

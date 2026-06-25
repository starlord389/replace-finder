import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import Lenis from "lenis";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Sparkles, MessageSquare, Settings, Pencil,
  Link2, Plus, SlidersHorizontal, Calendar, ChevronDown, Share2,
  LayoutGrid, Paperclip, Lightbulb, Building2, Gauge, TrendingUp,
  ShieldCheck, Check, User, ArrowRight, X,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ───────────────────────── Content ───────────────────────── */

const HERO = {
  eyebrow: "Built for real estate agents & brokers",
  headline: "Find your client's next replacement property.",
  subheadline:
    "A network of 1031 exchange replacement properties — so your client can find the next one before the old one ever gets listed.",
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
  [data-landing] .lp-hero-visual { position: relative; width: 100%; max-width: 530px; min-width: 0; margin: 0 auto; padding-bottom: 12%; }
  /* Desktop (two-column hero) nudges the visual toward the copy; on smaller
     screens it stays centered and fluid so it never spills off the page. */
  @media (min-width: 1024px) { [data-landing] .lp-hero-visual { left: -40px; } }
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

  /* ── Mobile-only hero polish (phones ≤640px) — must NOT affect ≥640px ── */
  @media (max-width: 639.98px) {
    /* Center the eyebrow, headline + subhead; keep the CTAs on one centered row */
    [data-landing] .lp-hero-copy { text-align: center; }
    [data-landing] .lp-hero-copy h1 { margin-left: auto; margin-right: auto; }
    [data-landing] .lp-hero-copy .lp-sub { margin-left: auto; margin-right: auto; }
    [data-landing] .lp-hero-cta { justify-content: center; flex-wrap: nowrap; }

    /* Eyebrow: smaller, on a single line */
    [data-landing] .lp-eyebrow { font-size: 10px; letter-spacing: 0.05em; padding: 5px 12px; white-space: nowrap; }

    /* Logo marquee: a touch faster (only ~2 logos visible at a time) */
    [data-landing] .lp-marquee-track { animation-duration: 30s; }

    /* Hero cards: render at full desktop proportions, then scale the whole
       composition down uniformly so they look identical to the desktop cards,
       just smaller (matching the Grovia template) — no reflow/cramping.
       The cards live in an absolutely-centered inner wrapper that's scaled as
       one unit; .lp-hero-visual is just a fixed-height stage for them. */
    [data-landing] .lp-hero-grid { grid-template-columns: minmax(0, 1fr); }
    [data-landing] .lp-hero-visual {
      width: 100%; max-width: 380px; height: 220px; padding-bottom: 0;
      margin-left: auto; margin-right: auto;
    }
    [data-landing] .lp-hero-cards {
      position: absolute; top: 0; left: 50%; width: 530px;
      transform: translateX(-50%) scale(0.61); transform-origin: top center;
    }
    /* desktop chart-card geometry (undo the ≤809.98px tablet tweak) */
    [data-landing] .lp-card-detail { right: -3%; bottom: -11%; width: 56%; transform: rotate(5deg); }
  }
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
      <div className="lp-hero-grid mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="lp-hero-copy lg:relative lg:left-10">
          <p className="lp-eyebrow lp-in" style={inDelay(0)}>{HERO.eyebrow}</p>
          <h1 className="lp-in max-w-[440px]" style={inDelay(0.08)}>{HERO.headline}</h1>
          <p className="lp-sub lp-in mt-6 max-w-[27rem]" style={inDelay(0.16)}>
            {HERO.subheadline}
          </p>
          <div className="lp-hero-cta lp-in mt-9 flex flex-wrap items-center gap-3" style={inDelay(0.24)}>
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
      <div className="lp-hero-cards">
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
    body: "Filter by ROI target, location, asset type, or cap rate. Every property in the network is auto-scored against your client's exchange.",
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
    body: "Open a direct line with the listing agent, submit an offer, and move to contract.",
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

  /* ── Mobile (phones ≤640px): scale the whole board down to fit the frame
     (Grovia-style) instead of letting the columns reflow + clip. --hiw-scale
     and --hiw-board-h are set by a ResizeObserver in HowItWorks so the board
     fills any phone width. Must NOT affect ≥640px. ── */
  @media (max-width: 639.98px) {
    [data-landing] .hiw-dash {
      height: var(--hiw-board-h, 250px);
      /* Fade the bottom of the board so it dissolves into the page before the
         step cards below (matches the Grovia template). */
      -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent 100%);
      mask-image: linear-gradient(to bottom, #000 70%, transparent 100%);
    }
    [data-landing] .hiw-dash::after { display: none; }
    [data-landing] .pb {
      width: 863px; height: 604px;
      transform: scale(var(--hiw-scale, 0.4)); transform-origin: top left;
    }
  }
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
          <div className="pb-widget-title">Match radar</div>
          <div className="pb-widget-text">3 new replacement-property matches surfaced this week.</div>
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

/* ───────── Features showcase — tabbed feature section (mirrors the template) ───────── */

const FEATURES_STYLE = `
  [data-landing] .fs { width: min(960px, 100%); margin: 0 auto; }
  [data-landing] .fs-head { width: min(580px, 100%); margin: 0 auto; text-align: center; }
  [data-landing] .fs-head h2 { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px, 3.7vw, 46px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.04; color: #171717; }
  [data-landing] .fs-sub { margin: 14px auto 0; max-width: 520px; font-family: 'Geist', sans-serif; font-size: 17px; font-weight: 400; line-height: 1.5; letter-spacing: -0.02em; color: rgba(86,82,75,0.86); }

  /* Tab bar — full-pill segmented control on a soft warm cream panel (matches Grovia) */
  [data-landing] .fs-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; padding: 7px; margin: 26px 0 16px; border-radius: 999px; background: linear-gradient(180deg, #f1ece3 0%, #ede7dd 100%); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.025); }
  [data-landing] .fs-tab { appearance: none; border: none; background: transparent; border-radius: 999px; min-height: 58px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; cursor: pointer; font-family: 'Geist', sans-serif; font-size: 17px; font-weight: 500; letter-spacing: -0.02em; color: rgba(96,91,84,0.92); white-space: nowrap; transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
  [data-landing] .fs-tab svg { width: 18px; height: 18px; flex: none; stroke-width: 1.9; color: #9c958b; transition: color 0.2s ease; }
  [data-landing] .fs-tab:hover:not(.is-active) { background: rgba(255,255,255,0.5); color: #2c2a26; }
  [data-landing] .fs-tab:hover:not(.is-active) svg { color: #6b655c; }
  [data-landing] .fs-tab:active:not(.is-active) { transform: scale(0.985); }
  [data-landing] .fs-tab.is-active svg { color: #1d1d1d; }
  [data-landing] .fs-tab.is-active { position: relative; z-index: 1; background: #ffffff; color: #1d1d1d; box-shadow: rgba(0,0,0,0.17) 0px 0.6px 1.57px -1.5px, rgba(0,0,0,0.14) 0px 2.29px 5.95px -3px, rgba(0,0,0,0.02) 0px 10px 26px -4.5px; }

  /* Content card */
  [data-landing] .fs-card { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); overflow: hidden; border-radius: 24px; background: linear-gradient(180deg, #faf8f4 0%, #f7f5f0 100%); border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 8px 20px rgba(104,99,80,0.15); }
  [data-landing] .fs-left { position: relative; min-height: 372px; margin: 8px; border-radius: 18px; overflow: hidden; background: radial-gradient(circle at 10% 92%, rgba(132,24,0,0.9) 0%, rgba(132,24,0,0) 30%), radial-gradient(circle at 95% 88%, rgba(122,23,0,0.78) 0%, rgba(122,23,0,0) 28%), linear-gradient(180deg, #39484d 0%, #344248 56%, #27363a 100%); }
  [data-landing] .fs-right { display: flex; flex-direction: column; justify-content: center; padding: 44px 42px; }
  [data-landing] .fs-eyebrow { align-self: flex-start; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.01em; color: #1d1d1d; background: #fef7af; padding: 7px 12px; border-radius: 999px; line-height: 1; }
  [data-landing] .fs-title { margin-top: 18px; font-family: 'Albert Sans', sans-serif; font-size: clamp(23px, 2.7vw, 33px); font-weight: 500; letter-spacing: -0.04em; line-height: 1.12; color: #1a1a1a; }
  [data-landing] .fs-desc { margin-top: 18px; max-width: 366px; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 400; line-height: 1.55; letter-spacing: -0.015em; color: rgba(86,82,75,0.86); }

  /* Mockup window — a contained rounded panel sitting inside the dark frame */
  [data-landing] .fs-mock { position: absolute; left: 14px; right: 14px; top: 18px; bottom: 14px; border-radius: 26px; overflow: hidden; background: rgba(255,255,255,0.98); box-shadow: 0 20px 36px rgba(20,28,32,0.22); padding: 20px 18px; font-family: 'Geist', sans-serif; color: #1d1d1d; }
  [data-landing] .fs-mock-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  [data-landing] .fs-mock-title { font-size: 13px; font-weight: 700; letter-spacing: -0.02em; }
  [data-landing] .fs-verified { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #39484d; background: rgba(57,72,77,0.1); padding: 4px 9px; border-radius: 999px; letter-spacing: -0.01em; }
  [data-landing] .fs-verified svg { width: 11px; height: 11px; }

  /* Off-market inventory grid */
  [data-landing] .fs-inv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
  [data-landing] .fs-inv-photo { position: relative; height: 66px; border-radius: 17px; background-size: cover; background-position: center; }
  [data-landing] .fs-inv-private { position: absolute; top: 6px; right: 6px; font-size: 7.5px; font-weight: 700; color: #fff; background: rgba(29,29,29,0.55); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); padding: 2px 7px; border-radius: 999px; }
  [data-landing] .fs-inv-name { margin-top: 7px; font-size: 11px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .fs-inv-meta { margin-top: 1px; font-size: 9px; color: #a39d93; }

  /* Score breakdown */
  [data-landing] .fs-score-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 13px; }
  [data-landing] .fs-score-sub { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #a39d93; margin-top: 3px; }
  [data-landing] .fs-score-circle { width: 34px; height: 34px; border-radius: 999px; background: #7fae8c; color: #fff; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fs-score-rows { display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fs-score-row { display: flex; align-items: center; gap: 8px; }
  [data-landing] .fs-score-label { width: 60px; flex: none; font-size: 9.5px; font-weight: 500; color: #6b655c; }
  [data-landing] .fs-score-bar { flex: 1; height: 7px; border-radius: 999px; background: #efe9df; overflow: hidden; }
  [data-landing] .fs-score-bar span { display: block; height: 100%; border-radius: 999px; }
  [data-landing] .fs-score-val { width: 22px; flex: none; text-align: right; font-size: 9.5px; font-weight: 700; }
  [data-landing] .fs-score-tags { display: flex; gap: 6px; margin-top: 13px; }
  [data-landing] .fs-pill { font-size: 9px; font-weight: 600; color: #8a847b; background: #f2efe9; padding: 3px 9px; border-radius: 999px; }

  /* Filters */
  [data-landing] .fs-mock-filters { display: flex; gap: 13px; }
  [data-landing] .fs-filt-panel { width: 120px; flex: none; }
  [data-landing] .fs-filt-sub { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #a39d93; margin: 2px 0 11px; }
  [data-landing] .fs-filt-field { margin-bottom: 8px; }
  [data-landing] .fs-filt-label { display: block; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #b0a99e; margin-bottom: 3px; }
  [data-landing] .fs-filt-val { display: block; font-size: 10px; font-weight: 600; color: #4a453d; background: #f5f2ec; padding: 6px 8px; border-radius: 7px; }
  [data-landing] .fs-filt-results { flex: 1; min-width: 0; }
  [data-landing] .fs-filt-rhead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 9px; }
  [data-landing] .fs-filt-sort { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b0a99e; }
  [data-landing] .fs-filt-match { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 10px; background: #f7f4ee; margin-bottom: 8px; }
  [data-landing] .fs-filt-match.is-hot { background: #fbeaa0; }
  [data-landing] .fs-filt-score { width: 24px; height: 24px; border-radius: 999px; background: #7fae8c; color: #fff; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fs-filt-name { font-size: 10.5px; font-weight: 700; }
  [data-landing] .fs-filt-meta { font-size: 8.5px; color: #8a847b; margin-top: 1px; }

  /* Upside comparison */
  [data-landing] .fs-up-head { margin-bottom: 12px; }
  [data-landing] .fs-up-sub { font-size: 8.5px; font-weight: 600; color: #a39d93; margin-top: 2px; }
  [data-landing] .fs-up-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
  [data-landing] .fs-up-col { border-radius: 12px; padding: 11px; background: #f5f2ec; }
  [data-landing] .fs-up-col.is-candidate { background: #fbeaa0; }
  [data-landing] .fs-up-label, [data-landing] .fs-up-clabel { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #a39d93; display: flex; align-items: center; gap: 5px; }
  [data-landing] .fs-up-col.is-candidate .fs-up-clabel { color: #8a6d12; }
  [data-landing] .fs-up-badge { font-size: 6.5px; font-weight: 800; color: #fff; background: #1d1d1d; padding: 2px 5px; border-radius: 999px; }
  [data-landing] .fs-up-name { margin-top: 7px; font-size: 11px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .fs-up-loc { font-size: 8.5px; color: #8a847b; }
  [data-landing] .fs-up-stat { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 9px; color: #8a847b; }
  [data-landing] .fs-up-stat b { font-size: 10px; font-weight: 700; color: #1d1d1d; }
  [data-landing] .fs-up-gain { display: flex; align-items: center; gap: 9px; margin-top: 12px; padding: 9px 12px; border-radius: 12px; background: #e4ede0; }
  [data-landing] .fs-up-gain svg { width: 17px; height: 17px; color: #5f8f6b; flex: none; }
  [data-landing] .fs-up-gain b { font-size: 13px; font-weight: 800; color: #2f6b46; }
  [data-landing] .fs-up-gain span { display: block; font-size: 8.5px; color: #6f9070; }

  /* ── In-image life — popping tooltip, live pulses (Grovia-style motion) ── */
  [data-landing] .fs-tip { position: absolute; z-index: 7; font-size: 9px; font-weight: 700; color: #fff; background: #1d1d1d; padding: 4px 8px; border-radius: 8px; white-space: nowrap; box-shadow: 0 7px 16px rgba(0,0,0,0.24); animation: fsTipPop 11s ease-in-out infinite; }
  [data-landing] .fs-tip::after { content: ''; position: absolute; left: 11px; bottom: -3px; width: 7px; height: 7px; background: #1d1d1d; transform: rotate(45deg); }
  [data-landing] .fs-live { position: relative; display: inline-block; width: 7px; height: 7px; border-radius: 999px; background: #4fae6e; flex: none; }
  [data-landing] .fs-live::after { content: ''; position: absolute; inset: 0; border-radius: 999px; background: #4fae6e; animation: fsLive 1.9s ease-out infinite; }
  [data-landing] .fs-ring { animation: fsRing 2.4s ease-out infinite; }
  [data-landing] .fs-bob { animation: fsBob 2.6s ease-in-out infinite; }
  [data-landing] .fs-glow { animation: fsGlow 3.2s ease-in-out infinite; }

  @keyframes fsTipPop { 0%, 16% { opacity: 0; transform: translateY(4px) scale(0.92); } 26%, 46% { opacity: 1; transform: none; } 58%, 100% { opacity: 0; transform: translateY(4px) scale(0.92); } }
  @keyframes fsLive { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.6); opacity: 0; } }
  @keyframes fsRing { 0% { box-shadow: 0 0 0 0 rgba(127,174,140,0.5); } 70%, 100% { box-shadow: 0 0 0 10px rgba(127,174,140,0); } }
  @keyframes fsBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes fsGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(217,175,42,0); } 50% { box-shadow: 0 0 0 3px rgba(217,175,42,0.3); } }

  /* Entrance animations — the panel is keyed by tab id, so these replay on every switch */
  @keyframes fsMockIn { from { opacity: 0; transform: translateY(10px) scale(0.985); } to { opacity: 1; transform: none; } }
  @keyframes fsUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes fsFill { from { transform: scaleX(0.04); } to { transform: scaleX(1); } }
  [data-landing] .fs-mock { animation: fsMockIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  [data-landing] .fs-right > * { animation: fsUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  [data-landing] .fs-eyebrow { animation-delay: 0.05s; }
  [data-landing] .fs-title { animation-delay: 0.12s; }
  [data-landing] .fs-desc { animation-delay: 0.19s; }
  [data-landing] .fs-anim { animation: fsUp 0.48s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(var(--i, 0) * 0.06s + 0.14s); }
  [data-landing] .fs-score-bar span { transform-origin: left center; animation: fsFill 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; animation-delay: calc(var(--i, 0) * 0.05s + 0.2s); }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .fs-mock, [data-landing] .fs-right > *, [data-landing] .fs-anim, [data-landing] .fs-score-bar span,
    [data-landing] .fs-tip, [data-landing] .fs-live::after, [data-landing] .fs-ring, [data-landing] .fs-bob, [data-landing] .fs-glow { animation: none !important; }
  }

  @media (max-width: 809.98px) {
    [data-landing] .fs-card { grid-template-columns: 1fr; height: auto; }
    [data-landing] .fs-left { height: 300px; }
    [data-landing] .fs-right { padding: 28px 24px; }
    /* Four equal columns can't fit the labels on a phone — switch to a
       horizontally scrollable row so each tab keeps its full label on one line. */
    [data-landing] .fs-tabs { display: flex; flex-wrap: nowrap; gap: 6px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    [data-landing] .fs-tabs::-webkit-scrollbar { display: none; }
    [data-landing] .fs-tab { flex: 0 0 auto; min-height: 46px; padding: 0 16px; font-size: 14px; }
  }

  /* Phones: stack the feature tabs vertically (Grovia mobile) so all four are
     visible at once, with the active one as a white pill. Tablet/desktop keep
     their layouts. */
  @media (max-width: 639.98px) {
    [data-landing] .fs-tabs {
      display: flex; flex-direction: column; flex-wrap: nowrap; overflow: visible;
      gap: 5px; padding: 8px; border-radius: 22px;
    }
    [data-landing] .fs-tab { width: 100%; flex: none; min-height: 50px; font-size: 15px; }
  }
`;

function FsOffMarket() {
  const props = [
    { photo: "/landing-prop-office.jpg", name: "Harbor Point Office", meta: "$4.2M · Boston, MA" },
    { photo: "/landing-prop-retail.jpg", name: "Back Bay Retail", meta: "$3.75M · Newton, MA" },
    { photo: "/landing-prop-industrial.jpg", name: "Merrimack Logistics", meta: "$5.1M · Lowell, MA" },
    { photo: "/landing-prop-office.jpg", name: "Seaport Landing Apts", meta: "$6.8M · Quincy, MA" },
  ];
  return (
    <div className="fs-mock">
      <div className="fs-mock-head">
        <span className="fs-mock-title">Replacement inventory</span>
        <span className="fs-verified"><ShieldCheck />4 verified</span>
      </div>
      <div className="fs-inv-grid">
        {props.map((p, i) => (
          <div key={p.name} className="fs-anim" style={{ "--i": i } as CSSProperties}>
            <div className="fs-inv-photo" style={{ backgroundImage: `url(${p.photo})` }} />
            <div className="fs-inv-name">{p.name}</div>
            <div className="fs-inv-meta">{p.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FsScoring() {
  const factors = [
    { label: "ROE uplift", score: 98 },
    { label: "Geography", score: 95 },
    { label: "Asset type", score: 100 },
    { label: "Strategy", score: 88 },
    { label: "Occupancy", score: 92 },
  ];
  return (
    <div className="fs-mock">
      <div className="fs-score-head">
        <div>
          <div className="fs-mock-title">Harbor Point Office Park</div>
          <div className="fs-score-sub">Match score breakdown</div>
        </div>
        <span className="fs-score-circle fs-ring">92</span>
      </div>
      <div className="fs-score-rows">
        {factors.map((f, i) => (
          <div key={f.label} className="fs-score-row fs-anim" style={{ "--i": i } as CSSProperties}>
            <span className="fs-score-label">{f.label}</span>
            <span className="fs-score-bar"><span style={{ width: `${f.score}%`, background: f.score < 80 ? "#e0a84a" : "#7fae8c" }} /></span>
            <span className="fs-score-val">{f.score}</span>
          </div>
        ))}
      </div>
      <div className="fs-score-tags">
        <span className="fs-pill">No boot</span><span className="fs-pill">Office</span><span className="fs-pill">Stabilized</span>
      </div>
      <div className="fs-tip" style={{ top: "48px", left: "118px" }}>Biggest driver: ROE uplift</div>
    </div>
  );
}

function FsFilters() {
  const fields = [["Geography", "Greater Boston"], ["Asset type", "Office, Retail"], ["Price", "$3M – $6M"], ["Cap rate", "6.5%+"]];
  const matches = [
    { s: 94, n: "Harbor Point Office", m: "$4.2M · 6.8% cap · Boston", hot: true },
    { s: 88, n: "Back Bay Retail", m: "$3.75M · 7.2% cap · Newton" },
    { s: 85, n: "Worcester Square Plaza", m: "$4.8M · 6.9% cap · Worcester" },
  ];
  return (
    <div className="fs-mock fs-mock-filters">
      <div className="fs-filt-panel">
        <div className="fs-mock-title" style={{ fontSize: "11px" }}>Filters</div>
        <div className="fs-filt-sub">Saved · Marcus Reeves</div>
        {fields.map(([l, v]) => (
          <div key={l} className="fs-filt-field">
            <span className="fs-filt-label">{l}</span>
            <span className="fs-filt-val">{v}</span>
          </div>
        ))}
      </div>
      <div className="fs-filt-results">
        <div className="fs-filt-rhead">
          <span className="fs-mock-title" style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}><span className="fs-live" />12 matches</span>
          <span className="fs-filt-sort">Sorted by score</span>
        </div>
        {matches.map((r, i) => (
          <div key={r.n} className={`fs-filt-match fs-anim${r.hot ? " is-hot fs-glow" : ""}`} style={{ "--i": i } as CSSProperties}>
            <span className="fs-filt-score">{r.s}</span>
            <div><div className="fs-filt-name">{r.n}</div><div className="fs-filt-meta">{r.m}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FsUpside() {
  const cur = [["Value", "$3.2M"], ["NOI", "$180K/yr"], ["Cap rate", "5.6%"]];
  const cand = [["Value", "$4.2M"], ["NOI", "$245K/yr"], ["Cap rate", "6.8%"]];
  return (
    <div className="fs-mock">
      <div className="fs-up-head">
        <div className="fs-mock-title">Upside comparison</div>
        <div className="fs-up-sub">Marcus Reeves · current vs candidate</div>
      </div>
      <div className="fs-up-cols">
        <div className="fs-up-col fs-anim" style={{ "--i": 0 } as CSSProperties}>
          <div className="fs-up-label">Current property</div>
          <div className="fs-up-name">Cambridge Office Plaza</div>
          <div className="fs-up-loc">Cambridge, MA</div>
          {cur.map(([l, v]) => <div key={l} className="fs-up-stat"><span>{l}</span><b>{v}</b></div>)}
        </div>
        <div className="fs-up-col is-candidate fs-anim" style={{ "--i": 1 } as CSSProperties}>
          <div className="fs-up-clabel">Replacement <span className="fs-up-badge">Candidate</span></div>
          <div className="fs-up-name">Harbor Point Office</div>
          <div className="fs-up-loc">Boston, MA</div>
          {cand.map(([l, v]) => <div key={l} className="fs-up-stat"><span>{l}</span><b>{v}</b></div>)}
        </div>
      </div>
      <div className="fs-up-gain fs-anim" style={{ "--i": 2 } as CSSProperties}>
        <TrendingUp className="fs-bob" />
        <div><b>+$65K / yr</b><span>+$480K over 10 years</span></div>
      </div>
    </div>
  );
}

const FEATURES = [
  { id: "off-market", Icon: Building2, label: "The network", eyebrow: "Live inventory", title: "Replacement properties, posted by other agents.", desc: "Every property is posted by a verified agent and matched to active 1031 exchanges, so your client gets early, direct access to replacements that fit — each one represented and ready to talk.", Visual: FsOffMarket },
  { id: "scoring", Icon: Gauge, label: "Auto-scoring", eyebrow: "Match engine", title: "Every match, scored for your client's return.", desc: "Every property is scored by how much it would lift your client's return on equity, then weighted by fit on geography, asset type, and strategy. You see the full breakdown behind every score — and so does your client.", Visual: FsScoring },
  { id: "filters", Icon: SlidersHorizontal, label: "Precision filters", eyebrow: "Custom search", title: "Dial in exactly what your client wants.", desc: "Filter every property by ROI target, geography, asset type, price band, cap rate, or debt profile. Save your client's criteria once and apply it to every new property that joins the network.", Visual: FsFilters },
  { id: "upside", Icon: TrendingUp, label: "Upside preview", eyebrow: "Projected return", title: "See exactly how much more your client could be earning.", desc: "Compare your client's current property against any candidate side-by-side — NOI, cap rate, projected 10-year return. Turn a “maybe someday” exchange into a clear yes.", Visual: FsUpside },
];

function FeaturesSection() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const f = FEATURES[active];
  const Visual = f.Visual;

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % FEATURES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + FEATURES.length) % FEATURES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = FEATURES.length - 1;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="feature" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="fs">
        <div className="fs-head" data-reveal>
          <h2>Every tool you need to close a 1031 exchange.</h2>
          <p className="fs-sub">One workspace for the whole exchange — your clients, their matches, the connections you've opened, and the offers on the table.</p>
        </div>
        <div className="fs-tabs" data-reveal role="tablist" aria-label="Features">
          {FEATURES.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`fs-tab-${t.id}`}
              aria-selected={active === i}
              aria-controls={`fs-panel-${t.id}`}
              tabIndex={active === i ? 0 : -1}
              className={`fs-tab${active === i ? " is-active" : ""}`}
              onClick={() => setActive(i)}
              onKeyDown={onTabKeyDown}
            >
              <t.Icon /><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div
          className="fs-card"
          data-reveal
          role="tabpanel"
          id={`fs-panel-${f.id}`}
          aria-labelledby={`fs-tab-${f.id}`}
        >
          <div className="fs-left" key={`v-${f.id}`}><Visual /></div>
          <div className="fs-right" key={`c-${f.id}`}>
            <span className="fs-eyebrow">{f.eyebrow}</span>
            <h3 className="fs-title">{f.title}</h3>
            <p className="fs-desc">{f.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [active, setActive] = useState(0);
  const dashRef = useRef<HTMLDivElement>(null);

  // On phones the Pipeline board renders at its full desktop width and is
  // scaled down to fill the frame (like the Grovia template) instead of the
  // columns reflowing + clipping. Drive the scale off the frame's real width
  // so it fits every phone size. The CSS only applies the scale at ≤640px.
  useEffect(() => {
    const el = dashRef.current;
    if (!el) return;
    const BOARD_W = 863;
    const apply = () => {
      const s = el.clientWidth / BOARD_W;
      el.style.setProperty("--hiw-scale", `${s}`);
      el.style.setProperty("--hiw-board-h", `${Math.round(604 * s)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="process" className="px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
      <div className="mx-auto max-w-[1040px]">
        <div className="hiw-dash" data-reveal ref={dashRef}>
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

/* ───────── Network coverage — asset classes the marketplace covers (matches the template's integrations layout) ───────── */

const INTEG_STYLE = `
  [data-landing] .ig { width: min(1040px, 100%); margin: 0 auto; }
  [data-landing] .ig-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 64px; align-items: center; }
  [data-landing] .ig-left { max-width: 440px; }
  [data-landing] .ig-left h2 { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px, 3.6vw, 44px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #171717; }
  [data-landing] .ig-sub { margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; letter-spacing: -0.02em; color: rgba(86,82,75,0.86); }
  [data-landing] .ig-cta { margin-top: 26px; }
  [data-landing] .ig-plus { display: flex; justify-content: space-between; width: 248px; margin: 34px 0; color: rgba(40,36,30,0.2); }
  [data-landing] .ig-plus svg { width: 13px; height: 13px; }
  [data-landing] .ig-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
  [data-landing] .ig-step { display: flex; align-items: center; gap: 14px; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 450; letter-spacing: -0.01em; color: #2c2a26; }
  [data-landing] .ig-step-num { flex: none; width: 26px; height: 26px; border-radius: 999px; background: #1d1d1d; color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }

  [data-landing] .ig-tiles { display: grid; grid-template-columns: repeat(2, 96px); gap: 16px; }
  [data-landing] .ig-tile { width: 96px; height: 96px; border-radius: 16px; background: #ebe6dd; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s ease, transform 0.2s ease; }
  [data-landing] .ig-tile:hover { background: #e6e0d4; transform: translateY(-2px); }
  [data-landing] .ig-tile svg { width: 30px; height: 30px; }
  [data-landing] .ig-tile span { font-family: 'Geist', sans-serif; font-size: 9.5px; font-weight: 500; letter-spacing: -0.01em; color: #6b655c; }

  @keyframes igUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  [data-landing] .ig-left[data-reveal].is-visible > * { animation: igUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  [data-landing] .ig-left[data-reveal].is-visible > *:nth-child(2) { animation-delay: 0.06s; }
  [data-landing] .ig-left[data-reveal].is-visible > *:nth-child(3) { animation-delay: 0.12s; }
  [data-landing] .ig-left[data-reveal].is-visible > *:nth-child(4) { animation-delay: 0.16s; }
  [data-landing] .ig-left[data-reveal].is-visible > *:nth-child(5) { animation-delay: 0.2s; }
  [data-landing] .ig-right[data-reveal].is-visible .ig-tile { animation: igUp 0.5s cubic-bezier(0.22,1,0.36,1) both; animation-delay: calc(var(--i,0) * 0.05s + 0.1s); }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .ig-left[data-reveal].is-visible > *, [data-landing] .ig-right[data-reveal].is-visible .ig-tile { animation: none; }
  }

  @media (max-width: 880px) {
    [data-landing] .ig-grid { grid-template-columns: 1fr; gap: 40px; }
    [data-landing] .ig-left { max-width: none; }
    [data-landing] .ig-right { display: flex; justify-content: center; }
    [data-landing] .ig-tiles { grid-template-columns: repeat(4, 1fr); width: 100%; max-width: 420px; }
    [data-landing] .ig-tile { width: 100%; }
    [data-landing] .ig-plus { display: none; }
  }
  @media (max-width: 480px) {
    /* Grovia keeps the tiles 4-per-row on phones too */
    [data-landing] .ig-tiles { grid-template-columns: repeat(4, 1fr); gap: 9px; }
    [data-landing] .ig-tile { height: 82px; gap: 6px; }
    [data-landing] .ig-tile span { font-size: 9px; white-space: nowrap; }
  }
  /* Phones: keep the decorative plus row between the CTA and steps, like the
     Grovia template (it's hidden in the 481–880px range). */
  @media (max-width: 639.98px) {
    [data-landing] .ig-plus { display: flex; width: 270px; margin: 28px 0; }
  }
`;

const IG_TILES = [
  { label: "Office", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="9" width="7" height="11.5" rx="2" fill="#a9e0ef" />
      <rect x="11.5" y="4" width="8.5" height="16.5" rx="2" fill="#74cfe6" />
      <rect x="13.7" y="7.3" width="1.7" height="1.7" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="16.3" y="7.3" width="1.7" height="1.7" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="13.7" y="10.6" width="1.7" height="1.7" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="16.3" y="10.6" width="1.7" height="1.7" rx="0.5" fill="#fff" opacity="0.92" />
    </svg>
  ) },
  { label: "Retail", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.2 8h13.6l-1.1 11.2a1.4 1.4 0 0 1-1.4 1.3H7.7a1.4 1.4 0 0 1-1.4-1.3L5.2 8z" fill="#f6c544" />
      <path d="M8.5 9V7.5a3.5 3.5 0 0 1 7 0V9" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.92" />
    </svg>
  ) },
  { label: "Industrial", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 20.5v-7l3.5 2.2v-2.2l3.5 2.2v-2.2l3.5 2.2v7H3z" fill="#f9d57e" />
      <rect x="15.5" y="5.5" width="4.5" height="15" rx="1.2" fill="#f6c544" />
    </svg>
  ) },
  { label: "Multifamily", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2.2" fill="#f4a09a" />
      <rect x="8" y="6.6" width="2.5" height="2.5" rx="0.6" fill="#fff" opacity="0.92" />
      <rect x="13.5" y="6.6" width="2.5" height="2.5" rx="0.6" fill="#fff" opacity="0.92" />
      <rect x="8" y="11" width="2.5" height="2.5" rx="0.6" fill="#fff" opacity="0.92" />
      <rect x="13.5" y="11" width="2.5" height="2.5" rx="0.6" fill="#fff" opacity="0.92" />
      <rect x="10" y="15.6" width="4" height="4.9" rx="0.6" fill="#fff" opacity="0.7" />
    </svg>
  ) },
  { label: "Medical", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="#f4a09a" />
      <path d="M12 7.6v8.8M7.6 12h8.8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  ) },
  { label: "Self-storage", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" fill="#74cfe6" />
      <rect x="6.5" y="8.2" width="11" height="1.5" rx="0.75" fill="#fff" opacity="0.85" />
      <rect x="6.5" y="11.4" width="11" height="1.5" rx="0.75" fill="#fff" opacity="0.85" />
      <rect x="6.5" y="14.6" width="11" height="1.5" rx="0.75" fill="#fff" opacity="0.85" />
      <rect x="10.5" y="17.4" width="3" height="1.4" rx="0.7" fill="#fff" opacity="0.95" />
    </svg>
  ) },
  { label: "Hospitality", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6.5" y="8" width="11" height="12.5" rx="1.8" fill="#74cfe6" />
      <path d="M12 4.2v3.8" stroke="#74cfe6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4.2l3.6 1.1L12 6.6V4.2z" fill="#a9e0ef" />
      <rect x="8.8" y="11" width="2" height="2" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="13.2" y="11" width="2" height="2" rx="0.5" fill="#fff" opacity="0.92" />
      <rect x="10.5" y="15.8" width="3" height="4.7" rx="0.5" fill="#fff" opacity="0.7" />
    </svg>
  ) },
  { label: "Land", mark: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="16.8" cy="7.8" r="2.9" fill="#f9d57e" />
      <path d="M2.5 20.5l5.2-6.8 3.6 4.2 3.9-5.4 6.3 8H2.5z" fill="#f6c544" />
    </svg>
  ) },
];

const IG_STEPS = [
  "Browse verified replacement properties",
  "Filter to your client's exchange criteria",
  "Connect directly with the listing agent",
];

function IntegrationsSection() {
  return (
    <section id="coverage" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="ig">
        <div className="ig-grid">
          <div className="ig-left" data-reveal>
            <h2>Replacement inventory across every asset class</h2>
            <p className="ig-sub">Find 1031 replacement property in every major asset class — each one verified and matched to your client's exchange and timeline.</p>
            <div className="ig-cta"><PillLink to={ROUTES.signup} primary>Get started</PillLink></div>
            <div className="ig-plus" aria-hidden="true"><Plus /><Plus /><Plus /><Plus /></div>
            <ul className="ig-steps">
              {IG_STEPS.map((s, i) => (
                <li key={s} className="ig-step"><span className="ig-step-num">0{i + 1}</span>{s}</li>
              ))}
            </ul>
          </div>
          <div className="ig-right" data-reveal>
            <div className="ig-tiles">
              {IG_TILES.map((t, i) => (
                <div key={t.label} className="ig-tile" style={{ "--i": i } as CSSProperties}>
                  {t.mark}
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Pricing — dark Grovia-style container with a 3-plan selector (all free in early access) ───────── */

const PRICE_STYLE = `
  [data-landing] .pp { position: relative; overflow: hidden; width: 100%; max-width: 2200px; margin: 0 auto; border-radius: 32px; padding: 92px 40px; background: radial-gradient(ellipse 52% 62% at 72% 50%, rgba(178,74,40,0.42) 0%, rgba(178,74,40,0) 62%), radial-gradient(ellipse 48% 58% at 50% 88%, rgba(74,128,86,0.4) 0%, rgba(74,128,86,0) 60%), radial-gradient(ellipse 42% 52% at 88% 80%, rgba(128,60,120,0.4) 0%, rgba(128,60,120,0) 60%), radial-gradient(ellipse 42% 48% at 14% 90%, rgba(150,36,12,0.5) 0%, rgba(150,36,12,0) 58%), linear-gradient(180deg, #3a4a50 0%, #313f44 55%, #27343a 100%); }
  [data-landing] .pp-grid { position: relative; max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 420px); gap: 48px; align-items: stretch; }
  [data-landing] .pp-left { display: flex; flex-direction: column; }
  [data-landing] .pp-left h2 { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(30px, 3.4vw, 42px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.05; color: #fff; }
  [data-landing] .pp-left-sub { margin: 12px 0 0; max-width: 330px; font-family: 'Geist', sans-serif; font-size: 15px; line-height: 1.5; color: rgba(255,255,255,0.6); }
  [data-landing] .pp-selectors { margin-top: 38px; max-width: 340px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 5px; }
  [data-landing] .pp-sel { width: 100%; appearance: none; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; border-radius: 12px; background: transparent; border: 1px solid transparent; transition: background 0.2s ease, border-color 0.2s ease; }
  [data-landing] .pp-sel-text { display: flex; flex-direction: column; gap: 2px; }
  [data-landing] .pp-sel-name { font-family: 'Albert Sans', sans-serif; font-size: 16px; font-weight: 500; letter-spacing: -0.02em; color: rgba(255,255,255,0.62); transition: color 0.2s ease; }
  [data-landing] .pp-sel-tag { font-family: 'Geist', sans-serif; font-size: 12px; color: rgba(255,255,255,0.4); transition: color 0.2s ease; }
  [data-landing] .pp-sel.is-active { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.22); }
  [data-landing] .pp-sel.is-active .pp-sel-name { color: #fff; }
  [data-landing] .pp-sel.is-active .pp-sel-tag { color: rgba(255,255,255,0.55); }
  [data-landing] .pp-soon { display: inline-block; margin-left: 8px; vertical-align: 1px; font-family: 'Geist', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.72); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); padding: 2px 6px; border-radius: 999px; }
  [data-landing] .pp-coming { display: inline-flex; align-items: center; font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #f4e08a; background: rgba(244,224,138,0.12); border: 1px solid rgba(244,224,138,0.32); padding: 8px 14px; border-radius: 999px; }
  [data-landing] .pp-sel-arrow { flex: none; width: 26px; height: 26px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.3); display: inline-flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; }
  [data-landing] .pp-sel.is-active .pp-sel-arrow { opacity: 1; }
  [data-landing] .pp-sel-arrow svg { width: 13px; height: 13px; color: #fff; }
  [data-landing] .pp-proof { margin-top: auto; padding-top: 40px; display: flex; align-items: center; gap: 12px; }
  [data-landing] .pp-proof-ic { flex: none; width: 40px; height: 40px; border-radius: 999px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pp-proof-ic svg { width: 19px; height: 19px; color: #f4e08a; }
  [data-landing] .pp-proof-text b { display: block; font-family: 'Geist', sans-serif; font-size: 13.5px; font-weight: 700; color: #fff; }
  [data-landing] .pp-proof-text i { font-style: normal; font-family: 'Geist', sans-serif; font-size: 12.5px; color: rgba(255,255,255,0.5); }

  [data-landing] .pp-detail { background: linear-gradient(180deg, rgba(18,24,26,0.5) 0%, rgba(14,19,21,0.72) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; padding: 28px 28px 30px; animation: ppFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes ppFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  [data-landing] .pp-detail-head { display: flex; align-items: center; gap: 12px; }
  [data-landing] .pp-detail-ic { flex: none; width: 38px; height: 38px; border-radius: 11px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .pp-detail-ic svg { width: 18px; height: 18px; color: #fff; }
  [data-landing] .pp-detail-name { font-family: 'Albert Sans', sans-serif; font-size: 23px; font-weight: 500; letter-spacing: -0.02em; color: #fff; }
  [data-landing] .pp-detail-price { margin-top: 18px; display: flex; align-items: baseline; gap: 8px; }
  [data-landing] .pp-detail-price b { font-family: 'Albert Sans', sans-serif; font-size: 44px; font-weight: 500; letter-spacing: -0.03em; line-height: 1; color: #fff; }
  [data-landing] .pp-detail-price span { font-family: 'Geist', sans-serif; font-size: 14px; color: rgba(255,255,255,0.5); }
  [data-landing] .pp-detail-desc { margin: 14px 0 0; max-width: 320px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.6); }
  [data-landing] .pp-yellow { appearance: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; margin-top: 20px; height: 42px; padding: 0 6px 0 18px; border-radius: 999px; background: #f4e08a; color: #1d1d1d; font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; text-decoration: none; transition: transform 0.2s ease, background 0.2s ease; }
  [data-landing] .pp-yellow:hover { background: #f8e8a3; transform: translateY(-1px); }
  [data-landing] .pp-yellow-arrow { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; background: #1d1d1d; }
  [data-landing] .pp-yellow-arrow svg { width: 14px; height: 14px; color: #f4e08a; }
  [data-landing] .pp-feats { margin: 26px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 13px; }
  [data-landing] .pp-feat { display: flex; align-items: center; gap: 11px; font-family: 'Geist', sans-serif; font-size: 14px; letter-spacing: -0.01em; color: rgba(255,255,255,0.82); }
  [data-landing] .pp-feat svg { flex: none; width: 15px; height: 15px; color: #fff; }

  @media (max-width: 860px) {
    [data-landing] .pp { padding: 36px 22px; border-radius: 26px; }
    [data-landing] .pp-grid { grid-template-columns: 1fr; gap: 30px; }
  }
`;

const PLANS = [
  { name: "Solo", key: "solo" as const, tag: "For individual agents", Icon: User, desc: "Everything one agent needs to find replacement properties for every client.", features: ["Unlimited active listings", "Match scoring for every client", "Precision filters & saved searches", "Direct counterparty messaging"] },
  { name: "Team", key: "team" as const, tag: "For small teams", soon: true, Icon: Users, desc: "Shared inventory and one pipeline for teams running several exchanges at once.", features: ["Everything in Solo", "Shared client pipeline", "Up to 10 agent seats", "Team activity dashboard"] },
  { name: "Brokerage", key: "brokerage" as const, tag: "For brokerages", soon: true, Icon: Building2, desc: "Brokerage-wide access with the controls and support a larger shop needs.", features: ["Everything in Team", "Unlimited agent seats", "Brokerage-wide inventory", "Priority support"] },
];

type WaitlistPlanKey = "team" | "brokerage";

const WL_STYLE = `
  [data-landing] .wl-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(25,22,18,0.55); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); animation: wlFade 0.2s ease both; }
  @keyframes wlFade { from { opacity: 0; } to { opacity: 1; } }
  [data-landing] .wl-card { position: relative; width: min(440px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; background: #fff; border-radius: 22px; box-shadow: 0 30px 70px rgba(0,0,0,0.32); padding: 34px 32px; animation: wlPop 0.25s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes wlPop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
  [data-landing] .wl-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 999px; border: none; background: #f2efe9; color: #6b655c; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s ease; }
  [data-landing] .wl-close:hover { background: #e8e4dc; }
  [data-landing] .wl-close svg { width: 16px; height: 16px; }
  [data-landing] .wl-title { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: 24px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.15; color: #171717; max-width: 320px; }
  [data-landing] .wl-sub { margin: 8px 0 0; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.5; color: rgba(86,82,75,0.82); }
  [data-landing] .wl-form { margin-top: 22px; display: flex; flex-direction: column; gap: 14px; }
  [data-landing] .wl-field { display: flex; flex-direction: column; gap: 6px; }
  [data-landing] .wl-field > span { font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: #2c2a26; }
  [data-landing] .wl-field > span i { font-style: normal; font-weight: 400; color: rgba(86,82,75,0.5); }
  [data-landing] .wl-field input { font-family: 'Geist', sans-serif; font-size: 14px; color: #1d1d1d; background: #f7f5f0; border: 1px solid rgba(0,0,0,0.08); border-radius: 11px; padding: 11px 13px; outline: none; transition: border-color 0.2s ease, background 0.2s ease; }
  [data-landing] .wl-field input::placeholder { color: rgba(86,82,75,0.42); }
  [data-landing] .wl-field input:focus { border-color: #74cfe6; background: #fff; }
  [data-landing] .wl-err { font-style: normal; font-family: 'Geist', sans-serif; font-size: 12px; color: #c0453a; }
  [data-landing] .wl-submit { margin-top: 6px; width: 100%; appearance: none; border: none; cursor: pointer; height: 46px; border-radius: 999px; background: #1d1d1d; color: #fff; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; transition: background 0.2s ease, transform 0.15s ease; }
  [data-landing] .wl-submit:hover { background: #000; }
  [data-landing] .wl-submit:active { transform: scale(0.99); }
  [data-landing] .wl-done { text-align: center; padding: 8px 0; }
  [data-landing] .wl-done-ic { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 999px; background: #e4f2e9; color: #2f7d52; }
  [data-landing] .wl-done-ic svg { width: 26px; height: 26px; }
  [data-landing] .wl-done h3 { margin: 12px 0 0; font-family: 'Albert Sans', sans-serif; font-size: 22px; font-weight: 500; color: #171717; }
  [data-landing] .wl-done p { margin: 8px 0 20px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.5; color: rgba(86,82,75,0.82); }
`;

function WaitlistModal({ plan, planKey, onClose }: { plan: string; planKey: WaitlistPlanKey; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const errs: { name?: string; email?: string } = {};
    if (!name) errs.name = "Please enter your name.";
    if (!email) errs.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (name.length > 120 || email.length > 255 || phone.length > 40 || company.length > 160) {
      toast({ title: "One of your entries is too long.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const table = planKey === "team" ? "team_waitlist_signups" : "brokerage_waitlist_signups";
    const { error } = await supabase.from(table).insert({
      name,
      email,
      phone: phone || null,
      company: company || null,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't add you to the waitlist.",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    setDone(true);
  };

  return (
    <div className="wl-overlay" onClick={onClose}>
      <div className="wl-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="wl-close" onClick={onClose} aria-label="Close"><X /></button>
        {done ? (
          <div className="wl-done">
            <span className="wl-done-ic"><Check /></span>
            <h3>You're on the list!</h3>
            <p>We'll reach out the moment {plan} is ready for you.</p>
            <button type="button" className="wl-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h3 className="wl-title">Join the {plan} waitlist</h3>
            <p className="wl-sub">Be first to know when {plan} launches — we'll only reach out about your spot.</p>
            <form className="wl-form" onSubmit={submit} noValidate>
              <label className="wl-field">
                <span>Name</span>
                <input type="text" value={form.name} onChange={set("name")} placeholder="Your name" />
                {errors.name ? <em className="wl-err">{errors.name}</em> : null}
              </label>
              <label className="wl-field">
                <span>Email</span>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
                {errors.email ? <em className="wl-err">{errors.email}</em> : null}
              </label>
              <label className="wl-field">
                <span>Phone</span>
                <input type="tel" value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" />
              </label>
              <label className="wl-field">
                <span>Company <i>(optional)</i></span>
                <input type="text" value={form.company} onChange={set("company")} placeholder="Your brokerage" />
              </label>
              <button type="submit" className="wl-submit" disabled={submitting}>
                {submitting ? "Joining…" : "Join the waitlist"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function PricingSection() {
  const [plan, setPlan] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const p = PLANS[plan];
  const Icon = p.Icon;
  return (
    <section id="pricing" className="px-3 py-4 sm:py-6">
      <div className="pp" data-reveal>
        <div className="pp-grid">
          <div className="pp-left">
            <h2>Free for every agent</h2>
            <div className="pp-selectors">
              {PLANS.map((pl, i) => (
                <button key={pl.name} type="button" className={`pp-sel${plan === i ? " is-active" : ""}`} onClick={() => setPlan(i)} aria-pressed={plan === i}>
                  <span className="pp-sel-text">
                    <span className="pp-sel-name">{pl.name}{pl.soon ? <span className="pp-soon">Coming soon</span> : null}</span>
                    <span className="pp-sel-tag">{pl.tag}</span>
                  </span>
                  <span className="pp-sel-arrow"><ArrowRight /></span>
                </button>
              ))}
            </div>
            <div className="pp-proof">
              <span className="pp-proof-ic"><ShieldCheck /></span>
              <div className="pp-proof-text">
                <b>Free during early access</b>
                <i>No credit card required.</i>
              </div>
            </div>
          </div>
          <div className="pp-detail" key={p.name}>
            <div className="pp-detail-head">
              <span className="pp-detail-ic"><Icon /></span>
              <span className="pp-detail-name">{p.name}</span>
            </div>
            {p.soon ? (
              <>
                <div className="pp-detail-price"><span className="pp-coming">Coming soon</span></div>
                <p className="pp-detail-desc">{p.desc} Join the waitlist to be first in line when it launches.</p>
                <button type="button" className="pp-yellow" onClick={() => setWaitlistOpen(true)}>Join the waitlist <span className="pp-yellow-arrow"><ArrowRight /></span></button>
              </>
            ) : (
              <>
                <div className="pp-detail-price"><b>Free</b><span>/ early access</span></div>
                <p className="pp-detail-desc">{p.desc}</p>
                <Link to={ROUTES.signup} className="pp-yellow">Get started free <span className="pp-yellow-arrow"><ArrowRight /></span></Link>
              </>
            )}
            <ul className="pp-feats">
              {p.features.map((f) => (
                <li key={f} className="pp-feat"><Check />{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {waitlistOpen && (p.key === "team" || p.key === "brokerage") ? <WaitlistModal plan={p.name} planKey={p.key} onClose={() => setWaitlistOpen(false)} /> : null}
    </section>
  );
}

/* ───────── ROE calculator — lead magnet (between pricing and FAQ) ───────── */

const ROE_STYLE = `
  [data-landing] .roe { width: min(1040px, 100%); margin: 0 auto; }
  [data-landing] .roe-grid { display: grid; grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr); gap: 56px; align-items: center; }
  [data-landing] .roe-left { max-width: 440px; }
  [data-landing] .roe-eyebrow { display: inline-block; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #8a6d12; background: #fef7af; padding: 7px 13px; border-radius: 999px; line-height: 1; }
  [data-landing] .roe-left h2 { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px, 3.6vw, 44px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #171717; }
  [data-landing] .roe-sub { margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; letter-spacing: -0.02em; color: rgba(86,82,75,0.86); }
  [data-landing] .roe-cta { margin-top: 26px; }
  [data-landing] .roe-plus { display: flex; justify-content: space-between; width: 248px; margin: 34px 0; color: rgba(40,36,30,0.2); }
  [data-landing] .roe-plus svg { width: 13px; height: 13px; }
  [data-landing] .roe-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
  [data-landing] .roe-step { display: flex; align-items: center; gap: 14px; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 450; letter-spacing: -0.01em; color: #2c2a26; }
  [data-landing] .roe-step-num { flex: none; width: 26px; height: 26px; border-radius: 999px; background: #1d1d1d; color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }

  [data-landing] .roe-card { border-radius: 24px; overflow: hidden; background: #fff; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 16px 40px rgba(104,99,80,0.1); }
  [data-landing] .roe-inputs { padding: 30px 30px; display: flex; flex-direction: column; gap: 24px; }
  [data-landing] .roe-field-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  [data-landing] .roe-field-label { font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: -0.01em; color: #2c2a26; }
  [data-landing] .roe-field-val { flex: none; font-family: 'Albert Sans', sans-serif; font-size: 17px; font-weight: 600; letter-spacing: -0.02em; color: #1d1d1d; }
  [data-landing] .roe-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; outline: none; cursor: pointer; }
  [data-landing] .roe-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #1d1d1d; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.22); cursor: pointer; }
  [data-landing] .roe-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 999px; background: #1d1d1d; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.22); cursor: pointer; }
  [data-landing] .roe-result { padding: 26px 30px 28px; background: #f6f3ee; border-top: 1px solid rgba(0,0,0,0.06); }
  [data-landing] .roe-result-top { display: flex; align-items: center; gap: 16px; }
  [data-landing] .roe-big { font-family: 'Albert Sans', sans-serif; font-size: 48px; font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
  [data-landing] .roe-result-meta { display: flex; flex-direction: column; gap: 6px; }
  [data-landing] .roe-result-label { font-family: 'Geist', sans-serif; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(86,82,75,0.65); }
  [data-landing] .roe-verdict { align-self: flex-start; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: -0.01em; padding: 5px 11px; border-radius: 999px; }
  [data-landing] .roe-compare { margin-top: 18px; padding: 14px 15px; border-radius: 13px; background: rgba(254,247,175,0.5); border: 1px solid rgba(201,176,74,0.28); }
  [data-landing] .roe-compare p { margin: 0; font-family: 'Geist', sans-serif; font-size: 12.5px; line-height: 1.55; letter-spacing: -0.01em; color: #4a4320; }
  [data-landing] .roe-compare b { font-weight: 700; color: #1d1d1d; }
  [data-landing] .roe-fine { margin: 12px 0 0; font-family: 'Geist', sans-serif; font-size: 11px; line-height: 1.4; color: rgba(86,82,75,0.55); }

  @keyframes roeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  [data-landing] .roe-left[data-reveal].is-visible > * { animation: roeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  [data-landing] .roe-left[data-reveal].is-visible > *:nth-child(2) { animation-delay: 0.06s; }
  [data-landing] .roe-left[data-reveal].is-visible > *:nth-child(3) { animation-delay: 0.12s; }
  [data-landing] .roe-left[data-reveal].is-visible > *:nth-child(4) { animation-delay: 0.16s; }
  [data-landing] .roe-left[data-reveal].is-visible > *:nth-child(5) { animation-delay: 0.2s; }
  [data-landing] .roe-right[data-reveal].is-visible { animation: roeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.12s; }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .roe-left[data-reveal].is-visible > *, [data-landing] .roe-right[data-reveal].is-visible { animation: none; }
  }

  @media (max-width: 880px) {
    [data-landing] .roe-grid { grid-template-columns: 1fr; gap: 36px; }
    [data-landing] .roe-left { max-width: none; }
  }
`;

const ROE_STEPS = [
  "See your property's real return on equity",
  "Compare it to a healthy ~8% target",
  "Reinvest tax-deferred into a stronger property",
];

function RoeCalculator() {
  const [value, setValue] = useState(2000000);
  const [loan, setLoan] = useState(750000);
  const [cashflow, setCashflow] = useState(82000);

  const PLATFORM = 8; // illustrative return-on-equity benchmark (%)
  const equity = Math.max(0, value - loan);
  const roe = equity > 0 ? (cashflow / equity) * 100 : 0;
  const potential = equity * (PLATFORM / 100);
  const uplift = potential - cashflow;

  const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const tone = roe < 5 ? "low" : roe < 8 ? "mid" : "high";
  const verdictText = roe < 5 ? "Equity underperforming" : roe < 8 ? "Below the ~8% target" : "Beating the target";
  const numColor = tone === "low" ? "#b8543a" : tone === "mid" ? "#9a7b22" : "#4e8466";
  const verdictStyle =
    tone === "low" ? { background: "rgba(184,84,58,0.12)", color: "#a8482f" }
    : tone === "mid" ? { background: "rgba(154,123,34,0.14)", color: "#7e6418" }
    : { background: "rgba(78,132,102,0.14)", color: "#3f7257" };

  const fields = [
    { label: "Current market value", val: value, set: setValue, min: 250000, max: 10000000, step: 50000 },
    { label: "Loan balance", val: loan, set: setLoan, min: 0, max: 9000000, step: 50000 },
    { label: "Annual cash flow", val: cashflow, set: setCashflow, min: 0, max: 500000, step: 5000 },
  ];

  return (
    <section id="roe-calculator" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="roe">
        <div className="roe-grid">
          <div className="roe-left" data-reveal>
            <h2>Is your client's equity working hard enough?</h2>
            <p className="roe-sub">Check a property's return on equity in seconds — and see how it measures up against a healthy ~8% target.</p>
            <div className="roe-cta"><PillLink to={ROUTES.signup} primary>Browse replacement properties</PillLink></div>
            <div className="roe-plus" aria-hidden="true"><Plus /><Plus /><Plus /><Plus /></div>
            <ul className="roe-steps">
              {ROE_STEPS.map((s, i) => (
                <li key={s} className="roe-step"><span className="roe-step-num">0{i + 1}</span>{s}</li>
              ))}
            </ul>
          </div>
          <div className="roe-right" data-reveal>
            <div className="roe-card">
              <div className="roe-inputs">
                {fields.map((f) => {
                  const pct = ((f.val - f.min) / (f.max - f.min)) * 100;
                  return (
                    <div key={f.label}>
                      <div className="roe-field-top">
                        <span className="roe-field-label">{f.label}</span>
                        <span className="roe-field-val">{usd(f.val)}</span>
                      </div>
                      <input
                        type="range"
                        className="roe-range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={f.val}
                        onChange={(e) => f.set(Number(e.target.value))}
                        style={{ background: `linear-gradient(90deg, #1d1d1d ${pct}%, #e6e2da ${pct}%)` }}
                        aria-label={f.label}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="roe-result">
                <div className="roe-result-top">
                  <span className="roe-big" style={{ color: numColor }}>{roe.toFixed(1)}%</span>
                  <div className="roe-result-meta">
                    <span className="roe-result-label">Return on equity</span>
                    <span className="roe-verdict" style={verdictStyle}>{verdictText}</span>
                  </div>
                </div>
                <div className="roe-compare">
                  {uplift > 0 ? (
                    <p>At an <b>~8% return on equity</b>, your {usd(equity)} of equity would earn about <b>{usd(potential)}/yr</b> — roughly <b>{usd(uplift)} more</b> than today.</p>
                  ) : (
                    <p>You're already at or above an <b>~8%</b> return on equity — nicely done. Browse replacement properties to keep that equity working.</p>
                  )}
                </div>
                <p className="roe-fine">Estimate only — not tax or investment advice.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */

const FAQ_STYLE = `
  [data-landing] .fq { width: min(1080px, 100%); margin: 0 auto; display: grid; grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.05fr); gap: 56px; align-items: start; }
  [data-landing] .fq-left h2 { margin: 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(30px, 3.6vw, 46px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #171717; }
  [data-landing] .fq-left p { margin: 18px 0 0; max-width: 320px; font-family: 'Geist', sans-serif; font-size: 16px; line-height: 1.55; letter-spacing: -0.02em; color: rgba(86,82,75,0.86); }
  [data-landing] .fq-contact { margin-top: 26px; }
  [data-landing] .fq-list { background: #ece9e2; border-radius: 26px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  [data-landing] .fq-item { background: #faf8f4; border: 1px solid rgba(0,0,0,0.035); border-radius: 16px; box-shadow: 0 1px 2px rgba(80,71,58,0.05); }
  [data-landing] .fq-q { width: 100%; appearance: none; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 18px; text-align: left; padding: 21px 22px; font-family: 'Albert Sans', sans-serif; font-size: 17.5px; font-weight: 500; letter-spacing: -0.02em; color: #1d1d1d; }
  [data-landing] .fq-ic { flex: none; width: 18px; height: 18px; color: #9a948b; }
  [data-landing] .fq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.34s cubic-bezier(0.4, 0, 0.2, 1); }
  [data-landing] .fq-item.is-open .fq-a { grid-template-rows: 1fr; }
  [data-landing] .fq-a > div { overflow: hidden; min-height: 0; }
  [data-landing] .fq-a p { margin: 0; padding: 0 22px 22px; font-family: 'Geist', sans-serif; font-size: 15px; line-height: 1.6; letter-spacing: -0.01em; color: rgba(86,82,75,0.9); }
  @media (max-width: 820px) {
    [data-landing] .fq { grid-template-columns: 1fr; gap: 30px; }
  }
`;

const FAQS = [
  { q: "Do I use this for buyers, for my listings, or both?", a: "Both. Bring a client doing a 1031 exchange and find them a replacement, or post a property to reach agents whose clients are exchanging into something like it. Most agents do both." },
  { q: "Is this a way to keep a property off the MLS?", a: "No — it's the opposite of a loophole. It's an agent-to-agent network for finding 1031 replacement properties and connecting with the agents who represent them. It doesn't replace the MLS, and every agent stays responsible for their own marketing and Clear Cooperation obligations." },
  { q: "How does the match scoring work?", a: "Each property is scored against your client's specific exchange across eight factors — holding strategy, boot, debt, timing, price, geography, asset type, and scale — and you can see the full breakdown behind every score." },
  { q: "Are the agents and properties verified?", a: "Yes. Every agent and broker is verified before they can post inventory or connect, so you're always dealing with real, represented properties." },
  { q: "Is it really free?", a: "Completely free during early access — no card, no commitment. We'll give you clear notice well before we ever introduce a paid plan." },
  { q: "Can I manage more than one client at a time?", a: "That's exactly what it's built for. You keep each client's exchange criteria separate and apply them to every new property that joins the network." },
];

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="fq">
        <div className="fq-left" data-reveal>
          <h2>Your questions, answered</h2>
          <p>Quick answers about how the network works. Still curious? Reach out any time.</p>
          <div className="fq-contact"><PillLink to={ROUTES.bookDemo}>Contact us</PillLink></div>
        </div>
        <div className="fq-list" data-reveal>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`fq-item${isOpen ? " is-open" : ""}`}>
                <button type="button" className="fq-q" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
                  <span>{item.q}</span>
                  {isOpen ? <X className="fq-ic" /> : <Plus className="fq-ic" />}
                </button>
                <div className="fq-a"><div><p>{item.a}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── Final CTA ───────── */

const CTA_STYLE = `
  [data-landing] .cta { position: relative; overflow: hidden; width: min(1000px, 100%); margin: 0 auto; border-radius: 28px; padding: 72px 32px; text-align: center; background: radial-gradient(ellipse 52% 62% at 72% 50%, rgba(178,74,40,0.42) 0%, rgba(178,74,40,0) 62%), radial-gradient(ellipse 48% 58% at 50% 88%, rgba(74,128,86,0.4) 0%, rgba(74,128,86,0) 60%), radial-gradient(ellipse 42% 52% at 88% 80%, rgba(128,60,120,0.4) 0%, rgba(128,60,120,0) 60%), radial-gradient(ellipse 42% 48% at 14% 90%, rgba(150,36,12,0.5) 0%, rgba(150,36,12,0) 58%), linear-gradient(180deg, #3a4a50 0%, #313f44 55%, #27343a 100%); border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 20px 50px rgba(20,28,32,0.18); }
  [data-landing] .cta-inner { position: relative; }
  [data-landing] .cta h2 { margin: 0 auto; max-width: 580px; font-family: 'Albert Sans', sans-serif; font-size: clamp(30px, 4vw, 50px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.05; color: #fff; }
  [data-landing] .cta p { margin: 16px auto 0; max-width: 440px; font-family: 'Geist', sans-serif; font-size: 16px; line-height: 1.5; letter-spacing: -0.02em; color: rgba(255,255,255,0.66); }
  [data-landing] .cta-actions { margin-top: 30px; display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  [data-landing] .cta .lp-pill:not([data-primary="true"]) { color: #fff; border-color: rgba(255,255,255,0.3); }
  [data-landing] .cta .lp-pill:not([data-primary="true"]):hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.45); }
`;

function FinalCta() {
  return (
    <section id="get-started" className="px-5 py-12 sm:px-8 sm:py-20">
      <div className="cta" data-reveal>
        <div className="cta-inner">
          <h2>Find your client's next replacement property</h2>
          <p>Join the network built for agents who work with 1031 investors — free while we're in early access.</p>
          <div className="cta-actions">
            <PillLink to={ROUTES.signup} primary>Get started free</PillLink>
            <PillLink to={ROUTES.bookDemo}>Book a demo</PillLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    document.title = "1031 Exchange Up — Find 1031 replacement properties for your clients";
  }, []);

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

  // Scroll to a section when the URL carries a hash (nav / footer anchor links).
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    const t = window.setTimeout(() => {
      if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -88 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [hash]);

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
      <style>{FEATURES_STYLE}</style>
      <style>{INTEG_STYLE}</style>
      <style>{PRICE_STYLE}</style>
      <style>{WL_STYLE}</style>
      <style>{ROE_STYLE}</style>
      <style>{FAQ_STYLE}</style>
      <style>{CTA_STYLE}</style>
      <div className="lp-bg" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-content">
        <Hero />
        <LogoMarquee />
        <HowItWorks />
        <FeaturesSection />
        <IntegrationsSection />
        <PricingSection />
        <RoeCalculator />
        <FaqSection />
        <FinalCta />
      </div>
    </div>
  );
}

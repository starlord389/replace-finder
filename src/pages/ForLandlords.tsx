import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, BadgeCheck, CheckCircle2, ChevronDown, EyeOff, Loader2, Lock, Plus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  LANDING_BASE_CSS, LandingBackdrop, Pill, inDelay, scrollToId, useLandingMotion,
} from "@/components/landing/landingKit";

/* ───────────────────────────── Content ───────────────────────────── */

const HERO = {
  eyebrow: "For commercial property owners",
  headline: "Your building, shown quietly to buyers who must close in 180 days.",
  subheadline:
    "Every buyer in our network already sold a property, already holds the cash in escrow, and is racing an IRS clock to reinvest it — or get taxed. They don't browse. They buy. Tell us about your property and we'll connect you, privately and free, with a licensed agent who can put it in front of them.",
};

/* Hero detail-card buyers — each carries a live countdown ring (daysLeft / 180). */
const HERO_BUYERS = [
  { name: "Cash buyer · office → retail", daysLeft: 42, hot: true, color: "#cf877b" },
  { name: "1031 buyer · multifamily", daysLeft: 68, hot: false, color: "#7ea7bd" },
] as const;

const PROBLEM_CHIPS = [
  { title: "Equity grows", body: "Appreciation and loan paydown leave far more value locked in the building than the day you bought it." },
  { title: "Income lags", body: "Rents rarely keep pace with that growing equity, so the real percentage return on what you own keeps slipping." },
  { title: "Tax keeps you stuck", body: "Selling outright can mean a capital-gains hit big enough that doing nothing feels safer. A 1031 exchange is the way around it." },
] as const;

const BUYER_POINTS = [
  {
    badge: "45 / 180",
    title: "A deadline, not a whim",
    body: "45 days to identify, 180 to close. Miss it and the tax bill lands. That deadline is the IRS's, not yours — it just happens to work in your favor.",
  },
  {
    badge: "Cash in escrow",
    title: "The money is already real",
    body: "Equity sitting in escrow from a sale that already closed — not a pre-approval, not a financing contingency that can evaporate. When a 1031 buyer offers, the cash is ready to deploy.",
  },
  {
    badge: "Off-market",
    title: "Nobody has to know it's for sale",
    body: "It starts off-market. No sign, no public listing, no parade of tire-kickers. Your agent shows it only to the buyers it fits — and tells you exactly when widening the net is worth it.",
  },
] as const;

const TRUST_POINTS = [
  {
    title: "Agents-only, by law — not by gimmick",
    body: "Real estate law reserves marketing, transacting, and referral fees for licensed agents. The limitation is the whole design, not a catch buried in the terms — so we connect you to one rather than working around it.",
  },
  {
    title: "Hand-matched, never auctioned",
    body: "Every agent is licensed and verified. You get the one who works your market and your asset type — not whoever bid highest for the lead. Your details are never resold.",
  },
  {
    title: "Free, private, no obligation",
    body: "There's no fee to an owner, ever — agents pay to be in the network, not you. The conversation is free and commits you to nothing. You decide every next step.",
  },
] as const;

const HOW_STEPS = [
  {
    step: "01",
    title: "Tell us about your property",
    body: "Six fields, about two minutes: where it is, what type, and a ballpark value. No documents, no obligation, no account. Just enough to route you to the right person.",
  },
  {
    step: "02",
    title: "We hand-match your agent",
    body: "Not a lead auction. We pair you with one vetted, licensed agent who works your market and your asset class and closes 1031 buyers for a living. They reach out to understand your goals — usually within one business day.",
  },
  {
    step: "03",
    title: "Your property meets the buyers",
    body: "Your agent quietly represents it to matched 1031 buyers in the network, where it's auto-scored against every active buyer's exact criteria. You decide if, when, and how it ever goes wider.",
  },
] as const;

const ROE_STEPS = [
  { n: "01", title: "See your real return on equity", body: "Not cap rate, not cash-on-cash — what your actual trapped equity earns per year, as a percentage, at today's value." },
  { n: "02", title: "Measure it against ~8%", body: "A simple, honest benchmark for whether your equity is pulling its weight or coasting in appreciated walls." },
  { n: "03", title: "See the tax-deferred upside", body: "An estimate of the additional annual income the same equity could produce in a stronger replacement — with the full gain still working, untaxed." },
] as const;

const FAQS = [
  {
    q: "What's the catch — why is this free for me?",
    a: "Agents pay to be in the network; owners never do. We're paid by the professional side, so the introduction costs you nothing and carries no obligation. If your property isn't a fit, the honest outcome is simply that we tell you.",
  },
  {
    q: "Will my building be listed publicly?",
    a: "Not unless you choose to. It can start entirely off-market, shown only to matched buyers. Your agent advises if and when going wider makes sense — it's always your decision. Tenants, competitors, and lenders learn nothing until you say so.",
  },
  {
    q: "What happens to my information?",
    a: "It goes only to the one vetted agent we match you with, so they can reach out. We don't sell your details, post them publicly, or blast them to a buyer pool.",
  },
  {
    q: "Am I committing to sell?",
    a: "Not at all. There's no listing agreement and no commitment. Many owners start just curious what their building could fetch or whether their equity is working. You can take the conversation as far — or as little — as you like, and stop at any point.",
  },
  {
    q: "Why can't I just join the network myself?",
    a: "Because real estate law reserves marketing, transacting, and referral fees for licensed agents. The network is agents-only by design. Rather than work around that, we connect you to someone who can act on it properly — which is also why our advice has no angle on you.",
  },
] as const;

const FORM_BENEFITS = [
  "Free for owners — no fees, ever",
  "No listing agreement, no obligation to sell",
  "Hand-matched to one vetted agent, not a buyer pool",
  "Off-market by default — your details stay private",
] as const;

const PROPERTY_TYPES = [
  "Multifamily", "Retail", "Office", "Industrial", "Mixed-use", "Land", "Other",
] as const;

/* ───────────────────────────── Styles ───────────────────────────── */

const FL_STYLE = `
  [data-landing] .fl-eyebrow {
    display: inline-flex; align-items: center; gap: 7px; font-family: 'Geist', sans-serif;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    color: #8a6d12; background: #fef7af; padding: 7px 13px 7px 11px; border-radius: 999px; line-height: 1;
  }
  [data-landing] .fl-eyebrow::before {
    content: ''; width: 6px; height: 6px; border-radius: 999px; background: #d9a72a; flex: none;
    box-shadow: 0 0 0 0 rgba(217,167,42,0.55); animation: flDot 2.1s ease-out infinite;
  }
  @keyframes flDot { 0% { box-shadow: 0 0 0 0 rgba(217,167,42,0.5); } 70%, 100% { box-shadow: 0 0 0 6px rgba(217,167,42,0); } }
  [data-landing] .fl-sub {
    margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400;
    line-height: 1.55; letter-spacing: -0.02em; color: rgba(86,82,75,0.86);
  }

  /* ── Countdown rings (shared) ── */
  [data-landing] .fl-ring { display: block; transform: rotate(-90deg); }
  [data-landing] .fl-ring .arc { stroke-dashoffset: var(--ring-c); }
  [data-landing] .fl-hero-visual .fl-ring .arc { animation: flRing 1.2s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
  [data-landing] [data-reveal] .fl-ring .arc { transition: stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1); }
  [data-landing] [data-reveal].is-visible .fl-ring .arc { stroke-dashoffset: var(--ring-off); }
  @keyframes flRing { from { stroke-dashoffset: var(--ring-c); } to { stroke-dashoffset: var(--ring-off); } }

  /* ── Hero visual ── */
  [data-landing] .fl-hero-visual { position: relative; width: 100%; max-width: 440px; margin: 0 auto; padding-bottom: 54px; }
  [data-landing] .fl-pcard {
    background: rgba(255,255,255,0.9);
    -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3);
    border: 2px solid rgba(255,255,255,0.97);
    box-shadow: 0 32px 64px rgba(38,34,28,0.15), 0 4px 14px rgba(38,34,28,0.05);
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1d1d1d;
  }
  [data-landing] .fl-pcard-main { position: relative; border-radius: 24px; padding: 16px 16px 18px; transform: rotate(-2.5deg); }
  [data-landing] .fl-pcard-photo { position: relative; height: 156px; border-radius: 16px; background-size: cover; background-position: center; }
  [data-landing] .fl-private { position: absolute; top: 10px; left: 10px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(29,29,29,0.6); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 999px; }
  [data-landing] .fl-pcard-name { margin-top: 14px; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
  [data-landing] .fl-pcard-loc { margin-top: 3px; font-size: 12.5px; color: #8a847b; }
  [data-landing] .fl-pcard-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 13px; border-top: 1px solid rgba(0,0,0,0.07); font-size: 12px; font-weight: 600; color: #4a453d; }
  [data-landing] .fl-live { position: relative; width: 8px; height: 8px; border-radius: 999px; background: #4fae6e; flex: none; }
  [data-landing] .fl-live::after { content: ''; position: absolute; inset: 0; border-radius: 999px; background: #4fae6e; animation: flLive 1.9s ease-out infinite; }
  @keyframes flLive { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.7); opacity: 0; } }

  [data-landing] .fl-pcard-detail { position: absolute; right: -3%; bottom: 0; width: 64%; border-radius: 18px; padding: 14px; transform: rotate(5deg); background: rgba(255,255,255,0.94); }
  [data-landing] .fl-detail-head { display: flex; align-items: center; gap: 10px; }
  [data-landing] .fl-detail-big { font-family: 'Albert Sans', sans-serif; font-size: 30px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; color: #1d1d1d; }
  [data-landing] .fl-detail-head b { display: block; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .fl-detail-head span { display: block; font-size: 10px; color: #8a847b; margin-top: 1px; }
  [data-landing] .fl-buyers { margin-top: 12px; display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fl-buyer { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 11px; background: #f6f3ed; }
  [data-landing] .fl-buyer.is-hot { background: #fbeaa0; }
  [data-landing] .fl-buyer-ring { position: relative; width: 30px; height: 30px; flex: none; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-buyer-ring span { position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: #8a6d12; }
  [data-landing] .fl-buyer-main { flex: 1; min-width: 0; }
  [data-landing] .fl-buyer-name { font-size: 9.5px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .fl-buyer-clock { font-size: 8.5px; font-weight: 600; color: #8a6d12; margin-top: 1px; }

  /* ── Problem: equity-drift chart ── */
  [data-landing] .fl-drift {
    position: relative; border-radius: 24px; background: #faf8f4; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 12px 30px rgba(104,99,80,0.13); padding: 26px 26px 22px; overflow: hidden;
  }
  [data-landing] .fl-drift-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
  [data-landing] .fl-drift-legend { display: flex; gap: 16px; }
  [data-landing] .fl-drift-leg { display: inline-flex; align-items: center; gap: 6px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: #6b665e; }
  [data-landing] .fl-drift-leg i { width: 14px; height: 3px; border-radius: 999px; display: inline-block; }
  [data-landing] .fl-drift-svg { width: 100%; height: auto; display: block; }
  [data-landing] .fl-drift-line { fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: var(--len); stroke-dashoffset: var(--len); }
  [data-landing] [data-reveal].is-visible .fl-drift-line { transition: stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1); stroke-dashoffset: 0; }
  [data-landing] .fl-drift-gap { opacity: 0; transition: opacity 0.6s ease 0.8s; }
  [data-landing] [data-reveal].is-visible .fl-drift-gap { opacity: 1; }
  [data-landing] .fl-drift-callout {
    position: absolute; right: 22px; top: 58px; max-width: 168px; font-family: 'Geist', sans-serif;
    font-size: 11.5px; line-height: 1.4; font-weight: 600; color: #7a5f12;
    background: rgba(255,255,255,0.82); border: 1px solid rgba(201,176,74,0.35);
    border-radius: 12px; padding: 9px 11px; box-shadow: 0 8px 20px rgba(104,99,80,0.12);
    opacity: 0; transform: translateY(6px); transition: opacity 0.5s ease 1s, transform 0.5s ease 1s;
  }
  [data-landing] [data-reveal].is-visible .fl-drift-callout { opacity: 1; transform: none; }
  [data-landing] .fl-chips { margin-top: 28px; display: grid; gap: 16px; }
  [data-landing] .fl-chip-t { font-family: 'Albert Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.02em; color: #1a1a1a; }
  [data-landing] .fl-chip-b { margin-top: 5px; font-family: 'Geist', sans-serif; font-size: 13.5px; line-height: 1.5; color: rgba(86,82,75,0.84); }
  [data-landing] .fl-chip-n { font-family: 'Albert Sans', sans-serif; font-size: 13px; font-weight: 700; color: #c2a23e; }

  /* ── Buyer / "why" cards ── */
  [data-landing] .fl-card {
    display: flex; flex-direction: column; height: 100%; border-radius: 24px;
    background: #faf8f4; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 8px 20px rgba(104,99,80,0.15); padding: 26px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  [data-landing] .fl-card:hover { transform: translateY(-3px); box-shadow: 0 18px 38px rgba(104,99,80,0.18); }
  [data-landing] .fl-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  [data-landing] .fl-stat { font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; color: #8a6d12; background: #fef7af; padding: 6px 12px; border-radius: 999px; }
  [data-landing] .fl-card-title { margin-top: 4px; font-family: 'Albert Sans', sans-serif; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #1a1a1a; }
  [data-landing] .fl-card-body { margin-top: 12px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.55; letter-spacing: -0.01em; color: rgba(86,82,75,0.86); }

  /* micro-visual: twin rings */
  [data-landing] .fl-mv { height: 64px; display: flex; align-items: center; }
  [data-landing] .fl-twin { position: relative; width: 64px; height: 64px; flex: none; }
  [data-landing] .fl-twin span { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; }
  [data-landing] .fl-twin span b { font-size: 14px; font-weight: 700; letter-spacing: -0.03em; color: #1a1a1a; line-height: 1; }
  [data-landing] .fl-twin span i { font-size: 7px; font-style: normal; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #8a847b; margin-top: 2px; }
  [data-landing] .fl-mv-cap { margin-left: 14px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: #8a6d12; }
  /* micro-visual: escrow chip */
  [data-landing] .fl-escrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: #eef7f0; border: 1px solid rgba(79,174,110,0.3); }
  [data-landing] .fl-escrow svg { width: 16px; height: 16px; color: #3a8f57; }
  [data-landing] .fl-escrow b { font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 700; color: #2f7048; }
  [data-landing] .fl-escrow s { font-family: 'Geist', sans-serif; font-size: 11px; color: #b3ada4; margin-left: 4px; }
  /* micro-visual: off-market */
  [data-landing] .fl-redact { position: relative; width: 100%; }
  [data-landing] .fl-redact-line { height: 7px; border-radius: 999px; background: #ece7dd; margin-bottom: 6px; }
  [data-landing] .fl-redact-eye { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 999px; background: #1d1d1d; color: #fadc6a; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-redact-eye svg { width: 17px; height: 17px; }
  [data-landing] .fl-redact-cap { margin-top: 12px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: #8a847b; }

  /* ── How: flow board ── */
  [data-landing] .fl-flow { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  [data-landing] .fl-flow::before {
    content: ''; position: absolute; left: 16%; right: 16%; top: 92px; height: 2px;
    background: repeating-linear-gradient(90deg, rgba(201,176,74,0.5) 0 7px, transparent 7px 13px); z-index: 0;
  }
  [data-landing] .fl-flow-dot {
    position: absolute; top: 88px; left: 16%; width: 9px; height: 9px; border-radius: 999px; z-index: 1;
    background: #d9a72a; box-shadow: 0 0 0 4px rgba(217,167,42,0.18);
  }
  [data-landing] [data-reveal].is-visible .fl-flow-dot { animation: flTravel 2.6s cubic-bezier(0.5,0,0.5,1) 0.4s infinite; }
  @keyframes flTravel { 0% { left: 16%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { left: calc(84% - 9px); opacity: 0; } }
  [data-landing] .fl-step {
    position: relative; z-index: 1; height: 100%; border-radius: 22px; background: #faf8f4;
    border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 8px 20px rgba(104,99,80,0.12); padding: 22px;
  }
  [data-landing] .fl-step-mock { height: 116px; border-radius: 14px; background: #fff; border: 1px solid rgba(0,0,0,0.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.7); padding: 12px; overflow: hidden; }
  [data-landing] .fl-mk-label { font-family: 'Geist', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #a39c91; }
  [data-landing] .fl-mk-field { height: 11px; border-radius: 4px; background: #f0ece4; margin-top: 5px; }
  [data-landing] .fl-mk-field.is-fill { background: #fbeaa0; box-shadow: inset 0 0 0 1px rgba(227,168,46,0.4); }
  [data-landing] .fl-mk-agent { display: flex; align-items: center; gap: 8px; }
  [data-landing] .fl-mk-av { width: 30px; height: 30px; border-radius: 999px; background: linear-gradient(135deg, #8a86bf, #6f6ab0); color: #fff; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fl-mk-vbadge { display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 700; color: #1d7a52; background: rgba(127,174,140,0.18); padding: 3px 6px; border-radius: 999px; margin-top: 4px; }
  [data-landing] .fl-mk-vbadge svg { width: 8px; height: 8px; }
  [data-landing] .fl-mk-buyer { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 9px; }
  [data-landing] .fl-mk-score { width: 17px; height: 17px; border-radius: 999px; background: #7fae8c; color: #fff; font-size: 8px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fl-mk-buyer.is-hot .fl-mk-score { background: #e0a84a; }
  [data-landing] .fl-mk-bar { flex: 1; height: 6px; border-radius: 999px; background: #efe9df; }
  [data-landing] .fl-step-num { display: inline-block; margin-top: 16px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: #c2a23e; }
  [data-landing] .fl-step-title { margin-top: 6px; font-family: 'Albert Sans', sans-serif; font-size: 18px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #1a1a1a; }
  [data-landing] .fl-step-body { margin-top: 9px; font-family: 'Geist', sans-serif; font-size: 13.5px; line-height: 1.5; color: rgba(86,82,75,0.84); }

  /* ── Dark aurora panel + handoff ── */
  [data-landing] .fl-aurora {
    position: relative; overflow: hidden; border-radius: 32px; padding: 56px 44px;
    background:
      radial-gradient(ellipse 52% 62% at 72% 50%, rgba(178,74,40,0.42) 0%, rgba(178,74,40,0) 62%),
      radial-gradient(ellipse 48% 58% at 50% 88%, rgba(74,128,86,0.4) 0%, rgba(74,128,86,0) 60%),
      radial-gradient(ellipse 42% 52% at 88% 80%, rgba(128,60,120,0.4) 0%, rgba(128,60,120,0) 60%),
      radial-gradient(ellipse 42% 48% at 14% 90%, rgba(150,36,12,0.5) 0%, rgba(150,36,12,0) 58%),
      linear-gradient(180deg, #3a4a50 0%, #313f44 55%, #27343a 100%);
    border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 20px 50px rgba(20,28,32,0.18);
  }
  [data-landing] .fl-aurora-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.82); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); padding: 7px 13px; border-radius: 999px; line-height: 1; }
  [data-landing] .fl-aurora h2 { margin: 18px 0 0; max-width: 640px; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px,3.6vw,42px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #fff; }
  [data-landing] .fl-aurora-sub { margin: 16px 0 0; max-width: 560px; font-family: 'Geist', sans-serif; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7); }

  /* handoff diagram */
  [data-landing] .fl-handoff { position: relative; margin: 34px 0 8px; display: flex; align-items: center; justify-content: space-between; max-width: 620px; }
  [data-landing] .fl-node { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; }
  [data-landing] .fl-node-dot { width: 46px; height: 46px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-node-dot svg { width: 21px; height: 21px; }
  [data-landing] .fl-node.you .fl-node-dot { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #fff; }
  [data-landing] .fl-node.agent .fl-node-dot { background: #fadc6a; color: #1d1d1d; box-shadow: 0 0 0 6px rgba(250,220,106,0.16); }
  [data-landing] .fl-node.buyers { flex-direction: row; }
  [data-landing] .fl-node-av { width: 30px; height: 30px; border-radius: 999px; border: 2px solid rgba(39,52,58,0.9); margin-left: -10px; }
  [data-landing] .fl-node-av:first-child { margin-left: 0; }
  [data-landing] .fl-node-label { font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.85); }
  [data-landing] .fl-node-label i { display: block; font-style: normal; font-size: 9.5px; color: rgba(255,255,255,0.5); margin-top: 1px; }
  [data-landing] .fl-handoff-line { position: absolute; left: 46px; right: 64px; top: 23px; height: 2px; z-index: 1; background: repeating-linear-gradient(90deg, rgba(250,220,106,0.6) 0 6px, transparent 6px 12px); }
  [data-landing] .fl-barrier { position: absolute; left: 38%; top: 4px; bottom: auto; height: 38px; z-index: 2; display: flex; flex-direction: column; align-items: center; }
  [data-landing] .fl-barrier i { width: 2px; height: 34px; background: repeating-linear-gradient(180deg, rgba(255,255,255,0.55) 0 4px, transparent 4px 8px); }
  [data-landing] .fl-barrier b { position: absolute; top: -16px; white-space: nowrap; font-family: 'Geist', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.6); }
  [data-landing] .fl-handoff-tag { margin-top: 6px; font-family: 'Geist', sans-serif; font-size: 11px; color: rgba(255,255,255,0.55); }
  [data-landing] .fl-handoff-tag b { color: #fadc6a; font-weight: 600; }

  [data-landing] .fl-aurora-grid { margin-top: 30px; display: grid; gap: 26px; }
  [data-landing] .fl-aurora-ic { width: 36px; height: 36px; border-radius: 11px; background: #fadc6a; color: #1d1d1d; display: inline-flex; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; font-size: 16px; font-weight: 700; }
  [data-landing] .fl-aurora-title { margin-top: 14px; font-family: 'Albert Sans', sans-serif; font-size: 17px; font-weight: 500; letter-spacing: -0.03em; color: #fff; }
  [data-landing] .fl-aurora-body { margin-top: 9px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.62); }

  /* ── FAQ accordion ── */
  [data-landing] .fl-faq-pill { display: inline-flex; align-items: center; gap: 7px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700; color: #8a6d12; background: #fef7af; padding: 6px 13px; border-radius: 999px; }
  [data-landing] .fl-faq-list { margin-top: 26px; display: flex; flex-direction: column; gap: 10px; }
  [data-landing] .fl-faq-item { border-radius: 16px; background: #faf8f4; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 14px rgba(104,99,80,0.07); overflow: hidden; transition: box-shadow 0.25s ease; }
  [data-landing] .fl-faq-item.is-open { box-shadow: 0 12px 28px rgba(104,99,80,0.12); }
  [data-landing] .fl-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; cursor: pointer; text-align: left; font-family: 'Albert Sans', sans-serif; font-size: 16.5px; font-weight: 500; letter-spacing: -0.02em; color: #1a1a1a; background: none; border: none; }
  [data-landing] .fl-faq-chev { flex: none; width: 19px; height: 19px; color: #8a847b; transition: transform 0.3s ease; }
  [data-landing] .fl-faq-item.is-open .fl-faq-chev { transform: rotate(180deg); }
  [data-landing] .fl-faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1); }
  [data-landing] .fl-faq-item.is-open .fl-faq-a { grid-template-rows: 1fr; }
  [data-landing] .fl-faq-a > div { overflow: hidden; }
  [data-landing] .fl-faq-a p { margin: 0; padding: 0 22px 20px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.6; color: rgba(86,82,75,0.88); }

  /* ── Referral form ── */
  [data-landing] .fl-formcard {
    border-radius: 30px; background: linear-gradient(180deg, #faf8f4 0%, #f7f5f0 100%);
    border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 16px 40px rgba(104,99,80,0.12); padding: 30px;
  }
  [data-landing] .fl-bullet { display: flex; align-items: flex-start; gap: 12px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.5; color: #4d4943; }
  [data-landing] .fl-bullet-ic { margin-top: 1px; flex: none; width: 20px; height: 20px; border-radius: 999px; background: #1d1d1d; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-bullet-ic svg { width: 13px; height: 13px; }
  [data-landing] .fl-field { display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fl-field > label { font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: #2c2a26; }
  [data-landing] .fl-field > label .req { color: rgba(86,82,75,0.5); font-weight: 400; }
  [data-landing] .fl-input, [data-landing] .fl-select {
    width: 100%; font-family: 'Geist', sans-serif; font-size: 14px; color: #1d1d1d;
    background: #fbf9f5; border: 1px solid rgba(0,0,0,0.09); border-radius: 12px; padding: 12px 13px;
    outline: none; transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }
  [data-landing] .fl-input::placeholder { color: rgba(86,82,75,0.42); }
  [data-landing] .fl-input:focus, [data-landing] .fl-select:focus { border-color: #d9a72a; background: #fff; box-shadow: 0 0 0 3px rgba(217,167,42,0.16); }
  [data-landing] .fl-select-wrap { position: relative; }
  [data-landing] .fl-select { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 36px; }
  [data-landing] .fl-select-chev { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #8a847b; pointer-events: none; }
  [data-landing] .fl-form-foot { display: flex; flex-direction: column; gap: 16px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 18px; margin-top: 4px; }
  [data-landing] .fl-fine { max-width: 19rem; font-family: 'Geist', sans-serif; font-size: 12px; line-height: 1.5; color: #7b756e; }
  [data-landing] .fl-submit {
    appearance: none; border: none; cursor: pointer; display: inline-flex; align-items: center;
    justify-content: center; gap: 10px; height: 46px; padding: 0 8px 0 22px; border-radius: 999px;
    background: #1d1d1d; color: #fff; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 600;
    letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  }
  [data-landing] .fl-submit:hover:not(:disabled) { background: #000; box-shadow: 0 5px 15px rgba(0,0,0,0.2), 0 0 0 5px rgba(29,29,29,0.08); }
  [data-landing] .fl-submit:active:not(:disabled) { transform: scale(0.99); }
  [data-landing] .fl-submit:disabled { opacity: 0.72; cursor: default; }
  [data-landing] .fl-submit-arrow { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; background: #fff; }
  [data-landing] .fl-submit-arrow svg { width: 14px; height: 14px; color: #1d1d1d; }
  [data-landing] .fl-submit-spin { width: 18px; height: 18px; animation: flSpin 0.8s linear infinite; }
  @keyframes flSpin { to { transform: rotate(360deg); } }
  [data-landing] .fl-done { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 320px; text-align: center; border-radius: 22px; background: #f3fbf0; border: 1px solid #d9ead4; padding: 40px 28px; }
  [data-landing] .fl-done-ic { width: 52px; height: 52px; border-radius: 999px; background: #3a7340; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-done-ic svg { width: 26px; height: 26px; }
  [data-landing] .fl-done h3 { margin: 16px 0 0; font-family: 'Albert Sans', sans-serif; font-size: 23px; font-weight: 500; letter-spacing: -0.03em; color: #27402b; }
  [data-landing] .fl-done p { margin: 10px 0 0; max-width: 380px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.55; color: #365339; }

  @media (min-width: 768px) {
    [data-landing] .fl-chips { grid-template-columns: repeat(3, 1fr); }
    [data-landing] .fl-aurora-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (min-width: 640px) {
    [data-landing] .fl-formcard { padding: 44px; }
    [data-landing] .fl-form-foot { flex-direction: row; align-items: flex-end; justify-content: space-between; }
  }
  @media (max-width: 860px) {
    [data-landing] .fl-aurora { padding: 40px 26px; border-radius: 26px; }
    [data-landing] .fl-handoff { max-width: 100%; }
  }
  /* Phones: stack the layered hero cards straight so nothing clips */
  @media (max-width: 700px) {
    [data-landing] .fl-flow { grid-template-columns: 1fr; gap: 14px; }
    [data-landing] .fl-flow::before, [data-landing] .fl-flow-dot { display: none; }
  }
  @media (max-width: 600px) {
    [data-landing] .fl-hero-visual { max-width: 360px; padding-bottom: 0; }
    [data-landing] .fl-pcard-main { transform: none; }
    [data-landing] .fl-pcard-detail { position: relative; right: auto; bottom: auto; width: 100%; margin-top: 14px; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .fl-ring .arc { animation: none !important; transition: none !important; stroke-dashoffset: var(--ring-off) !important; }
    [data-landing] .fl-drift-line { transition: none !important; stroke-dashoffset: 0 !important; }
    [data-landing] .fl-flow-dot { animation: none !important; }
    [data-landing] .fl-eyebrow::before, [data-landing] .fl-live::after { animation: none !important; }
  }
`;

const ROE_STYLE = `
  [data-landing] .roe { width: min(1040px, 100%); margin: 0 auto; }
  [data-landing] .roe-grid { display: grid; grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr); gap: 56px; align-items: center; }
  [data-landing] .roe-left { max-width: 440px; }
  [data-landing] .roe-left h2 { margin: 26px 0 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px, 3.6vw, 44px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #171717; }
  [data-landing] .roe-sub { margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; letter-spacing: -0.02em; color: rgba(86,82,75,0.86); }
  [data-landing] .roe-cta { margin-top: 26px; }
  [data-landing] .roe-steps { list-style: none; margin: 30px 0 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
  [data-landing] .roe-step { display: flex; gap: 14px; }
  [data-landing] .roe-step-num { flex: none; width: 26px; height: 26px; border-radius: 999px; background: #1d1d1d; color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 2px; }
  [data-landing] .roe-step b { font-family: 'Geist', sans-serif; font-size: 14.5px; font-weight: 600; color: #1f1d1a; letter-spacing: -0.01em; }
  [data-landing] .roe-step p { margin: 3px 0 0; font-family: 'Geist', sans-serif; font-size: 13px; line-height: 1.5; color: rgba(86,82,75,0.82); }
  [data-landing] .roe-card { border-radius: 24px; overflow: hidden; background: #fff; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 16px 40px rgba(104,99,80,0.1); }
  [data-landing] .roe-inputs { padding: 30px; display: flex; flex-direction: column; gap: 24px; }
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
  /* two-bar comparison */
  [data-landing] .roe-bars { margin-top: 20px; display: flex; align-items: flex-end; gap: 18px; height: 96px; }
  [data-landing] .roe-bar-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 7px; height: 100%; }
  [data-landing] .roe-bar { width: 100%; border-radius: 9px 9px 0 0; transition: height 0.5s cubic-bezier(0.22,1,0.36,1); }
  [data-landing] .roe-bar.today { background: #d8d2c6; }
  [data-landing] .roe-bar.repos { background: linear-gradient(180deg, #f3cf63, #e0a84a); }
  [data-landing] .roe-bar-cap { font-family: 'Geist', sans-serif; font-size: 10.5px; font-weight: 600; color: rgba(86,82,75,0.7); text-align: center; }
  [data-landing] .roe-bar-cap b { display: block; font-family: 'Albert Sans', sans-serif; font-size: 14px; color: #1d1d1d; }
  [data-landing] .roe-uplift { flex: none; align-self: stretch; display: flex; flex-direction: column; justify-content: center; padding-left: 4px; }
  [data-landing] .roe-uplift b { font-family: 'Albert Sans', sans-serif; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: #1d7a52; }
  [data-landing] .roe-uplift span { font-family: 'Geist', sans-serif; font-size: 10px; line-height: 1.3; color: rgba(86,82,75,0.7); }
  [data-landing] .roe-compare { margin-top: 18px; padding: 13px 15px; border-radius: 13px; background: rgba(254,247,175,0.5); border: 1px solid rgba(201,176,74,0.28); }
  [data-landing] .roe-compare p { margin: 0; font-family: 'Geist', sans-serif; font-size: 12.5px; line-height: 1.55; letter-spacing: -0.01em; color: #4a4320; }
  [data-landing] .roe-compare b { font-weight: 700; color: #1d1d1d; }
  [data-landing] .roe-fine { margin: 12px 0 0; font-family: 'Geist', sans-serif; font-size: 11px; line-height: 1.4; color: rgba(86,82,75,0.55); }
  @media (max-width: 880px) {
    [data-landing] .roe-grid { grid-template-columns: 1fr; gap: 36px; }
    [data-landing] .roe-left { max-width: none; }
  }
`;

/* ───────────────────────────── Primitives ───────────────────────────── */

/** A single SVG progress ring. `pct` is 0..1 of the arc that should remain filled. */
function Ring({ pct, size, stroke, color, track = "rgba(201,176,74,0.22)" }: {
  pct: number; size: number; stroke: number; color: string; track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg className="fl-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        className="arc"
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c}
        style={{ ["--ring-c" as string]: c, ["--ring-off" as string]: off } as CSSProperties}
      />
    </svg>
  );
}

function SectionHead({ eyebrow, title, sub, align = "left", titleMaxWidth }: {
  eyebrow: string; title: string; sub?: string; align?: "left" | "center"; titleMaxWidth?: number;
}) {
  return (
    <div data-reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="fl-eyebrow">{eyebrow}</span>
      <h2 className="lp-h2 mt-7" style={titleMaxWidth ? ({ maxWidth: titleMaxWidth, ...(align === "center" ? { marginInline: "auto" } : {}) } as CSSProperties) : undefined}>
        {title}
      </h2>
      {sub ? <p className="fl-sub">{sub}</p> : null}
    </div>
  );
}

/* ───────────────────────────── Sections ───────────────────────────── */

function HeroVisual() {
  return (
    <div className="fl-hero-visual lp-in" style={inDelay(0.2)}>
      <div className="fl-pcard fl-pcard-main">
        <div className="fl-pcard-photo" style={{ backgroundImage: "url(/landing-prop-retail.jpg)" }}>
          <span className="fl-private">Off-market</span>
        </div>
        <div className="fl-pcard-name">Maple Street Retail Center</div>
        <div className="fl-pcard-loc">Somerville, MA · ~$3.4M</div>
        <div className="fl-pcard-row">
          <span className="fl-live" />
          Shown privately to matched buyers
        </div>
      </div>

      <div className="fl-pcard fl-pcard-detail">
        <div className="fl-detail-head">
          <span className="fl-detail-big">3</span>
          <div>
            <b>1031 buyers</b>
            <span>matched · on a 180-day clock</span>
          </div>
        </div>
        <div className="fl-buyers">
          {HERO_BUYERS.map((b) => (
            <div key={b.name} className={`fl-buyer${b.hot ? " is-hot" : ""}`}>
              <span className="fl-buyer-ring">
                <Ring pct={b.daysLeft / 180} size={30} stroke={3} color={b.hot ? "#d9a72a" : "#9aaab4"} />
                <span>{b.daysLeft}</span>
              </span>
              <div className="fl-buyer-main">
                <div className="fl-buyer-name">{b.name}</div>
                <div className="fl-buyer-clock">{b.daysLeft} days left to close</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ onGetConnected, onSeeHow }: { onGetConnected: () => void; onSeeHow: () => void }) {
  return (
    <section className="px-5 pb-12 pt-28 sm:px-8 sm:pt-[168px]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="lg:relative lg:left-6">
          <p className="lp-eyebrow lp-in" style={inDelay(0)}>{HERO.eyebrow}</p>
          <h1 className="lp-in max-w-[520px]" style={inDelay(0.08)}>{HERO.headline}</h1>
          <p className="lp-sub lp-in mt-6 max-w-[32rem]" style={inDelay(0.16)}>{HERO.subheadline}</p>
          <div className="lp-in mt-9 flex flex-wrap items-center gap-3" style={inDelay(0.24)}>
            <Pill onClick={onGetConnected} primary>Get connected with an agent</Pill>
            <Pill onClick={onSeeHow}>See how it works</Pill>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div data-reveal>
          <span className="fl-eyebrow">The quiet problem</span>
          <h2 className="lp-h2 mt-7" style={{ maxWidth: 460 }}>Your building is doing fine. Your equity might not be.</h2>
          <p className="fl-sub max-w-[30rem]">
            You don't have a building problem — you have a redeployment problem. Years of appreciation and
            paydown have locked more value in the property than the day you bought it, but the income rarely
            keeps pace. So the return on the money you actually own keeps quietly sliding, while the building
            still looks like a success. Selling outright triggers a tax bill big enough that staying put feels
            like the only option. A 1031 exchange is the door around it — and there's a quiet way to test what
            your property is really worth before you ever commit.
          </p>
        </div>

        <div data-reveal>
          <div className="fl-drift">
            <div className="fl-drift-head">
              <div className="fl-drift-legend">
                <span className="fl-drift-leg"><i style={{ background: "#e0a84a" }} />Property value</span>
                <span className="fl-drift-leg"><i style={{ background: "#7fae8c" }} />Return on equity</span>
              </div>
            </div>
            <svg className="fl-drift-svg" viewBox="0 0 320 170" preserveAspectRatio="none" aria-hidden="true">
              {/* ~8% healthy guideline */}
              <line x1="0" y1="74" x2="320" y2="74" stroke="rgba(40,36,30,0.22)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* shaded drift gap */}
              <path className="fl-drift-gap" d="M0,150 L0,150 C90,150 150,150 320,150 L320,118 C150,118 90,140 0,150 Z" fill="rgba(254,247,175,0.55)" />
              {/* property value — climbing (amber) */}
              <path className="fl-drift-line" style={{ ["--len" as string]: 360 } as CSSProperties} stroke="#e0a84a" d="M4,150 C80,140 150,96 230,58 C270,40 300,30 316,24" />
              {/* return on equity — drooping (green) */}
              <path className="fl-drift-line" style={{ ["--len" as string]: 340 } as CSSProperties} stroke="#7fae8c" d="M4,108 C80,110 150,120 230,134 C270,141 300,146 316,150" />
            </svg>
            <span className="fl-drift-callout">This is the equity that could be working harder.</span>
            <div className="fl-chips">
              {PROBLEM_CHIPS.map((c, i) => (
                <div key={c.title}>
                  <span className="fl-chip-n">0{i + 1}</span>
                  <p className="fl-chip-t">{c.title}</p>
                  <p className="fl-chip-b">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuyerMicroVisual({ badge }: { badge: string }) {
  if (badge === "45 / 180") {
    return (
      <div className="fl-mv">
        <span className="fl-twin">
          <Ring pct={0.69} size={64} stroke={4} color="#cbb45a" track="rgba(40,36,30,0.08)" />
          <span style={{ inset: "11px" }}>
            <Ring pct={0.31} size={42} stroke={4} color="#e0a84a" track="rgba(40,36,30,0.08)" />
          </span>
          <span><b>31</b><i>of 45</i></span>
        </span>
        <span className="fl-mv-cap">Day 31 of 45 to identify</span>
      </div>
    );
  }
  if (badge === "Cash in escrow") {
    return (
      <div className="fl-mv">
        <span className="fl-escrow">
          <CheckCircle2 />
          <b>Funds verified · in escrow</b>
          <s>maybe-loan</s>
        </span>
      </div>
    );
  }
  return (
    <div className="fl-mv" style={{ display: "block" }}>
      <div className="fl-redact">
        <div className="fl-redact-line" style={{ width: "78%" }} />
        <div className="fl-redact-line" style={{ width: "92%" }} />
        <div className="fl-redact-line" style={{ width: "64%" }} />
        <span className="fl-redact-eye"><EyeOff /></span>
      </div>
      <p className="fl-redact-cap">Tenants &amp; competitors: not notified</p>
    </div>
  );
}

function BuyersSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Why these buyers are different"
          title="They've already sold. The money is in escrow. The clock is running."
          sub="A 1031 exchange buyer isn't shopping — they're under a federal deadline to spend money they already have. They sold a property, parked the proceeds with a qualified intermediary, and now have 45 days to identify a replacement and 180 to close, or the IRS taxes the gain. That deadline is your leverage."
          titleMaxWidth={640}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {BUYER_POINTS.map((card, i) => (
            <article key={card.title} className="fl-card" data-reveal style={{ ["--reveal-delay" as string]: `${i * 0.06}s` } as CSSProperties}>
              <div className="fl-card-top">
                <BuyerMicroVisual badge={card.badge} />
                <span className="fl-stat">{card.badge}</span>
              </div>
              <h3 className="fl-card-title">{card.title}</h3>
              <p className="fl-card-body">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HonestSection() {
  return (
    <section className="px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="fl-aurora" data-reveal>
          <span className="fl-aurora-eyebrow">The honest part</span>
          <h2>You can't join this network. That's exactly why you can trust it.</h2>
          <p className="fl-aurora-sub">
            Most "free property value" sites exist to sell your contact details to whoever pays the most.
            We're built differently. By law, only a licensed agent can represent a property, transact, and
            collect a referral fee — so we have nothing to sell you. All we can do is hand you to one
            professional who can actually close, and step out of the way.
          </p>

          {/* Handoff diagram — our logo sits off the transaction line */}
          <div className="fl-handoff">
            <div className="fl-handoff-line" />
            <div className="fl-barrier"><b>licensed only</b><i /></div>
            <div className="fl-node you">
              <span className="fl-node-dot"><Lock /></span>
              <span className="fl-node-label">You<i>owner</i></span>
            </div>
            <div className="fl-node agent">
              <span className="fl-node-dot"><BadgeCheck /></span>
              <span className="fl-node-label">Vetted agent<i>transacts &amp; closes</i></span>
            </div>
            <div className="fl-node">
              <div className="fl-node buyers">
                <span className="fl-node-av" style={{ background: "#cf877b" }} />
                <span className="fl-node-av" style={{ background: "#7ea7bd" }} />
                <span className="fl-node-av" style={{ background: "#a98cbe" }} />
              </div>
              <span className="fl-node-label" style={{ marginTop: 7 }}>Matched buyers<i>on the clock</i></span>
            </div>
          </div>
          <p className="fl-handoff-tag">We make the <b>introduction</b> — we're never a party to your deal.</p>

          <div className="fl-aurora-grid">
            {TRUST_POINTS.map((point, i) => (
              <div key={point.title}>
                <span className="fl-aurora-ic">{i + 1}</span>
                <h3 className="fl-aurora-title">{point.title}</h3>
                <p className="fl-aurora-body">{point.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepMock({ step }: { step: string }) {
  if (step === "01") {
    return (
      <div className="fl-step-mock">
        <span className="fl-mk-label">Property details</span>
        <div className="fl-mk-field" style={{ width: "70%" }} />
        <div className="fl-mk-field" style={{ width: "90%" }} />
        <div className="fl-mk-field is-fill" style={{ width: "55%" }} />
        <div className="fl-mk-field" style={{ width: "80%" }} />
      </div>
    );
  }
  if (step === "02") {
    return (
      <div className="fl-step-mock">
        <div className="fl-mk-agent">
          <span className="fl-mk-av">DR</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em" }}>Dana Reyes</div>
            <span className="fl-mk-vbadge"><BadgeCheck />Verified · works your market</span>
          </div>
        </div>
        <div style={{ marginTop: 9, fontSize: 9, color: "#9a948b" }}>Closes 1031 buyers daily · Greater Boston</div>
      </div>
    );
  }
  return (
    <div className="fl-step-mock">
      <span className="fl-mk-label">Maple Street Retail · matched</span>
      {[{ s: 94, hot: true }, { s: 88, hot: false }, { s: 81, hot: false }].map((b, i) => (
        <div key={i} className={`fl-mk-buyer${b.hot ? " is-hot" : ""}`}>
          <span className="fl-mk-score">{b.s}</span>
          <span className="fl-mk-bar" />
        </div>
      ))}
    </div>
  );
}

function HowSection() {
  return (
    <section id="how" className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="How it works"
          title="Two minutes now. A vetted agent reaches out by tomorrow."
          sub="No account to create, nothing to list, no listing agreement, no commitment. You tell us the basics; we hand-match you to one right agent; they take it from there, at whatever pace you set."
          titleMaxWidth={600}
        />
        <div className="fl-flow mt-12" data-reveal>
          <div className="fl-flow-dot" />
          {HOW_STEPS.map((item) => (
            <div key={item.step} className="fl-step">
              <StepMock step={item.step} />
              <span className="fl-step-num">{item.step}</span>
              <h3 className="fl-step-title">{item.title}</h3>
              <p className="fl-step-body">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoeCalculator({ onGetConnected }: { onGetConnected: () => void }) {
  const [value, setValue] = useState(2000000);
  const [loan, setLoan] = useState(750000);
  const [cashflow, setCashflow] = useState(82000);

  const PLATFORM = 8;
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

  // bar heights for the two-bar comparison (relative to the higher value)
  const maxV = Math.max(cashflow, potential, 1);
  const todayH = Math.max(8, (cashflow / maxV) * 100);
  const reposH = Math.max(8, (potential / maxV) * 100);

  const fields = [
    { label: "Current market value", val: value, set: setValue, min: 250000, max: 10000000, step: 50000 },
    { label: "Loan balance", val: loan, set: setLoan, min: 0, max: 9000000, step: 50000 },
    { label: "Annual cash flow", val: cashflow, set: setCashflow, min: 0, max: 500000, step: 5000 },
  ];

  return (
    <section id="equity-check" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="roe">
        <div className="roe-grid">
          <div className="roe-left" data-reveal>
            <span className="fl-eyebrow">Equity check</span>
            <h2>Run the number most owners never check.</h2>
            <p className="roe-sub">
              Cap rate tells you how the building performs. Return on equity tells you how your money performs —
              and it's almost always the lower, uglier number. Move three sliders to see yours in seconds, hold
              it against a healthy ~8% target, and see what that same equity could earn redeployed, tax-deferred.
            </p>
            <div className="roe-cta"><Pill onClick={onGetConnected} primary>Get connected with an agent</Pill></div>
            <ul className="roe-steps">
              {ROE_STEPS.map((s) => (
                <li key={s.n} className="roe-step">
                  <span className="roe-step-num">{s.n}</span>
                  <div><b>{s.title}</b><p>{s.body}</p></div>
                </li>
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
                        type="range" className="roe-range" min={f.min} max={f.max} step={f.step} value={f.val}
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

                {uplift > 0 ? (
                  <>
                    <div className="roe-bars">
                      <div className="roe-bar-col">
                        <span className="roe-bar-cap"><b>{usd(cashflow)}</b>today</span>
                        <div className="roe-bar today" style={{ height: `${todayH}%` }} />
                      </div>
                      <div className="roe-bar-col">
                        <span className="roe-bar-cap"><b>{usd(potential)}</b>repositioned</span>
                        <div className="roe-bar repos" style={{ height: `${reposH}%` }} />
                      </div>
                      <div className="roe-uplift">
                        <b>+{usd(uplift)}/yr</b>
                        <span>left on the table, tax-deferred</span>
                      </div>
                    </div>
                    <div className="roe-compare">
                      <p>Your <b>{usd(equity)}</b> of equity could be earning about <b>{usd(potential)}/yr</b> at a healthy ~8% — roughly <b>{usd(uplift)} more</b> than today, with the full gain still working untaxed.</p>
                    </div>
                  </>
                ) : (
                  <div className="roe-compare">
                    <p>You're already at or above a healthy <b>~8%</b> target — nicely done. When you're ready to trade up tax-deferred, we'll connect you with an agent.</p>
                  </div>
                )}
                <p className="roe-fine">Estimate only — not tax or investment advice.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div data-reveal className="text-center">
          <span className="fl-faq-pill"><span className="fl-live" />Free · private · no obligation</span>
          <h2 className="lp-h2 mt-7" style={{ marginInline: "auto", maxWidth: 520 }}>The questions a careful owner asks first.</h2>
          <p className="fl-sub" style={{ marginInline: "auto", maxWidth: 420 }}>No spin. If the honest answer is no, we say no.</p>
        </div>
        <div className="fl-faq-list" data-reveal>
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`fl-faq-item${isOpen ? " is-open" : ""}`}>
                <button type="button" className="fl-faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  {item.q}
                  <ChevronDown className="fl-faq-chev" />
                </button>
                <div className="fl-faq-a"><div><p>{item.a}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

type ReferralFormState = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyLocation: string;
  propertyType: string;
  estimatedValue: string;
};

const INITIAL_FORM_STATE: ReferralFormState = {
  ownerName: "", ownerEmail: "", ownerPhone: "", propertyLocation: "", propertyType: "", estimatedValue: "",
};

export default function ForLandlords() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useLandingMotion(rootRef);

  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "For Property Owners — 1031 Exchange Up";
  }, []);

  function updateField(field: keyof ReferralFormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ownerName = formState.ownerName.trim();
    const ownerEmail = formState.ownerEmail.trim();
    const ownerPhone = formState.ownerPhone.trim();
    const propertyLocation = formState.propertyLocation.trim();
    const propertyType = formState.propertyType.trim();

    if (ownerName.length < 2 || !ownerEmail) {
      toast({ title: "Please fill in your name and email.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (ownerName.length > 120 || ownerPhone.length > 40 || propertyLocation.length > 160) {
      toast({ title: "One of your entries is too long.", variant: "destructive" });
      return;
    }

    let estimatedValue: number | null = null;
    const rawValue = formState.estimatedValue.trim().toLowerCase();
    if (rawValue) {
      const millions = /^[$\s]*([\d.]+)\s*m$/.exec(rawValue);
      const plain = Number(rawValue.replace(/[$,\s]/g, ""));
      if (millions) estimatedValue = Math.round(parseFloat(millions[1]) * 1_000_000);
      else if (Number.isFinite(plain) && plain > 0) estimatedValue = Math.round(plain);
    }

    setSubmitting(true);

    const { error } = await supabase.from("referrals").insert({
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone || null,
      property_location: propertyLocation || null,
      property_type: propertyType || null,
      estimated_value: estimatedValue,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't submit your details.",
        description: "Please check your entries and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitted(true);
    setFormState(INITIAL_FORM_STATE);
  }

  const goToForm = () => scrollToId(lenisRef.current, "referral-form");
  const goToHow = () => scrollToId(lenisRef.current, "how");

  return (
    <div ref={rootRef} data-landing className="min-h-screen">
      <style>{LANDING_BASE_CSS}</style>
      <style>{FL_STYLE}</style>
      <style>{ROE_STYLE}</style>
      <LandingBackdrop />

      <div className="lp-content">
        <Hero onGetConnected={goToForm} onSeeHow={goToHow} />
        <ProblemSection />
        <BuyersSection />
        <HonestSection />
        <HowSection />
        <RoeCalculator onGetConnected={goToForm} />
        <FaqSection />

        {/* ── Referral form ── */}
        <section id="referral-form" className="scroll-mt-28 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
          <div className="mx-auto max-w-6xl fl-formcard" data-reveal>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <span className="fl-eyebrow">Get connected</span>
                <h2 className="lp-h2 mt-7" style={{ maxWidth: 360 }}>Tell us about your property — in confidence.</h2>
                <p className="fl-sub max-w-[26rem]">
                  Six fields, about two minutes. We'll match you with one vetted, licensed agent who works
                  your market and closes 1031 buyers — usually within one business day. No listing, no fee,
                  no obligation, and your details stay private.
                </p>
                <ul className="mt-7 space-y-3.5">
                  {FORM_BENEFITS.map((point) => (
                    <li key={point} className="fl-bullet">
                      <span className="fl-bullet-ic"><BadgeCheck className="h-3.5 w-3.5" /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                {submitted ? (
                  <div className="fl-done">
                    <span className="fl-done-ic"><CheckCircle2 /></span>
                    <h3>Done — you're in good hands.</h3>
                    <p>
                      We've got your details and we're matching you now. One vetted, licensed agent from our
                      network who works your market will reach out within one business day to talk through your
                      options — at your pace, with no pressure and no obligation.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-name">Your Name <span className="req">*</span></label>
                        <input id="ref-name" className="fl-input" value={formState.ownerName}
                          onChange={(e) => updateField("ownerName", e.target.value)} placeholder="Jane Smith" />
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-email">Email <span className="req">*</span></label>
                        <input id="ref-email" type="email" className="fl-input" value={formState.ownerEmail}
                          onChange={(e) => updateField("ownerEmail", e.target.value)} placeholder="jane@email.com" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-phone">Phone Number</label>
                        <input id="ref-phone" type="tel" className="fl-input" value={formState.ownerPhone}
                          onChange={(e) => updateField("ownerPhone", e.target.value)} placeholder="(555) 000-0000" />
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-location">Property Location</label>
                        <input id="ref-location" className="fl-input" value={formState.propertyLocation}
                          onChange={(e) => updateField("propertyLocation", e.target.value)} placeholder="City, State" />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-type">Property Type</label>
                        <div className="fl-select-wrap">
                          <select id="ref-type" className="fl-select" value={formState.propertyType}
                            onChange={(e) => updateField("propertyType", e.target.value)}>
                            <option value="">Select a type</option>
                            {PROPERTY_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
                          </select>
                          <ChevronDown className="fl-select-chev" />
                        </div>
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-value">Estimated Value</label>
                        <input id="ref-value" className="fl-input" value={formState.estimatedValue}
                          onChange={(e) => updateField("estimatedValue", e.target.value)} placeholder="e.g. $2,500,000" />
                      </div>
                    </div>

                    <div className="fl-form-foot">
                      <p className="fl-fine">
                        By submitting, you agree that a licensed agent from our network may contact you about
                        your property. No fees, no obligation.
                      </p>
                      <button type="submit" className="fl-submit" disabled={submitting}>
                        {submitting ? (<><Loader2 className="fl-submit-spin" />Submitting…</>)
                          : (<>Connect me with an agent<span className="fl-submit-arrow"><ArrowRight /></span></>)}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

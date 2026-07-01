import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, BadgeCheck, Building2, Check, CheckCircle2, ChevronDown, Eye, Loader2, Lock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  LANDING_BASE_CSS, LandingBackdrop, Pill, inDelay, scrollToId, useLandingMotion,
} from "@/components/landing/landingKit";

/* ───────────────────────────── Content ───────────────────────────── */

const HERO = {
  eyebrow: "For landlords",
  headline: "Line up a better-returning building before you ever have to sell.",
  subheadline:
    "The hard part of a 1031 isn't selling — it's having somewhere worth moving into before the tax clock starts. So we built a private network of agents who do these exchanges for their owner-clients. Your agent enters the building you own now and its numbers, and the network automatically surfaces other owners' buildings that would earn you a better return and that you can afford. No wish-list, no guessing. At the same time, your building is quietly surfaced to owners looking for a better return of their own. Nothing is public — names and addresses stay hidden until both sides choose to connect. Owners pay nothing, so tell us where you are and we'll connect you with a vetted agent, in confidence.",
};

/* Hero match card — a replacement that out-earns the owner's current building. */
const HERO_MATCH = [
  { label: "Earns more than yours", val: "7.4% vs 4.1%" },
  { label: "Within your budget", val: "Yes" },
  { label: "Agent-represented", val: "Yes" },
] as const;

const PROBLEM_CHIPS = [
  { title: "Equity grows", body: "Appreciation and loan paydown leave far more value locked in the building than the day you bought it." },
  { title: "Income lags", body: "Rents rarely keep pace with that growing equity, so the real percentage return on what you own keeps slipping." },
  { title: "Tax keeps you stuck", body: "Selling outright can mean a capital-gains hit big enough that doing nothing feels safer. A 1031 exchange is the way around it." },
] as const;

/* Replacement matches the network surfaces — each out-earns the owner's building. */
const MATCH_CARDS = [
  { name: "Cedar Point Industrial", loc: "Reno, NV", price: "$3.1M", score: 96, hot: true, photo: "/landing-prop-industrial.jpg", ret: "7.4% return", lift: "+3.3% vs yours" },
  { name: "Stonebridge Flex Park", loc: "Boise, ID", price: "$3.1M", score: 91, hot: false, photo: "/landing-prop-retail.jpg", ret: "6.8% return", lift: "+2.7% vs yours" },
  { name: "Harbor Logistics Center", loc: "Tucson, AZ", price: "$2.9M", score: 84, hot: false, photo: "/landing-prop-office.jpg", ret: "6.5% return", lift: "+2.4% vs yours" },
] as const;

const MATCH_POINTS = [
  { title: "No wish-list needed", body: "You never specify a type, an area, a price, or a target return. The starting point is one thing: the building you already own and what it earns. Everything else follows from that." },
  { title: "Driven by the return math", body: "The network only surfaces buildings that would beat the return you're getting today and that your equity can actually reach. If it can't earn you more, it doesn't show up." },
  { title: "Buildings you'd never find alone", body: "Every building belongs to another owner in the same spot as you — still holding it, weighing a move. You'd have no way to reach them on your own." },
] as const;

/* The other half — your building is automatically a match for other owners. */
const SELL_CARDS = [
  {
    icon: Eye,
    title: "Lined up before you commit",
    body: "You can see whether there's real interest in your building before you decide to sell anything. No listing, no sign out front, no parade of tire-kickers — just a quiet read on genuine interest.",
  },
  {
    icon: Building2,
    title: "The other side still owns their building",
    body: "They haven't sold and aren't sitting on cash. They're an owner in your exact position, looking for a better-returning building to move into — and yours might be it.",
  },
  {
    icon: Lock,
    title: "Nothing is public",
    body: "Tenants, competitors, and lenders learn nothing. Your name and address stay hidden, and a match only becomes a conversation when both sides choose to connect.",
  },
] as const;

const TRUST_POINTS = [
  {
    title: "A licensed agent handles the deal",
    body: "The replacement search, the negotiation, the close, and any fee all sit with a licensed agent. That's why we connect you with one instead of trying to act as one ourselves. We're not a brokerage and we don't touch the deal.",
  },
  {
    title: "Agents pay, owners never do",
    body: "Agents pay to be in the network. You don't, ever. The introduction costs you nothing and commits you to nothing, so our advice has no angle on you.",
  },
  {
    title: "Free, private, no obligation",
    body: "Your details go to one vetted agent, not a pool of buyers. Nothing is public, nothing is resold, and every next step is your call.",
  },
] as const;

const HOW_STEPS = [
  {
    step: "01",
    title: "Tell us about your situation",
    body: "A few quick fields: the building you own, roughly what it's worth, and where you are in your thinking. About two minutes. No documents, no account, no obligation.",
  },
  {
    step: "02",
    title: "We connect you with one agent",
    body: "Not a lead auction. One vetted, licensed agent who knows your market and your kind of building and does these exchanges for a living. They'll reach out to talk it through.",
  },
  {
    step: "03",
    title: "Your building goes into the network",
    body: "Your agent enters your building, which surfaces better-returning replacements for you and surfaces your building to other owners looking to trade up. Nothing is public, and you set the pace.",
  },
] as const;

const ROE_STEPS = [
  { n: "01", title: "See what your money really earns", body: "Not cap rate, not cash-on-cash. This is what your tied-up equity actually earns each year, as a percentage, at today's value." },
  { n: "02", title: "Compare it to 8%", body: "A simple, honest yardstick for whether your money is pulling its weight, or just sitting still inside a building that went up in value." },
  { n: "03", title: "See what you'd gain by moving it", body: "An estimate of the extra income each year that same money could earn in a stronger building, with your full gain still working and untaxed." },
] as const;

const FAQS = [
  {
    q: "Can you really find me a replacement within 45 days?",
    a: "That's what the network is built for. Once your agent enters the building you own and its numbers, the system automatically surfaces other owners' buildings that would earn you a better return and that you can afford. There's no wish-list to fill in — the return math does the matching. We can't promise one specific building, but getting real, better-returning options in front of you fast is exactly what this is for, and that's the part where most owners run out of time on their own.",
  },
  {
    q: "What's the catch? Why is this free for me?",
    a: "Agents pay to be in the network. Owners never do. We're paid by the agent side, so the introduction costs you nothing and carries no obligation. If your situation isn't a fit, we'll just tell you that straight.",
  },
  {
    q: "Is any of this public?",
    a: "No. Nothing goes on a public site. Your name and your building's address stay hidden, and a match only becomes a conversation when both sides choose to connect. Tenants, competitors, and lenders learn nothing unless and until you decide to take it further.",
  },
  {
    q: "What happens to my information?",
    a: "It goes to the one vetted agent we connect you with, and only so they can reach out. We don't sell your details, post them anywhere, or send them to a pool of buyers.",
  },
  {
    q: "Am I committing to anything?",
    a: "Not at all. No agreement, no mandate, no commitment. Plenty of owners start just curious whether a better-returning building exists for them, or whether their money is working as hard as it could. You take the conversation as far as you like and stop whenever you want.",
  },
  {
    q: "Why can't I just join the network myself?",
    a: "Because the deal and any fee are handled by a licensed agent, and the network is built for the agents who run these exchanges all day. Rather than have you work around that, we connect you with one who can do it properly — which is also why our introduction has no angle on you.",
  },
] as const;

const FORM_BENEFITS = [
  "Better-returning buildings, surfaced by the return math",
  "Free for owners — agents pay, you never do",
  "Connected by hand to one vetted agent, not a buyer pool",
  "Nothing public — your name and address stay private",
] as const;

const PROPERTY_TYPES = [
  "Multifamily", "Retail", "Office", "Industrial", "Mixed-use", "Land", "Other",
] as const;

/* ───────────────────────────── Styles ───────────────────────────── */

const FL_STYLE = `
  [data-landing] .fl-eyebrow {
    display: inline-flex; align-items: center; gap: 7px; font-family: 'Geist', sans-serif;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    color: #2f7a33; background: #e3f1e4; padding: 7px 13px 7px 11px; border-radius: 999px; line-height: 1;
  }
  [data-landing] .fl-eyebrow::before {
    content: ''; width: 6px; height: 6px; border-radius: 999px; background: #43a047; flex: none;
    box-shadow: 0 0 0 0 rgba(67,160,71,0.55); animation: flDot 2.1s ease-out infinite;
  }
  @keyframes flDot { 0% { box-shadow: 0 0 0 0 rgba(67,160,71,0.5); } 70%, 100% { box-shadow: 0 0 0 6px rgba(67,160,71,0); } }
  /* The shared .lp-h2 reset sets margin:0 and out-specifies Tailwind's mt-*,
     so the eyebrow -> headline gap must be set here (higher specificity). */
  [data-landing] .fl-eyebrow + .lp-h2,
  [data-landing] .fl-faq-pill + .lp-h2 { margin-top: 30px; }
  [data-landing] .fl-sub {
    margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400;
    line-height: 1.55; letter-spacing: -0.02em; color: rgba(86,101,122,0.86);
  }
  [data-landing] .fl-mini { margin-top: 26px; display: flex; flex-direction: column; gap: 16px; padding: 0; }
  [data-landing] .fl-mini li { list-style: none; display: flex; gap: 11px; }
  [data-landing] .fl-mini i { margin-top: 7px; width: 6px; height: 6px; border-radius: 999px; background: #43a047; flex: none; }
  [data-landing] .fl-mini b { font-family: 'Geist', sans-serif; font-size: 14.5px; font-weight: 600; color: #16284a; letter-spacing: -0.01em; }
  [data-landing] .fl-mini span { display: block; margin-top: 2px; font-family: 'Geist', sans-serif; font-size: 13px; line-height: 1.5; color: rgba(86,101,122,0.82); }

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
    box-shadow: 0 32px 64px rgba(14,42,77,0.15), 0 4px 14px rgba(14,42,77,0.05);
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #16284a;
  }
  [data-landing] .fl-pcard-main { position: relative; border-radius: 24px; padding: 16px 16px 18px; transform: rotate(-2.5deg); }
  [data-landing] .fl-pcard-photo { position: relative; height: 156px; border-radius: 16px; background-size: cover; background-position: center; }
  [data-landing] .fl-private { position: absolute; top: 10px; left: 10px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(22,40,74,0.6); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 999px; }
  [data-landing] .fl-pcard-clock { position: absolute; right: 10px; bottom: 10px; font-size: 9.5px; font-weight: 700; color: #2f7a33; background: #e3f1e4; box-shadow: 0 0 0 1px rgba(67,160,71,0.45); padding: 4px 9px; border-radius: 999px; }
  [data-landing] .fl-pcard-name { margin-top: 14px; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
  [data-landing] .fl-pcard-loc { margin-top: 3px; font-size: 12.5px; color: #8794a6; }
  [data-landing] .fl-pcard-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 13px; border-top: 1px solid rgba(0,0,0,0.07); font-size: 12px; font-weight: 600; color: #56657a; }
  [data-landing] .fl-live { position: relative; width: 8px; height: 8px; border-radius: 999px; background: #43a047; flex: none; }
  [data-landing] .fl-live::after { content: ''; position: absolute; inset: 0; border-radius: 999px; background: #43a047; animation: flLive 1.9s ease-out infinite; }
  @keyframes flLive { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.7); opacity: 0; } }

  [data-landing] .fl-pcard-detail { position: absolute; right: -3%; bottom: 0; width: 66%; border-radius: 18px; padding: 15px; transform: rotate(5deg); background: rgba(255,255,255,0.94); }
  [data-landing] .fl-match-head { display: flex; align-items: center; gap: 11px; }
  [data-landing] .fl-match-ring { position: relative; width: 54px; height: 54px; flex: none; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-match-ring > span { position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: -0.03em; color: #16284a; }
  [data-landing] .fl-match-meta b { display: block; font-size: 12.5px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .fl-match-meta i { display: block; font-style: normal; font-size: 10px; color: #8794a6; margin-top: 1px; }
  [data-landing] .fl-match-rows { margin-top: 13px; display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fl-match-row { display: flex; align-items: center; gap: 7px; }
  [data-landing] .fl-match-check { width: 14px; height: 14px; border-radius: 999px; background: #43a047; color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fl-match-check svg { width: 9px; height: 9px; stroke-width: 3.5; }
  [data-landing] .fl-match-label { font-size: 9.5px; font-weight: 600; color: #56657a; }
  [data-landing] .fl-match-val { margin-left: auto; font-size: 9.5px; font-weight: 700; color: #16284a; }

  /* ── Problem: equity-drift chart ── */
  [data-landing] .fl-drift {
    position: relative; border-radius: 24px; background: #eef3fb; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 12px 30px rgba(14,42,77,0.13); padding: 26px 26px 22px; overflow: hidden;
  }
  [data-landing] .fl-drift-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
  [data-landing] .fl-drift-legend { display: flex; gap: 16px; }
  [data-landing] .fl-drift-leg { display: inline-flex; align-items: center; gap: 6px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: #56657a; }
  [data-landing] .fl-drift-leg i { width: 14px; height: 3px; border-radius: 999px; display: inline-block; }
  [data-landing] .fl-drift-svg { width: 100%; height: auto; display: block; }
  [data-landing] .fl-drift-line { fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: var(--len); stroke-dashoffset: var(--len); }
  [data-landing] [data-reveal].is-visible .fl-drift-line { transition: stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1); stroke-dashoffset: 0; }
  [data-landing] .fl-drift-gap { opacity: 0; transition: opacity 0.6s ease 0.8s; }
  [data-landing] [data-reveal].is-visible .fl-drift-gap { opacity: 1; }
  [data-landing] .fl-drift-callout {
    position: absolute; right: 22px; top: 58px; max-width: 168px; font-family: 'Geist', sans-serif;
    font-size: 11.5px; line-height: 1.4; font-weight: 600; color: #2f7a33;
    background: rgba(255,255,255,0.82); border: 1px solid rgba(67,160,71,0.35);
    border-radius: 12px; padding: 9px 11px; box-shadow: 0 8px 20px rgba(14,42,77,0.12);
    opacity: 0; transform: translateY(6px); transition: opacity 0.5s ease 1s, transform 0.5s ease 1s;
  }
  [data-landing] [data-reveal].is-visible .fl-drift-callout { opacity: 1; transform: none; }
  [data-landing] .fl-chips { margin-top: 28px; display: grid; gap: 16px; }
  [data-landing] .fl-chip-t { font-family: 'Albert Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.02em; color: #16284a; }
  [data-landing] .fl-chip-b { margin-top: 5px; font-family: 'Geist', sans-serif; font-size: 13.5px; line-height: 1.5; color: rgba(86,101,122,0.84); }
  [data-landing] .fl-chip-n { font-family: 'Albert Sans', sans-serif; font-size: 13px; font-weight: 700; color: #43a047; }

  /* ── Scored replacement match feed ── */
  [data-landing] .fl-rep-caption { font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #2f7a33; margin-bottom: 12px; display: flex; align-items: center; gap: 7px; }
  [data-landing] .fl-rep-feed { display: flex; flex-direction: column; gap: 12px; }
  [data-landing] .fl-rep-card { position: relative; border-radius: 18px; background: #eef3fb; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 8px 20px rgba(14,42,77,0.12); padding: 14px; transition: transform 0.3s ease, box-shadow 0.3s ease; }
  [data-landing] .fl-rep-card:hover { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(14,42,77,0.16); }
  [data-landing] .fl-rep-card.is-hot { background: linear-gradient(180deg, #f2fbf3, #e3f1e4); border-color: rgba(67,160,71,0.4); box-shadow: 0 14px 32px rgba(67,160,71,0.2); }
  [data-landing] .fl-rep-flag { position: absolute; top: -9px; right: 16px; font-family: 'Geist', sans-serif; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #fff; background: #43a047; padding: 3px 9px; border-radius: 999px; box-shadow: 0 4px 10px rgba(67,160,71,0.4); }
  [data-landing] .fl-rep-top { display: flex; align-items: center; gap: 13px; }
  [data-landing] .fl-rep-thumb { position: relative; width: 66px; height: 66px; border-radius: 12px; background-size: cover; background-position: center; flex: none; }
  [data-landing] .fl-rep-off { position: absolute; top: 4px; left: 4px; font-size: 7px; font-weight: 700; color: #fff; background: rgba(22,40,74,0.62); padding: 2px 5px; border-radius: 999px; }
  [data-landing] .fl-rep-info { flex: 1; min-width: 0; }
  [data-landing] .fl-rep-name { font-family: 'Albert Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: -0.02em; color: #16284a; }
  [data-landing] .fl-rep-loc { font-family: 'Geist', sans-serif; font-size: 12px; color: #8794a6; margin-top: 1px; }
  [data-landing] .fl-rep-crit { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px; }
  [data-landing] .fl-rep-pill { display: inline-flex; align-items: center; gap: 3px; font-family: 'Geist', sans-serif; font-size: 9.5px; font-weight: 600; color: #2f7a33; background: rgba(67,160,71,0.16); padding: 3px 7px; border-radius: 999px; }
  [data-landing] .fl-rep-pill svg { width: 8px; height: 8px; stroke-width: 3.5; }
  [data-landing] .fl-rep-ring { position: relative; width: 50px; height: 50px; flex: none; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-rep-ring > span { position: absolute; inset: 0; display: inline-flex; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.03em; color: #16284a; }

  /* ── Buyer / "why" cards ── */
  [data-landing] .fl-card {
    display: flex; flex-direction: column; height: 100%; border-radius: 24px;
    background: #eef3fb; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 8px 20px rgba(14,42,77,0.15); padding: 26px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  [data-landing] .fl-card:hover { transform: translateY(-3px); box-shadow: 0 18px 38px rgba(14,42,77,0.18); }
  [data-landing] .fl-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  [data-landing] .fl-stat { font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; color: #2f7a33; background: #e3f1e4; padding: 6px 12px; border-radius: 999px; }
  [data-landing] .fl-card-title { margin-top: 4px; font-family: 'Albert Sans', sans-serif; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #16284a; }
  [data-landing] .fl-card-body { margin-top: 12px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.55; letter-spacing: -0.01em; color: rgba(86,101,122,0.86); }
  [data-landing] .fl-card-ic { width: 46px; height: 46px; border-radius: 13px; background: #e3f1e4; color: #16284a; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  [data-landing] .fl-card-ic svg { width: 22px; height: 22px; }

  /* ── How: flow board ── */
  [data-landing] .fl-flow { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  [data-landing] .fl-flow::before {
    content: ''; position: absolute; left: 16%; right: 16%; top: 92px; height: 2px;
    background: repeating-linear-gradient(90deg, rgba(67,160,71,0.5) 0 7px, transparent 7px 13px); z-index: 0;
  }
  [data-landing] .fl-flow-dot {
    position: absolute; top: 88px; left: 16%; width: 9px; height: 9px; border-radius: 999px; z-index: 1;
    background: #43a047; box-shadow: 0 0 0 4px rgba(67,160,71,0.18);
  }
  [data-landing] [data-reveal].is-visible .fl-flow-dot { animation: flTravel 2.6s cubic-bezier(0.5,0,0.5,1) 0.4s infinite; }
  @keyframes flTravel { 0% { left: 16%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { left: calc(84% - 9px); opacity: 0; } }
  [data-landing] .fl-step {
    position: relative; z-index: 1; height: 100%; border-radius: 22px; background: #eef3fb;
    border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 8px 20px rgba(14,42,77,0.12); padding: 22px;
  }
  [data-landing] .fl-step-mock { height: 116px; border-radius: 14px; background: #fff; border: 1px solid rgba(0,0,0,0.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.7); padding: 12px; overflow: hidden; }
  [data-landing] .fl-mk-label { font-family: 'Geist', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #8794a6; }
  [data-landing] .fl-mk-field { height: 11px; border-radius: 4px; background: #e8edf3; margin-top: 5px; }
  [data-landing] .fl-mk-field.is-fill { background: #e3f1e4; box-shadow: inset 0 0 0 1px rgba(67,160,71,0.4); }
  [data-landing] .fl-mk-agent { display: flex; align-items: center; gap: 8px; }
  [data-landing] .fl-mk-av { width: 30px; height: 30px; border-radius: 999px; background: linear-gradient(135deg, #16284a, #0e2a4d); color: #fff; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fl-mk-vbadge { display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 700; color: #2f7a33; background: rgba(67,160,71,0.18); padding: 3px 6px; border-radius: 999px; margin-top: 4px; }
  [data-landing] .fl-mk-vbadge svg { width: 8px; height: 8px; }
  [data-landing] .fl-mk-split { display: flex; gap: 8px; height: 100%; }
  [data-landing] .fl-mk-half { flex: 1; min-width: 0; border-radius: 9px; background: #eef3fb; padding: 8px; }
  [data-landing] .fl-mk-half .fl-mk-label { font-size: 7px; }
  [data-landing] .fl-mk-row { display: flex; align-items: center; gap: 5px; margin-top: 6px; font-size: 9px; }
  [data-landing] .fl-mk-score { width: 17px; height: 17px; border-radius: 999px; background: #43a047; color: #fff; font-size: 8px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  [data-landing] .fl-mk-row.is-hot .fl-mk-score { background: #43a047; }
  [data-landing] .fl-mk-bar { flex: 1; height: 6px; border-radius: 999px; background: #e8edf3; }
  [data-landing] .fl-step-num { display: inline-block; margin-top: 16px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: #43a047; }
  [data-landing] .fl-step-title { margin-top: 6px; font-family: 'Albert Sans', sans-serif; font-size: 18px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #16284a; }
  [data-landing] .fl-step-body { margin-top: 9px; font-family: 'Geist', sans-serif; font-size: 13.5px; line-height: 1.5; color: rgba(86,101,122,0.84); }

  /* ── Dark aurora panel + handoff ── */
  [data-landing] .fl-aurora {
    position: relative; overflow: hidden; border-radius: 32px; padding: 56px 44px;
    background:
      radial-gradient(ellipse 52% 62% at 72% 50%, rgba(67,160,71,0.42) 0%, rgba(67,160,71,0) 62%),
      radial-gradient(ellipse 48% 58% at 50% 88%, rgba(67,160,71,0.4) 0%, rgba(67,160,71,0) 60%),
      radial-gradient(ellipse 42% 52% at 88% 80%, rgba(46,211,198,0.4) 0%, rgba(46,211,198,0) 60%),
      radial-gradient(ellipse 42% 48% at 14% 90%, rgba(58,140,62,0.5) 0%, rgba(58,140,62,0) 58%),
      linear-gradient(180deg, #16284a 0%, #0e2a4d 55%, #0b1f3d 100%);
    border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 20px 50px rgba(11,31,61,0.18);
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
  [data-landing] .fl-node.agent .fl-node-dot { background: #43a047; color: #ffffff; box-shadow: 0 0 0 6px rgba(67,160,71,0.16); }
  [data-landing] .fl-node.buyers { flex-direction: row; }
  [data-landing] .fl-node-av { width: 30px; height: 30px; border-radius: 999px; border: 2px solid rgba(11,31,61,0.9); margin-left: -10px; }
  [data-landing] .fl-node-av:first-child { margin-left: 0; }
  [data-landing] .fl-node-label { font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.85); }
  [data-landing] .fl-node-label i { display: block; font-style: normal; font-size: 9.5px; color: rgba(255,255,255,0.5); margin-top: 1px; }
  [data-landing] .fl-handoff-line { position: absolute; left: 46px; right: 64px; top: 23px; height: 2px; z-index: 1; background: repeating-linear-gradient(90deg, rgba(67,160,71,0.6) 0 6px, transparent 6px 12px); }
  [data-landing] .fl-barrier { position: absolute; left: 38%; top: 4px; bottom: auto; height: 38px; z-index: 2; display: flex; flex-direction: column; align-items: center; }
  [data-landing] .fl-barrier i { width: 2px; height: 34px; background: repeating-linear-gradient(180deg, rgba(255,255,255,0.55) 0 4px, transparent 4px 8px); }
  [data-landing] .fl-barrier b { position: absolute; top: -16px; white-space: nowrap; font-family: 'Geist', sans-serif; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.6); }
  [data-landing] .fl-handoff-tag { margin-top: 6px; font-family: 'Geist', sans-serif; font-size: 11px; color: rgba(255,255,255,0.55); }
  [data-landing] .fl-handoff-tag b { color: #5cc15f; font-weight: 600; }

  [data-landing] .fl-aurora-grid { margin-top: 30px; display: grid; gap: 26px; }
  [data-landing] .fl-aurora-ic { width: 36px; height: 36px; border-radius: 11px; background: #43a047; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; font-size: 16px; font-weight: 700; }
  [data-landing] .fl-aurora-title { margin-top: 14px; font-family: 'Albert Sans', sans-serif; font-size: 17px; font-weight: 500; letter-spacing: -0.03em; color: #fff; }
  [data-landing] .fl-aurora-body { margin-top: 9px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.62); }

  /* ── FAQ accordion ── */
  [data-landing] .fl-faq-pill { display: inline-flex; align-items: center; gap: 7px; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 700; color: #2f7a33; background: #e3f1e4; padding: 6px 13px; border-radius: 999px; }
  [data-landing] .fl-faq-list { margin-top: 26px; display: flex; flex-direction: column; gap: 10px; }
  [data-landing] .fl-faq-item { border-radius: 16px; background: #eef3fb; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 14px rgba(14,42,77,0.07); overflow: hidden; transition: box-shadow 0.25s ease; }
  [data-landing] .fl-faq-item.is-open { box-shadow: 0 12px 28px rgba(14,42,77,0.12); }
  [data-landing] .fl-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; cursor: pointer; text-align: left; font-family: 'Albert Sans', sans-serif; font-size: 16.5px; font-weight: 500; letter-spacing: -0.02em; color: #16284a; background: none; border: none; }
  [data-landing] .fl-faq-chev { flex: none; width: 19px; height: 19px; color: #8794a6; transition: transform 0.3s ease; }
  [data-landing] .fl-faq-item.is-open .fl-faq-chev { transform: rotate(180deg); }
  [data-landing] .fl-faq-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1); }
  [data-landing] .fl-faq-item.is-open .fl-faq-a { grid-template-rows: 1fr; }
  [data-landing] .fl-faq-a > div { overflow: hidden; }
  [data-landing] .fl-faq-a p { margin: 0; padding: 0 22px 20px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.6; color: rgba(86,101,122,0.88); }

  /* ── Referral form ── */
  [data-landing] .fl-formcard {
    border-radius: 30px; background: linear-gradient(180deg, #eef3fb 0%, #eef3fb 100%);
    border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 16px 40px rgba(14,42,77,0.12); padding: 30px;
  }
  [data-landing] .fl-bullet { display: flex; align-items: flex-start; gap: 12px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.5; color: #56657a; }
  [data-landing] .fl-bullet-ic { margin-top: 1px; flex: none; width: 20px; height: 20px; border-radius: 999px; background: #43a047; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-bullet-ic svg { width: 13px; height: 13px; }
  [data-landing] .fl-field { display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fl-field > label { font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; color: #16284a; }
  [data-landing] .fl-field > label .req { color: rgba(86,101,122,0.5); font-weight: 400; }
  [data-landing] .fl-input, [data-landing] .fl-select {
    width: 100%; font-family: 'Geist', sans-serif; font-size: 14px; color: #16284a;
    background: #ffffff; border: 1px solid rgba(0,0,0,0.09); border-radius: 12px; padding: 12px 13px;
    outline: none; transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }
  [data-landing] .fl-input::placeholder { color: #9fb0c8; }
  [data-landing] .fl-input:focus, [data-landing] .fl-select:focus { border-color: #43a047; background: #fff; box-shadow: 0 0 0 3px rgba(67,160,71,0.16); }
  [data-landing] .fl-select-wrap { position: relative; }
  [data-landing] .fl-select { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 36px; }
  [data-landing] .fl-select-chev { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #8794a6; pointer-events: none; }
  [data-landing] .fl-form-foot { display: flex; flex-direction: column; gap: 16px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 18px; margin-top: 4px; }
  [data-landing] .fl-fine { max-width: 19rem; font-family: 'Geist', sans-serif; font-size: 12px; line-height: 1.5; color: #8794a6; }
  [data-landing] .fl-submit {
    appearance: none; border: none; cursor: pointer; display: inline-flex; align-items: center;
    justify-content: center; gap: 10px; height: 46px; padding: 0 8px 0 22px; border-radius: 999px;
    background: #43a047; color: #fff; font-family: 'Geist', sans-serif; font-size: 15px; font-weight: 600;
    letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 5px 15px rgba(14,42,77,0.2);
    transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  }
  [data-landing] .fl-submit:hover:not(:disabled) { background: #3a8c3e; box-shadow: 0 5px 15px rgba(14,42,77,0.2), 0 0 0 5px rgba(67,160,71,0.08); }
  [data-landing] .fl-submit:active:not(:disabled) { transform: scale(0.99); }
  [data-landing] .fl-submit:disabled { opacity: 0.72; cursor: default; }
  [data-landing] .fl-submit-arrow { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; background: #fff; }
  [data-landing] .fl-submit-arrow svg { width: 14px; height: 14px; color: #43a047; }
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
  @media (max-width: 700px) {
    [data-landing] .fl-flow { grid-template-columns: 1fr; gap: 14px; }
    [data-landing] .fl-flow::before, [data-landing] .fl-flow-dot { display: none; }
  }
  /* Phones: stack the layered hero cards straight so nothing clips */
  @media (max-width: 600px) {
    [data-landing] .fl-hero-visual { max-width: 360px; padding-bottom: 0; }
    [data-landing] .fl-pcard-main { transform: none; }
    [data-landing] .fl-pcard-detail { position: relative; right: auto; bottom: auto; width: 100%; margin-top: 14px; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .fl-ring .arc { animation: none !important; transition: none !important; stroke-dashoffset: var(--ring-off) !important; }
    [data-landing] .fl-flow-dot { animation: none !important; }
    [data-landing] .fl-drift-line { transition: none !important; stroke-dashoffset: 0 !important; }
    [data-landing] .fl-eyebrow::before, [data-landing] .fl-live::after { animation: none !important; }
  }
`;

const ROE_STYLE = `
  [data-landing] .roe { width: min(1040px, 100%); margin: 0 auto; }
  [data-landing] .roe-grid { display: grid; grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr); gap: 56px; align-items: center; }
  [data-landing] .roe-left { max-width: 440px; }
  [data-landing] .roe-left h2 { margin: 30px 0 0; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px, 3.6vw, 44px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.06; color: #16284a; }
  [data-landing] .roe-sub { margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.5; letter-spacing: -0.02em; color: rgba(86,101,122,0.86); }
  [data-landing] .roe-cta { margin-top: 26px; }
  [data-landing] .roe-steps { list-style: none; margin: 30px 0 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
  [data-landing] .roe-step { display: flex; gap: 14px; }
  [data-landing] .roe-step-num { flex: none; width: 26px; height: 26px; border-radius: 999px; background: #43a047; color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 2px; }
  [data-landing] .roe-step b { font-family: 'Geist', sans-serif; font-size: 14.5px; font-weight: 600; color: #16284a; letter-spacing: -0.01em; }
  [data-landing] .roe-step p { margin: 3px 0 0; font-family: 'Geist', sans-serif; font-size: 13px; line-height: 1.5; color: rgba(86,101,122,0.82); }
  [data-landing] .roe-card { border-radius: 24px; overflow: hidden; background: #fff; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 16px 40px rgba(14,42,77,0.1); }
  [data-landing] .roe-inputs { padding: 30px; display: flex; flex-direction: column; gap: 24px; }
  [data-landing] .roe-field-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  [data-landing] .roe-field-label { font-family: 'Geist', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: -0.01em; color: #16284a; }
  [data-landing] .roe-field-val { flex: none; font-family: 'Albert Sans', sans-serif; font-size: 17px; font-weight: 600; letter-spacing: -0.02em; color: #16284a; }
  [data-landing] .roe-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; outline: none; cursor: pointer; }
  [data-landing] .roe-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #43a047; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(14,42,77,0.22); cursor: pointer; }
  [data-landing] .roe-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 999px; background: #43a047; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(14,42,77,0.22); cursor: pointer; }
  [data-landing] .roe-result { padding: 26px 30px 28px; background: #eef3fb; border-top: 1px solid rgba(0,0,0,0.06); }
  [data-landing] .roe-result-top { display: flex; align-items: center; gap: 16px; }
  [data-landing] .roe-big { font-family: 'Albert Sans', sans-serif; font-size: 48px; font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
  [data-landing] .roe-result-meta { display: flex; flex-direction: column; gap: 6px; }
  [data-landing] .roe-result-label { font-family: 'Geist', sans-serif; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(86,101,122,0.65); }
  [data-landing] .roe-verdict { align-self: flex-start; font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: -0.01em; padding: 5px 11px; border-radius: 999px; }
  /* two-bar comparison */
  [data-landing] .roe-bars { margin-top: 20px; display: flex; align-items: flex-end; gap: 18px; height: 96px; }
  [data-landing] .roe-bar-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 7px; height: 100%; }
  [data-landing] .roe-bar { width: 100%; border-radius: 9px 9px 0 0; transition: height 0.5s cubic-bezier(0.22,1,0.36,1); }
  [data-landing] .roe-bar.today { background: #e8edf3; }
  [data-landing] .roe-bar.repos { background: linear-gradient(180deg, #5cc15f, #43a047); }
  [data-landing] .roe-bar-cap { font-family: 'Geist', sans-serif; font-size: 10.5px; font-weight: 600; color: rgba(86,101,122,0.7); text-align: center; }
  [data-landing] .roe-bar-cap b { display: block; font-family: 'Albert Sans', sans-serif; font-size: 14px; color: #16284a; }
  [data-landing] .roe-uplift { flex: none; align-self: stretch; display: flex; flex-direction: column; justify-content: center; padding-left: 4px; }
  [data-landing] .roe-uplift b { font-family: 'Albert Sans', sans-serif; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: #2f7a33; }
  [data-landing] .roe-uplift span { font-family: 'Geist', sans-serif; font-size: 10px; line-height: 1.3; color: rgba(86,101,122,0.7); }
  [data-landing] .roe-compare { margin-top: 18px; padding: 13px 15px; border-radius: 13px; background: rgba(227,241,228,0.5); border: 1px solid rgba(67,160,71,0.28); }
  [data-landing] .roe-compare p { margin: 0; font-family: 'Geist', sans-serif; font-size: 12.5px; line-height: 1.55; letter-spacing: -0.01em; color: #2f7a33; }
  [data-landing] .roe-compare b { font-weight: 700; color: #16284a; }
  [data-landing] .roe-fine { margin: 12px 0 0; font-family: 'Geist', sans-serif; font-size: 11px; line-height: 1.4; color: rgba(86,101,122,0.55); }
  @media (max-width: 880px) {
    [data-landing] .roe-grid { grid-template-columns: 1fr; gap: 36px; }
    [data-landing] .roe-left { max-width: none; }
  }
`;

/* ───────────────────────────── Primitives ───────────────────────────── */

/** A single SVG progress ring. `pct` is 0..1 of the arc that should remain filled. */
function Ring({ pct, size, stroke, color, track = "rgba(67,160,71,0.22)" }: {
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
        <div className="fl-pcard-photo" style={{ backgroundImage: "url(/landing-prop-industrial.jpg)" }} />
        <div className="fl-pcard-name">Cedar Point Industrial</div>
        <div className="fl-pcard-loc">Reno, NV · ~$3.1M</div>
        <div className="fl-pcard-row">
          <span className="fl-live" />
          Hidden until you connect
        </div>
      </div>

      <div className="fl-pcard fl-pcard-detail">
        <div className="fl-match-head">
          <span className="fl-match-ring">
            <Ring pct={0.94} size={54} stroke={5} color="#43a047" track="rgba(67,160,71,0.2)" />
            <span>94</span>
          </span>
          <div className="fl-match-meta">
            <b>Match score</b>
            <i>vs your building</i>
          </div>
        </div>
        <div className="fl-match-rows">
          {HERO_MATCH.map((c) => (
            <div key={c.label} className="fl-match-row">
              <span className="fl-match-check"><Check /></span>
              <span className="fl-match-label">{c.label}</span>
              <span className="fl-match-val">{c.val}</span>
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
                <span className="fl-drift-leg"><i style={{ background: "#16284a" }} />Property value</span>
                <span className="fl-drift-leg"><i style={{ background: "#43a047" }} />Return on equity</span>
              </div>
            </div>
            <svg className="fl-drift-svg" viewBox="0 0 320 170" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="74" x2="320" y2="74" stroke="rgba(22,40,74,0.22)" strokeWidth="1.5" strokeDasharray="4 4" />
              <path className="fl-drift-gap" d="M0,150 L0,150 C90,150 150,150 320,150 L320,118 C150,118 90,140 0,150 Z" fill="rgba(227,241,228,0.55)" />
              <path className="fl-drift-line" style={{ ["--len" as string]: 360 } as CSSProperties} stroke="#16284a" d="M4,150 C80,140 150,96 230,58 C270,40 300,30 316,24" />
              <path className="fl-drift-line" style={{ ["--len" as string]: 340 } as CSSProperties} stroke="#43a047" d="M4,108 C80,110 150,120 230,134 C270,141 300,146 316,150" />
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

function MatchSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        <div data-reveal>
          <span className="fl-eyebrow">How the matching works</span>
          <h2 className="lp-h2 mt-7" style={{ maxWidth: 480 }}>The network finds the buildings that beat what you own now.</h2>
          <p className="fl-sub max-w-[30rem]">
            There's no form where you describe a dream building. Your agent enters the property you own today
            and its numbers, and the network works out the return you're actually earning on your equity. The
            moment it's in, it scans every other owner's building and surfaces the ones that would earn you more
            than what you hold now and that you can afford. You don't search — the better-returning options come
            to you, driven by the math, while you still own what you have and before you commit to anything.
          </p>
          <ul className="fl-mini">
            {MATCH_POINTS.map((p) => (
              <li key={p.title}>
                <i />
                <div><b>{p.title}</b><span>{p.body}</span></div>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal>
          <div className="fl-rep-caption"><span className="fl-live" />Buildings that beat your return</div>
          <div className="fl-rep-feed">
            {MATCH_CARDS.map((c) => (
              <div key={c.name} className={`fl-rep-card${c.hot ? " is-hot" : ""}`}>
                {c.hot ? <span className="fl-rep-flag">New this week</span> : null}
                <div className="fl-rep-top">
                  <div className="fl-rep-thumb" style={{ backgroundImage: `url(${c.photo})` }} />
                  <div className="fl-rep-info">
                    <div className="fl-rep-name">{c.name}</div>
                    <div className="fl-rep-loc">{c.loc} · {c.price}</div>
                    <div className="fl-rep-crit">
                      <span className="fl-rep-pill">{c.ret}</span>
                      <span className="fl-rep-pill"><Check />{c.lift}</span>
                    </div>
                  </div>
                  <span className="fl-rep-ring">
                    <Ring pct={c.score / 100} size={50} stroke={4} color={c.hot ? "#43a047" : "#43a047"} track="rgba(22,40,74,0.08)" />
                    <span>{c.score}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
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
  const numColor = tone === "low" ? "#b8543a" : tone === "mid" ? "#16284a" : "#43a047";
  const verdictStyle =
    tone === "low" ? { background: "rgba(184,84,58,0.12)", color: "#a8482f" }
    : tone === "mid" ? { background: "rgba(22,40,74,0.10)", color: "#16284a" }
    : { background: "rgba(67,160,71,0.14)", color: "#2f7a33" };

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
            <h2>Before you trade up, check the one number most owners miss.</h2>
            <p className="roe-sub">
              Cap rate tells you how the building is doing. Return on equity tells you how your money is doing,
              and it's almost always the smaller, less flattering number. Move the three sliders to see yours.
              Hold it up against a healthy 8% line. Then see what that same money could earn in a stronger
              building, with your full gain still working and no tax taken out.
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
                        style={{ background: `linear-gradient(90deg, #43a047 ${pct}%, #e8edf3 ${pct}%)` }}
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
                        <span>in a matched replacement, tax-deferred</span>
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

function SellSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="The other half of your exchange"
          title="Your building is quietly a match for other owners too."
          sub="Every building in the network belongs to an owner doing exactly what you're doing — they still own it, they haven't sold, and they're looking for their own better-returning replacement. So the moment your agent enters yours, it's automatically surfaced to owners whose money would do better in it. An interested party can be lined up privately, while you still own the building and well before you decide to sell. Nothing is public — names and addresses stay hidden until both sides choose to connect."
          titleMaxWidth={640}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SELL_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="fl-card" data-reveal style={{ ["--reveal-delay" as string]: `${i * 0.06}s` } as CSSProperties}>
                <span className="fl-card-ic"><Icon strokeWidth={1.8} /></span>
                <h3 className="fl-card-title">{card.title}</h3>
                <p className="fl-card-body">{card.body}</p>
              </article>
            );
          })}
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
          <h2>You can't join this network yourself. That's exactly why you can trust it.</h2>
          <p className="fl-aurora-sub">
            Most free property-value sites exist to sell your contact details to the highest bidder. We're
            built the other way around. The deal itself and any fee are handled by a licensed agent — so rather
            than act as one, we simply connect you with one who does these exchanges every day, then step out of
            the way. We make the introduction and we're never part of your deal.
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
                <span className="fl-node-av" style={{ background: "#43a047" }} />
                <span className="fl-node-av" style={{ background: "#5cc1aa" }} />
                <span className="fl-node-av" style={{ background: "#5cc15f" }} />
              </div>
              <span className="fl-node-label" style={{ marginTop: 7 }}>Other owners<i>trading up</i></span>
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
        <span className="fl-mk-label">Your exchange</span>
        <div className="fl-mk-field" style={{ width: "70%" }} />
        <div className="fl-mk-field is-fill" style={{ width: "88%" }} />
        <div className="fl-mk-field" style={{ width: "60%" }} />
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
        <div style={{ marginTop: 9, fontSize: 9, color: "#8794a6" }}>Closes 1031s daily · Greater Boston</div>
      </div>
    );
  }
  return (
    <div className="fl-step-mock">
      <div className="fl-mk-split">
        <div className="fl-mk-half">
          <span className="fl-mk-label">Replacement</span>
          <div className="fl-mk-row is-hot"><span className="fl-mk-score">94</span><span className="fl-mk-bar" /></div>
          <div className="fl-mk-row"><span className="fl-mk-score">88</span><span className="fl-mk-bar" /></div>
        </div>
        <div className="fl-mk-half">
          <span className="fl-mk-label">Your property</span>
          <div className="fl-mk-row"><span className="fl-mk-score">91</span><span className="fl-mk-bar" /></div>
          <div className="fl-mk-row"><span className="fl-mk-score">85</span><span className="fl-mk-bar" /></div>
        </div>
      </div>
    </div>
  );
}

function HowSection() {
  return (
    <section id="how" className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="How it works"
          title="Tell us where you stand. We'll connect you with one vetted agent."
          sub="No account, nothing to list, no agreement, no commitment. Just tell us a little about your situation — the building you own and where you are in your thinking. We match you by hand with one vetted, licensed agent who does 1031 exchanges for a living, and they take it from there at your pace."
          titleMaxWidth={640}
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

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div data-reveal className="text-center">
          <span className="fl-faq-pill"><span className="fl-live" />Free · private · no obligation</span>
          <h2 className="lp-h2 mt-7" style={{ marginInline: "auto", maxWidth: 520 }}>The questions a careful exchanger asks first.</h2>
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
        <MatchSection />
        <RoeCalculator onGetConnected={goToForm} />
        <SellSection />
        <HonestSection />
        <HowSection />
        <FaqSection />

        {/* ── Referral form ── */}
        <section id="referral-form" className="scroll-mt-28 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
          <div className="mx-auto max-w-6xl fl-formcard" data-reveal>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <span className="fl-eyebrow">Get connected</span>
                <h2 className="lp-h2 mt-7" style={{ maxWidth: 380 }}>Tell us about your building, in confidence.</h2>
                <p className="fl-sub max-w-[26rem]">
                  A few fields, about two minutes. Tell us a little about the building you own and where you are
                  in your thinking, and we'll connect you with one vetted, licensed agent who does 1031 exchanges
                  every day. They'll enter your building into the network, surface better-returning options for
                  you, and quietly surface yours to other owners. No listing, no fee, no obligation, and your
                  details stay private.
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
                    <h3>Done. You're in good hands.</h3>
                    <p>
                      We've got your details and we're connecting you now. One vetted, licensed agent who knows
                      your market will reach out to talk through your situation — lining up a better-returning
                      building and, when you're ready, surfacing yours to other owners. At your pace, with no
                      pressure and no obligation.
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
                        your exchange. No fees, no obligation.
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

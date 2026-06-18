import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight, BadgeCheck, CheckCircle2, ChevronDown, EyeOff, Handshake,
  Loader2, Plus, ShieldCheck, Timer, TrendingUp, UserCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  LANDING_BASE_CSS, LandingBackdrop, Pill, inDelay, scrollToId, useLandingMotion,
} from "@/components/landing/landingKit";

/* ───────────────────────────── Content ───────────────────────────── */

const HERO = {
  eyebrow: "For property owners & landlords",
  headline: "Sell your property without ever listing it.",
  subheadline:
    "Our private network is full of 1031 exchange buyers who are legally required to buy a property like yours — soon. Tell us about your property and we'll connect you with a licensed agent who puts it in front of them, off-market.",
};

const WHY_CARDS = [
  {
    icon: Timer,
    stat: "180 days",
    title: "Our buyers are legally on the clock.",
    body: "Every buyer in the network is completing a 1031 exchange — the IRS gives them 45 days to identify a property and 180 to close. They aren't browsing. They have to buy.",
  },
  {
    icon: EyeOff,
    stat: "Off-market",
    title: "Sell without telling the world.",
    body: "No listing photos circulating, no tire-kickers touring your building, no tenants or competitors wondering what's going on. Your property is shown only to buyers it actually fits.",
  },
  {
    icon: TrendingUp,
    stat: "Equity in hand",
    title: "These buyers bring real money.",
    body: "1031 buyers are re-investing proceeds from a property they already sold. The equity is sitting in escrow waiting to be deployed — not a maybe-loan, not a lowball.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us about your property",
    body: "Two minutes, six fields, no obligation. Location, property type, and a rough value is all we need to get started.",
  },
  {
    step: "02",
    title: "We pair you with a licensed agent",
    body: "We match you with a vetted agent from our network who knows your market and works with 1031 buyers every day. They'll reach out to talk through your goals.",
  },
  {
    step: "03",
    title: "Your property meets motivated buyers",
    body: "Your agent lists the property privately on the network, where it's automatically scored against every active buyer's requirements. You stay in control the whole way.",
  },
] as const;

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Why we work through agents",
    body: "Real estate law only lets licensed agents transact and collect referral fees — so our network is agents-only. Instead of signing you up, we connect you with a professional who can actually close.",
  },
  {
    icon: UserCheck,
    title: "Vetted, not random",
    body: "Every agent in the network is licensed and verified. The one we refer you to works your market and your property type — not whoever paid for the lead.",
  },
  {
    icon: Handshake,
    title: "You're never locked in",
    body: "Talking to the agent we connect you with is free and commitment-free. You decide if, when, and how your property goes in front of the network.",
  },
] as const;

const FORM_BENEFITS = [
  "Free for property owners — no fees, ever",
  "No obligation to list or sell",
  "Your details stay private",
] as const;

const PROPERTY_TYPES = [
  "Multifamily",
  "Retail",
  "Office",
  "Industrial",
  "Mixed-use",
  "Land",
  "Other",
] as const;

/* Hero visual — a small off-market property card with a "matched buyers"
   detail card overhanging it, mirroring the homepage's layered hero cards. */
const HERO_BUYERS = [
  { name: "Cash buyer · office → retail", clock: "42 days left", hot: true, color: "#cf877b" },
  { name: "1031 buyer · multifamily", clock: "68 days left", hot: false, color: "#7ea7bd" },
] as const;

/* ───────────────────────────── Styles ───────────────────────────── */

const FL_STYLE = `
  /* Yellow section eyebrow (matches the homepage section eyebrows) */
  [data-landing] .fl-eyebrow {
    display: inline-block; font-family: 'Geist', sans-serif; font-size: 11px;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
    color: #8a6d12; background: #fef7af; padding: 7px 13px; border-radius: 999px; line-height: 1;
  }
  [data-landing] .fl-sub {
    margin: 18px 0 0; font-family: 'Geist', sans-serif; font-size: 16px; font-weight: 400;
    line-height: 1.55; letter-spacing: -0.02em; color: rgba(86,82,75,0.86);
  }

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

  [data-landing] .fl-pcard-detail { position: absolute; right: -3%; bottom: 0; width: 62%; border-radius: 18px; padding: 14px; transform: rotate(5deg); background: rgba(255,255,255,0.94); }
  [data-landing] .fl-detail-head { display: flex; align-items: center; gap: 10px; }
  [data-landing] .fl-detail-big { font-family: 'Albert Sans', sans-serif; font-size: 30px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; color: #1d1d1d; }
  [data-landing] .fl-detail-head b { display: block; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; }
  [data-landing] .fl-detail-head span { display: block; font-size: 10px; color: #8a847b; margin-top: 1px; }
  [data-landing] .fl-buyers { margin-top: 12px; display: flex; flex-direction: column; gap: 7px; }
  [data-landing] .fl-buyer { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 11px; background: #f6f3ed; }
  [data-landing] .fl-buyer.is-hot { background: #fbeaa0; }
  [data-landing] .fl-buyer-av { width: 20px; height: 20px; border-radius: 999px; flex: none; }
  [data-landing] .fl-buyer-main { flex: 1; min-width: 0; }
  [data-landing] .fl-buyer-name { font-size: 9.5px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-landing] .fl-buyer-clock { font-size: 8.5px; font-weight: 600; color: #8a6d12; margin-top: 1px; }
  [data-landing] .fl-buyer.is-hot .fl-buyer-clock { color: #8a6d12; }

  /* ── Soft cards (Why / How) ── */
  [data-landing] .fl-card {
    display: flex; flex-direction: column; height: 100%; border-radius: 24px;
    background: #faf8f4; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 8px 20px rgba(104,99,80,0.15); padding: 28px;
  }
  [data-landing] .fl-card-top { display: flex; align-items: center; justify-content: space-between; }
  [data-landing] .fl-card-ic { width: 44px; height: 44px; border-radius: 999px; background: #f1ece3; color: #1d1d1d; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-card-ic svg { width: 21px; height: 21px; }
  [data-landing] .fl-stat { font-family: 'Geist', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: -0.01em; color: #8a6d12; background: #fef7af; padding: 6px 12px; border-radius: 999px; }
  [data-landing] .fl-card-title { margin-top: 22px; font-family: 'Albert Sans', sans-serif; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #1a1a1a; }
  [data-landing] .fl-card-body { margin-top: 12px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.55; letter-spacing: -0.01em; color: rgba(86,82,75,0.86); }

  [data-landing] .fl-step {
    height: 100%; border-radius: 24px; background: #faf8f4; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 8px 20px rgba(104,99,80,0.12); padding: 28px;
  }
  [data-landing] .fl-step-num { font-family: 'Albert Sans', sans-serif; font-size: 40px; font-weight: 500; line-height: 1; letter-spacing: -0.05em; color: #e3ddd0; }
  [data-landing] .fl-step-title { margin-top: 16px; font-family: 'Albert Sans', sans-serif; font-size: 19px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.2; color: #1a1a1a; }
  [data-landing] .fl-step-body { margin-top: 10px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.55; color: rgba(86,82,75,0.86); }

  /* ── Dark aurora panel (the honest part) ── */
  [data-landing] .fl-aurora {
    position: relative; overflow: hidden; border-radius: 32px; padding: 64px 44px;
    background:
      radial-gradient(ellipse 52% 62% at 72% 50%, rgba(178,74,40,0.42) 0%, rgba(178,74,40,0) 62%),
      radial-gradient(ellipse 48% 58% at 50% 88%, rgba(74,128,86,0.4) 0%, rgba(74,128,86,0) 60%),
      radial-gradient(ellipse 42% 52% at 88% 80%, rgba(128,60,120,0.4) 0%, rgba(128,60,120,0) 60%),
      radial-gradient(ellipse 42% 48% at 14% 90%, rgba(150,36,12,0.5) 0%, rgba(150,36,12,0) 58%),
      linear-gradient(180deg, #3a4a50 0%, #313f44 55%, #27343a 100%);
    border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 20px 50px rgba(20,28,32,0.18);
  }
  [data-landing] .fl-aurora-eyebrow { display: inline-block; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.82); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); padding: 7px 13px; border-radius: 999px; line-height: 1; }
  [data-landing] .fl-aurora h2 { margin: 18px 0 0; max-width: 600px; font-family: 'Albert Sans', sans-serif; font-size: clamp(28px,3.6vw,42px); font-weight: 400; letter-spacing: -0.04em; line-height: 1.05; color: #fff; }
  [data-landing] .fl-aurora-ic { width: 44px; height: 44px; border-radius: 14px; background: #fadc6a; color: #1d1d1d; display: inline-flex; align-items: center; justify-content: center; }
  [data-landing] .fl-aurora-ic svg { width: 21px; height: 21px; }
  [data-landing] .fl-aurora-title { margin-top: 16px; font-family: 'Albert Sans', sans-serif; font-size: 19px; font-weight: 500; letter-spacing: -0.03em; color: #fff; }
  [data-landing] .fl-aurora-body { margin-top: 10px; font-family: 'Geist', sans-serif; font-size: 14.5px; line-height: 1.55; color: rgba(255,255,255,0.62); }

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
  [data-landing] .fl-input:focus, [data-landing] .fl-select:focus { border-color: #74cfe6; background: #fff; box-shadow: 0 0 0 3px rgba(116,207,230,0.18); }
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
  [data-landing] .fl-done p { margin: 10px 0 0; max-width: 360px; font-family: 'Geist', sans-serif; font-size: 14px; line-height: 1.55; color: #365339; }

  @media (min-width: 640px) {
    [data-landing] .fl-formcard { padding: 44px; }
    [data-landing] .fl-form-foot { flex-direction: row; align-items: flex-end; justify-content: space-between; }
  }
  @media (max-width: 860px) {
    [data-landing] .fl-aurora { padding: 40px 26px; border-radius: 26px; }
  }
`;

/* ── Equity / ROE calculator — landlord lead magnet, mirrors the homepage's
   two-column "left heading + CTA + numbered steps / right calculator" layout. */
const ROE_STYLE = `
  [data-landing] .roe { width: min(1040px, 100%); margin: 0 auto; }
  [data-landing] .roe-grid { display: grid; grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr); gap: 56px; align-items: center; }
  [data-landing] .roe-left { max-width: 440px; }
  [data-landing] .roe-eyebrow { display: inline-block; font-family: 'Geist', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #8a6d12; background: #fef7af; padding: 7px 13px; border-radius: 999px; line-height: 1; }
  [data-landing] .roe-left .roe-eyebrow { margin-bottom: 16px; }
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
  [data-landing] .roe-left[data-reveal].is-visible > *:nth-child(6) { animation-delay: 0.24s; }
  [data-landing] .roe-right[data-reveal].is-visible { animation: roeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.12s; }
  @media (prefers-reduced-motion: reduce) {
    [data-landing] .roe-left[data-reveal].is-visible > *, [data-landing] .roe-right[data-reveal].is-visible { animation: none; }
  }

  @media (max-width: 880px) {
    [data-landing] .roe-grid { grid-template-columns: 1fr; gap: 36px; }
    [data-landing] .roe-left { max-width: none; }
  }
`;

/* ───────────────────────────── Sections ───────────────────────────── */

function SectionHead({
  eyebrow, title, sub, align = "left", titleMaxWidth,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  titleMaxWidth?: number;
}) {
  return (
    <div data-reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="fl-eyebrow">{eyebrow}</span>
      <h2
        className="lp-h2 mt-5"
        style={titleMaxWidth ? ({ maxWidth: titleMaxWidth, ...(align === "center" ? { marginInline: "auto" } : {}) } as CSSProperties) : undefined}
      >
        {title}
      </h2>
      {sub ? <p className="fl-sub">{sub}</p> : null}
    </div>
  );
}

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
              <span className="fl-buyer-av" style={{ background: b.color }} />
              <div className="fl-buyer-main">
                <div className="fl-buyer-name">{b.name}</div>
                <div className="fl-buyer-clock">{b.clock}</div>
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
          <h1 className="lp-in max-w-[460px]" style={inDelay(0.08)}>{HERO.headline}</h1>
          <p className="lp-sub lp-in mt-6 max-w-[31rem]" style={inDelay(0.16)}>{HERO.subheadline}</p>

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

function WhySection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Why owners choose this"
          title="Better than putting up a sign."
          sub="A public listing tells everyone your property is for sale. The network shows it only to buyers who are already committed to buying — quietly, and on a deadline."
          titleMaxWidth={560}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {WHY_CARDS.map((card, i) => (
            <article key={card.title} className="fl-card" data-reveal style={{ ["--reveal-delay" as string]: `${i * 0.06}s` } as CSSProperties}>
              <div className="fl-card-top">
                <span className="fl-card-ic"><card.icon strokeWidth={1.9} /></span>
                <span className="fl-stat">{card.stat}</span>
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

function HowSection() {
  return (
    <section id="how" className="scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="How it works"
          title="From a 2-minute form to motivated buyers."
          titleMaxWidth={560}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="fl-step" data-reveal style={{ ["--reveal-delay" as string]: `${i * 0.06}s` } as CSSProperties}>
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

function TrustSection() {
  return (
    <section className="px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="fl-aurora" data-reveal>
          <span className="fl-aurora-eyebrow">The honest part</span>
          <h2>You can't join the network. That's the point.</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <span className="fl-aurora-ic"><point.icon strokeWidth={1.9} /></span>
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

const ROE_STEPS = [
  "See your property's real return on equity",
  "Compare it to the ~8% our network averages",
  "Trade up, tax-deferred, into a stronger property",
];

function RoeCalculator({ onGetConnected }: { onGetConnected: () => void }) {
  const [value, setValue] = useState(2000000);
  const [loan, setLoan] = useState(750000);
  const [cashflow, setCashflow] = useState(82000);

  const PLATFORM = 8; // average return on equity on the platform (%)
  const equity = Math.max(0, value - loan);
  const roe = equity > 0 ? (cashflow / equity) * 100 : 0;
  const potential = equity * (PLATFORM / 100);
  const uplift = potential - cashflow;

  const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const tone = roe < 5 ? "low" : roe < 8 ? "mid" : "high";
  const verdictText = roe < 5 ? "Equity underperforming" : roe < 8 ? "Below the ~8% average" : "Beating the average";
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
    <section id="equity-check" className="px-5 py-16 sm:px-8 sm:py-24">
      <div className="roe">
        <div className="roe-grid">
          <div className="roe-left" data-reveal>
            <span className="roe-eyebrow">Equity check</span>
            <h2>Is your property's equity working hard enough?</h2>
            <p className="roe-sub">
              Check your property's return on equity in seconds — then see how much more it could
              earn if you sold and reinvested through a 1031 exchange, off-market.
            </p>
            <div className="roe-cta"><Pill onClick={onGetConnected} primary>Get connected with an agent</Pill></div>
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
                    <p>Properties bought through our network average <b>~8% ROE</b>. Your {usd(equity)} of equity could be earning about <b>{usd(potential)}/yr</b> — roughly <b>{usd(uplift)} more</b> than it is today.</p>
                  ) : (
                    <p>You're already at or above the <b>~8%</b> our network averages — nicely done. When you're ready to trade up tax-deferred, we'll connect you with an agent.</p>
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
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  propertyLocation: "",
  propertyType: "",
  estimatedValue: "",
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
      toast({
        title: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (ownerName.length > 120 || ownerPhone.length > 40 || propertyLocation.length > 160) {
      toast({
        title: "One of your entries is too long.",
        variant: "destructive",
      });
      return;
    }

    // "$2,500,000" / "2.5m" / "2500000" all become a number; anything else is dropped
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
        <WhySection />
        <HowSection />
        <TrustSection />
        <RoeCalculator onGetConnected={goToForm} />

        {/* ── Referral form ── */}
        <section id="referral-form" className="scroll-mt-28 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
          <div className="mx-auto max-w-6xl fl-formcard" data-reveal>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div>
                <span className="fl-eyebrow">Get started</span>
                <h2 className="lp-h2 mt-5" style={{ maxWidth: 360 }}>Tell us about your property.</h2>
                <p className="fl-sub max-w-[26rem]">
                  We'll review your details and connect you with a licensed agent in our network
                  who knows your market — usually within one business day.
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
                    <h3>You're in good hands.</h3>
                    <p>
                      Thanks — we've received your property details. An agent from our network
                      will reach out within one business day to talk through your options.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-name">Your Name <span className="req">*</span></label>
                        <input
                          id="ref-name"
                          className="fl-input"
                          value={formState.ownerName}
                          onChange={(e) => updateField("ownerName", e.target.value)}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-email">Email <span className="req">*</span></label>
                        <input
                          id="ref-email"
                          type="email"
                          className="fl-input"
                          value={formState.ownerEmail}
                          onChange={(e) => updateField("ownerEmail", e.target.value)}
                          placeholder="jane@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-phone">Phone Number</label>
                        <input
                          id="ref-phone"
                          type="tel"
                          className="fl-input"
                          value={formState.ownerPhone}
                          onChange={(e) => updateField("ownerPhone", e.target.value)}
                          placeholder="(555) 000-0000"
                        />
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-location">Property Location</label>
                        <input
                          id="ref-location"
                          className="fl-input"
                          value={formState.propertyLocation}
                          onChange={(e) => updateField("propertyLocation", e.target.value)}
                          placeholder="City, State"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="fl-field">
                        <label htmlFor="ref-type">Property Type</label>
                        <div className="fl-select-wrap">
                          <select
                            id="ref-type"
                            className="fl-select"
                            value={formState.propertyType}
                            onChange={(e) => updateField("propertyType", e.target.value)}
                          >
                            <option value="">Select a type</option>
                            {PROPERTY_TYPES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <ChevronDown className="fl-select-chev" />
                        </div>
                      </div>
                      <div className="fl-field">
                        <label htmlFor="ref-value">Estimated Value</label>
                        <input
                          id="ref-value"
                          className="fl-input"
                          value={formState.estimatedValue}
                          onChange={(e) => updateField("estimatedValue", e.target.value)}
                          placeholder="e.g. $2,500,000"
                        />
                      </div>
                    </div>

                    <div className="fl-form-foot">
                      <p className="fl-fine">
                        By submitting, you agree that a licensed agent from our network may contact
                        you about your property. No fees, no obligation.
                      </p>
                      <button type="submit" className="fl-submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="fl-submit-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            Connect me with an agent
                            <span className="fl-submit-arrow"><ArrowRight /></span>
                          </>
                        )}
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

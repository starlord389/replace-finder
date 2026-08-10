import { FormEvent, useState } from "react";
import {
  Pencil, Link2, Plus,
  Calendar, ChevronDown, Share2, LayoutGrid, Paperclip, Lightbulb,
  Building2, Target, Activity, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UPCOMING_EVENT } from "@/content/events";


/* AUTO-ASSEMBLED landing sections (navy+green brand). Person/expert photos are placeholders. */

export const SECTIONS_CSS = "[data-nb] .nb-prob-line{color:#43a047;font-weight:800;font-size:18px;letter-spacing:-.01em;margin-top:22px}\n[data-nb] .nb-prob-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}\n[data-nb] .nb-prob-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}\n[data-nb] .nb-prob-ico{width:62px;height:62px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e8edf3;box-shadow:0 2px 12px rgba(14,42,77,.06)}\n[data-nb] .nb-prob-ico svg{width:34px;height:34px;stroke:#16284a;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}\n[data-nb] .nb-prob-label{font-size:13px;line-height:1.45;color:#56657a;font-weight:600;max-width:140px}\n@media (max-width:900px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr);gap:28px 16px}\n}\n@media (max-width:480px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr)}\n}\n\n[data-nb] #meet{background:linear-gradient(135deg,#eef3fb,#e3edf8);}\n[data-nb] .nb-meet-btn{display:inline-flex;align-items:center;gap:12px;height:54px;padding:0 26px;border-radius:12px;background:#43a047;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.01em;border:none;cursor:pointer;box-shadow:0 8px 22px rgba(67,160,71,.22);transition:background .15s ease,transform .15s ease,box-shadow .15s ease;}\n[data-nb] .nb-meet-btn:hover{background:#3a8c3e;transform:translateY(-1px);box-shadow:0 12px 28px rgba(67,160,71,.28);}\n[data-nb] .nb-meet-play{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}\n[data-nb] .nb-meet-flow{display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:6px;}\n[data-nb] .nb-meet-step{display:flex;flex-direction:column;align-items:center;text-align:center;width:124px;}\n[data-nb] .nb-meet-circle{width:96px;height:96px;border-radius:50%;background:#fff;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(14,42,77,.08);}\n[data-nb] .nb-meet-circle svg{width:38px;height:38px;}\n[data-nb] .nb-meet-circle-done{border-color:#cdeccf;background:#f3faf3;}\n[data-nb] .nb-meet-label{margin-top:14px;font-size:13.5px;font-weight:700;color:#16284a;letter-spacing:-.01em;line-height:1.3;}\n[data-nb] .nb-meet-arrow{align-self:center;margin-top:34px;color:#9fb0c8;font-size:24px;font-weight:400;line-height:1;flex-shrink:0;}\n@media (max-width:1100px){\n[data-nb] .nb-meet-arrow{display:none;}\n[data-nb] .nb-meet-flow{gap:24px 18px;}\n}\n\n[data-nb] .nb-how-flow{margin-top:28px;display:flex;justify-content:center;gap:24px 32px;max-width:980px;margin-left:auto;margin-right:auto}\n[data-nb] .nb-how-step{flex:1 1 0;min-width:200px;display:flex;flex-direction:column;align-items:center;text-align:center}\n[data-nb] .nb-how-step-top{position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:18px}\n[data-nb] .nb-how-step-num{position:absolute;top:-4px;right:-4px;width:24px;height:24px;border-radius:50%;background:#43a047;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.08)}\n[data-nb] .nb-how-step-icon{width:80px;height:80px;border-radius:50%;background:#f9fafb;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;color:#43a047;box-shadow:0 2px 10px rgba(0,0,0,.05)}\n[data-nb] .nb-how-step-icon svg{width:32px;height:32px;stroke-width:1.5}\n[data-nb] .nb-how-step-title{font-size:17px;font-weight:700;color:#16284a;letter-spacing:-.02em;margin-bottom:6px}\n[data-nb] .nb-how-step-desc{font-size:14px;line-height:1.55;color:#56657a;max-width:200px}\n@media (max-width:900px){\n[data-nb] .nb-how-flow{gap:16px 20px}\n[data-nb] .nb-how-step{min-width:160px}\n[data-nb] .nb-how-step-icon{width:72px;height:72px}\n[data-nb] .nb-how-step-icon svg{width:28px;height:28px}\n}\n@media (max-width:640px){\n[data-nb] .nb-how-flow{display:grid;grid-template-columns:1fr;gap:24px 0;overflow:visible;padding-bottom:0}\n[data-nb] .nb-how-step{flex:none;min-width:auto;max-width:100%;width:100%;align-items:center;padding:0 6px}\n[data-nb] .nb-how-step-icon{width:60px;height:60px}\n[data-nb] .nb-how-step-icon svg{width:26px;height:26px}\n[data-nb] .nb-how-step-desc{max-width:160px;font-size:13.5px}\n}\n\n[data-nb] #who { background: #ffffff; }\n\n[data-nb] .nb-who-head {\n  text-align: center;\n  max-width: 720px;\n  margin: 0 auto 56px;\n}\n[data-nb] .nb-who-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 24px;\n}\n@media (max-width: 900px) {\n  [data-nb] .nb-who-grid { grid-template-columns: 1fr; }\n}\n\n[data-nb] .nb-who-card {\n  border-radius: 16px;\n  padding: 28px;\n  display: flex;\n  flex-direction: column;\n  border: 1px solid #e8edf3;\n  box-shadow: 0 2px 12px rgba(14,42,77,.06);\n  transition: transform .18s ease, box-shadow .18s ease;\n}\n[data-nb] .nb-who-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 28px rgba(14,42,77,.10);\n}\n[data-nb] .nb-who-card--blue   { background: #eff4fb; }\n[data-nb] .nb-who-card--green  { background: #eef6ef; }\n[data-nb] .nb-who-card--orange { background: #fbf3ea; }\n\n[data-nb] .nb-who-icon {\n  width: 56px;\n  height: 56px;\n  border-radius: 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin-bottom: 20px;\n  background: #ffffff;\n  box-shadow: 0 2px 10px rgba(14,42,77,.07);\n}\n[data-nb] .nb-who-icon svg { width: 28px; height: 28px; }\n[data-nb] .nb-who-card--blue   .nb-who-icon svg { color: #2f6fd0; }\n[data-nb] .nb-who-card--green  .nb-who-icon svg { color: #43a047; }\n[data-nb] .nb-who-card--orange .nb-who-icon svg { color: #e08a2b; }\n\n[data-nb] .nb-who-title {\n  font-weight: 800;\n  font-size: 22px;\n  letter-spacing: -.02em;\n  color: #16284a;\n  margin: 0 0 18px;\n}\n\n[data-nb] .nb-who-list {\n  list-style: none;\n  margin: 0 0 26px;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n[data-nb] .nb-who-li {\n  display: flex;\n  align-items: center;\n  gap: 11px;\n  font-size: 15.5px;\n  color: #56657a;\n  line-height: 1.4;\n}\n[data-nb] .nb-who-check {\n  flex: none;\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n  background: #43a047;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n[data-nb] .nb-who-check svg { width: 12px; height: 12px; color: #ffffff; }\n\n[data-nb] .nb-who-link {\n  margin-top: auto;\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  font-weight: 700;\n  font-size: 15px;\n  color: #16284a;\n  text-decoration: none;\n  letter-spacing: -.01em;\n  transition: color .15s ease, gap .15s ease;\n}\n[data-nb] .nb-who-link:hover {\n  color: #43a047;\n  gap: 11px;\n}\n[data-nb] .nb-who-link span { transition: transform .15s ease; }\n\n[data-nb] .nb-why-wrap{background:linear-gradient(160deg,#13294e 0%,#0e2a4d 100%);border-radius:28px;color:#fff;}\n[data-nb] .nb-why-h2{font-size:clamp(28px,3.4vw,42px);font-weight:800;line-height:1.1;letter-spacing:-.02em;color:#fff;margin:0 0 28px;}\n[data-nb] .nb-why-h2 .nb-why-up{color:#5cc15f;}\n[data-nb] .nb-why-list{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;}\n@media (max-width:640px){[data-nb] .nb-why-list{grid-template-columns:1fr;}}\n[data-nb] .nb-why-item{display:flex;align-items:flex-start;gap:12px;}\n[data-nb] .nb-why-check{flex:0 0 24px;width:24px;height:24px;border-radius:7px;background:rgba(92,193,95,.16);display:flex;align-items:center;justify-content:center;margin-top:1px;}\n[data-nb] .nb-why-check svg{display:block;}\n[data-nb] .nb-why-item span{font-size:16px;font-weight:600;color:#eaf1fb;line-height:1.35;}\n[data-nb] .nb-why-card{background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(8,22,45,.35);padding:34px 32px;}\n@media (max-width:640px){[data-nb] .nb-why-card{padding:26px 22px;}}\n[data-nb] .nb-why-card-title{font-size:23px;font-weight:800;letter-spacing:-.02em;color:#16284a;text-align:center;line-height:1.2;margin:0 0 10px;}\n[data-nb] .nb-why-card-sub{font-size:14px;color:#56657a;text-align:center;line-height:1.55;margin:0 auto 26px;max-width:380px;}\n[data-nb] .nb-why-inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:22px;}\n@media (max-width:560px){[data-nb] .nb-why-inputs{grid-template-columns:1fr;}}\n[data-nb] .nb-why-field{display:flex;flex-direction:column;gap:7px;}\n[data-nb] .nb-why-label{font-size:12.5px;font-weight:700;color:#16284a;letter-spacing:-.01em;}\n[data-nb] .nb-why-input{position:relative;display:flex;align-items:center;border:1px solid #e8edf3;border-radius:10px;background:#fff;height:48px;padding:0 12px;transition:border-color .15s,box-shadow .15s;}\n[data-nb] .nb-why-input:focus-within{border-color:#43a047;box-shadow:0 0 0 3px rgba(67,160,71,.14);}\n[data-nb] .nb-why-input .nb-why-dollar{color:#56657a;font-weight:700;font-size:15px;margin-right:4px;}\n[data-nb] .nb-why-input input{border:0;outline:0;width:100%;font-family:inherit;font-size:15px;font-weight:700;color:#16284a;background:transparent;}\n[data-nb] .nb-why-calc{width:100%;height:50px;border:0;border-radius:10px;background:#43a047;color:#fff;font-family:inherit;font-size:16px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:background .15s;}\n[data-nb] .nb-why-calc:hover{background:#3a8c3e;}\n\n[data-nb] .nb-diff-wrap{display:grid;grid-template-columns:1fr;gap:56px;align-items:center}\n@media(min-width:980px){[data-nb] .nb-diff-wrap{grid-template-columns:1fr 1.05fr;gap:64px}}\n\n/* ---- LEFT: device mockup ---- */\n[data-nb] .nb-diff-devices{position:relative;width:100%;max-width:540px;margin:0 auto;aspect-ratio:5/4}\n[data-nb] .nb-diff-glow{position:absolute;inset:8% 6%;background:radial-gradient(60% 60% at 40% 35%,rgba(67,160,71,.16),rgba(238,243,251,0) 70%);filter:blur(8px);z-index:0}\n\n/* laptop */\n[data-nb] .nb-diff-laptop{position:absolute;top:6%;left:0;width:84%;z-index:1;filter:drop-shadow(0 18px 40px rgba(14,42,77,.16))}\n[data-nb] .nb-diff-laptop-screen{background:#fff;border:1px solid #e8edf3;border-radius:14px 14px 4px 4px;padding:14px;border-bottom:none}\n[data-nb] .nb-diff-laptop-bar{display:flex;gap:6px;margin-bottom:14px}\n[data-nb] .nb-diff-dot{width:9px;height:9px;border-radius:50%;background:#dfe6f0}\n[data-nb] .nb-diff-dot.g{background:#cfe4d0}\n[data-nb] .nb-diff-laptop-base{height:14px;background:linear-gradient(#eef3fb,#dde6f1);border:1px solid #e8edf3;border-top:none;border-radius:0 0 12px 12px;margin:0 -2px;position:relative}\n[data-nb] .nb-diff-laptop-base::after{content:\"\";position:absolute;top:0;left:50%;transform:translateX(-50%);width:26%;height:5px;background:#cdd8e6;border-radius:0 0 6px 6px}\n\n/* phone */\n[data-nb] .nb-diff-phone{position:absolute;right:-2%;bottom:-2%;width:34%;z-index:2;background:#fff;border:1px solid #e8edf3;border-radius:22px;padding:10px;filter:drop-shadow(0 16px 34px rgba(14,42,77,.20))}\n[data-nb] .nb-diff-phone-notch{width:34%;height:5px;background:#dfe6f0;border-radius:6px;margin:2px auto 12px}\n\n/* mock rows shared */\n[data-nb] .nb-diff-mock-row{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #eef3fb;border-radius:9px;margin-bottom:8px;background:#fbfdff}\n[data-nb] .nb-diff-mock-thumb{width:34px;height:34px;border-radius:7px;background:linear-gradient(135deg,#e7eef8,#dde7f3);flex:none}\n[data-nb] .nb-diff-mock-lines{flex:1;display:flex;flex-direction:column;gap:6px}\n[data-nb] .nb-diff-ml{height:7px;border-radius:4px;background:#e3eaf4}\n[data-nb] .nb-diff-ml.short{width:55%}\n[data-nb] .nb-diff-ml.tiny{width:32%;background:#cfe4d0}\n[data-nb] .nb-diff-mock-pill{width:30px;height:14px;border-radius:7px;background:#e6f2e7;flex:none}\n[data-nb] .nb-diff-phone .nb-diff-mock-row{padding:7px;margin-bottom:6px}\n[data-nb] .nb-diff-phone .nb-diff-mock-thumb{width:26px;height:26px}\n\n/* ---- RIGHT: comparison table ---- */\n[data-nb] .nb-diff-table{border:1px solid #e8edf3;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(14,42,77,.06);background:#fff}\n[data-nb] .nb-diff-thead{display:grid;grid-template-columns:1fr 1fr}\n[data-nb] .nb-diff-th{display:flex;align-items:center;gap:10px;padding:18px 20px;font-weight:800;font-size:15px;letter-spacing:-.01em;color:#fff}\n[data-nb] .nb-diff-th.trad{background:#16284a}\n[data-nb] .nb-diff-th.us{background:#43a047}\n[data-nb] .nb-diff-badge{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}\n[data-nb] .nb-diff-badge.x{background:rgba(255,255,255,.14)}\n[data-nb] .nb-diff-badge.c{background:rgba(255,255,255,.22)}\n\n[data-nb] .nb-diff-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eef3fb}\n[data-nb] .nb-diff-cell{padding:16px 20px;font-size:14.5px;display:flex;align-items:center;gap:10px;min-height:60px}\n[data-nb] .nb-diff-cell.left{color:#8794a6;border-right:1px solid #eef3fb}\n[data-nb] .nb-diff-cell.right{color:#16284a;font-weight:600}\n[data-nb] .nb-diff-cell.right svg{flex:none}\n[data-nb] .nb-diff-cell.left svg{flex:none;opacity:.6}\n@media(max-width:520px){\n [data-nb] .nb-diff-cell{padding:13px 14px;font-size:13.5px}\n [data-nb] .nb-diff-th{padding:15px;font-size:14px}\n}\n\n[data-nb] .nb-res-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}\n@media (max-width:980px){[data-nb] .nb-res-grid{grid-template-columns:1fr}}\n\n[data-nb] .nb-res-card{background:#fff;border:1px solid #e8edf3;border-radius:14px;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:32px;display:flex;flex-direction:column}\n[data-nb] .nb-res-title{font-size:20px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin:0 0 20px}\n\n[data-nb] .nb-res-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}\n[data-nb] .nb-res-li{display:flex;align-items:flex-start;gap:12px;font-size:15px;color:#56657a;line-height:1.4}\n[data-nb] .nb-res-li svg{flex:0 0 auto;margin-top:1px}\n[data-nb] .nb-res-li strong{color:#16284a;font-weight:700}\n[data-nb] .nb-res-link{margin-top:24px;font-size:15px;font-weight:700;color:#43a047;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:color .15s}\n[data-nb] .nb-res-link:hover{color:#3a8c3e}\n\n[data-nb] .nb-res-experts{display:flex;flex-direction:column;gap:18px}\n[data-nb] .nb-res-expert{display:flex;align-items:center;gap:14px}\n[data-nb] .nb-res-avatar{flex:0 0 auto;width:52px;height:52px;border-radius:50%;background:#eef3fb;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#16284a;letter-spacing:-.01em}\n[data-nb] .nb-res-ename{font-size:15px;font-weight:700;color:#16284a;line-height:1.3}\n[data-nb] .nb-res-erole{font-size:13px;color:#56657a;margin-top:2px}\n\n[data-nb] .nb-res-dark{background:#0e2a4d;border-color:#0e2a4d;box-shadow:0 12px 32px rgba(14,42,77,.22)}\n[data-nb] .nb-res-dark .nb-res-title{color:#fff}\n[data-nb] .nb-res-clist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:13px}\n[data-nb] .nb-res-cli{display:flex;align-items:center;gap:12px;font-size:15px;color:#d8e2f0;line-height:1.35}\n[data-nb] .nb-res-check{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:rgba(92,193,95,.16);display:flex;align-items:center;justify-content:center}\n[data-nb] .nb-res-dark .nb-res-btn{margin-top:26px;width:100%;justify-content:center}\n[data-nb] .nb-res-cap{margin-top:14px;text-align:center;font-size:13px;font-weight:700;color:#5cc15f;letter-spacing:.01em}\n\n/* ===== FAQ + CTA + FOOTER ===== */\n[data-nb] .nb-fct-wrap{ display:flex; flex-direction:column; gap:0; }\n\n/* (A) heading */\n[data-nb] .nb-fct-head{ text-align:center; max-width:760px; margin:0 auto; }\n\n/* (B) accordion */\n[data-nb] .nb-fct-acc{ max-width:840px; margin:40px auto 0; display:flex; flex-direction:column; gap:14px; }\n[data-nb] .nb-fct-item{\n  background:#fff; border:1px solid #e8edf3; border-radius:14px;\n  box-shadow:0 2px 12px rgba(14,42,77,.06); overflow:hidden;\n  transition:border-color .2s ease, box-shadow .2s ease;\n}\n[data-nb] .nb-fct-item[open]{ border-color:#d4e4d5; box-shadow:0 6px 22px rgba(14,42,77,.09); }\n[data-nb] .nb-fct-q{\n  list-style:none; cursor:pointer; display:flex; align-items:center;\n  justify-content:space-between; gap:18px; padding:22px 26px;\n  font-weight:800; font-size:17px; color:#16284a; letter-spacing:-.01em;\n  user-select:none;\n}\n[data-nb] .nb-fct-q::-webkit-details-marker{ display:none; }\n[data-nb] .nb-fct-q:hover{ color:#0e2a4d; }\n[data-nb] .nb-fct-plus{\n  flex:0 0 auto; width:30px; height:30px; border-radius:8px;\n  background:#eef3fb; display:flex; align-items:center; justify-content:center;\n  color:#43a047; transition:transform .25s ease, background .2s ease;\n}\n[data-nb] .nb-fct-item[open] .nb-fct-plus{ transform:rotate(45deg); background:#e3f1e4; }\n[data-nb] .nb-fct-plus svg{ width:16px; height:16px; display:block; }\n[data-nb] .nb-fct-a{\n  padding:0 26px 24px; color:#56657a; font-size:15.5px; line-height:1.65; max-width:680px;\n}\n[data-nb] .nb-fct-viewall{ text-align:center; margin-top:30px; }\n[data-nb] .nb-fct-viewall a{\n  color:#43a047; font-weight:700; font-size:15px; text-decoration:none;\n  display:inline-flex; align-items:center; gap:7px; transition:gap .2s ease, color .2s ease;\n}\n[data-nb] .nb-fct-viewall a:hover{ gap:11px; color:#3a8c3e; }\n\n/* (C) CTA band */\n[data-nb] .nb-fct-cta{\n  max-width:1100px; margin:70px auto 0; border-radius:24px; overflow:hidden;\n  position:relative; text-align:center; padding:64px 32px 60px;\n  background:\n    radial-gradient(120% 140% at 50% -20%, rgba(92,193,95,.22) 0%, rgba(92,193,95,0) 55%),\n    linear-gradient(180deg, #16284a 0%, #0e2a4d 100%);\n  box-shadow:0 24px 60px rgba(14,42,77,.28);\n}\n[data-nb] .nb-fct-cta::after{\n  content:\"\"; position:absolute; left:0; right:0; bottom:0; height:46%;\n  background:\n    linear-gradient(180deg, rgba(14,42,77,0) 0%, rgba(8,20,38,.55) 100%),\n    repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 26px);\n  -webkit-mask:linear-gradient(180deg, transparent, #000 40%);\n  mask:linear-gradient(180deg, transparent, #000 40%);\n  pointer-events:none;\n}\n[data-nb] .nb-fct-cta > *{ position:relative; z-index:1; }\n[data-nb] .nb-fct-cta-h{\n  color:#fff; font-weight:800; letter-spacing:-.02em; font-size:38px; line-height:1.1; margin:0;\n}\n[data-nb] .nb-fct-cta-sub{ color:#c4d2e6; font-size:17px; line-height:1.6; max-width:560px; margin:16px auto 0; }\n[data-nb] .nb-fct-cta-btns{ display:flex; flex-wrap:wrap; gap:14px; justify-content:center; margin-top:32px; }\n[data-nb] .nb-fct-btn{\n  height:52px; padding:0 26px; border-radius:11px; font-weight:700; font-size:15.5px;\n  display:inline-flex; align-items:center; justify-content:center; gap:9px;\n  cursor:pointer; border:1px solid transparent; transition:all .2s ease; text-decoration:none;\n}\n[data-nb] .nb-fct-btn-green{ background:#43a047; color:#fff; box-shadow:0 8px 20px rgba(67,160,71,.35); }\n[data-nb] .nb-fct-btn-green:hover{ background:#3a8c3e; transform:translateY(-1px); }\n[data-nb] .nb-fct-btn-out{ background:transparent; color:#fff; border-color:rgba(255,255,255,.45); }\n[data-nb] .nb-fct-btn-out:hover{ background:rgba(255,255,255,.1); border-color:#fff; }\n[data-nb] .nb-fct-social-proof{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:34px; flex-wrap:wrap; }\n[data-nb] .nb-fct-avatars{ display:flex; }\n[data-nb] .nb-fct-avatars span{\n  width:34px; height:34px; border-radius:50%; border:2px solid #16284a; margin-left:-10px;\n  display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:12px;\n}\n[data-nb] .nb-fct-avatars span:first-child{ margin-left:0; }\n[data-nb] .nb-fct-avatars span:nth-child(1){ background:#5cc15f; }\n[data-nb] .nb-fct-avatars span:nth-child(2){ background:#43a047; }\n[data-nb] .nb-fct-avatars span:nth-child(3){ background:#2f7bb5; }\n[data-nb] .nb-fct-avatars span:nth-child(4){ background:#3a8c3e; }\n[data-nb] .nb-fct-proof-txt{ color:#c4d2e6; font-size:14px; }\n\n/* FOOTER */\n[data-nb] .nb-fct-footer{ margin:80px -20px 0; background:#0e2a4d; }\n@media (min-width:640px){ [data-nb] .nb-fct-footer{ margin-left:-32px; margin-right:-32px; } }\n[data-nb] .nb-fct-footer-inner{ max-width:1240px; margin:0 auto; padding:72px 20px 0; }\n[data-nb] .nb-fct-fgrid{ display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr 1.4fr; gap:40px; }\n@media (max-width:960px){ [data-nb] .nb-fct-fgrid{ grid-template-columns:1fr 1fr; gap:36px; } }\n@media (max-width:520px){ [data-nb] .nb-fct-fgrid{ grid-template-columns:1fr; } }\n[data-nb] .nb-fct-flogo{ color:#fff; font-weight:800; font-size:22px; letter-spacing:-.02em; }[data-nb] .nb-fct-flogo sup{ font-size:0.55em; vertical-align:super; margin-left:2px; font-weight:500; }\n[data-nb] .nb-fct-flogo b{ color:#5cc15f; }\n[data-nb] .nb-fct-ftag{ color:#9fb2cc; font-size:14.5px; line-height:1.6; margin-top:14px; max-width:300px; }\n[data-nb] .nb-fct-fcol h4{ color:#fff; font-size:14px; font-weight:800; letter-spacing:.02em; margin:0 0 16px; }\n[data-nb] .nb-fct-fcol ul{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:11px; }\n[data-nb] .nb-fct-fcol a{ color:#9fb2cc; font-size:14.5px; text-decoration:none; transition:color .2s ease; }\n[data-nb] .nb-fct-fcol a:hover{ color:#fff; }\n[data-nb] .nb-fct-sub-form{ display:flex; gap:8px; margin-top:4px; }\n[data-nb] .nb-fct-sub-form input{\n  flex:1 1 auto; min-width:0; height:44px; border-radius:9px; border:1px solid #2a456e;\n  background:#16284a; color:#fff; padding:0 14px; font-size:14px; outline:none;\n}\n[data-nb] .nb-fct-sub-form input::placeholder{ color:#7e93b3; }\n[data-nb] .nb-fct-sub-form input:focus{ border-color:#43a047; }\n[data-nb] .nb-fct-sub-btn{\n  height:44px; padding:0 18px; border-radius:9px; border:none; background:#43a047; color:#fff;\n  font-weight:700; font-size:14px; cursor:pointer; transition:background .2s ease; white-space:nowrap;\n}\n[data-nb] .nb-fct-sub-btn:hover{ background:#3a8c3e; }\n[data-nb] .nb-fct-fbottom{\n  max-width:1240px; margin:48px auto 0; padding:24px 20px 28px; border-top:1px solid #1d3a60;\n  display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap;\n}\n[data-nb] .nb-fct-fsocial{ display:flex; gap:12px; }\n[data-nb] .nb-fct-fsocial a{\n  width:36px; height:36px; border-radius:9px; background:#16284a; color:#9fb2cc;\n  display:flex; align-items:center; justify-content:center; transition:all .2s ease;\n}\n[data-nb] .nb-fct-fsocial a:hover{ background:#43a047; color:#fff; }\n[data-nb] .nb-fct-fsocial svg{ width:17px; height:17px; }\n[data-nb] .nb-fct-copy{ color:#7e93b3; font-size:13.5px; }\n@media (max-width:640px){\n  [data-nb] .nb-fct-cta-h{ font-size:30px; }\n  [data-nb] .nb-fct-fbottom{ justify-content:center; text-align:center; }\n} [data-nb] .nb-fct-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:stretch} [data-nb] .nb-fct-left{min-width:0;display:flex;flex-direction:column} [data-nb] .nb-fct-head{text-align:left;max-width:none;margin:0} [data-nb] .nb-fct-acc{max-width:none;margin:28px 0 0} [data-nb] .nb-fct-viewall{text-align:left;margin-top:26px} [data-nb] .nb-fct-cta{max-width:none;margin:0;text-align:left;padding:48px 40px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(160deg,rgba(14,42,77,.82),rgba(11,31,61,.93)),url(/hero-skyline.jpg) center/cover no-repeat} [data-nb] .nb-fct-cta::after{display:none} [data-nb] .nb-fct-cta-h{font-size:32px} [data-nb] .nb-fct-cta-sub{margin:16px 0 0;max-width:none} [data-nb] .nb-fct-cta-btns{justify-content:flex-start} [data-nb] .nb-fct-social-proof{justify-content:flex-start} [data-nb] .nb-res-avatar{display:flex;align-items:center;justify-content:center;background:#eef3fb;object-fit:cover;object-position:center 22%;overflow:hidden} @media (max-width:900px){[data-nb] .nb-fct-grid{grid-template-columns:1fr;gap:34px} [data-nb] .nb-fct-cta{padding:40px 26px}} [data-nb] .nb-meet-step{width:106px} [data-nb] .nb-meet-circle{width:82px;height:82px} [data-nb] .nb-meet-circle svg{width:32px;height:32px} [data-nb] .nb-meet-label{font-size:12.5px;margin-top:12px} [data-nb] .nb-meet-arrow{margin-top:30px;font-size:20px} [data-nb] .nb-prob-head{max-width:640px;margin:0 0 46px} [data-nb] .nb-prob-item{background:#f7f9fc;border:1px solid #e8edf3;border-radius:16px;padding:26px 18px 24px;gap:16px} [data-nb] .nb-prob-ico{background:#ffffff;border-color:#e8edf3} [data-nb] .nb-prob-label{max-width:none} @media (max-width:900px){[data-nb] .nb-prob-head{margin-bottom:36px}} [data-nb] .nb-diff-mock-name{font-size:8.5px;font-weight:700;color:#16284a;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} [data-nb] .nb-diff-mock-loc{font-size:7px;color:#8794a6;margin-top:2px;white-space:nowrap} [data-nb] .nb-diff-mock-score{font-size:8px;font-weight:800;color:#2f7a33;background:#e3f1e4;border-radius:6px;padding:3px 5px;flex:none;line-height:1} [data-nb] .nb-diff-mock-thumb{background:linear-gradient(135deg,#8fabd0,#6a89b5)} [data-nb] .nb-who-card--blue,[data-nb] .nb-who-card--green,[data-nb] .nb-who-card--orange{background:#ffffff;border-color:#e8edf3} [data-nb] .nb-how-card,[data-nb] .nb-res-card{border-radius:16px} [data-nb] .nb-why-result{margin-top:20px;padding-top:20px;border-top:1px solid #e8edf3} [data-nb] .nb-why-result-top{display:flex;align-items:center;gap:14px} [data-nb] .nb-why-roe-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:40px;font-weight:800;letter-spacing:-.02em;line-height:1} [data-nb] .nb-why-result-meta{display:flex;flex-direction:column;gap:5px} [data-nb] .nb-why-result-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8794a6} [data-nb] .nb-why-verdict{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px} [data-nb] .nb-why-verdict[data-tone=low]{background:rgba(184,84,58,.12);color:#a8482f} [data-nb] .nb-why-verdict[data-tone=mid]{background:rgba(22,40,74,.1);color:#16284a} [data-nb] .nb-why-verdict[data-tone=high]{background:rgba(67,160,71,.14);color:#2f7a33} [data-nb] .nb-why-result-note{margin-top:14px;font-size:13.5px;line-height:1.55;color:#56657a} [data-nb] .nb-why-result-note b{color:#16284a;font-weight:700} [data-nb] .nb-why-fine{margin-top:10px;font-size:11px;color:#9fb0c8} [data-nb] .nb-diff-urlbar{margin-left:8px;flex:1;height:15px;border-radius:5px;background:#eef3fb;font-size:7px;color:#8794a6;display:flex;align-items:center;padding:0 8px;font-family:'Plus Jakarta Sans',sans-serif} [data-nb] .nb-diff-app-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px} [data-nb] .nb-diff-app-kicker{font-size:7px;font-weight:800;letter-spacing:.12em;color:#43a047} [data-nb] .nb-diff-app-title{font-size:13px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin-top:3px} [data-nb] .nb-diff-app-live{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;color:#2f7a33;background:#e3f1e4;padding:3px 7px;border-radius:999px;white-space:nowrap;flex:none} [data-nb] .nb-diff-app-livedot{width:5px;height:5px;border-radius:999px;background:#43a047} [data-nb] .nb-diff-app-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px} [data-nb] .nb-diff-kpi{background:#f7f9fc;border:1px solid #eef3fb;border-radius:9px;padding:8px 9px} [data-nb] .nb-diff-kpi b{display:block;font-size:14px;font-weight:800;color:#16284a;letter-spacing:-.02em;line-height:1} [data-nb] .nb-diff-kpi span{display:block;font-size:6.5px;color:#8794a6;margin-top:3px} [data-nb] .nb-diff-matches{display:flex;flex-direction:column;gap:8px} [data-nb] .nb-diff-match{display:flex;align-items:center;gap:9px;padding:8px;border:1px solid #eef3fb;border-radius:10px;background:#fff;box-shadow:0 1px 3px rgba(14,42,77,.04)} [data-nb] .nb-diff-match-thumb{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8fabd0,#5f7fae);flex:none} [data-nb] .nb-diff-match-body{flex:1;min-width:0} [data-nb] .nb-diff-match-name{font-size:9px;font-weight:700;color:#16284a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1} [data-nb] .nb-diff-match-meta{display:flex;align-items:center;gap:5px;font-size:7.5px;color:#8794a6;margin-top:3px;white-space:nowrap} [data-nb] .nb-diff-match-roe{color:#2f7a33;font-weight:700;background:#e3f1e4;padding:1px 5px;border-radius:999px} [data-nb] .nb-diff-match-score{flex:none;width:32px;height:32px;border-radius:999px;background:#e3f1e4;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;color:#2f7a33} [data-nb] .nb-diff-match-score i{font-style:normal;font-size:6.5px;font-weight:700;margin-left:.5px} [data-nb] .nb-diff-pfhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 2px} [data-nb] .nb-diff-pf-title{font-size:11px;font-weight:800;color:#16284a;letter-spacing:-.02em} [data-nb] .nb-diff-phone .nb-diff-match{padding:6px 7px;gap:7px} [data-nb] .nb-diff-phone .nb-diff-match-thumb{width:26px;height:26px;border-radius:6px} [data-nb] .nb-diff-phone .nb-diff-match-name{font-size:8px} [data-nb] .nb-diff-phone .nb-diff-match-meta{font-size:6.5px} [data-nb] .nb-diff-phone .nb-diff-match-score{width:26px;height:26px;font-size:9px} @media (max-width:900px){ [data-nb] .nb-prob-grid{gap:12px} [data-nb] .nb-prob-item{flex-direction:row;text-align:left;align-items:center;gap:14px;background:#f7f9fc;border:1px solid #eef3fb;border-radius:14px;padding:12px 16px} [data-nb] .nb-prob-ico{width:46px;height:46px;flex:none;border-radius:11px} [data-nb] .nb-prob-ico svg{width:25px;height:25px} [data-nb] .nb-prob-label{max-width:none;font-size:14px} } @media (max-width:640px){ [data-nb] .nb-prob-grid{grid-template-columns:1fr} } @media (max-width:640px){ [data-nb] .nb-h2,[data-nb] .nb-lead{text-align:center} [data-nb] .nb-prob-line{text-align:center} [data-nb] .nb-meet-btn{display:flex;width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-how-card{text-align:center} [data-nb] .nb-how-icon{margin-left:auto;margin-right:auto} [data-nb] .nb-how-num{left:50%;transform:translateX(-50%)} [data-nb] .nb-who-card{text-align:center} [data-nb] .nb-who-icon{margin-left:auto;margin-right:auto} [data-nb] .nb-who-list{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-who-link{align-self:center} [data-nb] .nb-why-h2{text-align:center} [data-nb] .nb-why-list{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-res-title{text-align:center} [data-nb] .nb-res-list,[data-nb] .nb-res-experts,[data-nb] .nb-res-clist{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-res-link{align-self:center} [data-nb] .nb-res-cap{text-align:center} [data-nb] .nb-fct-head{text-align:center} [data-nb] .nb-fct-viewall{text-align:center} [data-nb] .nb-fct-cta{text-align:center} [data-nb] .nb-fct-cta-sub{margin-left:auto;margin-right:auto} [data-nb] .nb-fct-cta-btns{justify-content:center} [data-nb] .nb-fct-social-proof{justify-content:center} [data-nb] .nb-fct-fgrid{text-align:center} [data-nb] .nb-fct-ftag{margin-left:auto;margin-right:auto} } [data-nb] .nb-ev{display:grid;grid-template-columns:1.2fr .8fr;gap:36px;background:linear-gradient(160deg,#13294e 0%,#0e2a4d 100%);border-radius:18px;padding:38px 40px;margin-bottom:26px;box-shadow:0 14px 36px rgba(14,42,77,.2)} @media (max-width:900px){[data-nb] .nb-ev{grid-template-columns:1fr;padding:30px 24px}} [data-nb] .nb-ev-badge{display:inline-flex;align-items:center;gap:7px;width:fit-content;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5cc15f;background:rgba(92,193,95,.14);border:1px solid rgba(92,193,95,.35);padding:6px 12px;border-radius:999px} [data-nb] .nb-ev-title{font-size:clamp(22px,2.4vw,28px);font-weight:800;color:#fff;letter-spacing:-.02em;margin:14px 0 0} [data-nb] .nb-ev-copy{margin:12px 0 0;font-size:15px;line-height:1.6;color:#c4d2e6;max-width:560px} [data-nb] .nb-ev-meta{display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:16px} [data-nb] .nb-ev-meta-item{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#d8e2f0} [data-nb] .nb-ev-meta-item svg{color:#5cc15f;flex:none} [data-nb] .nb-ev-vlabel{margin-top:20px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9fb2cc} [data-nb] .nb-ev-vchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px} [data-nb] .nb-ev-vchip{display:inline-flex;flex-direction:column;align-items:flex-start;gap:1px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.22);border-radius:11px;padding:7px 13px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;color:#fff;text-align:left;transition:background .15s,border-color .15s} [data-nb] .nb-ev-vchip i{font-style:normal;font-size:10px;font-weight:600;color:#9fb2cc} [data-nb] .nb-ev-vchip:hover{background:rgba(255,255,255,.13)} [data-nb] .nb-ev-vchip.open{background:rgba(92,193,95,.16);border-color:#43a047} [data-nb] .nb-ev-vchip.open i{color:#5cc15f} [data-nb] .nb-ev-vinfo{margin-top:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:12px 15px;font-size:13px;line-height:1.55;color:#c4d2e6;max-width:560px} [data-nb] .nb-ev-form{background:#fff;border-radius:14px;padding:24px;box-shadow:0 12px 30px rgba(4,14,30,.25);align-self:center;width:100%} [data-nb] .nb-ev-form-title{font-size:17px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin:0 0 12px} [data-nb] .nb-ev-label{display:block;font-size:12px;font-weight:700;color:#16284a;margin:12px 0 5px} [data-nb] .nb-ev-input{width:100%;height:44px;border-radius:9px;border:1px solid #e8edf3;background:#fff;padding:0 13px;font-family:inherit;font-size:14px;color:#16284a;outline:none;transition:border-color .15s,box-shadow .15s} [data-nb] .nb-ev-input:focus{border-color:#43a047;box-shadow:0 0 0 3px rgba(67,160,71,.14)} [data-nb] .nb-ev-input::placeholder{color:#9fb0c8} [data-nb] .nb-ev-roles{display:grid;grid-template-columns:1fr 1fr;gap:8px} [data-nb] .nb-ev-role{height:38px;border-radius:9px;border:1px solid #e8edf3;background:#fff;font-family:inherit;font-size:13px;font-weight:700;color:#56657a;cursor:pointer;transition:all .15s} [data-nb] .nb-ev-role.on{background:#e3f1e4;border-color:#43a047;color:#2f7a33} [data-nb] .nb-ev-submit{width:100%;height:46px;margin-top:16px;border:0;border-radius:9px;background:#43a047;color:#fff;font-family:inherit;font-size:14.5px;font-weight:800;cursor:pointer;transition:background .15s} [data-nb] .nb-ev-submit:hover{background:#3a8c3e} [data-nb] .nb-ev-submit:disabled{opacity:.7;cursor:default} [data-nb] .nb-ev-fine{margin:10px 0 0;font-size:11px;line-height:1.45;color:#8794a6;text-align:center} [data-nb] .nb-ev-done{text-align:center;padding:18px 6px} [data-nb] .nb-ev-done-ico{display:inline-flex;width:52px;height:52px;border-radius:999px;background:#e3f1e4;align-items:center;justify-content:center} [data-nb] .nb-ev-done h4{font-size:17px;font-weight:800;color:#16284a;margin:12px 0 0} [data-nb] .nb-ev-done p{font-size:13.5px;line-height:1.55;color:#56657a;margin:8px 0 0} @media (max-width:640px){[data-nb] .nb-ev-badge{margin-left:auto;margin-right:auto} [data-nb] .nb-ev-left{text-align:center} [data-nb] .nb-ev-copy{margin-left:auto;margin-right:auto} [data-nb] .nb-ev-meta{justify-content:center} [data-nb] .nb-ev-vchips{justify-content:center} [data-nb] .nb-ev-vchip{align-items:center;text-align:center} [data-nb] .nb-ev-vinfo{margin-left:auto;margin-right:auto}}";


export const EXTRA_CSS = `
[data-nb] .nb-flow{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:44px}
[data-nb] .nb-flow-box{width:100%;max-width:560px;text-align:center;border-radius:14px;border:1px solid #e8edf3;background:#fff;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:18px 22px;font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#16284a}
[data-nb] .nb-flow-box.engine{background:#16284a;border-color:#16284a;color:#fff}
[data-nb] .nb-flow-box.engine span{color:#5cc15f}

[data-nb] .nb-flow-out{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:100%;max-width:900px}
@media (max-width:760px){[data-nb] .nb-flow-out{grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-nb] .nb-flow-out div{border-radius:12px;border:1px solid #dbeadd;background:#f3faf3;padding:16px 14px;text-align:center;font-size:13.5px;font-weight:700;color:#16284a;line-height:1.4}
[data-nb] .nb-flow-note{margin-top:30px;text-align:center;font-size:17px;font-weight:700;color:#43a047}

[data-nb] .nb-ex-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:center;margin-top:44px}
@media (min-width:980px){[data-nb] .nb-ex-grid{grid-template-columns:1fr auto 1fr}}
[data-nb] .nb-ex-card{border-radius:16px;border:1px solid #e8edf3;background:#fff;box-shadow:0 6px 22px rgba(14,42,77,.08);padding:24px}
[data-nb] .nb-ex-card.hl{border-color:#cdeccf;background:#f7fcf7}
[data-nb] .nb-ex-tag{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#43a047}
[data-nb] .nb-ex-place{margin-top:8px;font-size:20px;font-weight:800;letter-spacing:-.02em;color:#16284a}
[data-nb] .nb-ex-rows{margin-top:16px;display:flex;flex-direction:column;gap:9px}
[data-nb] .nb-ex-row{display:flex;justify-content:space-between;gap:14px;font-size:14.5px;color:#56657a}
[data-nb] .nb-ex-row b{color:#16284a;font-weight:700}
[data-nb] .nb-ex-mid{display:flex;flex-direction:column;align-items:center;gap:8px;color:#9fb0c8}
[data-nb] .nb-ex-mid-label{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#43a047;text-align:center;max-width:150px;line-height:1.5}
[data-nb] .nb-ex-right{display:flex;flex-direction:column;gap:22px}
[data-nb] .nb-ex-fine{margin-top:26px;text-align:center;font-size:13px;color:#8794a6}

[data-nb] .nb-ag-grid{display:grid;grid-template-columns:1fr;gap:44px;align-items:start}
@media (min-width:980px){[data-nb] .nb-ag-grid{grid-template-columns:1.05fr .95fr;gap:60px}}
[data-nb] .nb-ag-list{margin:26px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:13px}
[data-nb] .nb-ag-li{display:flex;gap:11px;align-items:flex-start;font-size:15.5px;line-height:1.45;color:#56657a}
[data-nb] .nb-ag-check{flex:none;width:20px;height:20px;border-radius:50%;background:#43a047;display:flex;align-items:center;justify-content:center;margin-top:2px}
[data-nb] .nb-ag-check svg{width:12px;height:12px;color:#fff}
[data-nb] .nb-ag-note{margin-top:28px;border-left:3px solid #43a047;background:#f3faf3;border-radius:0 12px 12px 0;padding:18px 20px;font-size:16px;font-weight:700;color:#16284a;line-height:1.5}

[data-nb] .nb-inv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-top:44px}
@media (max-width:1000px){[data-nb] .nb-inv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){[data-nb] .nb-inv-grid{grid-template-columns:1fr}}
[data-nb] .nb-inv-card{border-radius:16px;border:1px solid #e8edf3;background:#fff;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:24px 22px}
[data-nb] .nb-inv-title{font-size:13px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#43a047}
[data-nb] .nb-inv-txt{margin-top:10px;font-size:15px;line-height:1.55;color:#56657a}

[data-nb] .nb-net-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:40px}
@media (min-width:900px){[data-nb] .nb-net-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
[data-nb] .nb-net-card{border-radius:16px;padding:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);font-size:15.5px;line-height:1.55;color:#eaf1fb}
[data-nb] .nb-net-close{margin-top:34px;text-align:center;font-size:18px;font-weight:700;color:#5cc15f}


[data-nb] .nb-sec-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:50px;padding:0 26px;margin-top:30px;border-radius:10px;background:#43a047;color:#fff;font-weight:800;font-size:15px;text-decoration:none;box-shadow:0 8px 20px rgba(67,160,71,.28)}
`;






export function HowItWorksFlow() {
  const steps = [
    {
      title: "Add",
      desc: "Your property and investment criteria.",
      icon: Building2,
    },
    {
      title: "Monitor",
      desc: <>Our <span style={{ color: "#43a047" }}>Exchange IQ™</span> keeps watching the network as it grows.</>,
      icon: Activity,
    },
    {
      title: "Alert",
      desc: "You are notified when a relevant opportunity appears.",
      icon: Bell,
    },
  ];


  return (
    <div className="nb-how-flow">
      {steps.map((s) => (
        <div className="nb-how-step" key={s.title}>
          <div className="nb-how-step-top">
            <div className="nb-how-step-icon">
              <s.icon size={32} strokeWidth={1.5} />
            </div>
          </div>
          <div className="nb-how-step-body">
            <h3 className="nb-how-step-title">{s.title}</h3>
            <p className="nb-how-step-desc">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sec_how({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <section id="how" data-nb className="bg-white">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20 sm:py-24">
        {showTitle && (
          <div className="max-w-[760px] mb-12 sm:mb-16">
            <p className="nb-eyebrow">How It Works</p>
            <h2 className="nb-h2 mt-3">A simple process designed to find your next property.</h2>
          </div>
        )}
        <HowItWorksFlow />
      </div>
    </section>
  );
}



export function Sec_agents() {
  return (
<section id="agents" data-nb className="w-full py-20 sm:py-24" style={{ background: "#eef3fb" }}>
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="nb-ag-grid">
      <div>
        <div className="nb-eyebrow">For Agents</div>
        <h2 className="nb-h2 mt-3">Exchanges Made Easier Across Your Whole Database.</h2>
        <p className="nb-lead mt-4">
          Add investor clients and investment properties to ExchangeUp™. The system continuously evaluates your database

          and the broader ExchangeUp™ network for potential transactions.
        </p>


        <ul className="nb-ag-list">
          {[
            "Opportunities between two of your own clients surface as an Internal Opportunity Detected - no need to connect with yourself.",
            "Opportunities across your brokerage and other participating agents.",
            "Potential buyers and replacement properties across the network.",
            "Keep your client relationship, always.",

          ].map((b) => (
            <li className="nb-ag-li" key={b}>
              <span className="nb-ag-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>

        <p className="nb-ag-note">
          You already built the database. Let ExchangeUp™ find the opportunities inside it. ExchangeUp™ does not replace the agent - it makes the agent&rsquo;s network more powerful.
        </p>

        <a href="/signup" className="nb-sec-cta">Add My First Opportunity</a>
      </div>

    </div>
  </div>
</section>
  );
}

export function Sec_investors() {
  return (
<section id="investors" data-nb className="w-full py-20 sm:py-24 bg-white">
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="text-center max-w-[760px] mx-auto">
      <div className="nb-eyebrow">For Investors &amp; Property Owners</div>
      <h2 className="nb-h2 mt-3">Your 1031 Exchange, Made Easier.</h2>
      <p className="nb-lead mt-4">
        Add your investment property and goals once. ExchangeUp™ keeps watching for opportunities that may better align
        with your equity position - so the exchange is simple when the timing is right.
      </p>




    </div>


    <div className="text-center">
      <a href="/signup" className="nb-sec-cta">Monitor My Property</a>
    </div>

  </div>
</section>
  );
}




function RoeMiniCalc() {
  const [value, setValue] = useState(1000000);
  const [loan, setLoan] = useState(0);
  const [rent, setRent] = useState(6000);
  const [pi, setPi] = useState(0);
  const [ti, setTi] = useState(0);
  const [opex, setOpex] = useState(0);
  const [shown, setShown] = useState(false);

  const equity = Math.max(0, value - loan);
  const monthlyExpenses = pi + ti + opex;
  const monthlyCashFlow = rent - monthlyExpenses;
  const income = monthlyCashFlow * 12;
  const roe = equity > 0 ? (income / equity) * 100 : 0;

  const usd = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  const parse = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;

  const numColor = roe >= 0 ? "#43a047" : "#b8543a";

  const signupHref =
    `/signup?role=investor&value=${Math.round(value)}&loan=${Math.round(loan)}&rent=${Math.round(rent)}` +
    `&pi=${Math.round(pi)}&ti=${Math.round(ti)}&opex=${Math.round(opex)}`;

  const FIELDS: { id: string; label: string; hint?: string; val: number; set: (n: number) => void }[] = [
    { id: "cv", label: "Estimated Property Value", val: value, set: setValue },
    { id: "lb", label: "Current Loan Balance", val: loan, set: setLoan },
    { id: "gr", label: "Gross Monthly Rent", val: rent, set: setRent },
    { id: "pi", label: "Monthly P&I (Principal & Interest)", val: pi, set: setPi },
    { id: "ti", label: "Monthly T&I (Taxes & Insurance)", val: ti, set: setTi },
    { id: "oe", label: "Other Monthly Operating Expenses", val: opex, set: setOpex },
  ];

  return (
    <div className="nb-why-card">
      <h3 className="nb-why-card-title">Return on Equity Calculator</h3>
      <p className="nb-why-card-sub">
        Enter your property value, loan balance, rent and monthly costs - P&amp;I, T&amp;I and other expenses - to see
        how hard your equity is working today.
      </p>

      <div className="nb-why-inputs">
        {FIELDS.map((f) => (
          <div className="nb-why-field" key={f.id}>
            <label className="nb-why-label" htmlFor={`nb-why-${f.id}`}>{f.label}</label>
            <div className="nb-why-input">
              <span className="nb-why-dollar">$</span>
              <input
                id={`nb-why-${f.id}`}
                type="text"
                inputMode="numeric"
                value={f.val.toLocaleString("en-US")}
                onChange={(e) => f.set(parse(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          fontSize: 12,
          fontWeight: 700,
          color: "#56657a",
          margin: "2px 0 12px",
        }}
      >
        <span>Total monthly expenses: {usd(monthlyExpenses)}</span>
        <span>Monthly cash flow: {usd(monthlyCashFlow)}</span>
      </div>

      <button type="button" className="nb-why-calc" onClick={() => setShown(true)}>Calculate My Return on Equity</button>


      {shown && (
        <div className="nb-why-result">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Equity</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#16284a" }}>{usd(equity)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Annual Cash Flow</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#16284a" }}>{usd(income)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Current ROE</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: numColor }}>{roe.toFixed(1)}%</div>
            </div>
          </div>

          <p className="nb-why-result-note" style={{ fontWeight: 800, color: "#16284a" }}>
            Is your equity working as hard as it could?
          </p>

          <p className="nb-why-result-note">
            After <b>{usd(monthlyExpenses)}/mo</b> in P&amp;I, T&amp;I and other operating expenses, your annual
            cash flow is about <b>{usd(income)}/yr</b>. With <b>{usd(equity)}</b> in equity, your property is
            returning <b style={{ color: numColor }}>{roe.toFixed(1)}%</b>. ExchangeUp™ can continuously monitor
            for investment opportunities that may better align with your goals.
          </p>

          <a href={signupHref} className="nb-why-calc" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 14 }}>
            Monitor My Opportunities
          </a>

          <p className="nb-why-fine">
            Annual cash flow is calculated as gross monthly rent less your entered P&amp;I, T&amp;I and other monthly
            operating expenses, multiplied by twelve. This calculator is for
            educational purposes only and does not constitute financial, tax or investment advice. Results are estimates
            and do not predict or guarantee any outcome.
          </p>

        </div>
      )}
    </div>
  );
}




export function Sec_why() {
  return (
<section id="why" className="px-5 sm:px-8 py-20 sm:py-24">
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="nb-why-wrap px-6 sm:px-12 lg:px-16 py-14 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* LEFT */}
        <div>
          <h2 className="nb-why-h2">
            Is Your Equity Working<span className="nb-why-up"> Hard Enough</span>?
          </h2>
          <p style={{ color: "#c4d2e6", fontSize: 16, lineHeight: 1.6, margin: "-14px 0 26px" }}>
            Run the numbers on what you own today. If your equity could be doing more elsewhere, that’s what we watch for.
          </p>

          <div className="nb-why-list">
            {[
              "Automatic Return-on-Equity Matching",
              "Purchasing-Capacity Guardrails",
              "Private, Network-Wide Opportunities",
              "Agent & Investor Workspaces",
              "Educational Webinars & Events",
              "And Much More...",

            ].map((item) => (
              <div className="nb-why-item" key={item}>
                <span className="nb-why-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 7.2L5.2 10.4L12 3.6" stroke="#5cc15f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - ROE calculator */}
        <RoeMiniCalc />
      </div>
    </div>
  </div>
</section>
  );
}


function SummitEventCard() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "investor">("agent");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) {
      toast({ title: "Enter your name.", variant: "destructive" });
      return;
    }
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || mail.length > 255) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("event_registrations")
      .upsert(
        { full_name: name, email: mail, role, event: "1031-exchange-summit" },
        { onConflict: "email,event", ignoreDuplicates: true },
      );
    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't register you.",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setDone(true);
    toast({ title: "You're registered!", description: "Complete your Zoom registration in the new tab." });
    if (UPCOMING_EVENT.registrationUrl) {
      window.open(UPCOMING_EVENT.registrationUrl, "_blank", "noopener,noreferrer");
    }
  }

  

  return (
    <div className="nb-ev">
      <div className="nb-ev-left">
        <h3 className="nb-ev-title">{UPCOMING_EVENT.title}</h3>
        <p className="nb-ev-copy">{UPCOMING_EVENT.description}</p>
        <div className="nb-ev-meta">
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
            Next session: {UPCOMING_EVENT.dateLabel}
          </span>
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
            {UPCOMING_EVENT.timeLabel}
          </span>
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M15 10l5-5M15 10l5 5M15 10H3" /></svg>
            {UPCOMING_EVENT.platform}
          </span>

          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.4c2.7.2 5 1.9 5 4.6" /></svg>
            Real Estate Agents, Investors and professionals welcomed
          </span>
        </div>
      </div>

      <div className="nb-ev-form">
        {done ? (
          <div className="nb-ev-done">
            <span className="nb-ev-done-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#43a047" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5" /><path d="M8 12.3l2.6 2.6L16.5 9" /></svg>
            </span>
            <h4>You're registered!</h4>
            <p>We'll email you the details for the {UPCOMING_EVENT.dateLabel} session - and every monthly summit after it.</p>
            {UPCOMING_EVENT.registrationUrl && (
              <a
                href={UPCOMING_EVENT.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nb-ev-submit"
                style={{ marginTop: 16, textAlign: "center" }}
              >
                Join on Zoom
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <h4 className="nb-ev-form-title">Register free</h4>
            <label className="nb-ev-label" htmlFor="ev-name">Full Name</label>
            <input id="ev-name" className="nb-ev-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" disabled={submitting} />
            <label className="nb-ev-label" htmlFor="ev-email">Email</label>
            <input id="ev-email" className="nb-ev-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={submitting} />
            <span className="nb-ev-label">I'm an</span>
            <div className="nb-ev-roles">
              <button type="button" className={`nb-ev-role${role === "agent" ? " on" : ""}`} onClick={() => setRole("agent")}>Agent</button>
              <button type="button" className={`nb-ev-role${role === "investor" ? " on" : ""}`} onClick={() => setRole("investor")}>Investor</button>
            </div>
            <button type="submit" className="nb-ev-submit" disabled={submitting}>
              {submitting ? "Registering…" : "Register for the Summit"}
            </button>
            <p className="nb-ev-fine">Free to attend. We'll only use your info to send event details.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function Sec_resources() {
  return (
<section id="resources" className="w-full" style={{ background: '#ffffff' }}>
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="px-5 sm:px-8 py-20 sm:py-24">
      <SummitEventCard />
      <div className="nb-res-grid">
        {/* (1) Learn From Trusted Experts */}
        <div className="nb-res-card">
          <h3 className="nb-res-title">Learn From Trusted Experts</h3>
          <div className="nb-res-experts">
            {/* Placeholder initials avatars - swap each for the real headshot
                (drop photos in /public and replace the div with an <img>). */}
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-joe.webp" alt="Joe Bonavita" />
              <div>
                <div className="nb-res-ename">Joe Bonavita</div>
                <div className="nb-res-erole">Qualified Intermediary</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-emily.png" alt="Emily Yormak" />
              <div>
                <div className="nb-res-ename">Emily Yormak</div>
                <div className="nb-res-erole">Cost Segregation Expert</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-wolfgang.jpg" alt="Wolfgang Suess" />
              <div>
                <div className="nb-res-ename">Wolfgang Suess</div>
                <div className="nb-res-erole">DST Specialist</div>
              </div>
            </div>
          </div>
          <a href="/signup" className="nb-res-link" style={{ marginTop: 'auto', paddingTop: 24 }}>Meet All Our Experts →</a>
        </div>

        {/* (2) Pricing */}
        <div className="nb-res-card nb-res-dark">
          <h3 className="nb-res-title">Free for Agents & Investors</h3>
          <ul className="nb-res-clist">
            {[
              'Free for investors - every property and criteria',
              'Free for agents - every client, every property',
              'No plans, no tiers, no upsells',
              'No card required, ever',
              'Members help shape the platform',
            ].map((t) => (
              <li className="nb-res-cli" key={t}>
                <span className="nb-res-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#5cc15f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href="/signup" className="nb-btn nb-btn-green nb-res-btn">Add Your First Opportunity</a>
          <div className="nb-res-cap">Completely free</div>
        </div>


      </div>
    </div>
  </div>
</section>
  );
}

function Sec_faqcta() {
  return (
<section id="faq" className="w-full px-5 sm:px-8 py-20 sm:py-24" style={{ background: '#eef3fb' }}>
  <div className="mx-auto" style={{ maxWidth: '1240px' }}>
    <div className="nb-fct-grid">

      {/* LEFT - FAQ column */}
      <div className="nb-fct-left">

      {/* (A) Heading */}
      <div className="nb-fct-head">
        <h2 className="nb-h2">Frequently Asked Questions</h2>
      </div>

      {/* (B) Accordion */}
      <div className="nb-fct-acc">
        {[
          {
            q: 'What happens when ExchangeUp finds an opportunity for me?',
            a: "You'll receive an alert letting you know that ExchangeUp has identified a potential opportunity based on your property, equity position, and investment criteria. You can review the opportunity and decide whether you want to explore it further. There's no obligation to sell, exchange, or pursue any opportunity.",
          },
          {
            q: 'Why is ExchangeUp free?',
            a: "Because ExchangeUp becomes more valuable as more investors, agents, and properties join the network. Our goal is to remove the friction of finding potential 1031 Exchange opportunities and build the largest possible network of investment properties and participating real estate professionals. There is no cost to register your property, receive potential opportunity alerts, or explore matches.",
          },
          {
            q: 'Do I need to be planning a 1031 Exchange right now?',
            a: "No. In fact, that's one of the biggest benefits of ExchangeUp. Register your investment property today and let ExchangeUp continuously look for potential opportunities. If a property enters the network that could be a better fit for your investment goals, we'll let you know. You decide if and when you want to explore an exchange.",
          },
          {
            q: 'How does ExchangeUp determine if another property could be a better investment?',
            a: 'ExchangeUp uses property data, financial information, available equity, and your investment criteria to evaluate potential opportunities across the network. Rather than simply showing you more listings, ExchangeUp is designed to identify properties that may represent a meaningful opportunity to put your equity to work differently. Any opportunity is intended as a starting point for further evaluation-not investment, tax, or financial advice.',
          },
          {
            q: "Will ExchangeUp recommend properties that don't fit what I'm looking for?",
            a: "ExchangeUp uses your investment criteria to help narrow potential opportunities based on factors such as property type, value, location, and other preferences. The goal isn't to send you more properties. It's to surface relevant opportunities worth taking a closer look at.",
          },
          {
            q: 'Are properties registered on ExchangeUp actually for sale?',
            a: "Not necessarily. ExchangeUp is an opportunity network, not another MLS. A property can be registered so the system can evaluate potential matches even if the owner isn't actively marketing it for sale. When a potential opportunity is identified, the parties can decide whether there is mutual interest in exploring a transaction.",
          },
          {
            q: "If I'm an investor, do I have to use an ExchangeUp real estate agent?",
            a: "No. ExchangeUp doesn't require you to give up your existing real estate relationship. If you already have an agent you want to work with, you can continue working with them. If you need an experienced real estate professional, ExchangeUp may also be able to connect you with a participating agent.",
          },
          {
            q: "If I'm a real estate agent, do I keep my client?",
            a: "Yes. ExchangeUp is designed to make your existing relationships and database more valuable-not replace you. When you add clients and properties, you remain their real estate agent. ExchangeUp simply helps uncover potential opportunities within your own database and across the broader ExchangeUp network.",
          },
          {
            q: 'Can other agents see my clients or my entire database?',
            a: "No. Your database isn't made publicly available to other agents. ExchangeUp evaluates information behind the scenes to identify potential opportunities without turning your client list into a shared prospecting database. When an opportunity is identified, only the information necessary to evaluate and facilitate that opportunity is surfaced.",
          },
          {
            q: 'What information do I need to add a property?',
            a: "We've intentionally kept it simple. You can get started with basic information about the property and a few key financial details, such as its estimated value, current loan balance, and rental income. You don't need to complete a complicated financial analysis just to join the network. Additional information can be added as needed to improve the quality of potential matches.",
          },
          {
            q: 'Does ExchangeUp actually handle my 1031 Exchange?',
            a: "No. ExchangeUp helps solve one of the biggest challenges surrounding a 1031 Exchange: identifying potential replacement-property opportunities. The actual exchange should still be completed with the appropriate professionals, including a qualified intermediary and your legal, tax, financial, and real estate advisors. ExchangeUp helps you discover the opportunity. Your professional team helps you determine whether the transaction is right for you and properly execute the exchange.",
          },
        ].map((item, i) => (
          <details className="nb-fct-item" key={i}>
            <summary className="nb-fct-q">
              {item.q}
              <span className="nb-fct-plus" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </summary>
            <div className="nb-fct-a">{item.a}</div>
          </details>
        ))}
      </div>


      </div>{/* /nb-fct-left */}

      {/* RIGHT - CTA card */}
      <div className="nb-fct-cta">
        <h3 className="nb-fct-cta-h">Register Your Property. There’s No Obligation to Exchange.</h3>
        <p className="nb-fct-cta-sub">It takes a few minutes and it’s free. From there, we keep watching the network and let you know if something better shows up for your equity.</p>
        <div className="nb-fct-cta-btns">
          <a href="/signup" className="nb-fct-btn nb-fct-btn-green">Register My Property - Free</a>
          <a href="/book-demo" className="nb-fct-btn nb-fct-btn-out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
            Schedule a Demo
          </a>
        </div>
        <div className="nb-fct-social-proof">
          <div className="nb-fct-avatars" aria-hidden="true">
            <span>JM</span>
            <span>AK</span>
            <span>RP</span>
            <span>+</span>
          </div>
          <span className="nb-fct-proof-txt">Join a growing network of 1031-focused agents and investors.</span>
        </div>
      </div>

    </div>
  </div>

  {/* FOOTER */}
  <footer className="nb-fct-footer">
    <div className="nb-fct-footer-inner">
      <div className="nb-fct-fgrid">
        <div>
          <div className="nb-fct-flogo">1031Exchange<b>UP</b><sup>™</sup></div>
          <p className="nb-fct-ftag">Private 1031 exchange matching for investors/property owners and their agents.</p>
        </div>

        <div className="nb-fct-fcol">
          <h4>Platform</h4>
          <ul>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#agents">For Agents</a></li>
            <li><a href="#why">Why Join</a></li>
            <li><a href="#resources">Resources</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Get Started</h4>
          <ul>
            <li><a href="/signup">Join Free</a></li>
            <li><a href="/book-demo">Book a Demo</a></li>
            <li><a href="/landlords">For Property Owners</a></li>
            <li><a href="/login">Log In</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Support</h4>
          <ul>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="mailto:support@1031exchangeup.com">Contact Us</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Stay Up to Date</h4>
          <form className="nb-fct-sub-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <button type="submit" className="nb-fct-sub-btn">Subscribe</button>
          </form>
        </div>
      </div>
    </div>

    <div className="nb-fct-fbottom">
      <span className="nb-fct-copy">© 2025 1031ExchangeUp™. All rights reserved.</span>
    </div>
  </footer>
</section>
  );
}



export function LandingSections() {
  return (
    <>
      <style>{EXTRA_CSS}</style>
      <Sec_resources />
      <Sec_why />
      <Sec_faqcta />

    </>
  );
}

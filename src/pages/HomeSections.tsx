import { useState } from "react";
import {
  LayoutDashboard, Users, Sparkles, MessageSquare, Settings, Pencil, Link2, Plus,
  SlidersHorizontal, Calendar, ChevronDown, Share2, LayoutGrid, Paperclip, Lightbulb,
} from "lucide-react";

/* AUTO-ASSEMBLED landing sections (navy+green brand). Person/expert photos are placeholders. */

export const SECTIONS_CSS = "[data-nb] .nb-prob-line{color:#43a047;font-weight:800;font-size:18px;letter-spacing:-.01em;margin-top:22px}\n[data-nb] .nb-prob-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}\n[data-nb] .nb-prob-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}\n[data-nb] .nb-prob-ico{width:62px;height:62px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e8edf3;box-shadow:0 2px 12px rgba(14,42,77,.06)}\n[data-nb] .nb-prob-ico svg{width:34px;height:34px;stroke:#16284a;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}\n[data-nb] .nb-prob-label{font-size:13px;line-height:1.45;color:#56657a;font-weight:600;max-width:140px}\n@media (max-width:900px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr);gap:28px 16px}\n}\n@media (max-width:480px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr)}\n}\n\n[data-nb] #meet{background:linear-gradient(135deg,#eef3fb,#e3edf8);}\n[data-nb] .nb-meet-btn{display:inline-flex;align-items:center;gap:12px;height:54px;padding:0 26px;border-radius:12px;background:#43a047;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.01em;border:none;cursor:pointer;box-shadow:0 8px 22px rgba(67,160,71,.22);transition:background .15s ease,transform .15s ease,box-shadow .15s ease;}\n[data-nb] .nb-meet-btn:hover{background:#3a8c3e;transform:translateY(-1px);box-shadow:0 12px 28px rgba(67,160,71,.28);}\n[data-nb] .nb-meet-play{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}\n[data-nb] .nb-meet-flow{display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:6px;}\n[data-nb] .nb-meet-step{display:flex;flex-direction:column;align-items:center;text-align:center;width:124px;}\n[data-nb] .nb-meet-circle{width:96px;height:96px;border-radius:50%;background:#fff;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(14,42,77,.08);}\n[data-nb] .nb-meet-circle svg{width:38px;height:38px;}\n[data-nb] .nb-meet-circle-done{border-color:#cdeccf;background:#f3faf3;}\n[data-nb] .nb-meet-label{margin-top:14px;font-size:13.5px;font-weight:700;color:#16284a;letter-spacing:-.01em;line-height:1.3;}\n[data-nb] .nb-meet-arrow{align-self:center;margin-top:34px;color:#9fb0c8;font-size:24px;font-weight:400;line-height:1;flex-shrink:0;}\n@media (max-width:1100px){\n[data-nb] .nb-meet-arrow{display:none;}\n[data-nb] .nb-meet-flow{gap:24px 18px;}\n}\n\n[data-nb] .nb-how-grid{margin-top:48px}\n[data-nb] .nb-how-card{position:relative;background:#fff;border:1px solid #e8edf3;border-radius:14px;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:36px 26px 30px;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}\n[data-nb] .nb-how-card:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(14,42,77,.10);border-color:#dde6f1}\n[data-nb] .nb-how-num{position:absolute;top:-14px;left:26px;width:28px;height:28px;border-radius:50%;background:#43a047;color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(67,160,71,.35)}\n[data-nb] .nb-how-icon{width:54px;height:54px;border-radius:13px;background:#eef3fb;display:flex;align-items:center;justify-content:center;margin-bottom:22px;margin-top:6px}\n[data-nb] .nb-how-icon svg{width:28px;height:28px;stroke:#16284a;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}\n[data-nb] .nb-how-title{font-size:18px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin-bottom:10px}\n[data-nb] .nb-how-desc{font-size:15px;line-height:1.55;color:#56657a}\n\n[data-nb] #who { background: #ffffff; }\n\n[data-nb] .nb-who-head {\n  text-align: center;\n  max-width: 720px;\n  margin: 0 auto 56px;\n}\n[data-nb] .nb-who-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 24px;\n}\n@media (max-width: 900px) {\n  [data-nb] .nb-who-grid { grid-template-columns: 1fr; }\n}\n\n[data-nb] .nb-who-card {\n  border-radius: 16px;\n  padding: 28px;\n  display: flex;\n  flex-direction: column;\n  border: 1px solid #e8edf3;\n  box-shadow: 0 2px 12px rgba(14,42,77,.06);\n  transition: transform .18s ease, box-shadow .18s ease;\n}\n[data-nb] .nb-who-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 28px rgba(14,42,77,.10);\n}\n[data-nb] .nb-who-card--blue   { background: #eff4fb; }\n[data-nb] .nb-who-card--green  { background: #eef6ef; }\n[data-nb] .nb-who-card--orange { background: #fbf3ea; }\n\n[data-nb] .nb-who-icon {\n  width: 56px;\n  height: 56px;\n  border-radius: 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin-bottom: 20px;\n  background: #ffffff;\n  box-shadow: 0 2px 10px rgba(14,42,77,.07);\n}\n[data-nb] .nb-who-icon svg { width: 28px; height: 28px; }\n[data-nb] .nb-who-card--blue   .nb-who-icon svg { color: #2f6fd0; }\n[data-nb] .nb-who-card--green  .nb-who-icon svg { color: #43a047; }\n[data-nb] .nb-who-card--orange .nb-who-icon svg { color: #e08a2b; }\n\n[data-nb] .nb-who-title {\n  font-weight: 800;\n  font-size: 22px;\n  letter-spacing: -.02em;\n  color: #16284a;\n  margin: 0 0 18px;\n}\n\n[data-nb] .nb-who-list {\n  list-style: none;\n  margin: 0 0 26px;\n  padding: 0;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n[data-nb] .nb-who-li {\n  display: flex;\n  align-items: center;\n  gap: 11px;\n  font-size: 15.5px;\n  color: #56657a;\n  line-height: 1.4;\n}\n[data-nb] .nb-who-check {\n  flex: none;\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n  background: #43a047;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n[data-nb] .nb-who-check svg { width: 12px; height: 12px; color: #ffffff; }\n\n[data-nb] .nb-who-link {\n  margin-top: auto;\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  font-weight: 700;\n  font-size: 15px;\n  color: #16284a;\n  text-decoration: none;\n  letter-spacing: -.01em;\n  transition: color .15s ease, gap .15s ease;\n}\n[data-nb] .nb-who-link:hover {\n  color: #43a047;\n  gap: 11px;\n}\n[data-nb] .nb-who-link span { transition: transform .15s ease; }\n\n[data-nb] .nb-why-wrap{background:linear-gradient(160deg,#13294e 0%,#0e2a4d 100%);border-radius:28px;color:#fff;}\n[data-nb] .nb-why-h2{font-size:clamp(28px,3.4vw,42px);font-weight:800;line-height:1.1;letter-spacing:-.02em;color:#fff;margin:0 0 28px;}\n[data-nb] .nb-why-h2 .nb-why-up{color:#5cc15f;}\n[data-nb] .nb-why-list{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px;}\n@media (max-width:640px){[data-nb] .nb-why-list{grid-template-columns:1fr;}}\n[data-nb] .nb-why-item{display:flex;align-items:flex-start;gap:12px;}\n[data-nb] .nb-why-check{flex:0 0 24px;width:24px;height:24px;border-radius:7px;background:rgba(92,193,95,.16);display:flex;align-items:center;justify-content:center;margin-top:1px;}\n[data-nb] .nb-why-check svg{display:block;}\n[data-nb] .nb-why-item span{font-size:16px;font-weight:600;color:#eaf1fb;line-height:1.35;}\n[data-nb] .nb-why-card{background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(8,22,45,.35);padding:34px 32px;}\n@media (max-width:640px){[data-nb] .nb-why-card{padding:26px 22px;}}\n[data-nb] .nb-why-card-title{font-size:23px;font-weight:800;letter-spacing:-.02em;color:#16284a;text-align:center;line-height:1.2;margin:0 0 10px;}\n[data-nb] .nb-why-card-sub{font-size:14px;color:#56657a;text-align:center;line-height:1.55;margin:0 auto 26px;max-width:380px;}\n[data-nb] .nb-why-inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:22px;}\n@media (max-width:560px){[data-nb] .nb-why-inputs{grid-template-columns:1fr;}}\n[data-nb] .nb-why-field{display:flex;flex-direction:column;gap:7px;}\n[data-nb] .nb-why-label{font-size:12.5px;font-weight:700;color:#16284a;letter-spacing:-.01em;}\n[data-nb] .nb-why-input{position:relative;display:flex;align-items:center;border:1px solid #e8edf3;border-radius:10px;background:#fff;height:48px;padding:0 12px;transition:border-color .15s,box-shadow .15s;}\n[data-nb] .nb-why-input:focus-within{border-color:#43a047;box-shadow:0 0 0 3px rgba(67,160,71,.14);}\n[data-nb] .nb-why-input .nb-why-dollar{color:#56657a;font-weight:700;font-size:15px;margin-right:4px;}\n[data-nb] .nb-why-input input{border:0;outline:0;width:100%;font-family:inherit;font-size:15px;font-weight:700;color:#16284a;background:transparent;}\n[data-nb] .nb-why-calc{width:100%;height:50px;border:0;border-radius:10px;background:#43a047;color:#fff;font-family:inherit;font-size:16px;font-weight:800;letter-spacing:-.01em;cursor:pointer;transition:background .15s;}\n[data-nb] .nb-why-calc:hover{background:#3a8c3e;}\n\n[data-nb] .nb-diff-wrap{display:grid;grid-template-columns:1fr;gap:56px;align-items:center}\n@media(min-width:980px){[data-nb] .nb-diff-wrap{grid-template-columns:1fr 1.05fr;gap:64px}}\n\n/* ---- LEFT: device mockup ---- */\n[data-nb] .nb-diff-devices{position:relative;width:100%;max-width:540px;margin:0 auto;aspect-ratio:5/4}\n[data-nb] .nb-diff-glow{position:absolute;inset:8% 6%;background:radial-gradient(60% 60% at 40% 35%,rgba(67,160,71,.16),rgba(238,243,251,0) 70%);filter:blur(8px);z-index:0}\n\n/* laptop */\n[data-nb] .nb-diff-laptop{position:absolute;top:6%;left:0;width:84%;z-index:1;filter:drop-shadow(0 18px 40px rgba(14,42,77,.16))}\n[data-nb] .nb-diff-laptop-screen{background:#fff;border:1px solid #e8edf3;border-radius:14px 14px 4px 4px;padding:14px;border-bottom:none}\n[data-nb] .nb-diff-laptop-bar{display:flex;gap:6px;margin-bottom:14px}\n[data-nb] .nb-diff-dot{width:9px;height:9px;border-radius:50%;background:#dfe6f0}\n[data-nb] .nb-diff-dot.g{background:#cfe4d0}\n[data-nb] .nb-diff-laptop-base{height:14px;background:linear-gradient(#eef3fb,#dde6f1);border:1px solid #e8edf3;border-top:none;border-radius:0 0 12px 12px;margin:0 -2px;position:relative}\n[data-nb] .nb-diff-laptop-base::after{content:\"\";position:absolute;top:0;left:50%;transform:translateX(-50%);width:26%;height:5px;background:#cdd8e6;border-radius:0 0 6px 6px}\n\n/* phone */\n[data-nb] .nb-diff-phone{position:absolute;right:-2%;bottom:-2%;width:34%;z-index:2;background:#fff;border:1px solid #e8edf3;border-radius:22px;padding:10px;filter:drop-shadow(0 16px 34px rgba(14,42,77,.20))}\n[data-nb] .nb-diff-phone-notch{width:34%;height:5px;background:#dfe6f0;border-radius:6px;margin:2px auto 12px}\n\n/* mock rows shared */\n[data-nb] .nb-diff-mock-row{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #eef3fb;border-radius:9px;margin-bottom:8px;background:#fbfdff}\n[data-nb] .nb-diff-mock-thumb{width:34px;height:34px;border-radius:7px;background:linear-gradient(135deg,#e7eef8,#dde7f3);flex:none}\n[data-nb] .nb-diff-mock-lines{flex:1;display:flex;flex-direction:column;gap:6px}\n[data-nb] .nb-diff-ml{height:7px;border-radius:4px;background:#e3eaf4}\n[data-nb] .nb-diff-ml.short{width:55%}\n[data-nb] .nb-diff-ml.tiny{width:32%;background:#cfe4d0}\n[data-nb] .nb-diff-mock-pill{width:30px;height:14px;border-radius:7px;background:#e6f2e7;flex:none}\n[data-nb] .nb-diff-phone .nb-diff-mock-row{padding:7px;margin-bottom:6px}\n[data-nb] .nb-diff-phone .nb-diff-mock-thumb{width:26px;height:26px}\n\n/* ---- RIGHT: comparison table ---- */\n[data-nb] .nb-diff-table{border:1px solid #e8edf3;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(14,42,77,.06);background:#fff}\n[data-nb] .nb-diff-thead{display:grid;grid-template-columns:1fr 1fr}\n[data-nb] .nb-diff-th{display:flex;align-items:center;gap:10px;padding:18px 20px;font-weight:800;font-size:15px;letter-spacing:-.01em;color:#fff}\n[data-nb] .nb-diff-th.trad{background:#16284a}\n[data-nb] .nb-diff-th.us{background:#43a047}\n[data-nb] .nb-diff-badge{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}\n[data-nb] .nb-diff-badge.x{background:rgba(255,255,255,.14)}\n[data-nb] .nb-diff-badge.c{background:rgba(255,255,255,.22)}\n\n[data-nb] .nb-diff-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eef3fb}\n[data-nb] .nb-diff-cell{padding:16px 20px;font-size:14.5px;display:flex;align-items:center;gap:10px;min-height:60px}\n[data-nb] .nb-diff-cell.left{color:#8794a6;border-right:1px solid #eef3fb}\n[data-nb] .nb-diff-cell.right{color:#16284a;font-weight:600}\n[data-nb] .nb-diff-cell.right svg{flex:none}\n[data-nb] .nb-diff-cell.left svg{flex:none;opacity:.6}\n@media(max-width:520px){\n [data-nb] .nb-diff-cell{padding:13px 14px;font-size:13.5px}\n [data-nb] .nb-diff-th{padding:15px;font-size:14px}\n}\n\n[data-nb] .nb-res-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}\n@media (max-width:980px){[data-nb] .nb-res-grid{grid-template-columns:1fr}}\n\n[data-nb] .nb-res-card{background:#fff;border:1px solid #e8edf3;border-radius:14px;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:32px;display:flex;flex-direction:column}\n[data-nb] .nb-res-title{font-size:20px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin:0 0 20px}\n\n[data-nb] .nb-res-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}\n[data-nb] .nb-res-li{display:flex;align-items:flex-start;gap:12px;font-size:15px;color:#56657a;line-height:1.4}\n[data-nb] .nb-res-li svg{flex:0 0 auto;margin-top:1px}\n[data-nb] .nb-res-li strong{color:#16284a;font-weight:700}\n[data-nb] .nb-res-link{margin-top:24px;font-size:15px;font-weight:700;color:#43a047;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:color .15s}\n[data-nb] .nb-res-link:hover{color:#3a8c3e}\n\n[data-nb] .nb-res-experts{display:flex;flex-direction:column;gap:18px}\n[data-nb] .nb-res-expert{display:flex;align-items:center;gap:14px}\n[data-nb] .nb-res-avatar{flex:0 0 auto;width:52px;height:52px;border-radius:50%;background:#eef3fb;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#16284a;letter-spacing:-.01em}\n[data-nb] .nb-res-ename{font-size:15px;font-weight:700;color:#16284a;line-height:1.3}\n[data-nb] .nb-res-erole{font-size:13px;color:#56657a;margin-top:2px}\n\n[data-nb] .nb-res-dark{background:#0e2a4d;border-color:#0e2a4d;box-shadow:0 12px 32px rgba(14,42,77,.22)}\n[data-nb] .nb-res-dark .nb-res-title{color:#fff}\n[data-nb] .nb-res-clist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:13px}\n[data-nb] .nb-res-cli{display:flex;align-items:center;gap:12px;font-size:15px;color:#d8e2f0;line-height:1.35}\n[data-nb] .nb-res-check{flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:rgba(92,193,95,.16);display:flex;align-items:center;justify-content:center}\n[data-nb] .nb-res-dark .nb-res-btn{margin-top:26px;width:100%;justify-content:center}\n[data-nb] .nb-res-cap{margin-top:14px;text-align:center;font-size:13px;font-weight:700;color:#5cc15f;letter-spacing:.01em}\n\n/* ===== FAQ + CTA + FOOTER ===== */\n[data-nb] .nb-fct-wrap{ display:flex; flex-direction:column; gap:0; }\n\n/* (A) heading */\n[data-nb] .nb-fct-head{ text-align:center; max-width:760px; margin:0 auto; }\n\n/* (B) accordion */\n[data-nb] .nb-fct-acc{ max-width:840px; margin:40px auto 0; display:flex; flex-direction:column; gap:14px; }\n[data-nb] .nb-fct-item{\n  background:#fff; border:1px solid #e8edf3; border-radius:14px;\n  box-shadow:0 2px 12px rgba(14,42,77,.06); overflow:hidden;\n  transition:border-color .2s ease, box-shadow .2s ease;\n}\n[data-nb] .nb-fct-item[open]{ border-color:#d4e4d5; box-shadow:0 6px 22px rgba(14,42,77,.09); }\n[data-nb] .nb-fct-q{\n  list-style:none; cursor:pointer; display:flex; align-items:center;\n  justify-content:space-between; gap:18px; padding:22px 26px;\n  font-weight:800; font-size:17px; color:#16284a; letter-spacing:-.01em;\n  user-select:none;\n}\n[data-nb] .nb-fct-q::-webkit-details-marker{ display:none; }\n[data-nb] .nb-fct-q:hover{ color:#0e2a4d; }\n[data-nb] .nb-fct-plus{\n  flex:0 0 auto; width:30px; height:30px; border-radius:8px;\n  background:#eef3fb; display:flex; align-items:center; justify-content:center;\n  color:#43a047; transition:transform .25s ease, background .2s ease;\n}\n[data-nb] .nb-fct-item[open] .nb-fct-plus{ transform:rotate(45deg); background:#e3f1e4; }\n[data-nb] .nb-fct-plus svg{ width:16px; height:16px; display:block; }\n[data-nb] .nb-fct-a{\n  padding:0 26px 24px; color:#56657a; font-size:15.5px; line-height:1.65; max-width:680px;\n}\n[data-nb] .nb-fct-viewall{ text-align:center; margin-top:30px; }\n[data-nb] .nb-fct-viewall a{\n  color:#43a047; font-weight:700; font-size:15px; text-decoration:none;\n  display:inline-flex; align-items:center; gap:7px; transition:gap .2s ease, color .2s ease;\n}\n[data-nb] .nb-fct-viewall a:hover{ gap:11px; color:#3a8c3e; }\n\n/* (C) CTA band */\n[data-nb] .nb-fct-cta{\n  max-width:1100px; margin:70px auto 0; border-radius:24px; overflow:hidden;\n  position:relative; text-align:center; padding:64px 32px 60px;\n  background:\n    radial-gradient(120% 140% at 50% -20%, rgba(92,193,95,.22) 0%, rgba(92,193,95,0) 55%),\n    linear-gradient(180deg, #16284a 0%, #0e2a4d 100%);\n  box-shadow:0 24px 60px rgba(14,42,77,.28);\n}\n[data-nb] .nb-fct-cta::after{\n  content:\"\"; position:absolute; left:0; right:0; bottom:0; height:46%;\n  background:\n    linear-gradient(180deg, rgba(14,42,77,0) 0%, rgba(8,20,38,.55) 100%),\n    repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 26px);\n  -webkit-mask:linear-gradient(180deg, transparent, #000 40%);\n  mask:linear-gradient(180deg, transparent, #000 40%);\n  pointer-events:none;\n}\n[data-nb] .nb-fct-cta > *{ position:relative; z-index:1; }\n[data-nb] .nb-fct-cta-h{\n  color:#fff; font-weight:800; letter-spacing:-.02em; font-size:38px; line-height:1.1; margin:0;\n}\n[data-nb] .nb-fct-cta-sub{ color:#c4d2e6; font-size:17px; line-height:1.6; max-width:560px; margin:16px auto 0; }\n[data-nb] .nb-fct-cta-btns{ display:flex; flex-wrap:wrap; gap:14px; justify-content:center; margin-top:32px; }\n[data-nb] .nb-fct-btn{\n  height:52px; padding:0 26px; border-radius:11px; font-weight:700; font-size:15.5px;\n  display:inline-flex; align-items:center; justify-content:center; gap:9px;\n  cursor:pointer; border:1px solid transparent; transition:all .2s ease; text-decoration:none;\n}\n[data-nb] .nb-fct-btn-green{ background:#43a047; color:#fff; box-shadow:0 8px 20px rgba(67,160,71,.35); }\n[data-nb] .nb-fct-btn-green:hover{ background:#3a8c3e; transform:translateY(-1px); }\n[data-nb] .nb-fct-btn-out{ background:transparent; color:#fff; border-color:rgba(255,255,255,.45); }\n[data-nb] .nb-fct-btn-out:hover{ background:rgba(255,255,255,.1); border-color:#fff; }\n[data-nb] .nb-fct-social-proof{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:34px; flex-wrap:wrap; }\n[data-nb] .nb-fct-avatars{ display:flex; }\n[data-nb] .nb-fct-avatars span{\n  width:34px; height:34px; border-radius:50%; border:2px solid #16284a; margin-left:-10px;\n  display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:12px;\n}\n[data-nb] .nb-fct-avatars span:first-child{ margin-left:0; }\n[data-nb] .nb-fct-avatars span:nth-child(1){ background:#5cc15f; }\n[data-nb] .nb-fct-avatars span:nth-child(2){ background:#43a047; }\n[data-nb] .nb-fct-avatars span:nth-child(3){ background:#2f7bb5; }\n[data-nb] .nb-fct-avatars span:nth-child(4){ background:#3a8c3e; }\n[data-nb] .nb-fct-proof-txt{ color:#c4d2e6; font-size:14px; }\n\n/* FOOTER */\n[data-nb] .nb-fct-footer{ margin:80px -20px 0; background:#0e2a4d; }\n@media (min-width:640px){ [data-nb] .nb-fct-footer{ margin-left:-32px; margin-right:-32px; } }\n[data-nb] .nb-fct-footer-inner{ max-width:1240px; margin:0 auto; padding:72px 20px 0; }\n[data-nb] .nb-fct-fgrid{ display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr 1.4fr; gap:40px; }\n@media (max-width:960px){ [data-nb] .nb-fct-fgrid{ grid-template-columns:1fr 1fr; gap:36px; } }\n@media (max-width:520px){ [data-nb] .nb-fct-fgrid{ grid-template-columns:1fr; } }\n[data-nb] .nb-fct-flogo{ color:#fff; font-weight:800; font-size:22px; letter-spacing:-.02em; }\n[data-nb] .nb-fct-flogo b{ color:#5cc15f; }\n[data-nb] .nb-fct-ftag{ color:#9fb2cc; font-size:14.5px; line-height:1.6; margin-top:14px; max-width:300px; }\n[data-nb] .nb-fct-fcol h4{ color:#fff; font-size:14px; font-weight:800; letter-spacing:.02em; margin:0 0 16px; }\n[data-nb] .nb-fct-fcol ul{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:11px; }\n[data-nb] .nb-fct-fcol a{ color:#9fb2cc; font-size:14.5px; text-decoration:none; transition:color .2s ease; }\n[data-nb] .nb-fct-fcol a:hover{ color:#fff; }\n[data-nb] .nb-fct-sub-form{ display:flex; gap:8px; margin-top:4px; }\n[data-nb] .nb-fct-sub-form input{\n  flex:1 1 auto; min-width:0; height:44px; border-radius:9px; border:1px solid #2a456e;\n  background:#16284a; color:#fff; padding:0 14px; font-size:14px; outline:none;\n}\n[data-nb] .nb-fct-sub-form input::placeholder{ color:#7e93b3; }\n[data-nb] .nb-fct-sub-form input:focus{ border-color:#43a047; }\n[data-nb] .nb-fct-sub-btn{\n  height:44px; padding:0 18px; border-radius:9px; border:none; background:#43a047; color:#fff;\n  font-weight:700; font-size:14px; cursor:pointer; transition:background .2s ease; white-space:nowrap;\n}\n[data-nb] .nb-fct-sub-btn:hover{ background:#3a8c3e; }\n[data-nb] .nb-fct-fbottom{\n  max-width:1240px; margin:48px auto 0; padding:24px 20px 28px; border-top:1px solid #1d3a60;\n  display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap;\n}\n[data-nb] .nb-fct-fsocial{ display:flex; gap:12px; }\n[data-nb] .nb-fct-fsocial a{\n  width:36px; height:36px; border-radius:9px; background:#16284a; color:#9fb2cc;\n  display:flex; align-items:center; justify-content:center; transition:all .2s ease;\n}\n[data-nb] .nb-fct-fsocial a:hover{ background:#43a047; color:#fff; }\n[data-nb] .nb-fct-fsocial svg{ width:17px; height:17px; }\n[data-nb] .nb-fct-copy{ color:#7e93b3; font-size:13.5px; }\n@media (max-width:640px){\n  [data-nb] .nb-fct-cta-h{ font-size:30px; }\n  [data-nb] .nb-fct-fbottom{ justify-content:center; text-align:center; }\n} [data-nb] .nb-fct-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:stretch} [data-nb] .nb-fct-left{min-width:0;display:flex;flex-direction:column} [data-nb] .nb-fct-head{text-align:left;max-width:none;margin:0} [data-nb] .nb-fct-acc{max-width:none;margin:28px 0 0} [data-nb] .nb-fct-viewall{text-align:left;margin-top:26px} [data-nb] .nb-fct-cta{max-width:none;margin:0;text-align:left;padding:48px 40px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(160deg,rgba(14,42,77,.82),rgba(11,31,61,.93)),url(/hero-skyline.jpg) center/cover no-repeat} [data-nb] .nb-fct-cta::after{display:none} [data-nb] .nb-fct-cta-h{font-size:32px} [data-nb] .nb-fct-cta-sub{margin:16px 0 0;max-width:none} [data-nb] .nb-fct-cta-btns{justify-content:flex-start} [data-nb] .nb-fct-social-proof{justify-content:flex-start} [data-nb] .nb-res-avatar{display:block;background:#eef3fb;object-fit:cover;object-position:center 22%;overflow:hidden} @media (max-width:900px){[data-nb] .nb-fct-grid{grid-template-columns:1fr;gap:34px} [data-nb] .nb-fct-cta{padding:40px 26px}} [data-nb] .nb-meet-step{width:106px} [data-nb] .nb-meet-circle{width:82px;height:82px} [data-nb] .nb-meet-circle svg{width:32px;height:32px} [data-nb] .nb-meet-label{font-size:12.5px;margin-top:12px} [data-nb] .nb-meet-arrow{margin-top:30px;font-size:20px} [data-nb] .nb-prob-head{max-width:640px;margin:0 0 46px} [data-nb] .nb-prob-item{background:#f7f9fc;border:1px solid #e8edf3;border-radius:16px;padding:26px 18px 24px;gap:16px} [data-nb] .nb-prob-ico{background:#ffffff;border-color:#e8edf3} [data-nb] .nb-prob-label{max-width:none} @media (max-width:900px){[data-nb] .nb-prob-head{margin-bottom:36px}} [data-nb] .nb-diff-mock-name{font-size:8.5px;font-weight:700;color:#16284a;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis} [data-nb] .nb-diff-mock-loc{font-size:7px;color:#8794a6;margin-top:2px;white-space:nowrap} [data-nb] .nb-diff-mock-score{font-size:8px;font-weight:800;color:#2f7a33;background:#e3f1e4;border-radius:6px;padding:3px 5px;flex:none;line-height:1} [data-nb] .nb-diff-mock-thumb{background:linear-gradient(135deg,#8fabd0,#6a89b5)} [data-nb] .nb-who-card--blue,[data-nb] .nb-who-card--green,[data-nb] .nb-who-card--orange{background:#ffffff;border-color:#e8edf3} [data-nb] .nb-how-card,[data-nb] .nb-res-card{border-radius:16px} [data-nb] .nb-why-result{margin-top:20px;padding-top:20px;border-top:1px solid #e8edf3} [data-nb] .nb-why-result-top{display:flex;align-items:center;gap:14px} [data-nb] .nb-why-roe-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:40px;font-weight:800;letter-spacing:-.02em;line-height:1} [data-nb] .nb-why-result-meta{display:flex;flex-direction:column;gap:5px} [data-nb] .nb-why-result-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8794a6} [data-nb] .nb-why-verdict{align-self:flex-start;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px} [data-nb] .nb-why-verdict[data-tone=low]{background:rgba(184,84,58,.12);color:#a8482f} [data-nb] .nb-why-verdict[data-tone=mid]{background:rgba(22,40,74,.1);color:#16284a} [data-nb] .nb-why-verdict[data-tone=high]{background:rgba(67,160,71,.14);color:#2f7a33} [data-nb] .nb-why-result-note{margin-top:14px;font-size:13.5px;line-height:1.55;color:#56657a} [data-nb] .nb-why-result-note b{color:#16284a;font-weight:700} [data-nb] .nb-why-fine{margin-top:10px;font-size:11px;color:#9fb0c8} [data-nb] .nb-diff-urlbar{margin-left:8px;flex:1;height:15px;border-radius:5px;background:#eef3fb;font-size:7px;color:#8794a6;display:flex;align-items:center;padding:0 8px;font-family:'Plus Jakarta Sans',sans-serif} [data-nb] .nb-diff-app-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px} [data-nb] .nb-diff-app-kicker{font-size:7px;font-weight:800;letter-spacing:.12em;color:#43a047} [data-nb] .nb-diff-app-title{font-size:13px;font-weight:800;color:#16284a;letter-spacing:-.02em;margin-top:3px} [data-nb] .nb-diff-app-live{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;color:#2f7a33;background:#e3f1e4;padding:3px 7px;border-radius:999px;white-space:nowrap;flex:none} [data-nb] .nb-diff-app-livedot{width:5px;height:5px;border-radius:999px;background:#43a047} [data-nb] .nb-diff-app-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px} [data-nb] .nb-diff-kpi{background:#f7f9fc;border:1px solid #eef3fb;border-radius:9px;padding:8px 9px} [data-nb] .nb-diff-kpi b{display:block;font-size:14px;font-weight:800;color:#16284a;letter-spacing:-.02em;line-height:1} [data-nb] .nb-diff-kpi span{display:block;font-size:6.5px;color:#8794a6;margin-top:3px} [data-nb] .nb-diff-matches{display:flex;flex-direction:column;gap:8px} [data-nb] .nb-diff-match{display:flex;align-items:center;gap:9px;padding:8px;border:1px solid #eef3fb;border-radius:10px;background:#fff;box-shadow:0 1px 3px rgba(14,42,77,.04)} [data-nb] .nb-diff-match-thumb{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8fabd0,#5f7fae);flex:none} [data-nb] .nb-diff-match-body{flex:1;min-width:0} [data-nb] .nb-diff-match-name{font-size:9px;font-weight:700;color:#16284a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1} [data-nb] .nb-diff-match-meta{display:flex;align-items:center;gap:5px;font-size:7.5px;color:#8794a6;margin-top:3px;white-space:nowrap} [data-nb] .nb-diff-match-roe{color:#2f7a33;font-weight:700;background:#e3f1e4;padding:1px 5px;border-radius:999px} [data-nb] .nb-diff-match-score{flex:none;width:32px;height:32px;border-radius:999px;background:#e3f1e4;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;color:#2f7a33} [data-nb] .nb-diff-match-score i{font-style:normal;font-size:6.5px;font-weight:700;margin-left:.5px} [data-nb] .nb-diff-pfhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 2px} [data-nb] .nb-diff-pf-title{font-size:11px;font-weight:800;color:#16284a;letter-spacing:-.02em} [data-nb] .nb-diff-phone .nb-diff-match{padding:6px 7px;gap:7px} [data-nb] .nb-diff-phone .nb-diff-match-thumb{width:26px;height:26px;border-radius:6px} [data-nb] .nb-diff-phone .nb-diff-match-name{font-size:8px} [data-nb] .nb-diff-phone .nb-diff-match-meta{font-size:6.5px} [data-nb] .nb-diff-phone .nb-diff-match-score{width:26px;height:26px;font-size:9px} @media (max-width:900px){ [data-nb] .nb-prob-grid{gap:12px} [data-nb] .nb-prob-item{flex-direction:row;text-align:left;align-items:center;gap:14px;background:#f7f9fc;border:1px solid #eef3fb;border-radius:14px;padding:12px 16px} [data-nb] .nb-prob-ico{width:46px;height:46px;flex:none;border-radius:11px} [data-nb] .nb-prob-ico svg{width:25px;height:25px} [data-nb] .nb-prob-label{max-width:none;font-size:14px} } @media (max-width:640px){ [data-nb] .nb-prob-grid{grid-template-columns:1fr} } @media (max-width:640px){ [data-nb] .nb-h2,[data-nb] .nb-lead{text-align:center} [data-nb] .nb-prob-line{text-align:center} [data-nb] .nb-meet-btn{display:flex;width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-how-card{text-align:center} [data-nb] .nb-how-icon{margin-left:auto;margin-right:auto} [data-nb] .nb-how-num{left:50%;transform:translateX(-50%)} [data-nb] .nb-who-card{text-align:center} [data-nb] .nb-who-icon{margin-left:auto;margin-right:auto} [data-nb] .nb-who-list{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-who-link{align-self:center} [data-nb] .nb-why-h2{text-align:center} [data-nb] .nb-why-list{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-res-title{text-align:center} [data-nb] .nb-res-list,[data-nb] .nb-res-experts,[data-nb] .nb-res-clist{width:fit-content;margin-left:auto;margin-right:auto} [data-nb] .nb-res-link{align-self:center} [data-nb] .nb-res-cap{text-align:center} [data-nb] .nb-fct-head{text-align:center} [data-nb] .nb-fct-viewall{text-align:center} [data-nb] .nb-fct-cta{text-align:center} [data-nb] .nb-fct-cta-sub{margin-left:auto;margin-right:auto} [data-nb] .nb-fct-cta-btns{justify-content:center} [data-nb] .nb-fct-social-proof{justify-content:center} [data-nb] .nb-fct-fgrid{text-align:center} [data-nb] .nb-fct-ftag{margin-left:auto;margin-right:auto} }";

function Sec_problem() {
  return (
<section id="problem" className="bg-white">
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20 sm:py-24">
    <div className="nb-prob-head">
      <h2 className="nb-h2">The 1031 Exchange Process Is Broken</h2>
      <p className="nb-lead mt-4">Outdated processes, limited inventory, and disconnected professionals make successful exchanges harder than they should be.</p>
      <p className="nb-prob-line">There has to be a better way.</p>
    </div>

    <div className="nb-prob-grid">
        {/* 1 — magnifying glass */}
        <div className="nb-prob-item">
          <div className="nb-prob-ico">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
          </div>
          <div className="nb-prob-label">Buyers can&rsquo;t find replacement properties.</div>
        </div>

        {/* 2 — target / bullseye */}
        <div className="nb-prob-item">
          <div className="nb-prob-ico">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="#16284a" stroke="none"/></svg>
          </div>
          <div className="nb-prob-label">Great opportunities never hit the market.</div>
        </div>

        {/* 3 — lightbulb */}
        <div className="nb-prob-item">
          <div className="nb-prob-ico">
            <svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2H14.5c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z"/></svg>
          </div>
          <div className="nb-prob-label">Agents work in silos.</div>
        </div>

        {/* 4 — clock */}
        <div className="nb-prob-item">
          <div className="nb-prob-ico">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>
          </div>
          <div className="nb-prob-label">The 45-day deadline creates enormous pressure.</div>
        </div>

        {/* 5 — person with question */}
        <div className="nb-prob-item">
          <div className="nb-prob-ico">
            <svg viewBox="0 0 24 24"><circle cx="9" cy="7.5" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M17 8.2a2 2 0 1 1 2.6 1.9c-.7.3-1.1.8-1.1 1.6"/><line x1="18.5" y1="14.4" x2="18.5" y2="14.5"/></svg>
          </div>
          <div className="nb-prob-label">Landlords don&rsquo;t know where to start.</div>
        </div>
      </div>
    </div>
</section>
  );
}

function Sec_meet() {
  return (
<section id="meet">
  <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

      <div className="max-w-xl">
        <h2 className="nb-h2">Meet 1031Exchange<span style={{ color: '#43a047' }}>Up</span></h2>
        <p className="nb-lead mt-5">The first AI-powered matchmaking platform designed specifically to streamline the 1031 exchange process.</p>
        <a href="#how" className="nb-meet-btn mt-8">
          <span className="nb-meet-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </span>
          See How It Works
        </a>
      </div>

      <div className="nb-meet-flow">
        <div className="nb-meet-step">
          <div className="nb-meet-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16284a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 18a4 4 0 0 1-.8-7.92A5.5 5.5 0 0 1 17 8.5a3.5 3.5 0 0 1 1.5 6.66" />
              <path d="M12 13v6" />
              <path d="M9 15.5 12 12.5l3 3" />
            </svg>
          </div>
          <div className="nb-meet-label">Upload Property</div>
        </div>

        <div className="nb-meet-arrow" aria-hidden="true">&rarr;</div>

        <div className="nb-meet-step">
          <div className="nb-meet-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16284a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.5 4.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0-1.5 4.3A2.5 2.5 0 0 0 7 15.8 2.5 2.5 0 0 0 9.5 19 2 2 0 0 0 12 17V6a2 2 0 0 0-2.5-1.5Z" />
              <path d="M14.5 4.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1 1.5 4.3A2.5 2.5 0 0 1 17 15.8 2.5 2.5 0 0 1 14.5 19 2 2 0 0 1 12 17" />
              <path d="M9 9.5h1.5M15 9.5h-1.5M9 13h1.5" />
            </svg>
          </div>
          <div className="nb-meet-label">AI Finds Matches</div>
        </div>

        <div className="nb-meet-arrow" aria-hidden="true">&rarr;</div>

        <div className="nb-meet-step">
          <div className="nb-meet-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16284a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="2.6" />
              <path d="M4 18.5a5 5 0 0 1 10 0" />
              <circle cx="16.5" cy="9" r="2.2" />
              <path d="M14.5 13.2a4.4 4.4 0 0 1 5.5 4.3" />
            </svg>
          </div>
          <div className="nb-meet-label">Agents Collaborate</div>
        </div>

        <div className="nb-meet-arrow" aria-hidden="true">&rarr;</div>

        <div className="nb-meet-step">
          <div className="nb-meet-circle nb-meet-circle-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="#43a047" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12 2.5 2.5L16 9" />
            </svg>
          </div>
          <div className="nb-meet-label">Exchange Completed</div>
        </div>
      </div>

    </div>
  </div>
</section>
  );
}

function Sec_how() {
  return (
<section id="how" data-nb className="bg-white">
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20 sm:py-24">
    <h2 className="nb-h2 text-center">How It Works</h2>

    <div className="nb-how-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">

      <div className="nb-how-card">
        <span className="nb-how-num">1</span>
        <div className="nb-how-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 className="nb-how-title">Join Free</h3>
        <p className="nb-how-desc">Create your free account in less than 5 minutes</p>
      </div>

      <div className="nb-how-card">
        <span className="nb-how-num">2</span>
        <div className="nb-how-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></svg>
        </div>
        <h3 className="nb-how-title">Add Your Client or Property</h3>
        <p className="nb-how-desc">Input your client criteria or list a property</p>
      </div>

      <div className="nb-how-card">
        <span className="nb-how-num">3</span>
        <div className="nb-how-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 11h5M9.5 13.5h5"/><path d="M9 3v2M12 3v2M15 3v2M9 19v2M12 19v2M15 19v2M3 9h2M3 12h2M3 15h2M19 9h2M19 12h2M19 15h2"/></svg>
        </div>
        <h3 className="nb-how-title">AI Searches the Network</h3>
        <p className="nb-how-desc">Our AI matches against thousands of opportunities</p>
      </div>

      <div className="nb-how-card">
        <span className="nb-how-num">4</span>
        <div className="nb-how-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <h3 className="nb-how-title">Receive Match Alerts</h3>
        <p className="nb-how-desc">Get notified of the best matches in real time</p>
      </div>

    </div>
  </div>
</section>
  );
}

function Sec_who() {
  return (
<section id="who" data-nb className="w-full py-20 sm:py-24" style={{ background: "#eef3fb" }}>
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="nb-who-head">
      <h2 className="nb-h2">Who It's Built For</h2>
    </div>

    <div className="nb-who-grid">
      {/* Real Estate Agents */}
      <div className="nb-who-card nb-who-card--blue">
        <div className="nb-who-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="nb-who-title">Real Estate Agents</h3>
        <ul className="nb-who-list">
          {["More listings", "More buyers", "More referrals", "More commissions"].map((b) => (
            <li className="nb-who-li" key={b}>
              <span className="nb-who-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a className="nb-who-link" href="/signup">Learn More <span aria-hidden="true">&rarr;</span></a>
      </div>

      {/* Property Owners */}
      <div className="nb-who-card nb-who-card--green">
        <div className="nb-who-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V8l9-5 9 5v13" />
            <path d="M3 21h18" />
            <rect x="8" y="13" width="3" height="4" />
            <rect x="13" y="13" width="3" height="4" />
            <path d="M9.5 8.5h5" />
          </svg>
        </div>
        <h3 className="nb-who-title">Property Owners</h3>
        <ul className="nb-who-list">
          {["Find replacement properties", "Reduce stress", "Save time"].map((b) => (
            <li className="nb-who-li" key={b}>
              <span className="nb-who-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a className="nb-who-link" href="/signup">Learn More <span aria-hidden="true">&rarr;</span></a>
      </div>

      {/* Investors */}
      <div className="nb-who-card nb-who-card--orange">
        <div className="nb-who-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-5 4 4 8-8" />
            <polyline points="16 8 21 8 21 13" />
            <path d="M12 21v-3" />
            <path d="M12 18a2 2 0 0 0 2-2c0-1.2-1-1.6-2-2s-2-.8-2-2a2 2 0 0 1 4 0" />
          </svg>
        </div>
        <h3 className="nb-who-title">Investors</h3>
        <ul className="nb-who-list">
          {["Discover opportunities", "Expand your network", "Exchange smarter"].map((b) => (
            <li className="nb-who-li" key={b}>
              <span className="nb-who-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
        <a className="nb-who-link" href="/signup">Learn More <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
  </div>
</section>
  );
}

function RoeMiniCalc() {
  const [value, setValue] = useState(1000000);
  const [loan, setLoan] = useState(0);
  const [income, setIncome] = useState(60000);
  const [shown, setShown] = useState(false);

  const PLATFORM = 8; // healthy return-on-equity benchmark
  const equity = Math.max(0, value - loan);
  const roe = equity > 0 ? (income / equity) * 100 : 0;
  const potential = equity * (PLATFORM / 100);
  const uplift = potential - income;

  const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const parse = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;

  const tone = roe < 5 ? "low" : roe < 8 ? "mid" : "high";
  const numColor = tone === "low" ? "#b8543a" : tone === "mid" ? "#16284a" : "#43a047";

  const FIELDS: { id: string; label: string; val: number; set: (n: number) => void }[] = [
    { id: "cv", label: "Current Property Value", val: value, set: setValue },
    { id: "ni", label: "Current Net Income", val: income, set: setIncome },
    { id: "lb", label: "Loan Balance", val: loan, set: setLoan },
  ];

  return (
    <div className="nb-why-card">
      <h3 className="nb-why-card-title">Is Your Equity Working Hard Enough?</h3>
      <p className="nb-why-card-sub">
        In about 20 seconds, see whether your equity is pulling its weight — measured against a healthy 8% return.
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

      <button type="button" className="nb-why-calc" onClick={() => setShown(true)}>Calculate My ROE</button>

      {shown && (
        <div className="nb-why-result">
          <p className="nb-why-result-note">
            {uplift > 0 ? (
              <>Your equity earns <b style={{ color: numColor }}>{roe.toFixed(1)}%</b> today — below a healthy 8%. That same <b>{usd(equity)}</b> could earn about <b>{usd(potential)}/yr</b>, roughly <b>{usd(uplift)} more</b>, in a stronger property.</>
            ) : (
              <>Your equity earns <b style={{ color: numColor }}>{roe.toFixed(1)}%</b> — already at or above a healthy 8%. Nicely done.</>
            )}
          </p>
          <p className="nb-why-fine">Estimate only — not tax or investment advice.</p>
        </div>
      )}
    </div>
  );
}

function Sec_why() {
  return (
<section id="why" className="px-5 sm:px-8 py-20 sm:py-24">
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="nb-why-wrap px-6 sm:px-12 lg:px-16 py-14 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          <h2 className="nb-why-h2">
            Why Join 1031Exchange<span className="nb-why-up">Up</span>?
          </h2>
          <div className="nb-why-list">
            {[
              "AI-Powered Matchmaking",
              "Off-Market Opportunities",
              "Investor-Focused Network",
              "Educational Webinars & Events",
              "Exchange Resources",
              "Growing Community",
              "Future Integrations",
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

        {/* RIGHT — ROE calculator */}
        <RoeMiniCalc />
      </div>
    </div>
  </div>
</section>
  );
}

const DASHBOARD_CSS = `
  [data-nb] .nb-dash { border-radius: 18px; overflow: hidden; background: #fff; border: 1px solid #e8edf3; box-shadow: 0 26px 60px rgba(14,42,77,.16); }
  [data-nb] .nb-dash-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; border-bottom: 1px solid #eef3fb; background: #f7f9fc; }
  [data-nb] .nb-dash-bar i { width: 10px; height: 10px; border-radius: 50%; background: #dfe6f0; }
  [data-nb] .nb-dash-bar i:nth-child(3) { background: #cfe4d0; }
  [data-nb] .nb-dash-url { margin-left: 10px; font-size: 11px; color: #8794a6; background: #eef3fb; padding: 5px 14px; border-radius: 7px; }
  [data-nb] .nb-dash-screen { background: linear-gradient(160deg, #f5f8fc, #eaf0f8); }

  [data-nb] .pb { display: flex; width: 100%; height: 486px; overflow: hidden; color: #16284a; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; }
  [data-nb] .pb-side { width: 176px; flex: none; display: flex; flex-direction: column; padding: 16px 12px 14px; background: rgba(255,255,255,.7); border-right: 1px solid #e8edf3; }
  [data-nb] .pb-brand { display: flex; align-items: center; gap: 8px; padding: 0 2px; margin-bottom: 14px; }
  [data-nb] .pb-brand-logo { width: 26px; height: 26px; flex: none; border-radius: 8px; background: #16284a; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-nb] .pb-brand-logo svg { width: 14px; height: 14px; }
  [data-nb] .pb-brand-name { font-size: 12px; font-weight: 800; letter-spacing: -.02em; color: #16284a; }
  [data-nb] .pb-brand-badge { margin-left: auto; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #2f7a33; background: #e3f1e4; padding: 2px 6px; border-radius: 999px; }
  [data-nb] .pb-navlabel { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: #9fb0c8; margin: 14px 10px 7px; }
  [data-nb] .pb-nav { display: flex; flex-direction: column; gap: 1px; }
  [data-nb] .pb-nav-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; font-size: 12px; font-weight: 500; color: #56657a; }
  [data-nb] .pb-nav-item svg { width: 15px; height: 15px; flex: none; color: #9fb0c8; stroke-width: 2; }
  [data-nb] .pb-nav-item.is-active { background: #e3f1e4; color: #2f7a33; font-weight: 600; }
  [data-nb] .pb-nav-item.is-active svg { color: #43a047; }
  [data-nb] .pb-proj { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 9px; font-size: 12px; font-weight: 500; color: #56657a; }
  [data-nb] .pb-proj-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
  [data-nb] .pb-proj.is-active { background: #eef3fb; color: #16284a; font-weight: 600; }
  [data-nb] .pb-widget { margin-top: auto; position: relative; border-radius: 14px; padding: 30px 12px 13px; text-align: center; background: linear-gradient(180deg, rgba(227,241,228,0) 0%, #e3f1e4 100%); border: 1px solid #dbeadd; overflow: hidden; }
  [data-nb] .pb-widget-bulb { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 999px; background: radial-gradient(circle, rgba(67,160,71,.28) 0%, rgba(67,160,71,0) 68%); display: inline-flex; align-items: center; justify-content: center; }
  [data-nb] .pb-widget-bulb svg { width: 15px; height: 15px; color: #43a047; }
  [data-nb] .pb-widget-title { margin-top: 16px; font-size: 10.5px; font-weight: 700; color: #16284a; }
  [data-nb] .pb-widget-text { margin-top: 4px; font-size: 9px; line-height: 1.45; color: #6c7c90; }

  [data-nb] .pb-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  [data-nb] .pb-top { display: flex; align-items: center; gap: 9px; padding: 16px 20px 0; }
  [data-nb] .pb-title { font-size: 19px; font-weight: 800; letter-spacing: -.03em; color: #16284a; }
  [data-nb] .pb-title-ico { display: inline-flex; gap: 6px; margin-left: 3px; }
  [data-nb] .pb-title-ico span { width: 22px; height: 22px; border-radius: 7px; background: #fff; border: 1px solid #e8edf3; display: inline-flex; align-items: center; justify-content: center; }
  [data-nb] .pb-title-ico svg { width: 11px; height: 11px; color: #8794a6; }
  [data-nb] .pb-top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  [data-nb] .pb-invite { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: #56657a; }
  [data-nb] .pb-invite svg { width: 13px; height: 13px; color: #8794a6; }
  [data-nb] .pb-toolbar { display: flex; align-items: center; gap: 8px; padding: 14px 20px 0; }
  [data-nb] .pb-pill { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #e8edf3; background: #fff; font-size: 11.5px; font-weight: 600; color: #56657a; white-space: nowrap; }
  [data-nb] .pb-pill svg { width: 13px; height: 13px; color: #8794a6; }
  [data-nb] .pb-chev { width: 11px; height: 11px; }
  [data-nb] .pb-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  [data-nb] .pb-iconbtn { width: 30px; height: 30px; border-radius: 999px; border: 1px solid #e8edf3; background: #fff; display: inline-flex; align-items: center; justify-content: center; }
  [data-nb] .pb-iconbtn svg { width: 14px; height: 14px; color: #8794a6; }
  [data-nb] .pb-share { color: #16284a; }
  [data-nb] .pb-avatars { display: inline-flex; align-items: center; }
  [data-nb] .pb-av { width: 24px; height: 24px; border-radius: 999px; margin-left: -7px; border: 2px solid #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; }
  [data-nb] .pb-av:first-child { margin-left: 0; }
  [data-nb] .pb-av-more { background: #d7e6f7; color: #2f6fd0; }
  [data-nb] .pb-board { flex: 1; display: flex; gap: 14px; padding: 16px 20px 0; overflow: hidden; }
  [data-nb] .pb-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  [data-nb] .pb-col-head { display: flex; align-items: center; gap: 7px; padding-bottom: 9px; margin-bottom: 13px; border-bottom: 2px solid #e8edf3; }
  [data-nb] .pb-col-dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
  [data-nb] .pb-col-title { font-size: 12px; font-weight: 700; color: #16284a; }
  [data-nb] .pb-col-count { font-size: 9.5px; font-weight: 700; color: #8794a6; background: #eef3fb; padding: 1px 7px; border-radius: 999px; }
  [data-nb] .pb-col-cards { display: flex; flex-direction: column; gap: 13px; }
  [data-nb] .pb-deal { background: #fff; border: 1px solid #eef3fb; border-radius: 14px; padding: 12px; box-shadow: 0 1px 2px rgba(14,42,77,.04), 0 6px 18px rgba(14,42,77,.05); }
  [data-nb] .pb-drag { position: relative; margin-top: 2px; }
  [data-nb] .pb-placeholder { position: absolute; inset: 0; border: 2px dashed #cfdcea; border-radius: 14px; z-index: 0; }
  [data-nb] .pb-deal.is-lifted { position: relative; z-index: 3; transform: rotate(-3deg) translate(-4px, -15px); box-shadow: 0 22px 44px rgba(14,42,77,.2); }
  [data-nb] .pb-tag { display: inline-flex; font-size: 8.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
  [data-nb] .pb-tag.tone-blue { color: #2f6fd0; background: #e8f0fb; }
  [data-nb] .pb-tag.tone-teal { color: #0f8a86; background: #d7f2ee; }
  [data-nb] .pb-tag.tone-green { color: #2f7a33; background: #e3f1e4; }
  [data-nb] .pb-deal-title { margin-top: 9px; font-size: 13px; font-weight: 700; letter-spacing: -.015em; color: #16284a; line-height: 1.25; }
  [data-nb] .pb-deal-text { margin-top: 6px; font-size: 10px; line-height: 1.5; color: #6c7c90; }
  [data-nb] .pb-deal-photo { margin-top: 11px; height: 80px; border-radius: 11px; background-size: cover; background-position: center; }
  [data-nb] .pb-deal-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
  [data-nb] .pb-deal-foot .pb-av { width: 20px; height: 20px; font-size: 7.5px; }
  [data-nb] .pb-meta { display: inline-flex; align-items: center; gap: 11px; }
  [data-nb] .pb-meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 500; color: #8794a6; }
  [data-nb] .pb-meta-item svg { width: 11px; height: 11px; }

  @media (min-width: 980px) { [data-nb] .nb-diff-wrap { grid-template-columns: 1fr 1.05fr; } }

  /* compact device composition (original sizing), detailed board scaled to fit */
  [data-nb] .nb-diff-devices .nb-diff-laptop-screen { padding: 11px; overflow: hidden; }
  [data-nb] .nb-diff-devices .nb-diff-laptop-bar { margin-bottom: 8px; }
  [data-nb] .nb-lapscale { width: 100%; height: 292px; overflow: hidden; border-radius: 5px; }
  [data-nb] .nb-lapscale .pb { width: 166.7%; transform: scale(.6); transform-origin: top left; }
  /* stacked layout (<980): reserve room below the laptop for the overlapping phone */
  @media (max-width: 979.98px) { [data-nb] .nb-diff-devices { margin-bottom: 46px; } }
  /* mobile: hide the app sidebar and rescale the board so columns stay legible */
  @media (max-width: 720px) {
    [data-nb] .pb-side { display: none; }
    [data-nb] .nb-lapscale { height: 244px; }
    [data-nb] .nb-lapscale .pb { width: 200%; transform: scale(.5); }
    [data-nb] .pb-board { padding: 14px 16px 0; gap: 12px; }
    [data-nb] .pb-top { padding: 14px 16px 0; }
    [data-nb] .pb-toolbar { padding: 12px 16px 0; }
  }

  /* Mobile phone — same app, mobile view, scaled into the composition */
  [data-nb] .nb-phone { position: absolute; right: -3%; bottom: -5%; width: 208px; z-index: 5; border-radius: 26px; background: #fff; padding: 4px; box-shadow: 0 26px 54px rgba(14,42,77,.22); border: 1px solid #e8edf3; transform: scale(.72); transform-origin: bottom right; }
  [data-nb] .nb-phone-screen { border-radius: 22px; overflow: hidden; background: #f5f8fc; }
  [data-nb] .nb-ph-status { display: flex; align-items: center; justify-content: space-between; padding: 6px 13px 3px; font-size: 8px; font-weight: 700; color: #16284a; }
  [data-nb] .nb-ph-sig { width: 15px; height: 7px; border-radius: 2px; background: #16284a; opacity: .45; }
  [data-nb] .nb-ph-top { display: flex; align-items: center; gap: 8px; padding: 3px 12px 7px; }
  [data-nb] .nb-ph-logo { width: 23px; height: 23px; flex: none; border-radius: 7px; background: #16284a; color: #fff; display: flex; align-items: center; justify-content: center; }
  [data-nb] .nb-ph-logo svg { width: 12px; height: 12px; }
  [data-nb] .nb-ph-title { font-size: 12.5px; font-weight: 800; letter-spacing: -.02em; color: #16284a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  [data-nb] .nb-ph-av { margin-left: auto; width: 23px; height: 23px; flex: none; border-radius: 999px; background: linear-gradient(135deg, #5b7cc0, #4a9e6a); }
  [data-nb] .nb-ph-chips { display: flex; gap: 6px; padding: 0 12px 8px; }
  [data-nb] .nb-ph-chip { font-size: 8px; font-weight: 600; padding: 4px 9px; border-radius: 999px; background: #fff; border: 1px solid #e8edf3; color: #56657a; white-space: nowrap; }
  [data-nb] .nb-ph-chip.active { background: #16284a; color: #fff; border-color: #16284a; }
  [data-nb] .nb-ph-cards { display: flex; flex-direction: column; gap: 8px; padding: 0 11px 9px; }
  [data-nb] .nb-ph-cards .pb-deal { padding: 9px; border-radius: 12px; }
  [data-nb] .nb-ph-cards .pb-deal-title { font-size: 12px; margin-top: 7px; }
  [data-nb] .nb-ph-cards .pb-deal-text { margin-top: 5px; }
  [data-nb] .nb-ph-cards .pb-deal-foot { margin-top: 9px; }
  [data-nb] .nb-ph-cards .pb-deal-photo { height: 56px; margin-top: 8px; }
  [data-nb] .nb-ph-nav { display: flex; align-items: center; justify-content: space-around; padding: 7px 8px; border-top: 1px solid #e8edf3; background: #fff; }
  [data-nb] .nb-ph-nav-item { width: 18px; height: 18px; color: #9fb0c8; stroke-width: 2; }
  [data-nb] .nb-ph-nav-item.active { color: #43a047; }
  @media (max-width: 640px) { [data-nb] .nb-phone { transform: scale(.62); } }
`;

const PB_NAV = [
  { Icon: LayoutDashboard, label: "Dashboard" },
  { Icon: Users, label: "My Clients" },
  { Icon: Sparkles, label: "Matches", active: true },
  { Icon: MessageSquare, label: "Messages" },
  { Icon: Settings, label: "Settings" },
];

const PB_EXCHANGES = [
  { name: "42 Linden Avenue", dot: "#43a047", active: true },
  { name: "8 Harborview Street", dot: "#2f8fd0" },
  { name: "215 Chestnut Street", dot: "#2ec5c0" },
  { name: "76 Warren Avenue", dot: "#6b7bd0" },
];

type PbDealData = {
  tag: string; tone: "blue" | "teal" | "green"; title: string;
  photo?: string; text?: string; lifted?: boolean;
  matches: number; docs: number; avatars: string[];
};

const PB_COLS: Array<{ title: string; count: number; dot: string; deals: PbDealData[] }> = [
  {
    title: "New matches", count: 4, dot: "#8794a6",
    deals: [
      { tag: "New", tone: "blue", title: "42 Linden Avenue", text: "$1.15M · Somerville · Triplex · 5.9% cap. Three-family, fully leased near Davis Sq.", matches: 5, docs: 2, avatars: ["RC", "MJ"] },
      { tag: "Hot match", tone: "teal", lifted: true, title: "8 Harborview Street", photo: "/mf-1.jpg", matches: 8, docs: 4, avatars: ["AK", "TS"] },
    ],
  },
  {
    title: "In review", count: 3, dot: "#2f8fd0",
    deals: [
      { tag: "Strong fit", tone: "blue", title: "215 Chestnut Street", photo: "/mf-3.jpg", matches: 6, docs: 3, avatars: ["BL", "DV"] },
      { tag: "New", tone: "blue", title: "76 Warren Avenue", text: "$820K · Quincy · Duplex · 6.4% cap. Two-family, value-add, 100% occupied.", matches: 3, docs: 1, avatars: ["JT"] },
    ],
  },
  {
    title: "Offers out", count: 2, dot: "#43a047",
    deals: [
      { tag: "Offer sent", tone: "green", title: "134 Elm Street", photo: "/mf-5.jpg", matches: 4, docs: 6, avatars: ["JA", "KP"] },
      { tag: "Closing", tone: "green", title: "19 Beacon Court", text: "$1.35M · Medford · Fourplex · 6.0% cap. Under LOI, closing Q3.", matches: 2, docs: 5, avatars: ["RM"] },
    ],
  },
];

const PB_AV_COLORS = ["#5b7cc0", "#4a9e6a", "#3aa8b0", "#6a6fc0", "#5a86a8", "#7a6cc0", "#4a9e8a"];
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
        <div className="pb-brand">
          <span className="pb-brand-logo"><Sparkles /></span>
          <span className="pb-brand-name">1031ExchangeUp</span>
          <span className="pb-brand-badge">Agent</span>
        </div>
        <nav className="pb-nav">
          {PB_NAV.map(({ Icon, label, active }) => (
            <div key={label} className={`pb-nav-item${active ? " is-active" : ""}`}><Icon /><span>{label}</span></div>
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
          <span className="pb-title">42 Linden Avenue</span>
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

const PH_DEALS: PbDealData[] = [
  { tag: "Hot match", tone: "teal", title: "8 Harborview Street", photo: "/mf-1.jpg", matches: 8, docs: 4, avatars: ["AK", "TS"] },
  { tag: "New", tone: "blue", title: "42 Linden Avenue", text: "$1.15M · Somerville · Triplex.", matches: 5, docs: 2, avatars: ["RC", "MJ"] },
];

/** Mobile view of the same pipeline app — a phone showing the deals stacked. */
function PhonePreview() {
  return (
    <div className="nb-phone">
      <div className="nb-phone-screen">
        <div className="nb-ph-status"><span>9:41</span><span className="nb-ph-sig" /></div>
        <div className="nb-ph-top">
          <span className="nb-ph-logo"><Sparkles /></span>
          <span className="nb-ph-title">42 Linden Avenue</span>
          <span className="nb-ph-av" />
        </div>
        <div className="nb-ph-chips">
          <span className="nb-ph-chip active">New matches</span>
          <span className="nb-ph-chip">In review</span>
          <span className="nb-ph-chip">Offers</span>
        </div>
        <div className="nb-ph-cards">
          {PH_DEALS.map((d) => <PbDeal key={d.title} d={d} />)}
        </div>
        <div className="nb-ph-nav">
          <LayoutDashboard className="nb-ph-nav-item" />
          <Users className="nb-ph-nav-item" />
          <Sparkles className="nb-ph-nav-item active" />
          <MessageSquare className="nb-ph-nav-item" />
          <Settings className="nb-ph-nav-item" />
        </div>
      </div>
    </div>
  );
}

function Sec_diff() {
  return (
<section id="different" className="w-full py-20 sm:py-24" data-nb style={{ background: "#eef3fb" }}>
  <style>{DASHBOARD_CSS}</style>
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="text-center mb-12 sm:mb-16">
      <h2 className="nb-h2">Why We&apos;re Different</h2>
    </div>

    <div className="nb-diff-wrap">
      {/* LEFT — product dashboard + mobile (compact device composition) */}
      <div className="nb-diff-devices" aria-hidden="true">
        <div className="nb-diff-glow" />
        <div className="nb-diff-laptop">
          <div className="nb-diff-laptop-screen">
            <div className="nb-diff-laptop-bar">
              <span className="nb-diff-dot" /><span className="nb-diff-dot" /><span className="nb-diff-dot g" />
            </div>
            <div className="nb-lapscale"><PipelineBoard /></div>
          </div>
          <div className="nb-diff-laptop-base" />
        </div>
        <PhonePreview />
      </div>

      {/* RIGHT — comparison table */}
      <div className="nb-diff-table">
        <div className="nb-diff-thead">
          <div className="nb-diff-th trad">
            <span className="nb-diff-badge x">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2l8 8M10 2l-8 8" stroke="#c2cad8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            The Traditional Way
          </div>
          <div className="nb-diff-th us">
            <span className="nb-diff-badge c">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7.5l2.6 2.6L11 4" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            1031ExchangeUp
          </div>
        </div>

        {[
          ["Spreadsheets & email chains", "AI-powered matching"],
          ["Countless phone calls", "Instant notifications"],
          ["Searching everywhere", "One focused network"],
          ["Waiting & hoping", "Real-time opportunities"],
          ["Limited inventory", "Network-wide inventory"],
        ].map(([trad, us]) => (
          <div className="nb-diff-row" key={us}>
            <div className="nb-diff-cell left">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2l8 8M10 2l-8 8" stroke="#aab4c4" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {trad}
            </div>
            <div className="nb-diff-cell right">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="8" fill="#e6f2e7" />
                <path d="M4.5 8.2l2.3 2.3L11.5 5.7" stroke="#43a047" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {us}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
  );
}

function Sec_resources() {
  return (
<section id="resources" className="w-full" style={{ background: '#ffffff' }}>
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="px-5 sm:px-8 py-20 sm:py-24">
      <div className="nb-res-grid">
        {/* (1) Educational Resources */}
        <div className="nb-res-card">
          <h3 className="nb-res-title">Educational Resources</h3>
          <ul className="nb-res-list">
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="#43a047" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span><strong>1031 Exchange Summit</strong> · July 22, 2025</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="2" stroke="#43a047" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span>Webinars &amp; Workshops</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5z" stroke="#43a047" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v4h4M8 12h7M8 16h7" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span>Articles &amp; Guides</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#43a047" strokeWidth="1.8"/><path d="M10 9l5 3-5 3z" fill="#43a047"/></svg>
              <span>Videos &amp; Tutorials</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-5 4 3 6-7" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9h4v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Tax Strategies &amp; Insights</span>
            </li>
          </ul>
          <a href="/signup" className="nb-res-link" style={{ marginTop: 'auto', paddingTop: 24 }}>View All Resources →</a>
        </div>

        {/* (2) Learn From Trusted Experts */}
        <div className="nb-res-card">
          <h3 className="nb-res-title">Learn From Trusted Experts</h3>
          <div className="nb-res-experts">
            <div className="nb-res-expert">
              <div>
                <div className="nb-res-ename">Joe Bonavita</div>
                <div className="nb-res-erole">Qualified Intermediary</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <div>
                <div className="nb-res-ename">Emily Yormak</div>
                <div className="nb-res-erole">Cost Segregation Expert</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <div>
                <div className="nb-res-ename">Wolfgang Suess</div>
                <div className="nb-res-erole">DST Specialist</div>
              </div>
            </div>
          </div>
          <a href="/signup" className="nb-res-link" style={{ marginTop: 'auto', paddingTop: 24 }}>Meet All Our Experts →</a>
        </div>

        {/* (3) Become a Founding Member */}
        <div className="nb-res-card nb-res-dark">
          <h3 className="nb-res-title">Become a Founding Member</h3>
          <ul className="nb-res-clist">
            {['First 25 North Shore Agents','First 75 Properties','6 Months Free','Help Shape the Platform','Be Part of Something Big'].map((t) => (
              <li className="nb-res-cli" key={t}>
                <span className="nb-res-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#5cc15f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href="/signup" className="nb-btn nb-btn-green nb-res-btn">Join as a Founding Member</a>
          <div className="nb-res-cap">Spots Are Limited!</div>
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

      {/* LEFT — FAQ column */}
      <div className="nb-fct-left">

      {/* (A) Heading */}
      <div className="nb-fct-head">
        <h2 className="nb-h2">Frequently Asked Questions</h2>
      </div>

      {/* (B) Accordion */}
      <div className="nb-fct-acc">
        {[
          {
            q: 'How much does it cost?',
            a: 'Joining the network is completely free — you only consider a paid plan once you start closing matched exchanges.',
          },
          {
            q: 'Who can join 1031ExchangeUp?',
            a: 'Licensed agents, brokers, and accredited investors active in 1031 exchanges are all welcome to create an account.',
          },
          {
            q: 'Do I have to upload property addresses?',
            a: 'No — you can keep specifics private and share only the high-level details needed for the platform to surface relevant matches.',
          },
          {
            q: 'How does AI matching work?',
            a: 'Our model reads the shape of each deal and each investor goal, then quietly connects the two sides when there is real overlap.',
          },
          {
            q: "What if I don't have a 1031 client today?",
            a: 'That is fine — many members join early to build their network so the right match is waiting when a client does come along.',
          },
          {
            q: 'Can investors join?',
            a: 'Yes — investors are a core part of the network and can join directly to connect with investor-friendly agents.',
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

      {/* RIGHT — CTA card */}
      <div className="nb-fct-cta">
        <h3 className="nb-fct-cta-h">Ready to Exchange Up?</h3>
        <p className="nb-fct-cta-sub">Join the AI-powered network that's revolutionizing the 1031 exchange process.</p>
        <div className="nb-fct-cta-btns">
          <a href="/signup" className="nb-fct-btn nb-fct-btn-green">Join the Network (Free)</a>
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
          <span className="nb-fct-proof-txt">Join hundreds of investor-friendly agents and investors today!</span>
        </div>
      </div>

    </div>
  </div>

  {/* FOOTER */}
  <footer className="nb-fct-footer">
    <div className="nb-fct-footer-inner">
      <div className="nb-fct-fgrid">
        <div>
          <div className="nb-fct-flogo">1031Exchange<b>UP</b></div>
          <p className="nb-fct-ftag">The AI-powered matchmaking platform for 1031 exchange success.</p>
        </div>

        <div className="nb-fct-fcol">
          <h4>Platform</h4>
          <ul>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#who">Who It's For</a></li>
            <li><a href="#why">Why Join</a></li>
            <li><a href="#resources">Resources</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Get Started</h4>
          <ul>
            <li><a href="/signup">Join Free</a></li>
            <li><a href="/book-demo">Book a Demo</a></li>
            <li><a href="/landlords">For Landlords</a></li>
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
      <span className="nb-fct-copy">© 2025 1031ExchangeUp. All rights reserved.</span>
    </div>
  </footer>
</section>
  );
}

export function LandingSections() {
  return (
    <>
      <Sec_problem />
      <Sec_meet />
      <Sec_how />
      <Sec_who />
      <Sec_why />
      <Sec_diff />
      <Sec_resources />
      <Sec_faqcta />
    </>
  );
}

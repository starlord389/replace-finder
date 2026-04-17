import Lenis from "lenis";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOGO_BRANDS = [
  { name: "Pluto Inc", mark: "chevrons" },
  { name: "VitaHealth", mark: "plus" },
  { name: "BoxMedia", mark: "cube" },
  { name: "NovaTech", mark: "shield" },
  { name: "Horizon Labs", mark: "bars" },
  { name: "Vertex AI", mark: "spark" },
] as const;

const SMOOTH_SCROLL_STYLE = `
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }

  html.lenis,
  html.lenis body {
    height: auto;
  }

  .lenis:not(.lenis-autoToggle).lenis-stopped {
    overflow: clip;
  }

  .lenis [data-lenis-prevent],
  .lenis [data-lenis-prevent-wheel],
  .lenis [data-lenis-prevent-touch],
  .lenis [data-lenis-prevent-vertical],
  .lenis [data-lenis-prevent-horizontal] {
    overscroll-behavior: contain;
  }
`;

const NAVBAR_FONT_STACK =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const NAVBAR_LOGO_LOCKUP = `
  <span style="display:inline-flex;align-items:center;justify-content:center;flex:none;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="100 60 312 392" width="32" height="32" aria-hidden="true" style="display:block;flex:none;">
      <rect x="126" y="86" width="52" height="340" rx="26" ry="26" fill="#1A1A1A" transform="rotate(20 256 256)"></rect>
      <rect x="334" y="86" width="52" height="340" rx="26" ry="26" fill="#1A1A1A" transform="rotate(-20 256 256)"></rect>
      <circle cx="382" cy="124" r="34" fill="#FADC6A"></circle>
    </svg>
  </span>
  <span style="font-family: ${NAVBAR_FONT_STACK}; font-size: 15px; font-weight: 600; letter-spacing: -0.03em; color: #1d1d1d; line-height: 1; white-space: nowrap;">
    1031 Exchange Up
  </span>
`;

const NAVBAR_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

  [data-exchangeup-navbar="true"] a,
  [data-exchangeup-navbar="true"] p,
  [data-exchangeup-navbar="true"] span {
    font-family: ${NAVBAR_FONT_STACK} !important;
  }

  [data-exchangeup-navbar="true"] [data-framer-name="Nav/Desktop"] {
    text-decoration: none !important;
  }

  [data-exchangeup-navbar="true"] [data-framer-name="Nav/Desktop"] p {
    margin: 0 !important;
    color: #5d5d5d !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    letter-spacing: -0.02em !important;
    line-height: 1 !important;
  }

  [data-exchangeup-navbar="true"] [data-framer-name="Nav/Desktop"]:hover p {
    color: #1d1d1d !important;
  }

  [data-exchangeup-navbar="true"] a[href="/signup"] p {
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: -0.02em !important;
  }
`;

type EasySetupCardId = "1" | "2" | "3";

const PREVIEW_SPARKLE_SVG = `
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3 13.6 10.4 21 12 13.6 13.6 12 21 10.4 13.6 3 12 10.4 10.4Z"/>
  </svg>
`;

const EASY_SETUP_PREVIEW_MARKUP: Record<EasySetupCardId, string> = {
  "1": `
    <div data-exchangeup-preview-surface data-preview-variant="1">
      <div data-preview-glass>
        <div data-preview-sparkle>${PREVIEW_SPARKLE_SVG}</div>
        <div data-preview-title>New exchange</div>
        <div data-preview-subtle>Step 1 of 3</div>
        <div data-preview-invite-row>
          <span data-preview-invite-label>Invite</span>
          <div data-preview-invite-avatars>
            <span></span><span></span><span></span><span></span>
          </div>
          <span data-preview-invite-count>+2</span>
        </div>
        <div data-preview-input-group>
          <div data-preview-input-label>Relinquished property</div>
          <div data-preview-input-field>Phoenix, AZ office</div>
        </div>
        <div data-preview-input-group>
          <div data-preview-input-label>Asset type</div>
          <div data-preview-input-field data-preview-highlight>Office &middot; stabilized</div>
        </div>
      </div>
    </div>
  `,
  "2": `
    <div data-exchangeup-preview-surface data-preview-variant="2">
      <div data-preview-glass>
        <div data-preview-sparkle>${PREVIEW_SPARKLE_SVG}</div>
        <div data-preview-title>Match found</div>
        <div data-preview-subtle>Auto-scored against the network</div>
        <div data-preview-match-stack>
          <div data-preview-mini-match data-preview-mini-match-variant="featured">
            <div data-preview-score-chip data-preview-score-variant="high">92</div>
            <div>
              <div data-preview-mini-match-title>Summit Ridge Office</div>
              <div data-preview-mini-match-meta>$4.2M &middot; Scottsdale, AZ</div>
            </div>
          </div>
          <div data-preview-mini-match>
            <div data-preview-score-chip data-preview-score-variant="good">88</div>
            <div>
              <div data-preview-mini-match-title>Parkview Retail</div>
              <div data-preview-mini-match-meta>$3.75M &middot; Chandler, AZ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  "3": `
    <div data-exchangeup-preview-surface data-preview-variant="3">
      <div data-preview-glass>
        <div data-preview-sparkle>${PREVIEW_SPARKLE_SVG}</div>
        <div data-preview-title>Private connection</div>
        <div data-preview-subtle>With Alex Chen</div>
        <div data-preview-match-strip>
          <div data-preview-match-strip-dot>92</div>
          <div>
            <div data-preview-match-strip-title>Summit Ridge Office</div>
            <div data-preview-match-strip-meta>$4.2M &middot; Scottsdale, AZ</div>
          </div>
        </div>
        <div data-preview-chat-bubble data-preview-chat-side="them">
          <div data-preview-chat-dot>AC</div>
          <div data-preview-chat-text>Financials attached. Open to offers.</div>
        </div>
        <div data-preview-offer-card>
          <div data-preview-offer-label>Offer submitted</div>
          <div data-preview-offer-row>
            <div data-preview-offer-amount>$4.15M</div>
            <div data-preview-offer-status>Sent</div>
          </div>
        </div>
      </div>
    </div>
  `,
};

const EASY_SETUP_STYLE = `
  @media (min-width: 1200px) and (hover: hover) and (pointer: fine) {
    [data-exchangeup-easy-setup-row] {
      display: flex !important;
      align-items: stretch !important;
      gap: 8px !important;
      overflow: visible !important;
    }

    [data-exchangeup-easy-setup-group] {
      display: flex !important;
      align-items: stretch !important;
      gap: 8px !important;
      flex: none !important;
      overflow: visible !important;
      transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-exchangeup-easy-setup-shell] {
      flex: none !important;
      overflow: visible !important;
      transition: width 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-exchangeup-easy-setup-card] {
      position: relative !important;
      width: 100% !important;
      height: 340px !important;
      overflow: hidden !important;
      cursor: pointer !important;
      transition:
        box-shadow 0.35s ease,
        transform 0.35s ease !important;
    }

    [data-exchangeup-easy-setup-content] {
      position: relative !important;
      z-index: 2 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      min-width: 0 !important;
      height: 100% !important;
      transition: max-width 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-exchangeup-easy-setup-preview] {
      position: absolute !important;
      top: 24px !important;
      right: 24px !important;
      width: 222px !important;
      height: 292px !important;
      opacity: 0 !important;
      transform: translateX(28px) scale(0.96) !important;
      transform-origin: right center !important;
      pointer-events: none !important;
      transition:
        opacity 0.28s ease,
        transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-group] {
      width: 768px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-shell="1"] {
      width: 509px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-shell="2"] {
      width: 251px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-shell="3"] {
      width: 248px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-group] {
      width: 768px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-shell="1"] {
      width: 251px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-shell="2"] {
      width: 509px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-shell="3"] {
      width: 248px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-group] {
      width: 507px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-shell="1"] {
      width: 251px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-shell="2"] {
      width: 248px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-shell="3"] {
      width: 509px !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-card="1"],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-card="2"],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-card="3"] {
      transform: translateY(-2px) !important;
      box-shadow: 0 20px 44px rgba(40, 35, 28, 0.12), 0 3px 12px rgba(40, 35, 28, 0.05) !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-card="1"] [data-exchangeup-easy-setup-content],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-card="2"] [data-exchangeup-easy-setup-content],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-card="3"] [data-exchangeup-easy-setup-content] {
      max-width: calc(100% - 262px) !important;
    }

    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="1"] [data-exchangeup-easy-setup-card="1"] [data-exchangeup-easy-setup-preview],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="2"] [data-exchangeup-easy-setup-card="2"] [data-exchangeup-easy-setup-preview],
    [data-exchangeup-easy-setup-row][data-exchangeup-active-card="3"] [data-exchangeup-easy-setup-card="3"] [data-exchangeup-easy-setup-preview] {
      opacity: 1 !important;
      transform: translateX(0) scale(1) !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-exchangeup-easy-setup-row] *,
    [data-exchangeup-easy-setup-row] {
      transition: none !important;
      animation: none !important;
    }
  }

  [data-exchangeup-preview-surface] {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 18px;
    font-family: ${NAVBAR_FONT_STACK};
    color: #1d1d1d;
    background:
      radial-gradient(ellipse 70% 55% at 12% 85%, #f7a76c 0%, transparent 58%),
      radial-gradient(ellipse 60% 55% at 82% 18%, #d9b1f5 0%, transparent 58%),
      radial-gradient(ellipse 50% 45% at 95% 88%, #a8e6cf 0%, transparent 58%),
      linear-gradient(135deg, #fde9f0 0%, #f0e7fa 45%, #eaf4ef 100%);
  }

  [data-preview-glass] {
    position: absolute;
    inset: 18px 10px 14px 34px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.82);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    box-shadow:
      0 12px 28px rgba(40, 35, 28, 0.10),
      inset 0 0 0 1px rgba(255, 255, 255, 0.55);
    padding: 14px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  [data-preview-sparkle] {
    color: rgba(97, 97, 97, 0.55);
    display: flex;
  }

  [data-preview-sparkle] svg {
    width: 13px;
    height: 13px;
    display: block;
  }

  [data-preview-title] {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    color: #1d1d1d;
  }

  [data-preview-subtle] {
    font-size: 10px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.78);
    margin-top: -7px;
  }

  /* ---- Preview 1: Add exchange ---- */
  [data-preview-invite-row] {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-preview-invite-label] {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: inset 0 0 0 1px rgba(214, 210, 205, 0.55);
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.86);
  }

  [data-preview-invite-avatars] {
    display: flex;
  }

  [data-preview-invite-avatars] span {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid #ffffff;
    margin-left: -6px;
  }

  [data-preview-invite-avatars] span:nth-child(1) {
    background: linear-gradient(135deg, #f7c26d 0%, #e7946e 100%);
    margin-left: 0;
  }
  [data-preview-invite-avatars] span:nth-child(2) { background: linear-gradient(135deg, #d9b1f5 0%, #a69ddc 100%); }
  [data-preview-invite-avatars] span:nth-child(3) { background: linear-gradient(135deg, #a8e6cf 0%, #77c7a5 100%); }
  [data-preview-invite-avatars] span:nth-child(4) { background: linear-gradient(135deg, #f7a76c 0%, #ef7f51 100%); }

  [data-preview-invite-count] {
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.86);
    margin-left: 2px;
  }

  [data-preview-input-group] {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  [data-preview-input-label] {
    font-size: 10px;
    font-weight: 600;
    color: rgba(29, 29, 29, 0.85);
  }

  [data-preview-input-field] {
    padding: 9px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: inset 0 0 0 1px rgba(214, 210, 205, 0.55);
    font-size: 10px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.78);
  }

  [data-preview-input-field][data-preview-highlight] {
    background: linear-gradient(135deg, #fff4a7 0%, #fadc6a 100%);
    box-shadow: inset 0 0 0 1px rgba(250, 220, 106, 0.55);
    color: #5a471b;
    font-weight: 700;
  }

  /* ---- Preview 2: Match found ---- */
  [data-preview-match-stack] {
    position: relative;
    margin-top: 2px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  [data-preview-mini-match] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 9px;
    padding: 9px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 4px 10px rgba(40, 35, 28, 0.06), inset 0 0 0 1px rgba(214, 210, 205, 0.5);
    align-items: center;
  }

  [data-preview-mini-match][data-preview-mini-match-variant="featured"] {
    background: linear-gradient(135deg, #fff4a7 0%, #ffec8c 100%);
    box-shadow: 0 6px 14px rgba(204, 166, 52, 0.18), inset 0 0 0 1px rgba(250, 220, 106, 0.55);
    position: relative;
    z-index: 2;
  }

  [data-preview-score-chip] {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 8px rgba(22, 163, 74, 0.3);
  }

  [data-preview-score-chip][data-preview-score-variant="high"] {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }

  [data-preview-score-chip][data-preview-score-variant="good"] {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  }

  [data-preview-mini-match-title] {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
    color: #1d1d1d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-preview-mini-match-meta] {
    font-size: 9px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.75);
    margin-top: 2px;
  }

  /* ---- Preview 3: Private connection + offer ---- */
  [data-preview-connect-party] {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-preview-connect-avatar] {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    flex-shrink: 0;
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.02em;
    box-shadow: 0 2px 6px rgba(29, 29, 29, 0.15);
  }

  [data-preview-connect-avatar][data-preview-connect-side="them"] {
    background: linear-gradient(135deg, #f7a76c 0%, #ef7f51 100%);
  }

  [data-preview-connect-avatar][data-preview-connect-side="you"] {
    background: linear-gradient(135deg, #39484d 0%, #1d1d1d 100%);
  }

  [data-preview-connect-info] {
    min-width: 0;
    line-height: 1.2;
  }

  [data-preview-connect-name] {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1d1d1d;
  }

  [data-preview-connect-firm] {
    font-size: 9px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.78);
    margin-top: 1px;
  }

  [data-preview-match-strip] {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: inset 0 0 0 1px rgba(214, 210, 205, 0.55);
  }

  [data-preview-match-strip-dot] {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #ffffff;
    font-size: 9px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-preview-match-strip-title] {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1d1d1d;
    line-height: 1.2;
  }

  [data-preview-match-strip-meta] {
    font-size: 9px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.78);
    margin-top: 1px;
  }

  [data-preview-chat-bubble] {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 9px;
    line-height: 1.3;
  }

  [data-preview-chat-bubble][data-preview-chat-side="them"] {
    align-self: flex-start;
  }

  [data-preview-chat-bubble][data-preview-chat-side="you"] {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  [data-preview-chat-dot] {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    flex-shrink: 0;
    font-size: 7px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-preview-chat-bubble][data-preview-chat-side="them"] [data-preview-chat-dot] {
    background: linear-gradient(135deg, #f7a76c 0%, #ef7f51 100%);
  }

  [data-preview-chat-bubble][data-preview-chat-side="you"] [data-preview-chat-dot] {
    background: linear-gradient(135deg, #39484d 0%, #1d1d1d 100%);
  }

  [data-preview-chat-text] {
    padding: 5px 9px;
    border-radius: 10px;
    max-width: 140px;
    font-weight: 500;
    color: #1d1d1d;
  }

  [data-preview-chat-bubble][data-preview-chat-side="them"] [data-preview-chat-text] {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 0 0 1px rgba(214, 210, 205, 0.55);
    border-top-left-radius: 2px;
  }

  [data-preview-chat-bubble][data-preview-chat-side="you"] [data-preview-chat-text] {
    background: #1d1d1d;
    color: #ffffff;
    border-top-right-radius: 2px;
  }

  [data-preview-offer-card] {
    margin-top: auto;
    padding: 10px 12px;
    border-radius: 12px;
    background: linear-gradient(135deg, #fff4a7 0%, #fadc6a 100%);
    box-shadow: inset 0 0 0 1px rgba(250, 220, 106, 0.55);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  [data-preview-offer-label] {
    font-size: 9px;
    font-weight: 700;
    color: #7a5a0a;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-preview-offer-row] {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  [data-preview-offer-amount] {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1d1d1d;
  }

  [data-preview-offer-status] {
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(29, 29, 29, 0.12);
    color: #1d1d1d;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: -0.01em;
    white-space: nowrap;
    flex-shrink: 0;
  }
`;

type FeatureShowcaseTabId =
  | "off-market"
  | "match-scoring"
  | "filters"
  | "upside-preview";

type FeatureShowcaseItem = {
  id: FeatureShowcaseTabId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
};

const FEATURE_SHOWCASE_HEADING = "Every tool a 1031 agent actually needs.";
const FEATURE_SHOWCASE_SUBHEADING =
  "One private workspace for the clients you represent, the matches you're watching, the connections you've opened, and the offers on the table.";
// These strings live in the upstream Framer template and are used to locate
// the original section so we can hide it before injecting our rebuilt one.
const FEATURE_SHOWCASE_ORIGINAL_HEADING = "Built for high performance";
const FEATURE_SHOWCASE_ORIGINAL_SUBHEADING =
  "Grovia gives your team everything it needs to stay aligned, track performance, and scale with confidence";
const LANDING_DASHBOARD_IMAGE_SRC = "/landing-dashboard-render.png";
const HERO_LIST_IMAGE_SRC = "/landing-hero-list-render.png";
const HERO_KPI_IMAGE_SRC = "/landing-hero-kpi-render.png";

function createLandingRenderImage(
  doc: Document,
  src: string,
  alt: string,
  objectPosition = "center center",
) {
  const image = doc.createElement("img");
  image.src = src;
  image.alt = alt;
  image.decoding = "async";
  image.style.cssText = [
    "display:block",
    "width:100%",
    "height:100%",
    "border-radius:inherit",
    "corner-shape:inherit",
    "object-fit:cover",
    `object-position:${objectPosition}`,
  ].join(";");

  return image;
}

const FEATURE_SHOWCASE_ITEMS: FeatureShowcaseItem[] = [
  {
    id: "off-market",
    label: "Off-market marketplace",
    eyebrow: "Private inventory",
    title: "Inventory you won't find anywhere else.",
    description:
      "Every listing in the network is off-market, posted by a verified 1031 agent. Your client finds replacements their competition will never see \u2014 before the seller ever needs to go public.",
  },
  {
    id: "match-scoring",
    label: "Auto-scoring",
    eyebrow: "Match engine",
    title: "Every match, built for your client's exchange.",
    description:
      "Every property in our database is scored for your client's specific exchange across eight factors \u2014 their current holding, strategy, boot profile, debt, timing, price, geography, and scale. You see the full breakdown behind every score, and so does your client.",
  },
  {
    id: "filters",
    label: "Precision filters",
    eyebrow: "Custom search",
    title: "Dial in exactly what your client wants.",
    description:
      "Filter every listing by ROI target, geography, asset type, price band, cap rate, or debt profile. Save your client's criteria once and apply it to every new listing that joins the network.",
  },
  {
    id: "upside-preview",
    label: "Upside preview",
    eyebrow: "Projected return",
    title: "See exactly how much more your client could be earning.",
    description:
      "Compare your client's current property against any candidate side-by-side \u2014 NOI, cap rate, projected 10-year return. Turn a \u201cmaybe someday\u201d exchange into a clear yes.",
  },
];

const FEATURE_SHOWCASE_STYLE = `
  [data-exchangeup-feature-showcase] {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 10px 0 0;
    color: #1d1d1d;
  }

  [data-exchangeup-feature-shell] {
    width: min(960px, calc(100vw - 96px));
  }

  [data-exchangeup-feature-heading] {
    width: min(580px, 100%);
    margin: 0 auto;
    text-align: center;
  }

  [data-exchangeup-feature-heading] h2 {
    margin: 0;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: clamp(26px, 3.3vw, 40px);
    font-weight: 350;
    letter-spacing: -0.04em;
    line-height: 1.02;
    color: #171717;
  }

  [data-exchangeup-feature-heading] p {
    margin: 12px auto 0;
    max-width: 500px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: -0.02em;
    color: rgba(86, 82, 75, 0.86);
  }

  [data-exchangeup-feature-tabs] {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 7px;
    padding: 7px;
    margin-top: 24px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(244, 239, 230, 0.96) 0%, rgba(240, 235, 226, 0.92) 100%);
    box-shadow: inset 0 0 0 1px rgba(236, 230, 219, 0.92);
  }

  [data-exchangeup-feature-tab] {
    appearance: none;
    border: none;
    background: transparent;
    border-radius: 999px;
    min-height: 56px;
    padding: 0 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    cursor: pointer;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.03em;
    color: rgba(100, 95, 88, 0.9);
    transition:
      background 0.24s ease,
      color 0.24s ease,
      transform 0.24s ease,
      box-shadow 0.24s ease;
  }

  [data-exchangeup-feature-tab] svg {
    width: 17px;
    height: 17px;
    display: block;
    color: currentColor;
    flex: none;
  }

  [data-exchangeup-feature-tab]:hover,
  [data-exchangeup-feature-tab]:focus-visible {
    color: #1d1d1d;
    outline: none;
  }

  [data-exchangeup-feature-panel] {
    display: none;
    grid-template-columns: minmax(0, 1.03fr) minmax(300px, 0.97fr);
    margin-top: 14px;
    overflow: hidden;
    border-radius: 26px;
    background: linear-gradient(180deg, rgba(255, 252, 247, 0.98) 0%, rgba(255, 251, 245, 0.98) 100%);
    border: 1px solid rgba(240, 234, 225, 0.96);
    box-shadow: 0 16px 30px rgba(92, 83, 70, 0.06);
  }

  ${FEATURE_SHOWCASE_ITEMS.map(
    ({ id }) => `
      [data-exchangeup-feature-showcase][data-exchangeup-feature-active="${id}"] [data-exchangeup-feature-tab="${id}"] {
        background: rgba(255, 255, 255, 0.96);
        color: #1d1d1d;
        box-shadow: 0 12px 26px rgba(80, 71, 58, 0.14), inset 0 0 0 1px rgba(239, 233, 223, 0.98);
        transform: translateY(-1px);
      }

      [data-exchangeup-feature-showcase][data-exchangeup-feature-active="${id}"] [data-exchangeup-feature-panel="${id}"] {
        display: grid;
      }
    `,
  ).join("\n")}

  [data-exchangeup-feature-visual] {
    position: relative;
    min-height: 372px;
    padding: 24px 18px 0;
    overflow: hidden;
    background:
      radial-gradient(circle at 10% 92%, rgba(132, 24, 0, 0.9) 0%, rgba(132, 24, 0, 0) 30%),
      radial-gradient(circle at 95% 88%, rgba(122, 23, 0, 0.78) 0%, rgba(122, 23, 0, 0) 28%),
      linear-gradient(180deg, #39484d 0%, #344248 56%, #27363a 100%);
  }

  [data-exchangeup-feature-visual]::before {
    content: "";
    position: absolute;
    inset: auto -16% -24% auto;
    width: 260px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(173, 52, 22, 0.34) 0%, rgba(173, 52, 22, 0) 72%);
    pointer-events: none;
  }

  [data-exchangeup-feature-visual]::after {
    content: "";
    position: absolute;
    inset: auto auto -28% -8%;
    width: 220px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(183, 58, 22, 0.36) 0%, rgba(183, 58, 22, 0) 72%);
    pointer-events: none;
  }

  [data-exchangeup-feature-copy] {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 38px 36px;
    background: rgba(255, 252, 247, 0.98);
  }

  [data-exchangeup-feature-chip] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: #fff084;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
    text-transform: uppercase;
    color: #5e5617;
  }

  [data-exchangeup-feature-copy] h3 {
    margin: 18px 0 0;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: clamp(24px, 3vw, 38px);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.05em;
    color: #1a1a1a;
  }

  [data-exchangeup-feature-copy] p {
    margin: 18px 0 0;
    max-width: 360px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 14px;
    font-weight: 500;
    line-height: 1.54;
    letter-spacing: -0.02em;
    color: rgba(86, 82, 75, 0.86);
  }

  [data-feature-window] {
    position: absolute;
    left: 12px;
    right: 24px;
    top: 24px;
    bottom: 12px;
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 20px 36px rgba(20, 28, 32, 0.22);
    padding: 22px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-family: ${NAVBAR_FONT_STACK};
    color: #1d1d1d;
  }

  [data-feature-window-header] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1d1d1d;
  }

  [data-feature-window-tag] {
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(57, 72, 77, 0.09);
    color: #39484d;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  /* Off-market marketplace visual */
  [data-feature-market-grid] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  [data-feature-market-card] {
    position: relative;
    border-radius: 14px;
    background: #faf7f1;
    border: 1px solid #f0ebe1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  [data-feature-market-photo] {
    height: 56%;
    background-size: cover;
    background-position: center;
  }

  [data-feature-market-card][data-feature-market-variant="1"] [data-feature-market-photo] {
    background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=340&h=200&fit=crop&auto=format&q=85');
  }
  [data-feature-market-card][data-feature-market-variant="2"] [data-feature-market-photo] {
    background-image: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=340&h=200&fit=crop&auto=format&q=85');
  }
  [data-feature-market-card][data-feature-market-variant="3"] [data-feature-market-photo] {
    background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=340&h=200&fit=crop&auto=format&q=85');
  }
  [data-feature-market-card][data-feature-market-variant="4"] [data-feature-market-photo] {
    background-image: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=340&h=200&fit=crop&auto=format&q=85');
  }

  [data-feature-market-pill] {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(29, 29, 29, 0.78);
    backdrop-filter: blur(6px);
    color: #ffffff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  [data-feature-market-body] {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    justify-content: flex-end;
  }

  [data-feature-market-name] {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1d1d1d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-feature-market-meta] {
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.86);
  }

  /* Auto-scoring visual */
  [data-feature-score-header] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  [data-feature-score-title] {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1d1d1d;
    line-height: 1.15;
  }

  [data-feature-score-sub] {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-score-overall] {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.32);
    flex-shrink: 0;
  }

  [data-feature-score-rows] {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    padding: 2px 0;
  }

  [data-feature-score-row] {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 10px;
  }

  [data-feature-score-label] {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1d1d1d;
  }

  [data-feature-score-track] {
    height: 8px;
    border-radius: 999px;
    background: #f0ebe1;
    overflow: hidden;
  }

  [data-feature-score-fill] {
    height: 100%;
    border-radius: 999px;
  }

  [data-feature-score-fill][data-feature-score-tone="green"] {
    background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
  }

  [data-feature-score-fill][data-feature-score-tone="teal"] {
    background: linear-gradient(90deg, #39484d 0%, #5a7a84 100%);
  }

  [data-feature-score-fill][data-feature-score-tone="amber"] {
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  }

  [data-feature-score-value] {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
    text-align: right;
  }

  [data-feature-score-footer] {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding-top: 4px;
  }

  [data-feature-score-chip] {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  [data-feature-score-chip][data-feature-score-chip-variant="green"] {
    background: #e8f7ee;
    color: #2a8d56;
  }

  [data-feature-score-chip][data-feature-score-chip-variant="teal"] {
    background: rgba(57, 72, 77, 0.1);
    color: #39484d;
  }

  [data-feature-score-chip][data-feature-score-chip-variant="neutral"] {
    background: #f0ebe1;
    color: #5d5448;
  }

  /* Precision filters visual */
  [data-feature-window][data-feature-window-variant="split"] {
    display: grid;
    grid-template-columns: minmax(150px, 0.85fr) minmax(0, 1.15fr);
    gap: 14px;
  }

  [data-feature-filter-panel] {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 14px 14px;
    border-radius: 16px;
    background: #faf7f1;
    border: 1px solid #f0ebe1;
  }

  [data-feature-filter-header] {
    padding-bottom: 8px;
    border-bottom: 1px solid #f0ebe1;
  }

  [data-feature-filter-title] {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
  }

  [data-feature-filter-sub] {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 700;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-filter-chips] {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  [data-feature-filter-chip] {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #f0ebe1;
    line-height: 1.25;
  }

  [data-feature-filter-chip] span {
    font-size: 10px;
    font-weight: 700;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-filter-chip] strong {
    margin-top: 3px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1d1d1d;
  }

  [data-feature-filter-results] {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }

  [data-feature-filter-results-header] {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 4px;
  }

  [data-feature-filter-results-header] strong {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
  }

  [data-feature-filter-results-header] span {
    font-size: 10px;
    font-weight: 700;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-filter-result-card] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #faf7f1;
    border: 1px solid #f0ebe1;
  }

  [data-feature-filter-result-card][data-feature-filter-result-variant="featured"] {
    background: linear-gradient(135deg, #fff4a7 0%, #ffec8c 100%);
    border-color: rgba(250, 220, 106, 0.55);
    box-shadow: 0 6px 14px rgba(204, 166, 52, 0.18);
  }

  [data-feature-filter-result-score] {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(22, 163, 74, 0.32);
  }

  [data-feature-filter-result-title] {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1d1d1d;
    line-height: 1.15;
  }

  [data-feature-filter-result-meta] {
    margin-top: 2px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.82);
  }

  /* Upside preview visual */
  [data-feature-upside-header] {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  [data-feature-upside-title] {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
  }

  [data-feature-upside-sub] {
    font-size: 11px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.82);
  }

  [data-feature-upside-compare] {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;
  }

  [data-feature-upside-card] {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px 14px 12px;
    border-radius: 14px;
    background: #faf7f1;
    border: 1px solid #f0ebe1;
  }

  [data-feature-upside-card][data-feature-upside-card-variant="candidate"] {
    background: linear-gradient(180deg, #fff8d5 0%, #fff3a0 100%);
    border-color: rgba(250, 220, 106, 0.6);
    box-shadow: 0 8px 18px rgba(204, 166, 52, 0.18);
  }

  [data-feature-upside-card-badge] {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #1d1d1d;
    color: #ffffff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  [data-feature-upside-card-label] {
    font-size: 10px;
    font-weight: 700;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-upside-card-name] {
    margin-top: 3px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
    line-height: 1.15;
  }

  [data-feature-upside-card-meta] {
    font-size: 10px;
    font-weight: 600;
    color: rgba(97, 97, 97, 0.82);
  }

  [data-feature-upside-card-rows] {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  [data-feature-upside-card-rows] > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  [data-feature-upside-card-rows] span {
    font-size: 10px;
    font-weight: 700;
    color: rgba(97, 97, 97, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  [data-feature-upside-card-rows] strong {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d1d1d;
  }

  [data-feature-upside-card][data-feature-upside-card-variant="candidate"] [data-feature-upside-card-rows] strong {
    color: #1d1d1d;
  }

  [data-feature-upside-delta] {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 14px;
    background: #e8f7ee;
    border: 1px solid #cceedb;
    color: #2a8d56;
  }

  [data-feature-upside-delta] svg {
    width: 20px;
    height: 20px;
    display: block;
    color: currentColor;
    flex-shrink: 0;
  }

  [data-feature-upside-delta] strong {
    display: block;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #1d6b3f;
  }

  [data-feature-upside-delta] span {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 700;
    color: #2a8d56;
  }

  @media (max-width: 1199.98px) {
    [data-exchangeup-feature-shell] {
      width: calc(100vw - 48px);
    }

    [data-exchangeup-feature-heading] {
      width: min(560px, 100%);
    }

    [data-exchangeup-feature-heading] h2 {
      font-size: clamp(24px, 4vw, 34px);
    }

    [data-exchangeup-feature-heading] p {
      max-width: 520px;
      font-size: 14px;
    }

    [data-exchangeup-feature-tabs] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      padding: 7px;
      margin-top: 20px;
      border-radius: 24px;
    }

    [data-exchangeup-feature-tab] {
      min-height: 52px;
      padding: 0 16px;
      font-size: 15px;
    }

    [data-exchangeup-feature-panel] {
      grid-template-columns: 1fr;
      margin-top: 14px;
    }

    [data-exchangeup-feature-visual] {
      min-height: 320px;
      padding: 20px 16px 0;
    }

    [data-exchangeup-feature-copy] {
      padding: 30px 24px 28px;
    }

    [data-exchangeup-feature-copy] h3 {
      font-size: clamp(24px, 3.8vw, 32px);
    }

    [data-exchangeup-feature-copy] p {
      margin-top: 18px;
      max-width: 100%;
      font-size: 14px;
    }
  }

  @media (max-width: 809.98px) {
    [data-exchangeup-feature-showcase] {
      padding-top: 2px;
    }

    [data-exchangeup-feature-shell] {
      width: calc(100vw - 18px);
    }

    [data-exchangeup-feature-heading] h2 {
      font-size: 24px;
    }

    [data-exchangeup-feature-heading] p {
      margin-top: 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    [data-exchangeup-feature-tabs] {
      gap: 6px;
      padding: 6px;
      margin-top: 16px;
    }

    [data-exchangeup-feature-tab] {
      min-height: 46px;
      padding: 0 12px;
      gap: 6px;
      font-size: 13px;
    }

    [data-exchangeup-feature-tab] svg {
      width: 15px;
      height: 15px;
    }

    [data-exchangeup-feature-panel] {
      margin-top: 14px;
      border-radius: 20px;
    }

    [data-exchangeup-feature-visual] {
      min-height: 240px;
      padding: 16px 12px 0;
    }

    [data-exchangeup-feature-copy] {
      padding: 20px 16px 18px;
    }

    [data-exchangeup-feature-copy] h3 {
      margin-top: 16px;
      font-size: 24px;
    }

    [data-exchangeup-feature-copy] p {
      margin-top: 16px;
      font-size: 13px;
      line-height: 1.55;
    }

    [data-feature-window] {
      left: 7px;
      right: 12px;
      top: 12px;
      bottom: 7px;
      padding: 16px 14px 14px;
      gap: 10px;
    }

    [data-feature-score-title],
    [data-feature-upside-title],
    [data-feature-filter-results-header] strong {
      font-size: 13px;
    }

    [data-feature-score-overall] {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    [data-feature-score-row] {
      grid-template-columns: 64px minmax(0, 1fr) 26px;
      gap: 8px;
    }

    [data-feature-score-label],
    [data-feature-score-value] {
      font-size: 10px;
    }

    [data-feature-window][data-feature-window-variant="split"] {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    [data-feature-filter-result-card] {
      padding: 8px 10px;
    }

    [data-feature-upside-compare] {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    [data-feature-upside-card] {
      padding: 12px 12px 10px;
    }

    [data-feature-upside-card-name] {
      font-size: 12px;
    }

    [data-feature-upside-card-rows] strong {
      font-size: 12px;
    }

    [data-feature-upside-delta] {
      padding: 10px 14px;
    }

    [data-feature-upside-delta] strong {
      font-size: 14px;
    }
  }
`;

function getLogoMarkSvg(mark: (typeof LOGO_BRANDS)[number]["mark"]) {
  switch (mark) {
    case "plus":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5V3Z" fill="currentColor"/>
        </svg>
      `;
    case "cube":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.8 16.4 6.5v7L10 17.2 3.6 13.5v-7L10 2.8Z" fill="currentColor" opacity=".18"/>
          <path d="M10 2.8 16.4 6.5 10 10.2 3.6 6.5 10 2.8Z" fill="currentColor"/>
          <path d="M10 10.2v7" stroke="currentColor" stroke-width="1.3"/>
        </svg>
      `;
    case "shield":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.5 16.2 4.7v4.4c0 4.1-2.6 6.7-6.2 8.4-3.6-1.7-6.2-4.3-6.2-8.4V4.7L10 2.5Z" fill="currentColor"/>
        </svg>
      `;
    case "bars":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 5h2.8l2.4 4.1L6.8 15H4l2.4-5.9L4 5Zm9.2 0H16l-2.4 4.1L16 15h-2.8l-2.4-5.9L13.2 5Z" fill="currentColor"/>
        </svg>
      `;
    case "spark":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.4 12.1 7.9 17.6 10l-5.5 2.1L10 17.6l-2.1-5.5L2.4 10l5.5-2.1L10 2.4Z" fill="currentColor"/>
        </svg>
      `;
    case "chevrons":
    default:
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M2.8 4.8 8.1 10l-5.3 5.2h3.7L11.8 10 6.5 4.8H2.8Zm5.7 0L13.8 10l-5.3 5.2h3.7L17.5 10l-5.3-5.2H8.5Z" fill="currentColor"/>
        </svg>
      `;
  }
}

function getFeatureShowcaseIconSvg(tabId: FeatureShowcaseTabId) {
  switch (tabId) {
    case "off-market":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.2" y="3.2" width="6.1" height="6.1" rx="1.3" stroke="currentColor" stroke-width="1.6"/>
          <rect x="10.7" y="3.2" width="6.1" height="6.1" rx="1.3" stroke="currentColor" stroke-width="1.6"/>
          <rect x="3.2" y="10.7" width="6.1" height="6.1" rx="1.3" stroke="currentColor" stroke-width="1.6"/>
          <rect x="10.7" y="10.7" width="6.1" height="6.1" rx="1.3" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      `;
    case "match-scoring":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.4 15.6h13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M4.8 12.6 8.2 9.5l2.7 2.2 4-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    case "filters":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.2 4.5h13.6l-5.2 6.4v4.6l-3.2 1.5v-6.1L3.2 4.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    case "upside-preview":
    default:
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.4 15.6h13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="m4.6 12 3.2-3.4 2.6 2.2 4.6-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.8 5.8h3.4v3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
  }
}

function getFeatureOffMarketMarkup() {
  return `
    <div data-feature-window>
      <div data-feature-window-header>
        <span>Off-market inventory</span>
        <span data-feature-window-tag>4 verified</span>
      </div>
      <div data-feature-market-grid>
        <div data-feature-market-card data-feature-market-variant="1">
          <div data-feature-market-photo></div>
          <div data-feature-market-pill>Private</div>
          <div data-feature-market-body>
            <div data-feature-market-name>Summit Ridge Office</div>
            <div data-feature-market-meta>$4.2M &middot; Scottsdale, AZ</div>
          </div>
        </div>
        <div data-feature-market-card data-feature-market-variant="2">
          <div data-feature-market-photo></div>
          <div data-feature-market-pill>Private</div>
          <div data-feature-market-body>
            <div data-feature-market-name>Parkview Retail</div>
            <div data-feature-market-meta>$3.75M &middot; Chandler, AZ</div>
          </div>
        </div>
        <div data-feature-market-card data-feature-market-variant="3">
          <div data-feature-market-photo></div>
          <div data-feature-market-pill>Private</div>
          <div data-feature-market-body>
            <div data-feature-market-name>Lakeshore Industrial</div>
            <div data-feature-market-meta>$5.1M &middot; Mesa, AZ</div>
          </div>
        </div>
        <div data-feature-market-card data-feature-market-variant="4">
          <div data-feature-market-photo></div>
          <div data-feature-market-pill>Private</div>
          <div data-feature-market-body>
            <div data-feature-market-name>Canyon Vista Apts</div>
            <div data-feature-market-meta>$6.8M &middot; Tempe, AZ</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

const SCORE_DIMENSIONS: Array<{ label: string; value: number; tone: "green" | "teal" | "amber" }> = [
  { label: "Price", value: 94, tone: "green" },
  { label: "Geography", value: 95, tone: "green" },
  { label: "Asset Type", value: 100, tone: "teal" },
  { label: "Strategy", value: 88, tone: "green" },
  { label: "Financial", value: 90, tone: "green" },
  { label: "Timing", value: 85, tone: "green" },
  { label: "Debt Fit", value: 92, tone: "green" },
  { label: "Scale Fit", value: 78, tone: "amber" },
];

function getFeatureScoringMarkup() {
  const rows = SCORE_DIMENSIONS.map(
    ({ label, value, tone }) => `
      <div data-feature-score-row>
        <span data-feature-score-label>${label}</span>
        <div data-feature-score-track>
          <div data-feature-score-fill data-feature-score-tone="${tone}" style="width:${value}%"></div>
        </div>
        <span data-feature-score-value>${value}</span>
      </div>
    `,
  ).join("");

  return `
    <div data-feature-window>
      <div data-feature-score-header>
        <div>
          <div data-feature-score-title>Summit Ridge Office Park</div>
          <div data-feature-score-sub>Match score breakdown</div>
        </div>
        <div data-feature-score-overall>92</div>
      </div>
      <div data-feature-score-rows>${rows}</div>
      <div data-feature-score-footer>
        <span data-feature-score-chip data-feature-score-chip-variant="green">No Boot</span>
        <span data-feature-score-chip data-feature-score-chip-variant="teal">Office</span>
        <span data-feature-score-chip data-feature-score-chip-variant="neutral">Stabilized</span>
      </div>
    </div>
  `;
}

function getFeatureFiltersMarkup() {
  return `
    <div data-feature-window data-feature-window-variant="split">
      <div data-feature-filter-panel>
        <div data-feature-filter-header>
          <div data-feature-filter-title>Filters</div>
          <div data-feature-filter-sub>Saved for Marcus Reeves</div>
        </div>
        <div data-feature-filter-chips>
          <div data-feature-filter-chip>
            <span>Geography</span>
            <strong>Phoenix MSA</strong>
          </div>
          <div data-feature-filter-chip>
            <span>Asset type</span>
            <strong>Office, Retail</strong>
          </div>
          <div data-feature-filter-chip>
            <span>Price</span>
            <strong>$3M &ndash; $6M</strong>
          </div>
          <div data-feature-filter-chip>
            <span>Cap rate</span>
            <strong>6.5%+</strong>
          </div>
          <div data-feature-filter-chip>
            <span>Debt</span>
            <strong>Assumable only</strong>
          </div>
        </div>
      </div>
      <div data-feature-filter-results>
        <div data-feature-filter-results-header>
          <strong>12 matches</strong>
          <span>Sorted by score</span>
        </div>
        <div data-feature-filter-result-card data-feature-filter-result-variant="featured">
          <div data-feature-filter-result-score>94</div>
          <div>
            <div data-feature-filter-result-title>Summit Ridge Office</div>
            <div data-feature-filter-result-meta>$4.2M &middot; 6.8% cap &middot; Scottsdale</div>
          </div>
        </div>
        <div data-feature-filter-result-card>
          <div data-feature-filter-result-score>88</div>
          <div>
            <div data-feature-filter-result-title>Parkview Retail</div>
            <div data-feature-filter-result-meta>$3.75M &middot; 7.2% cap &middot; Chandler</div>
          </div>
        </div>
        <div data-feature-filter-result-card>
          <div data-feature-filter-result-score>85</div>
          <div>
            <div data-feature-filter-result-title>Desert Square Plaza</div>
            <div data-feature-filter-result-meta>$4.8M &middot; 6.9% cap &middot; Gilbert</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getFeatureUpsideMarkup() {
  return `
    <div data-feature-window>
      <div data-feature-upside-header>
        <div data-feature-upside-title>Upside comparison</div>
        <div data-feature-upside-sub>Marcus Reeves &middot; current vs candidate</div>
      </div>
      <div data-feature-upside-compare>
        <div data-feature-upside-card data-feature-upside-card-variant="current">
          <div data-feature-upside-card-label>Current property</div>
          <div data-feature-upside-card-name>Camelback Office Plaza</div>
          <div data-feature-upside-card-meta>Phoenix, AZ</div>
          <div data-feature-upside-card-rows>
            <div><span>Value</span><strong>$3.2M</strong></div>
            <div><span>NOI</span><strong>$180K/yr</strong></div>
            <div><span>Cap rate</span><strong>5.6%</strong></div>
          </div>
        </div>
        <div data-feature-upside-card data-feature-upside-card-variant="candidate">
          <div data-feature-upside-card-badge>Candidate</div>
          <div data-feature-upside-card-label>Replacement</div>
          <div data-feature-upside-card-name>Summit Ridge Office</div>
          <div data-feature-upside-card-meta>Scottsdale, AZ</div>
          <div data-feature-upside-card-rows>
            <div><span>Value</span><strong>$4.2M</strong></div>
            <div><span>NOI</span><strong>$245K/yr</strong></div>
            <div><span>Cap rate</span><strong>6.8%</strong></div>
          </div>
        </div>
      </div>
      <div data-feature-upside-delta>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.4 15.6h13.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="m4.8 12 3.2-3.4 2.6 2.2 4.6-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.6 5.8h3.4v3.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
          <strong>+$65K / yr</strong>
          <span>+$480K over 10 years</span>
        </div>
      </div>
    </div>
  `;
}

function getFeatureShowcaseVisualMarkup(tabId: FeatureShowcaseTabId) {
  switch (tabId) {
    case "off-market":
      return getFeatureOffMarketMarkup();
    case "match-scoring":
      return getFeatureScoringMarkup();
    case "filters":
      return getFeatureFiltersMarkup();
    case "upside-preview":
    default:
      return getFeatureUpsideMarkup();
  }
}

function getFeatureShowcaseMarkup() {
  const tabsMarkup = FEATURE_SHOWCASE_ITEMS.map(
    (item) => `
      <button
        type="button"
        role="tab"
        tabindex="-1"
        aria-selected="false"
        data-exchangeup-feature-tab="${item.id}"
      >
        ${getFeatureShowcaseIconSvg(item.id)}
        <span>${item.label}</span>
      </button>
    `,
  ).join("");

  const panelsMarkup = FEATURE_SHOWCASE_ITEMS.map(
    (item) => `
      <article
        role="tabpanel"
        aria-label="${item.label}"
        data-exchangeup-feature-panel="${item.id}"
      >
        <div data-exchangeup-feature-visual data-variant="${item.id}">
          ${getFeatureShowcaseVisualMarkup(item.id)}
        </div>
        <div data-exchangeup-feature-copy>
          <span data-exchangeup-feature-chip>${item.eyebrow}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      </article>
    `,
  ).join("");

  return `
    <div data-exchangeup-feature-shell>
      <div data-exchangeup-feature-heading>
        <h2>${FEATURE_SHOWCASE_HEADING}</h2>
        <p>${FEATURE_SHOWCASE_SUBHEADING}</p>
      </div>
      <div
        role="tablist"
        aria-label="Product feature tabs"
        data-exchangeup-feature-tabs
      >
        ${tabsMarkup}
      </div>
      ${panelsMarkup}
    </div>
  `;
}

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_SECTION_HEADING = "Your questions, answered";
const FAQ_SECTION_SUBHEADING =
  "Get quick answers to the most common questions about our platform and services.";
const FAQ_SECTION_ORIGINAL_QUESTION = "What types of companies do you work with?";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Who can list properties on 1031 Exchange Up?",
    answer:
      "Only verified 1031 exchange agents can post inventory to the marketplace, so every listing comes from a real professional working an active exchange.",
  },
  {
    question: "Are the properties on the platform off-market?",
    answer:
      "Yes. The marketplace is built around private, off-market replacement opportunities that your client can review before the broader market ever sees them.",
  },
  {
    question: "How does match scoring work?",
    answer:
      "Each property is scored against your client's exchange profile across factors like price, geography, asset type, debt fit, timing, and overall strategy so you can quickly focus on the strongest options.",
  },
  {
    question: "Can I filter listings for a specific client?",
    answer:
      "Yes. You can save a client's criteria once and screen the marketplace by ROI goals, location, asset class, price range, cap rate, and other exchange-specific requirements.",
  },
  {
    question: "Can agents connect privately and submit offers through the platform?",
    answer:
      "Yes. Once you identify a fit, you can open a private connection with the listing agent, share deal details, and move the conversation toward an offer without leaving the workspace.",
  },
];

const FAQ_STYLE = `
  [data-exchangeup-faq-shell] {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(250, 247, 241, 0.98) 0%, rgba(247, 242, 234, 0.98) 100%);
    border: 1px solid rgba(232, 224, 213, 0.98);
    box-shadow:
      0 22px 44px rgba(86, 74, 57, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.72);
    font-family: ${NAVBAR_FONT_STACK};
    color: #1d1d1d;
  }

  [data-exchangeup-faq-item] {
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(230, 223, 212, 0.96);
    box-shadow: 0 8px 16px rgba(92, 83, 70, 0.06);
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  [data-exchangeup-faq-item][data-state="open"] {
    border-color: rgba(250, 220, 106, 0.55);
    background: linear-gradient(180deg, rgba(255, 250, 230, 0.98) 0%, rgba(255, 247, 214, 0.98) 100%);
    box-shadow:
      0 12px 24px rgba(150, 118, 27, 0.10),
      inset 0 1px 0 rgba(255, 255, 255, 0.82);
  }

  [data-exchangeup-faq-trigger] {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  [data-exchangeup-faq-question] {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.3;
    color: #1d1d1d;
  }

  [data-exchangeup-faq-icon] {
    position: relative;
    width: 28px;
    height: 28px;
    flex: none;
    border-radius: 999px;
    background: rgba(57, 72, 77, 0.08);
    color: #39484d;
    transition:
      transform 0.2s ease,
      background 0.2s ease,
      color 0.2s ease;
  }

  [data-exchangeup-faq-icon]::before,
  [data-exchangeup-faq-icon]::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: 12px;
    height: 1.5px;
    border-radius: 999px;
    background: currentColor;
    transform: translate(-50%, -50%);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  [data-exchangeup-faq-icon]::after {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  [data-exchangeup-faq-item][data-state="open"] [data-exchangeup-faq-icon] {
    background: #39484d;
    color: #ffffff;
    transform: rotate(180deg);
  }

  [data-exchangeup-faq-item][data-state="open"] [data-exchangeup-faq-icon]::after {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(90deg) scaleX(0);
  }

  [data-exchangeup-faq-panel] {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.24s ease;
  }

  [data-exchangeup-faq-item][data-state="open"] [data-exchangeup-faq-panel] {
    grid-template-rows: 1fr;
  }

  [data-exchangeup-faq-panel-inner] {
    overflow: hidden;
  }

  [data-exchangeup-faq-answer] {
    margin: 0;
    padding: 0 22px 20px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6;
    letter-spacing: -0.02em;
    color: rgba(86, 82, 75, 0.9);
  }

  @media (max-width: 809.98px) {
    [data-exchangeup-faq-shell] {
      gap: 10px;
      padding: 14px;
      border-radius: 22px;
    }

    [data-exchangeup-faq-trigger] {
      padding: 16px 16px 14px;
      gap: 12px;
    }

    [data-exchangeup-faq-question] {
      font-size: 15px;
    }

    [data-exchangeup-faq-answer] {
      padding: 0 16px 16px;
      font-size: 13px;
      line-height: 1.55;
    }

    [data-exchangeup-faq-icon] {
      width: 24px;
      height: 24px;
    }
  }
`;

function getFaqMarkup() {
  return `
    <div data-exchangeup-faq-shell>
      ${FAQ_ITEMS.map(
        (item, index) => `
          <article data-exchangeup-faq-item data-state="${index === 0 ? "open" : "closed"}">
            <button
              type="button"
              aria-expanded="${index === 0 ? "true" : "false"}"
              data-exchangeup-faq-trigger
            >
              <span data-exchangeup-faq-question>${item.question}</span>
              <span aria-hidden="true" data-exchangeup-faq-icon></span>
            </button>
            <div data-exchangeup-faq-panel>
              <div data-exchangeup-faq-panel-inner>
                <p data-exchangeup-faq-answer>${item.answer}</p>
              </div>
            </div>
          </article>
        `,
      ).join("")}
    </div>
  `;
}

const CONTACT_SECTION_SELECTOR =
  'section[data-framer-name="Desktop"], section[data-framer-name="Tablet"], section[data-framer-name="Phone"]';
const CONTACT_ORIGINAL_HEADING = "Start your journey";
const CONTACT_ORIGINAL_BODY = "Let’s start building something great together.";
const CONTACT_ORIGINAL_EMAIL = "hello@grovia.io";
const CONTACT_ORIGINAL_PHONE = "206-837-1232";
const CONTACT_ORIGINAL_RATING = "4.9 / 5 RatedOver 9.2k Customers";
const CONTACT_SUPPORT_EMAIL = "support@1031exchangeup.com";
const CONTACT_HEADING = "Talk to the 1031 Exchange Up team.";
const CONTACT_BODY =
  "Questions about the marketplace, onboarding, or getting started? Send us a message and we'll follow up by email.";
const FOOTER_SECTION_SELECTOR =
  'footer[data-framer-name="Desktop"], footer[data-framer-name="Tablet"], footer[data-framer-name="Phone"]';
const FOOTER_NEWSLETTER_COPY = "The exchange network for 1031 agents.";
const FOOTER_PAGE_LINKS = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
] as const;
const FOOTER_STYLE = `
  [data-exchangeup-footer="true"] [data-framer-name="Nav"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  [data-exchangeup-footer="true"] [data-framer-name="Nav List"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }

  [data-exchangeup-footer="true"] [data-framer-name="Nav List"] > div {
    width: max-content !important;
    max-width: none !important;
    flex: none !important;
  }

  [data-exchangeup-footer="true"] a[data-framer-name*="Footer"] {
    display: inline-flex !important;
    width: auto !important;
    max-width: none !important;
    white-space: nowrap !important;
    line-height: 1.25 !important;
    text-decoration: none !important;
  }

  [data-exchangeup-footer="true"] [data-framer-name="Contact"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  [data-exchangeup-footer="true"] a[href^="mailto:"] {
    display: inline-block !important;
    width: auto !important;
    max-width: 100% !important;
    white-space: nowrap !important;
    text-decoration: none !important;
  }

  @media (max-width: 809.98px) {
    [data-exchangeup-footer="true"] a[href^="mailto:"] {
      white-space: normal !important;
      word-break: break-word !important;
    }
  }
`;

function getContactSections(doc: Document) {
  return Array.from(
    doc.querySelectorAll<HTMLElement>(CONTACT_SECTION_SELECTOR),
  ).filter(
    (section) =>
      ((section.textContent ?? "").includes(CONTACT_ORIGINAL_HEADING) ||
        (section.textContent ?? "").includes(CONTACT_HEADING)) &&
      Boolean(section.querySelector("form")),
  );
}

function getFooterSections(doc: Document) {
  return Array.from(
    doc.querySelectorAll<HTMLElement>(FOOTER_SECTION_SELECTOR),
  ).filter((section) => (section.textContent ?? "").includes("hello@grovia.io"));
}

function isMissingContactSubmissionsTable(message: string) {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("contact_submissions") &&
    (normalizedMessage.includes("schema cache") ||
      normalizedMessage.includes("could not find the table") ||
      normalizedMessage.includes("relation") ||
      normalizedMessage.includes("does not exist"))
  );
}

async function submitContactLead({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const contactSubmissionResult = await supabase.from("contact_submissions").insert({
    name,
    email,
    message,
  });

  if (!contactSubmissionResult.error) {
    return contactSubmissionResult;
  }

  if (!isMissingContactSubmissionsTable(contactSubmissionResult.error.message)) {
    return contactSubmissionResult;
  }

  return supabase.from("demo_requests").insert({
    full_name: name,
    work_email: email,
    company: "Website contact inquiry",
    role: "Contact form lead",
    phone: null,
    timeline: null,
    use_case: message,
  });
}

export default function Index() {
  const lenisRef = useRef<Lenis | null>(null);
  const lenisRafRef = useRef<number | null>(null);
  const revealRafRef = useRef<number | null>(null);
  const [frameReady, setFrameReady] = useState(false);

  const destroySmoothScroll = useCallback(() => {
    if (lenisRafRef.current !== null) {
      cancelAnimationFrame(lenisRafRef.current);
    }

    lenisRafRef.current = null;
    lenisRef.current?.destroy();
    lenisRef.current = null;
  }, []);

  const injectSmoothScrollStyles = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-smooth-scroll-style]")?.remove();

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-smooth-scroll-style", "true");
    style.textContent = SMOOTH_SCROLL_STYLE;
    doc.head.appendChild(style);
  }, []);

  const injectNavbarStyles = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-navbar-style]")?.remove();

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-navbar-style", "true");
    style.textContent = NAVBAR_STYLE;
    doc.head.appendChild(style);
  }, []);

  const injectEasySetupStyles = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-easy-setup-style]")?.remove();

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-easy-setup-style", "true");
    style.textContent = EASY_SETUP_STYLE;
    doc.head.appendChild(style);
  }, []);

  const removeSectionsBetweenFeatureAndFaq = useCallback((doc: Document) => {
    doc
      .querySelectorAll<HTMLElement>("[data-exchangeup-section-hidden='true']")
      .forEach((node) => {
        node.removeAttribute("data-exchangeup-section-hidden");
        node.style.removeProperty("display");
      });

    const featureSection = doc.querySelector<HTMLElement>(
      'section[data-framer-name="Feature Section"]',
    );
    const faqSection = doc.querySelector<HTMLElement>(
      'section[data-framer-name="FAQ Section"]',
    );

    const parent = featureSection?.parentElement;
    if (!featureSection || !faqSection || !parent || faqSection.parentElement !== parent) {
      return;
    }

    const siblings = Array.from(parent.children);
    const featureIndex = siblings.indexOf(featureSection);
    const faqIndex = siblings.indexOf(faqSection);

    if (featureIndex < 0 || faqIndex < 0 || faqIndex <= featureIndex + 1) {
      return;
    }

    siblings.slice(featureIndex + 1, faqIndex).forEach((node) => {
      const section = node as HTMLElement;
      if (section.tagName !== "SECTION") return;
      section.setAttribute("data-exchangeup-section-hidden", "true");
      section.style.display = "none";
    });
  }, []);

  const injectFaqSection = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-faq-style]")?.remove();

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-faq-style", "true");
    style.textContent = FAQ_STYLE;
    doc.head.appendChild(style);

    const normalizeText = (value: string) =>
      value.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim();

    const faqSection =
      Array.from(
        doc.querySelectorAll<HTMLElement>('section[data-framer-name="FAQ Section"]'),
      )[0] ??
      Array.from(doc.querySelectorAll<HTMLElement>("section, div")).find((node) => {
        const text = normalizeText(node.textContent ?? "");
        return (
          text.includes(FAQ_SECTION_HEADING) &&
          text.includes(FAQ_SECTION_SUBHEADING)
        );
      });

    if (!faqSection) return;

    const faqContainer =
      Array.from(
        faqSection.querySelectorAll<HTMLElement>('section[data-framer-name="Container"]'),
      )[0] ?? faqSection;

    const faqHosts = Array.from(faqContainer.children).filter((node) => {
      const text = normalizeText(node.textContent ?? "");
      return text.includes(FAQ_SECTION_ORIGINAL_QUESTION);
    }) as HTMLElement[];

    if (faqHosts.length === 0) return;

    faqHosts.forEach((hostVariant) => {
      const host = hostVariant.firstElementChild as HTMLElement | null;
      if (!host) return;

      host.replaceChildren();

      const faqShell = doc.createElement("div");
      faqShell.setAttribute("data-exchangeup-faq-injected", "true");
      faqShell.innerHTML = getFaqMarkup();
      host.appendChild(faqShell);

      const items = Array.from(
        faqShell.querySelectorAll<HTMLElement>("[data-exchangeup-faq-item]"),
      );

      const setItemState = (item: HTMLElement, open: boolean) => {
        item.setAttribute("data-state", open ? "open" : "closed");
        const trigger = item.querySelector<HTMLElement>("[data-exchangeup-faq-trigger]");
        trigger?.setAttribute("aria-expanded", String(open));
      };

      items.forEach((item) => {
        const trigger = item.querySelector<HTMLElement>("[data-exchangeup-faq-trigger]");
        if (!trigger) return;

        trigger.addEventListener("click", () => {
          const shouldOpen = item.getAttribute("data-state") !== "open";
          items.forEach((otherItem) => setItemState(otherItem, false));
          setItemState(item, shouldOpen);
        });
      });
    });
  }, []);

  const injectContactSection = useCallback((doc: Document) => {
    const normalizeText = (value: string) =>
      value.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim();

    const findLeafTextNodes = (root: ParentNode, text: string) =>
      Array.from(
        root.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, div, span, a"),
      ).filter(
        (node) =>
          node.children.length === 0 &&
          normalizeText(node.textContent ?? "") === text,
      );

    const findExactTextNodes = (root: ParentNode, text: string) =>
      Array.from(
        root.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, div, span, a"),
      ).filter((node) => normalizeText(node.textContent ?? "") === text);

    const setLeafText = (root: ParentNode, originalText: string, nextText: string) => {
      findLeafTextNodes(root, originalText).forEach((node) => {
        node.textContent = nextText;
      });
    };

    const hideTextChain = (root: HTMLElement, text: string) => {
      findExactTextNodes(root, text).forEach((node) => {
        let current: HTMLElement | null = node;

        while (current && current !== root) {
          if (normalizeText(current.textContent ?? "") !== text) break;
          current.style.display = "none";
          current.setAttribute("data-exchangeup-contact-hidden", "true");
          current = current.parentElement;
        }
      });
    };

    getContactSections(doc).forEach((section) => {
      section
        .querySelectorAll<HTMLElement>("[data-exchangeup-contact-hidden='true']")
        .forEach((node) => {
          node.removeAttribute("data-exchangeup-contact-hidden");
          node.style.removeProperty("display");
        });

      setLeafText(section, CONTACT_ORIGINAL_HEADING, CONTACT_HEADING);
      setLeafText(section, CONTACT_ORIGINAL_BODY, CONTACT_BODY);

      hideTextChain(section, CONTACT_ORIGINAL_PHONE);
      hideTextChain(section, CONTACT_ORIGINAL_RATING);

      findLeafTextNodes(section, CONTACT_ORIGINAL_EMAIL).forEach((node) => {
        if (node.tagName === "A") {
          const anchor = node as HTMLAnchorElement;
          anchor.href = `mailto:${CONTACT_SUPPORT_EMAIL}`;
          anchor.textContent = CONTACT_SUPPORT_EMAIL;
          return;
        }

        node.textContent = CONTACT_SUPPORT_EMAIL;

        const anchor = node.querySelector<HTMLAnchorElement>("a");
        if (anchor) {
          anchor.href = `mailto:${CONTACT_SUPPORT_EMAIL}`;
          anchor.textContent = CONTACT_SUPPORT_EMAIL;
        }
      });

      section.querySelectorAll<HTMLElement>('[data-framer-name="Rating"]').forEach((node) => {
        node.style.display = "none";
        node.setAttribute("data-exchangeup-contact-hidden", "true");
      });
    });
  }, []);

  const wireContactForm = useCallback((doc: Document) => {
    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const createStatusNode = () => {
      const node = doc.createElement("div");
      node.setAttribute("data-exchangeup-contact-status", "true");
      node.style.display = "none";
      node.style.marginTop = "14px";
      node.style.fontSize = "13px";
      node.style.lineHeight = "1.55";
      node.style.letterSpacing = "-0.01em";
      node.style.color = "#5f5a53";
      return node;
    };

    getContactSections(doc).forEach((section) => {
      const form = section.querySelector<HTMLFormElement>("form");
      if (!form) return;

      form.parentElement
        ?.querySelectorAll<HTMLElement>("[data-exchangeup-contact-status='true']")
        .forEach((node) => node.remove());

      const statusNode = createStatusNode();
      form.insertAdjacentElement("afterend", statusNode);

      if (form.dataset.exchangeupContactSubmitWired === "true") return;
      form.dataset.exchangeupContactSubmitWired = "true";

      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const submitLabel =
        submitButton?.querySelector<HTMLElement>("p, span, div") ?? submitButton;
      const defaultButtonText = submitLabel?.textContent?.trim() || "Submit";
      let submitting = false;

      const setStatus = (message: string, tone: "default" | "success" | "error") => {
        statusNode.style.display = "block";
        statusNode.textContent = message;
        statusNode.style.color =
          tone === "error"
            ? "#a11d1d"
            : tone === "success"
              ? "#2f6c36"
              : "#5f5a53";
      };

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitting) return;

        const nameInput = form.querySelector<HTMLInputElement>('input[name="Name"]');
        const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
        const messageInput = form.querySelector<HTMLTextAreaElement>("textarea");

        const name = nameInput?.value.trim() ?? "";
        const email = emailInput?.value.trim() ?? "";
        const message = messageInput?.value.trim() ?? "";

        if (!name || !email || !message) {
          setStatus("Please fill in your name, email, and message.", "error");
          return;
        }

        if (!isValidEmail(email)) {
          setStatus("Enter a valid email address.", "error");
          return;
        }

        if (name.length > 120 || email.length > 320 || message.length > 5000) {
          setStatus("One of your entries is too long. Please shorten it and try again.", "error");
          return;
        }

        submitting = true;
        if (submitButton) submitButton.disabled = true;
        if (submitLabel) submitLabel.textContent = "Submitting...";
        setStatus("Submitting your message...", "default");

        const { error } = await submitContactLead({
          name,
          email,
          message,
        });

        submitting = false;
        if (submitButton) submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = defaultButtonText;

        if (error) {
          setStatus(error.message || "We couldn't send your message. Please try again.", "error");
          return;
        }

        form.reset();
        setStatus("Thanks. Your message was sent successfully.", "success");
      });
    });
  }, []);

  const injectFooterSection = useCallback((doc: Document) => {
    const normalizeText = (value: string) =>
      value.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim();

    doc.querySelector("[data-exchangeup-footer-style]")?.remove();

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-footer-style", "true");
    style.textContent = FOOTER_STYLE;
    doc.head.appendChild(style);

    const leafNodes = (root: ParentNode) =>
      Array.from(
        root.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, div, span, a"),
      ).filter((node) => node.children.length === 0);

    getFooterSections(doc).forEach((footer) => {
      footer.setAttribute("data-exchangeup-footer", "true");
      footer
        .querySelectorAll<HTMLElement>("[data-exchangeup-footer-hidden='true']")
        .forEach((node) => {
          node.removeAttribute("data-exchangeup-footer-hidden");
          node.style.removeProperty("display");
        });

      leafNodes(footer).forEach((node) => {
        const text = normalizeText(node.textContent ?? "");

        if (text === "Sign up for our newsletter") {
          node.textContent = FOOTER_NEWSLETTER_COPY;
        }

        if (text === "hello@grovia.io") {
          node.textContent = CONTACT_SUPPORT_EMAIL;
        }

        if (text === "Designed by Lunis. All rights reserved.") {
          node.textContent = `© ${new Date().getFullYear()} 1031 Exchange Up. All rights reserved.`;
        }
      });

      const pageLinks = Array.from(footer.querySelectorAll<HTMLAnchorElement>("a")).filter(
        (anchor) => normalizeText(anchor.textContent ?? "").length > 0,
      );

      FOOTER_PAGE_LINKS.forEach((linkConfig, index) => {
        const anchor = pageLinks[index];
        if (!anchor) return;
        anchor.href = linkConfig.href;
        anchor.target = "_parent";
        anchor.textContent = linkConfig.label;
      });

      const emailAnchor = pageLinks[FOOTER_PAGE_LINKS.length];
      if (emailAnchor) {
        emailAnchor.href = `mailto:${CONTACT_SUPPORT_EMAIL}`;
        emailAnchor.target = "_parent";
        emailAnchor.textContent = CONTACT_SUPPORT_EMAIL;
      }

      const socialContainer = footer.querySelector<HTMLElement>(
        '[data-framer-name="Socials"]',
      );
      socialContainer?.setAttribute("data-exchangeup-footer-hidden", "true");
      if (socialContainer) {
        socialContainer.style.display = "none";
      }
    });
  }, []);

  const injectFeatureShowcase = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-feature-showcase-style]")?.remove();
    doc.querySelector("[data-exchangeup-feature-showcase]")?.remove();

    doc
      .querySelectorAll("[data-exchangeup-feature-original-hidden='true']")
      .forEach((node) => {
        node.removeAttribute("data-exchangeup-feature-original-hidden");
        (node as HTMLElement).style.removeProperty("display");
      });

    const normalizeText = (value: string) =>
      value.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim();

    const featureSection = doc.querySelector<HTMLElement>(
      'section[data-framer-name="Feature Section"]',
    );
    const featureContainer =
      featureSection?.querySelector<HTMLElement>(
        'section[data-framer-name="Container"]',
      ) ?? null;

    if (!featureSection || !featureContainer) return;

    if (!featureContainer.dataset.exchangeupFeatureOriginalHtml) {
      featureContainer.dataset.exchangeupFeatureOriginalHtml = featureContainer.innerHTML;
    } else {
      featureContainer.innerHTML = featureContainer.dataset.exchangeupFeatureOriginalHtml;
    }

    const candidates = Array.from(featureContainer.querySelectorAll("section, div"))
      .filter((node) => {
        const text = normalizeText(node.textContent ?? "");
        const rect = (node as HTMLElement).getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          text.includes(FEATURE_SHOWCASE_ORIGINAL_HEADING) &&
          text.includes(FEATURE_SHOWCASE_ORIGINAL_SUBHEADING)
        );
      })
      .sort(
        (a, b) =>
          normalizeText(a.textContent ?? "").length -
          normalizeText(b.textContent ?? "").length,
      ) as HTMLElement[];

    const anchor =
      candidates.find((node) => normalizeText(node.textContent ?? "").length < 320) ??
      candidates[0];

    if (!anchor) return;

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-feature-showcase-style", "true");
    style.textContent = FEATURE_SHOWCASE_STYLE;
    doc.head.appendChild(style);

    const showcase = doc.createElement("section");
    showcase.setAttribute("data-exchangeup-feature-showcase", "true");
    showcase.setAttribute("data-exchangeup-feature-active", "off-market");
    showcase.innerHTML = getFeatureShowcaseMarkup();

    const setActiveTab = (tabId: FeatureShowcaseTabId) => {
      showcase.setAttribute("data-exchangeup-feature-active", tabId);

      showcase
        .querySelectorAll("[data-exchangeup-feature-tab]")
        .forEach((button) => {
          const isActive =
            button.getAttribute("data-exchangeup-feature-tab") === tabId;
          button.setAttribute("aria-selected", String(isActive));
          button.setAttribute("tabindex", isActive ? "0" : "-1");
        });
    };

    showcase
      .querySelectorAll("[data-exchangeup-feature-tab]")
      .forEach((button) => {
        const tabId = button.getAttribute(
          "data-exchangeup-feature-tab",
        ) as FeatureShowcaseTabId | null;
        if (!tabId) return;

        button.addEventListener("click", () => setActiveTab(tabId));
        button.addEventListener("focus", () => setActiveTab(tabId));
        button.addEventListener("mouseenter", () => setActiveTab(tabId));
      });

    setActiveTab("off-market");
    featureSection.style.height = "auto";
    featureSection.style.minHeight = "0";
    featureSection.style.overflow = "visible";

    featureContainer.style.height = "auto";
    featureContainer.style.minHeight = "0";
    featureContainer.style.paddingTop = "32px";
    featureContainer.style.paddingBottom = "24px";
    featureContainer.style.overflow = "visible";
    featureContainer.replaceChildren(showcase);
  }, []);

  const setupEasySetupCards = useCallback(
    (frame: HTMLIFrameElement | null) => {
      const win = frame?.contentWindow;
      const doc = frame?.contentDocument;
      if (!win || !doc) return;

      doc
        .querySelectorAll("[data-exchangeup-easy-setup-preview][data-exchangeup-injected='true']")
        .forEach((node) => node.remove());
      doc
        .querySelectorAll("[data-exchangeup-easy-setup-row]")
        .forEach((node) => {
          node.removeAttribute("data-exchangeup-easy-setup-row");
          node.removeAttribute("data-exchangeup-active-card");
          (node as HTMLElement).onmouseleave = null;
        });
      doc
        .querySelectorAll("[data-exchangeup-easy-setup-group]")
        .forEach((node) => node.removeAttribute("data-exchangeup-easy-setup-group"));
      doc
        .querySelectorAll("[data-exchangeup-easy-setup-shell]")
        .forEach((node) => {
          node.removeAttribute("data-exchangeup-easy-setup-shell");
          (node as HTMLElement).onmouseenter = null;
        });
      doc
        .querySelectorAll("[data-exchangeup-easy-setup-card]")
        .forEach((node) => node.removeAttribute("data-exchangeup-easy-setup-card"));
      doc
        .querySelectorAll("[data-exchangeup-easy-setup-content]")
        .forEach((node) => node.removeAttribute("data-exchangeup-easy-setup-content"));

      if (
        frame.clientWidth < 1200 ||
        !win.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        return;
      }

      injectEasySetupStyles(doc);

      const cardRoots = Array.from(
        doc.querySelectorAll(
          '[data-framer-name="Default/Open"], [data-framer-name="Default/Close"]',
        ),
      )
        .filter((node) => {
          const text = (node.textContent ?? "").trim();
          const rect = (node as HTMLElement).getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.top > 1200 &&
            rect.top < 1800 &&
            (text.includes("Easy setup") ||
              text.includes("Collaborate") ||
              text.includes("Track growth"))
          );
        })
        .sort(
          (a, b) =>
            (a as HTMLElement).getBoundingClientRect().left -
            (b as HTMLElement).getBoundingClientRect().left,
        ) as HTMLElement[];

      if (cardRoots.length !== 3) return;

      const row = cardRoots[0].closest(
        '[data-framer-name="Desktop/1"]',
      ) as HTMLElement | null;
      const group = cardRoots[0].closest(
        '[data-framer-name="1+2"]',
      ) as HTMLElement | null;
      if (!row || !group) return;

      const cardIds: EasySetupCardId[] = ["1", "2", "3"];
      const cardCopy: Record<EasySetupCardId, { title: string; body: string }> = {
        "1": {
          title: "Add your client's property",
          body: "Enter the property your client currently holds. It anchors every replacement the system scores.",
        },
        "2": {
          title: "Filter and find your match",
          body: "Filter by ROI target, location, asset type, or cap rate. Every off-market property is auto-scored against your client's exchange.",
        },
        "3": {
          title: "Connect and offer",
          body: "Open a private line with the listing agent, submit an offer, and lock it in before the old property lists.",
        },
      };
      row.setAttribute("data-exchangeup-easy-setup-row", "true");
      row.setAttribute("data-exchangeup-active-card", "1");
      group.setAttribute("data-exchangeup-easy-setup-group", "true");

      cardRoots.forEach((cardRoot, index) => {
        const cardId = cardIds[index];
        const shell = cardRoot.parentElement as HTMLElement | null;
        const content = cardRoot.firstElementChild as HTMLElement | null;
        if (!shell || !content) return;

        shell.setAttribute("data-exchangeup-easy-setup-shell", cardId);
        cardRoot.setAttribute("data-exchangeup-easy-setup-card", cardId);
        content.setAttribute("data-exchangeup-easy-setup-content", "true");

        const copy = cardCopy[cardId];
        const originalTitles = ["Easy setup", "Collaborate", "Track growth"];
        const richTextNodes = Array.from(
          content.querySelectorAll(
            "[data-framer-component-type='RichTextContainer'] p, [data-framer-component-type='RichTextContainer'] h1, [data-framer-component-type='RichTextContainer'] h2, [data-framer-component-type='RichTextContainer'] h3, [data-framer-component-type='RichTextContainer'] h4, [data-framer-component-type='RichTextContainer'] h5, [data-framer-component-type='RichTextContainer'] h6",
          ),
        ) as HTMLElement[];

        const titleIndex = richTextNodes.findIndex((node) => {
          const text = (node.textContent ?? "").trim();
          return originalTitles.includes(text);
        });

        if (titleIndex >= 0) {
          richTextNodes[titleIndex].textContent = copy.title;
          const bodyNode = richTextNodes[titleIndex + 1];
          if (bodyNode) bodyNode.textContent = copy.body;
        } else {
          const lastNode = richTextNodes[richTextNodes.length - 1];
          if (lastNode) lastNode.textContent = copy.body;
        }

        while (cardRoot.children.length > 1) {
          cardRoot.lastElementChild?.remove();
        }

        const preview = doc.createElement("div");
        preview.setAttribute("data-exchangeup-easy-setup-preview", "true");
        preview.setAttribute("data-exchangeup-injected", "true");
        preview.innerHTML = EASY_SETUP_PREVIEW_MARKUP[cardId];
        cardRoot.appendChild(preview);

        shell.onmouseenter = () => {
          row.setAttribute("data-exchangeup-active-card", cardId);
        };
      });

      row.onmouseleave = () => {
        row.setAttribute("data-exchangeup-active-card", "1");
      };
    },
    [injectEasySetupStyles],
  );

  const setupSmoothScroll = useCallback((frame: HTMLIFrameElement | null) => {
    const win = frame?.contentWindow;
    const doc = frame?.contentDocument;
    if (!win || !doc) return;

    injectSmoothScrollStyles(doc);
    destroySmoothScroll();

    if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      wrapper: doc.documentElement,
      content: doc.body,
      eventsTarget: doc.documentElement,
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      overscroll: true,
      anchors: true,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      prevent: (node) =>
        typeof (node as Element | null)?.closest === "function" &&
        Boolean(
          (node as Element).closest(
            "textarea, input, select, [data-lenis-prevent]",
          ),
        ),
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      lenisRafRef.current = requestAnimationFrame(raf);
    };

    lenisRafRef.current = requestAnimationFrame(raf);
  }, [destroySmoothScroll, injectSmoothScrollStyles]);

  const rewriteHeroCopy = useCallback((doc: Document) => {
    const headlineContainers = Array.from(
      doc.querySelectorAll(
        '[data-framer-name="Strategy and growth for modern teams"]',
      ),
    );

    headlineContainers.forEach((container) => {
      const lines = container.querySelectorAll("h1");
      if (lines[0]) lines[0].textContent = "Find your client's next replacement property.";
      if (lines[1]) {
        lines[1].textContent = "";
        (lines[1] as HTMLElement).style.display = "none";
      }

      const parent = (lines[0] as HTMLElement | undefined)?.parentElement;
      if (lines[0] && parent) {
        let eyebrow = parent.querySelector<HTMLElement>(
          "[data-exchangeup-hero-eyebrow='true']",
        );
        if (!eyebrow) {
          eyebrow = doc.createElement("p");
          eyebrow.setAttribute("data-exchangeup-hero-eyebrow", "true");
          parent.insertBefore(eyebrow, lines[0]);
        }
        eyebrow.textContent = "Built for real estate agents & brokers";
        eyebrow.style.margin = "0 0 14px 0";
        eyebrow.style.padding = "6px 14px";
        eyebrow.style.display = "inline-flex";
        eyebrow.style.alignSelf = "flex-start";
        eyebrow.style.alignItems = "center";
        eyebrow.style.width = "fit-content";
        eyebrow.style.borderRadius = "999px";
        eyebrow.style.border = "1px solid rgba(29,29,29,0.12)";
        eyebrow.style.background = "rgba(29,29,29,0.04)";
        eyebrow.style.fontFamily = NAVBAR_FONT_STACK;
        eyebrow.style.fontSize = "12px";
        eyebrow.style.fontWeight = "600";
        eyebrow.style.letterSpacing = "0.14em";
        eyebrow.style.textTransform = "uppercase";
        eyebrow.style.color = "#1d1d1d";
        eyebrow.style.lineHeight = "1";
      }
    });

    const subheadlineText =
      "An off-market marketplace of verified 1031 exchange replacement properties \u2014 so your client can find the next one before the old one ever gets listed.";

    const subheadlineContainers = Array.from(
      doc.querySelectorAll(
        '[data-framer-name="Grovia partners with startups and small businesses to streamline operations, elevate team performance, and build a foundation for lasting success."]',
      ),
    );

    subheadlineContainers.forEach((container) => {
      const paragraph = container.querySelector("p");
      if (paragraph) {
        paragraph.textContent = subheadlineText;
      }
    });

    const buttonGroups = Array.from(
      doc.querySelectorAll('[data-framer-name="Buttons"]'),
    );

    buttonGroups.forEach((group) => {
      const links = Array.from(group.querySelectorAll("a"));
      if (links[0]) {
        links[0].setAttribute("href", "/signup");
        links[0].setAttribute("target", "_parent");
        const textEl = links[0].querySelector(
          "[data-framer-component-type='RichTextContainer'] p",
        );
        if (textEl) textEl.textContent = "Get Started";
      }

      if (links[1]) {
        links[1].setAttribute("href", "/book-demo");
        links[1].setAttribute("target", "_parent");
        const textEl = links[1].querySelector(
          "[data-framer-component-type='RichTextContainer'] p",
        );
        if (textEl) textEl.textContent = "Book a Demo";
      }
    });
  }, []);

  const injectButtonArrows = useCallback((doc: Document) => {
    const arrowSvg = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="width:14px;height:14px;color:#1d1d1d;display:block;"
      >
        <path d="M7 17 17 7"/>
        <path d="M7 7h10v10"/>
      </svg>
    `;

    const arrowContainers = Array.from(
      doc.querySelectorAll('a [data-framer-name="Arrow"]'),
    ) as HTMLElement[];

    arrowContainers.forEach((container) => {
      if (container.dataset.exchangeupArrowInjected === "true") return;
      container.dataset.exchangeupArrowInjected = "true";
      container.style.width = "28px";
      container.style.height = "28px";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.flexShrink = "0";
      container.innerHTML = arrowSvg;
    });
  }, []);

  const replaceDashboardScreenshot = useCallback((doc: Document) => {
    const screenshots = Array.from(
      doc.querySelectorAll(
        "img[alt='Dashboard UI'], img[src*='gU3HkY1CdAlVmjaQoAPwETeEos']",
      ),
    ) as HTMLImageElement[];

    screenshots.forEach((screenshot) => {
      const wrapper = screenshot.parentElement;
      if (!wrapper) return;

      wrapper.replaceChildren(
        createLandingRenderImage(
          doc,
          LANDING_DASHBOARD_IMAGE_SRC,
          "1031 ExchangeUp dashboard preview",
          "center top",
        ),
      );
    });
  }, []);

  const replaceHeroRenders = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-hero-renders-style]")?.remove();
    doc.querySelector("[data-exchangeup-hero-renders]")?.remove();

    doc
      .querySelectorAll("[data-exchangeup-hero-original-hidden='true']")
      .forEach((node) => {
        node.removeAttribute("data-exchangeup-hero-original-hidden");
        (node as HTMLElement).style.removeProperty("display");
      });

    const heroSection = doc.querySelector(
      'header[data-framer-name="Hero Section"]',
    ) as HTMLElement | null;
    if (!heroSection) return;

    const heroListWidgets = Array.from(
      doc.querySelectorAll("[data-framer-name='Widget']"),
    ).filter((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      return text.includes("Customers") && text.includes("Sort by Newest");
    }) as HTMLElement[];

    const heroKpiWidgets = Array.from(
      doc.querySelectorAll("[data-framer-name='Chart']"),
    ).filter((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      return text.includes("Daily Average") && text.includes("+30m");
    }) as HTMLElement[];

    [...heroListWidgets, ...heroKpiWidgets].forEach((widget) => {
      widget.setAttribute("data-exchangeup-hero-original-hidden", "true");
      widget.style.display = "none";
    });

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-hero-renders-style", "true");
    style.textContent = `
      header[data-framer-name="Hero Section"] {
        position: relative;
        overflow: visible;
      }

      [data-exchangeup-hero-renders] {
        position: absolute;
        right: max(72px, min(9vw, 130px));
        top: 170px;
        width: min(540px, 42vw);
        height: 392px;
        pointer-events: none;
        z-index: 3;
      }

      [data-exchangeup-hero-renders] img {
        position: absolute;
        display: block;
        max-width: none;
      }

      [data-exchangeup-hero-card="list"] {
        inset: 0 44px 72px 0;
        width: calc(100% - 44px);
        height: calc(100% - 72px);
        object-fit: contain;
        filter: drop-shadow(0 24px 42px rgba(77, 63, 41, 0.12));
      }

      [data-exchangeup-hero-card="kpi"] {
        right: 0;
        bottom: 0;
        width: 52%;
        object-fit: contain;
        transform: rotate(-3deg);
        filter: drop-shadow(0 20px 34px rgba(77, 63, 41, 0.14));
      }

      @media (max-width: 809.98px) {
        header[data-framer-name="Hero Section"] {
          min-height: 860px !important;
        }

        [data-exchangeup-hero-renders] {
          left: 18px;
          right: 18px;
          top: auto;
          bottom: 22px;
          width: auto;
          height: 312px;
        }

        [data-exchangeup-hero-card="list"] {
          inset: 0 38px 74px 0;
          width: calc(100% - 38px);
          height: calc(100% - 74px);
        }

        [data-exchangeup-hero-card="kpi"] {
          width: 61%;
          right: -2px;
          bottom: -2px;
        }
      }
    `;
    doc.head.appendChild(style);

    const heroRenders = doc.createElement("div");
    heroRenders.setAttribute("data-exchangeup-hero-renders", "true");
    heroRenders.innerHTML = `
      <img
        data-exchangeup-hero-card="list"
        src="${HERO_LIST_IMAGE_SRC}"
        alt="1031 ExchangeUp client pipeline"
        decoding="async"
      />
      <img
        data-exchangeup-hero-card="kpi"
        src="${HERO_KPI_IMAGE_SRC}"
        alt="1031 ExchangeUp match activity"
        decoding="async"
      />
    `;

    heroSection.appendChild(heroRenders);
  }, []);

  const injectLogoSlider = useCallback((doc: Document) => {
    doc.querySelector("[data-exchangeup-logo-slider]")?.remove();
    doc.querySelector("[data-exchangeup-logo-slider-style]")?.remove();

    const heroSection = doc.querySelector(
      'header[data-framer-name="Hero Section"]',
    ) as HTMLElement | null;
    if (!heroSection || !heroSection.parentElement) return;

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-logo-slider-style", "true");
    style.textContent = `
      @keyframes exchangeupLogoMarquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      header[data-framer-name="Hero Section"] {
        margin-bottom: -24px;
      }

      [data-exchangeup-logo-slider] {
        width: 100%;
        padding: 2px 0 6px;
        background: transparent;
        display: flex;
        justify-content: center;
      }

      [data-exchangeup-logo-slider] [data-logo-slider-viewport] {
        overflow: hidden;
        width: min(1000px, calc(100vw - 160px));
        mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
      }

      [data-exchangeup-logo-slider] [data-logo-slider-track] {
        display: flex;
        align-items: center;
        gap: 0;
        width: max-content;
        animation: exchangeupLogoMarquee 52s linear infinite;
      }

      [data-exchangeup-logo-slider] [data-logo-slider-group] {
        display: flex;
        align-items: center;
      }

      [data-exchangeup-logo-slider] [data-logo-item] {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 0 28px;
        color: rgba(148, 144, 136, 0.82);
        font-family: Geist, sans-serif;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: -0.03em;
        white-space: nowrap;
        flex: none;
        user-select: none;
      }

      [data-exchangeup-logo-slider] [data-logo-item] svg {
        width: 62px;
        height: 62px;
        display: block;
        color: rgba(148, 144, 136, 0.7);
      }

      @media (max-width: 809.98px) {
        header[data-framer-name="Hero Section"] {
          margin-bottom: -14px;
        }

        [data-exchangeup-logo-slider] {
          padding: 2px 0 4px;
        }

        [data-exchangeup-logo-slider] [data-logo-slider-viewport] {
          width: calc(100vw - 40px);
        }

        [data-exchangeup-logo-slider] [data-logo-item] {
          font-size: 15px;
          padding: 0 20px;
          gap: 10px;
        }

        [data-exchangeup-logo-slider] [data-logo-item] svg {
          width: 49px;
          height: 49px;
        }
      }
    `;
    doc.head.appendChild(style);

    const slider = doc.createElement("section");
    slider.setAttribute("data-exchangeup-logo-slider", "true");
    slider.setAttribute("aria-label", "Partner logo slider");

    const viewport = doc.createElement("div");
    viewport.setAttribute("data-logo-slider-viewport", "true");

    const track = doc.createElement("div");
    track.setAttribute("data-logo-slider-track", "true");

    for (let groupIndex = 0; groupIndex < 2; groupIndex += 1) {
      const group = doc.createElement("div");
      group.setAttribute("data-logo-slider-group", "true");

      LOGO_BRANDS.forEach((brand) => {
        const item = doc.createElement("div");
        item.setAttribute("data-logo-item", "true");

        const icon = doc.createElement("span");
        icon.innerHTML = getLogoMarkSvg(brand.mark);

        const label = doc.createElement("span");
        label.textContent = brand.name;

        item.append(icon, label);
        group.appendChild(item);
      });

      track.appendChild(group);
    }

    viewport.appendChild(track);
    slider.appendChild(viewport);
    heroSection.insertAdjacentElement("afterend", slider);
  }, []);

  const cleanIframe = useCallback((frame: HTMLIFrameElement | null) => {
    const doc = frame?.contentDocument;
    if (!doc) return;

    injectNavbarStyles(doc);

    doc.querySelector("#__framer-badge-container")?.remove();

    const allAnchors = Array.from(doc.querySelectorAll("a"));

    allAnchors.forEach((anchor) => {
      const text = (anchor.textContent ?? "").toLowerCase().trim();
      const href = (anchor.getAttribute("href") ?? "").toLowerCase();

      if (
        text.includes("made in framer") ||
        text.includes("use template") ||
        href.includes("framer.com")
      ) {
        anchor.remove();
        return;
      }

      const linkMap: Record<string, { href: string; label?: string }> = {
        about: { href: "/how-it-works", label: "How It Works" },
        features: { href: "/features" },
        pricing: { href: "/pricing" },
        "contact us": { href: "/signup", label: "Get Started" },
      };

      const match = linkMap[text];
      if (match) {
        anchor.setAttribute("href", match.href);
        anchor.setAttribute("target", "_parent");
        if (match.label) {
          const textEl = anchor.querySelector("[data-framer-component-type='RichTextContainer'] p");
          if (textEl) {
            textEl.textContent = match.label;
          }
        }
      }
    });

    doc
      .querySelectorAll("[data-exchangeup-injected-login]")
      .forEach((node) => node.remove());

    const navEl = doc.querySelector(".framer-9FYxx") as HTMLElement | null;
    if (navEl) {
      navEl.setAttribute("data-exchangeup-navbar", "true");
      if (frame.clientWidth >= 960) {
        navEl.style.width = "730px";
        navEl.style.maxWidth = "calc(100vw - 48px)";
      }

      const logoWrap = navEl.querySelector(
        '[data-framer-name="Logo"]',
      ) as HTMLElement | null;
      const logoLink = logoWrap?.querySelector("a") as HTMLAnchorElement | null;
      if (logoWrap && logoLink) {
        logoWrap.style.width = "auto";

        logoLink.href = "/";
        logoLink.target = "_parent";
        logoLink.innerHTML = NAVBAR_LOGO_LOCKUP;
        logoLink.style.cssText =
          "display:inline-flex; align-items:center; gap:6px; width:auto; height:36px; " +
          "position:relative; text-decoration:none; color:#1d1d1d; white-space:nowrap; overflow:visible;";
      }

      const contactBtn = navEl.querySelector("a[href='/signup']") as HTMLAnchorElement | null;
      if (contactBtn) {
        contactBtn.style.textDecoration = "none";
        const actionContainer = contactBtn.parentElement as HTMLElement | null;
        if (actionContainer) {
          actionContainer.style.display = "flex";
          actionContainer.style.alignItems = "center";
          actionContainer.style.gap = "8px";
          actionContainer.style.whiteSpace = "nowrap";
        }

        const loginLink = doc.createElement("a");
        loginLink.setAttribute("data-exchangeup-injected-login", "true");
        loginLink.href = "/login";
        loginLink.target = "_parent";
        loginLink.textContent = "Login";
        loginLink.style.cssText =
          `font-family: ${NAVBAR_FONT_STACK}; font-size: 14px; font-weight: 500; letter-spacing: -0.02em; color: #5d5d5d; ` +
          "text-decoration: none; padding: 4px 4px; white-space: nowrap; " +
          "line-height: 1; display: inline-flex; align-items: center; " +
          "transition: color 0.2s;";
        loginLink.addEventListener("mouseenter", () => { loginLink.style.color = "#1d1d1d"; });
        loginLink.addEventListener("mouseleave", () => { loginLink.style.color = "#5d5d5d"; });

        contactBtn.parentElement?.insertBefore(loginLink, contactBtn);
      }
    }

    rewriteHeroCopy(doc);
    replaceHeroRenders(doc);
    replaceDashboardScreenshot(doc);
    injectButtonArrows(doc);
    setupEasySetupCards(frame);
    injectLogoSlider(doc);
    removeSectionsBetweenFeatureAndFaq(doc);
    injectFaqSection(doc);
    injectContactSection(doc);
    wireContactForm(doc);
    injectFooterSection(doc);
    injectFeatureShowcase(doc);
  }, [injectButtonArrows, injectContactSection, injectFaqSection, injectFeatureShowcase, injectFooterSection, injectLogoSlider, injectNavbarStyles, removeSectionsBetweenFeatureAndFaq, replaceDashboardScreenshot, replaceHeroRenders, rewriteHeroCopy, setupEasySetupCards, wireContactForm]);

  const handleFrameLoad = useCallback((frame: HTMLIFrameElement | null) => {
    setFrameReady(false);
    cleanIframe(frame);
    setupSmoothScroll(frame);

    if (revealRafRef.current !== null) {
      cancelAnimationFrame(revealRafRef.current);
    }

    revealRafRef.current = requestAnimationFrame(() => {
      revealRafRef.current = null;
      setFrameReady(true);
    });
  }, [cleanIframe, setupSmoothScroll]);

  useEffect(() => {
    return () => {
      if (revealRafRef.current !== null) {
        cancelAnimationFrame(revealRafRef.current);
      }

      destroySmoothScroll();
    };
  }, [destroySmoothScroll]);

  return (
    <section
      aria-label="Grovia template homepage"
      className="relative h-full min-h-screen w-full"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[#f8f5ef] transition-opacity duration-200 ${
          frameReady ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      />
      <iframe
        title="Grovia homepage"
        src="/grovia/index.html"
        className={`relative z-10 h-[100vh] w-full border-0 transition-opacity duration-200 ${
          frameReady ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onLoad={(event) => handleFrameLoad(event.currentTarget)}
      />
    </section>
  );
}

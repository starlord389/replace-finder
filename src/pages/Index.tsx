import Lenis from "lenis";
import { useCallback, useEffect, useRef } from "react";

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

const EASY_SETUP_PREVIEW_MARKUP: Record<EasySetupCardId, string> = {
  "1": `
    <div data-exchangeup-preview-surface data-preview-variant="1">
      <div data-exchangeup-preview-ribbon></div>
      <div data-exchangeup-preview-panel>
        <div data-exchangeup-preview-kicker>+</div>
        <div data-exchangeup-preview-title>Create account</div>
        <div data-exchangeup-preview-avatars>
          <span></span><span></span><span></span><span></span>
        </div>
        <div data-exchangeup-preview-label">Username</div>
        <div data-exchangeup-preview-input>Your username</div>
        <div data-exchangeup-preview-label">Email</div>
        <div data-exchangeup-preview-input>Your email</div>
      </div>
    </div>
  `,
  "2": `
    <div data-exchangeup-preview-surface data-preview-variant="2">
      <div data-exchangeup-preview-ribbon></div>
      <div data-exchangeup-preview-panel>
        <div data-exchangeup-preview-kicker>+</div>
        <div data-exchangeup-preview-title">To-do tasks</div>
        <div data-exchangeup-preview-task">
          <span data-exchangeup-preview-checkbox></span>
          <div>
            <div data-exchangeup-preview-task-title>Brainstorming</div>
            <div data-exchangeup-preview-task-meta>Sketch next campaign ideas</div>
          </div>
        </div>
        <div data-exchangeup-preview-avatars>
          <span></span><span></span><span></span>
        </div>
        <div data-exchangeup-preview-task>
          <span data-exchangeup-preview-checkbox></span>
          <div>
            <div data-exchangeup-preview-task-title>Research</div>
            <div data-exchangeup-preview-task-meta>Gather market notes and links</div>
          </div>
        </div>
      </div>
    </div>
  `,
  "3": `
    <div data-exchangeup-preview-surface data-preview-variant="3">
      <div data-exchangeup-preview-ribbon></div>
      <div data-exchangeup-preview-panel>
        <div data-exchangeup-preview-kicker>+</div>
        <div data-exchangeup-preview-title">Sales Performance</div>
        <div data-exchangeup-preview-subtitle>Apr 30 - May 30</div>
        <div data-exchangeup-preview-chart>
          <svg viewBox="0 0 180 92" aria-hidden="true">
            <path d="M10 68C26 48 40 30 58 42C76 54 88 82 112 70C128 62 138 34 150 36C162 38 171 56 174 58" />
          </svg>
        </div>
        <div data-exchangeup-preview-metric">
          <strong>30%</strong>
          <span>Your sales performance is 30% above average this month.</span>
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
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(236, 243, 251, 0.98) 0%, rgba(250, 238, 242, 0.98) 100%);
    box-shadow: 0 12px 32px rgba(40, 35, 28, 0.08);
  }

  [data-exchangeup-preview-ribbon] {
    position: absolute;
    inset: 0 auto 0 0;
    width: 14px;
    background: linear-gradient(180deg, #98c5e1 0%, #f6a76c 52%, #cc88d2 100%);
  }

  [data-exchangeup-preview-panel] {
    position: relative;
    height: 100%;
    margin-left: 14px;
    padding: 16px 16px 14px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 250, 251, 0.82) 100%);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  [data-exchangeup-preview-kicker] {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: #7d7d7d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(29, 29, 29, 0.08);
  }

  [data-exchangeup-preview-title] {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.03em;
    color: #1d1d1d;
  }

  [data-exchangeup-preview-subtitle] {
    margin-top: -6px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.7);
  }

  [data-exchangeup-preview-avatars] {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  [data-exchangeup-preview-avatars] span {
    width: 16px;
    height: 16px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.9);
    margin-left: -5px;
  }

  [data-exchangeup-preview-avatars] span:nth-child(1) { background: #f7c26d; margin-left: 0; }
  [data-exchangeup-preview-avatars] span:nth-child(2) { background: #f49774; }
  [data-exchangeup-preview-avatars] span:nth-child(3) { background: #9a9df4; }
  [data-exchangeup-preview-avatars] span:nth-child(4) { background: #7ac7a4; }

  [data-exchangeup-preview-label] {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 600;
    color: rgba(29, 29, 29, 0.85);
  }

  [data-exchangeup-preview-input] {
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(207, 204, 198, 0.72);
    padding: 10px 12px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 500;
    color: rgba(128, 128, 128, 0.92);
  }

  [data-exchangeup-preview-task] {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(214, 210, 205, 0.72);
    padding: 10px 11px;
  }

  [data-exchangeup-preview-checkbox] {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 1.5px solid rgba(188, 184, 178, 0.9);
    flex: none;
    margin-top: 2px;
  }

  [data-exchangeup-preview-task-title] {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 600;
    color: #1d1d1d;
  }

  [data-exchangeup-preview-task-meta] {
    margin-top: 2px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.76);
  }

  [data-exchangeup-preview-chart] {
    margin-top: 4px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(214, 210, 205, 0.7);
    padding: 10px 10px 8px;
  }

  [data-exchangeup-preview-chart] svg {
    width: 100%;
    height: 92px;
    display: block;
  }

  [data-exchangeup-preview-chart] path {
    fill: none;
    stroke: #b57659;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [data-exchangeup-preview-metric] {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: auto;
  }

  [data-exchangeup-preview-metric] strong {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    color: #1d1d1d;
  }

  [data-exchangeup-preview-metric] span {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 500;
    color: rgba(97, 97, 97, 0.76);
  }
`;

type FeatureShowcaseTabId =
  | "client-portal"
  | "kpi-tracking"
  | "workflow-automation"
  | "team-management";

type FeatureShowcaseItem = {
  id: FeatureShowcaseTabId;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
};

const FEATURE_SHOWCASE_HEADING = "Built for high performance";
const FEATURE_SHOWCASE_SUBHEADING =
  "Grovia gives your team everything it needs to stay aligned, track performance, and scale with confidence — all in one place.";
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
    id: "client-portal",
    label: "Client portal",
    eyebrow: "Client portal",
    title: "Centralized access for teams and clients",
    description:
      "Securely share progress, files, feedback, and timelines with stakeholders. Keep everyone on the same page without switching platforms.",
  },
  {
    id: "kpi-tracking",
    label: "KPI tracking",
    eyebrow: "KPI tracking",
    title: "Measure what matters most",
    description:
      "Monitor your team's goals and key business metrics in real time. Custom dashboards make insights easy to access and act on.",
  },
  {
    id: "workflow-automation",
    label: "Workflow automation",
    eyebrow: "Workflow automation",
    title: "Automate repetitive tasks",
    description:
      "Save time with built-in automations that handle reminders, approvals, and task assignments, so your team can focus on high-impact work.",
  },
  {
    id: "team-management",
    label: "Team management",
    eyebrow: "Team management",
    title: "Built for growing teams",
    description:
      "Easily onboard new members, assign roles, and manage access. Keep your organization structured and scalable from day one.",
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

  [data-feature-client-window] {
    position: absolute;
    left: 12px;
    right: 24px;
    top: 24px;
    bottom: 12px;
    border-radius: 20px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 20px 36px rgba(20, 28, 32, 0.22);
  }

  [data-feature-client-window]::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 24px;
    background: #44545a;
  }

  [data-feature-client-body] {
    position: absolute;
    inset: 24px 0 0;
    padding: 18px 16px 16px;
  }

  [data-feature-client-header] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 13px;
    font-weight: 600;
    color: #232323;
  }

  [data-feature-client-list] {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
  }

  [data-feature-client-row] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(247, 247, 245, 0.9);
  }

  [data-feature-client-row="active"] {
    background: linear-gradient(180deg, #fff390 0%, #fff07a 100%);
  }

  [data-feature-avatar] {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: linear-gradient(135deg, #ff8e78 0%, #ffd281 100%);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.72);
  }

  [data-feature-avatar="2"] { background: linear-gradient(135deg, #9fd8ff 0%, #7ae0d0 100%); }
  [data-feature-avatar="3"] { background: linear-gradient(135deg, #ff7b72 0%, #ffd46c 100%); }
  [data-feature-avatar="4"] { background: linear-gradient(135deg, #ffa39b 0%, #f7d4d0 100%); }

  [data-feature-client-name] {
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 13px;
    font-weight: 600;
    line-height: 1.15;
    color: #1e1e1e;
  }

  [data-feature-client-meta] {
    margin-top: 3px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 500;
    color: rgba(93, 93, 93, 0.82);
  }

  [data-feature-client-icons] {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: rgba(39, 39, 39, 0.72);
  }

  [data-feature-client-icons] svg {
    width: 12px;
    height: 12px;
    display: block;
  }

  [data-feature-kpi-stack] {
    position: relative;
    width: min(76%, 360px);
    margin: 30px auto 0;
  }

  [data-feature-kpi-shadow] {
    position: absolute;
    inset: 0;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(4px);
  }

  [data-feature-kpi-shadow="back"] {
    transform: translate(-16px, -14px);
    opacity: 0.28;
  }

  [data-feature-kpi-shadow="mid"] {
    transform: translate(-8px, -8px);
    opacity: 0.4;
  }

  [data-feature-kpi-card] {
    position: relative;
    z-index: 2;
    padding: 24px 24px 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 22px 34px rgba(18, 24, 28, 0.24);
  }

  [data-feature-kpi-card] h4,
  [data-feature-kpi-card] p,
  [data-feature-team-form] h4,
  [data-feature-team-form] p {
    margin: 0;
    font-family: ${NAVBAR_FONT_STACK};
  }

  [data-feature-kpi-card] h4 {
    font-size: 20px;
    font-weight: 450;
    letter-spacing: -0.04em;
    color: #1d1d1d;
    text-align: center;
  }

  [data-feature-kpi-card] p {
    margin-top: 3px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    color: rgba(95, 95, 95, 0.72);
  }

  [data-feature-kpi-chart] {
    position: relative;
    margin-top: 20px;
    height: 150px;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(255, 237, 241, 0.76) 0%, rgba(255, 255, 255, 0) 60%),
      rgba(251, 250, 248, 0.9);
    overflow: hidden;
  }

  [data-feature-kpi-chart] svg {
    position: absolute;
    inset: 18px 14px 14px;
    width: calc(100% - 28px);
    height: calc(100% - 32px);
  }

  [data-feature-kpi-bubble] {
    position: absolute;
    left: 16px;
    top: 36px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #111111;
    color: #ffffff;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: -0.03em;
    box-shadow: 0 14px 20px rgba(17, 17, 17, 0.18);
  }

  [data-feature-kpi-tag] {
    position: absolute;
    left: 96px;
    top: 68px;
    padding: 7px 10px;
    border-radius: 999px;
    background: #ff8f9f;
    color: #ffffff;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: -0.02em;
    box-shadow: 0 12px 16px rgba(255, 143, 159, 0.28);
  }

  [data-feature-workflow-ghost] {
    position: absolute;
    left: 74px;
    top: 52px;
    width: min(58%, 224px);
    aspect-ratio: 0.82;
    border-radius: 24px;
    border: 1px dashed rgba(255, 255, 255, 0.26);
    transform: rotate(-2deg);
  }

  [data-feature-workflow-card] {
    position: relative;
    z-index: 2;
    width: min(58%, 224px);
    aspect-ratio: 0.82;
    margin: 30px 0 0 90px;
    padding: 14px 14px 12px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 22px 36px rgba(18, 24, 28, 0.24);
    transform: rotate(3deg);
  }

  [data-feature-workflow-tag] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 9px;
    border-radius: 999px;
    background: #ffd5ea;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #d96e9f;
  }

  [data-feature-workflow-card] h4 {
    margin: 12px 0 0;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 22px;
    font-weight: 450;
    letter-spacing: -0.04em;
    color: #1d1d1d;
  }

  [data-feature-workflow-illustration] {
    position: relative;
    margin-top: 14px;
    height: 132px;
    overflow: hidden;
    border-radius: 16px;
    background: linear-gradient(135deg, #f7d2ba 0%, #efc0a0 100%);
  }

  [data-feature-workflow-illustration]::before,
  [data-feature-workflow-illustration]::after {
    content: "";
    position: absolute;
    background: rgba(214, 111, 79, 0.58);
  }

  [data-feature-workflow-illustration]::before {
    width: 172px;
    height: 5px;
    left: -18px;
    top: 44px;
    transform: rotate(-32deg);
  }

  [data-feature-workflow-illustration]::after {
    width: 154px;
    height: 5px;
    left: 46px;
    top: 82px;
    transform: rotate(-34deg);
  }

  [data-feature-workflow-leaf] {
    position: absolute;
    left: 84px;
    top: 42px;
    width: 38px;
    height: 60px;
  }

  [data-feature-workflow-leaf] span {
    position: absolute;
    border-radius: 999px 999px 0 999px;
    background: #5c8f56;
    transform-origin: bottom center;
  }

  [data-feature-workflow-leaf] span:nth-child(1) {
    width: 12px;
    height: 20px;
    left: 13px;
    top: 4px;
  }

  [data-feature-workflow-leaf] span:nth-child(2) {
    width: 14px;
    height: 24px;
    left: 3px;
    top: 18px;
    transform: rotate(-34deg);
  }

  [data-feature-workflow-leaf] span:nth-child(3) {
    width: 14px;
    height: 24px;
    right: 1px;
    top: 20px;
    transform: scaleX(-1) rotate(-32deg);
  }

  [data-feature-workflow-stem] {
    position: absolute;
    left: 102px;
    top: 28px;
    width: 3px;
    height: 78px;
    background: #50724f;
    border-radius: 999px;
  }

  [data-feature-workflow-text] {
    margin-top: 12px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
    color: rgba(92, 92, 92, 0.78);
  }

  [data-feature-workflow-footer] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 14px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 500;
    color: rgba(85, 85, 85, 0.82);
  }

  [data-feature-workflow-avatars] {
    display: inline-flex;
    align-items: center;
  }

  [data-feature-workflow-avatars] span {
    width: 18px;
    height: 18px;
    margin-left: -6px;
    border-radius: 999px;
    border: 2px solid #ffffff;
  }

  [data-feature-workflow-avatars] span:nth-child(1) {
    margin-left: 0;
    background: #fa9376;
  }

  [data-feature-workflow-avatars] span:nth-child(2) { background: #f0c964; }
  [data-feature-workflow-avatars] span:nth-child(3) { background: #b2d6ff; }

  [data-feature-team-form] {
    position: absolute;
    left: 14px;
    right: 32px;
    top: 24px;
    bottom: 14px;
    padding: 24px 20px 18px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 20px 36px rgba(20, 28, 32, 0.22);
    overflow: hidden;
  }

  [data-feature-team-form] h4 {
    font-size: 20px;
    font-weight: 450;
    letter-spacing: -0.04em;
    color: #1d1d1d;
  }

  [data-feature-team-field] {
    margin-top: 15px;
  }

  [data-feature-team-field] label {
    display: block;
    margin-bottom: 6px;
    font-family: ${NAVBAR_FONT_STACK};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: #484848;
  }

  [data-feature-team-field] div {
    height: 40px;
    border-radius: 10px;
    background: rgba(245, 243, 239, 0.9);
  }

  [data-feature-team-invite] {
    position: absolute;
    left: 78px;
    top: 14px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px 9px 10px;
    border-radius: 12px;
    background: #111111;
    color: #ffffff;
    box-shadow: 0 16px 22px rgba(17, 17, 17, 0.22);
  }

  [data-feature-team-invite] strong,
  [data-feature-team-invite] span {
    font-family: ${NAVBAR_FONT_STACK};
  }

  [data-feature-team-invite] strong {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  [data-feature-team-invite] span {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.84);
  }

  [data-feature-team-invite-avatars] {
    display: inline-flex;
    align-items: center;
  }

  [data-feature-team-invite-avatars] span {
    width: 28px;
    height: 28px;
    margin-left: -7px;
    border-radius: 999px;
    border: 2px solid rgba(17, 17, 17, 0.9);
    background: linear-gradient(135deg, #ff7f7a 0%, #f8d36a 100%);
  }

  [data-feature-team-invite-avatars] span:nth-child(1) { margin-left: 0; }
  [data-feature-team-invite-avatars] span:nth-child(2) { background: linear-gradient(135deg, #9fd9ff 0%, #6ce6cb 100%); }
  [data-feature-team-invite-avatars] span:nth-child(3) { background: linear-gradient(135deg, #ffd3df 0%, #ffa188 100%); }
  [data-feature-team-invite-avatars] span:nth-child(4) { background: linear-gradient(135deg, #fab35b 0%, #ff8f95 100%); }
  [data-feature-team-invite-avatars] span:nth-child(5) { background: linear-gradient(135deg, #7faeff 0%, #d1b0ff 100%); }

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

    [data-feature-client-window],
    [data-feature-team-form] {
      left: 7px;
      right: 12px;
      top: 12px;
      bottom: 7px;
    }

    [data-feature-kpi-stack] {
      width: calc(100% - 30px);
      margin-top: 18px;
    }

    [data-feature-kpi-card] {
      padding: 16px 16px 10px;
    }

    [data-feature-kpi-card] h4,
    [data-feature-workflow-card] h4,
    [data-feature-team-form] h4 {
      font-size: 18px;
    }

    [data-feature-kpi-chart] {
      height: 124px;
      margin-top: 16px;
    }

    [data-feature-kpi-bubble] {
      top: 26px;
      left: 6px;
      padding: 7px 9px;
      font-size: 9px;
    }

    [data-feature-kpi-tag] {
      left: 74px;
      top: 56px;
      padding: 5px 7px;
      font-size: 8px;
    }

    [data-feature-workflow-ghost] {
      left: 28px;
      top: 22px;
      width: 168px;
    }

    [data-feature-workflow-card] {
      width: 168px;
      margin: 14px 0 0 38px;
      padding: 10px 10px 8px;
    }

    [data-feature-workflow-illustration] {
      height: 96px;
    }

    [data-feature-team-invite] {
      left: 46px;
      top: 6px;
      padding: 7px 9px;
      gap: 5px;
    }

    [data-feature-team-invite-avatars] span {
      width: 22px;
      height: 22px;
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
    case "client-portal":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.2" y="4.2" width="13.6" height="9.8" rx="2.1" stroke="currentColor" stroke-width="1.6"/>
          <path d="M7.2 15.8h5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      `;
    case "kpi-tracking":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.4 15.6h13.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M4.8 12.6 8.2 9.5l2.7 2.2 4-4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    case "workflow-automation":
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.4 6.2 10 3.8l4.6 2.4L10 8.6 5.4 6.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M5.4 10 10 12.4 14.6 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5.4 13.8 10 16.2l4.6-2.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    case "team-management":
    default:
      return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7.3 8.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm5.8.8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="1.6"/>
          <path d="M3.8 15.8c.6-2 2.2-3.1 4.5-3.1 2.4 0 4 1.1 4.5 3.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M12.7 15.4c.3-1.2 1.3-1.9 2.8-1.9 1.2 0 2.1.4 2.7 1.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      `;
  }
}

function getFeatureClientMarkup() {
  return `
    <div data-feature-client-window>
      <div data-feature-client-body>
        <div data-feature-client-header>
          <span>Customers</span>
          <span>Sort by</span>
        </div>
        <div data-feature-client-list>
          <div data-feature-client-row="active">
            <span data-feature-avatar="1"></span>
            <div>
              <div data-feature-client-name>Maggie Johnson</div>
              <div data-feature-client-meta>Oasis Organic Inc.</div>
            </div>
            <div data-feature-client-icons>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 14.2 14.2 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="m11.8 5.8 2.4.2.2 2.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 3.8 1.8 3.7 4.1.6-3 2.9.7 4-3.6-1.9-3.6 1.9.7-4-3-2.9 4.1-.6L10 3.8Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.6 10h10.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 4.6v10.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div data-feature-client-row>
            <span data-feature-avatar="2"></span>
            <div>
              <div data-feature-client-name>Chris Friedkly</div>
              <div data-feature-client-meta>Supermarket Villanova</div>
            </div>
            <div data-feature-client-icons>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 14.2 14.2 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div data-feature-client-row>
            <span data-feature-avatar="3"></span>
            <div>
              <div data-feature-client-name>Gael Harry</div>
              <div data-feature-client-meta>New York Finest Fruits</div>
            </div>
            <div data-feature-client-icons>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 4.4 5.2 5.2L10 14.8 4.8 9.6 10 4.4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div data-feature-client-row>
            <span data-feature-avatar="4"></span>
            <div>
              <div data-feature-client-name>Molly Smith</div>
              <div data-feature-client-meta>NovaTech Inc.</div>
            </div>
            <div data-feature-client-icons>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M10 3.8v2.1M10 14.1v2.1M16.2 10h-2.1M5.9 10H3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getFeatureKpiMarkup() {
  return `
    <div data-feature-kpi-stack>
      <div data-feature-kpi-shadow="back"></div>
      <div data-feature-kpi-shadow="mid"></div>
      <div data-feature-kpi-card>
        <h4>Revenue Overview</h4>
        <p>Apr 30 - Aug 31</p>
        <div data-feature-kpi-chart>
          <div data-feature-kpi-bubble>4,890: Sales in June</div>
          <div data-feature-kpi-tag>Emily</div>
          <svg viewBox="0 0 320 150" fill="none" aria-hidden="true">
            <path d="M10 112C38 88 58 58 90 72C122 86 138 126 168 118C204 108 214 70 246 64C274 58 292 78 310 74V136H10V112Z" fill="#f6dce5"/>
            <path d="M10 112C38 88 58 58 90 72C122 86 138 126 168 118C204 108 214 70 246 64C274 58 292 78 310 74" stroke="#f09aae" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 122C44 116 58 76 94 80C126 84 140 108 168 102C196 96 210 48 240 46C270 44 288 80 310 74V136H10V122Z" fill="#d6eef4" fill-opacity="0.96"/>
            <path d="M10 122C44 116 58 76 94 80C126 84 140 108 168 102C196 96 210 48 240 46C270 44 288 80 310 74" stroke="#a5dce6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            ${Array.from({ length: 18 }, (_, index) => {
              const x = 14 + index * 17;
              return `<path d="M${x} 136v8" stroke="rgba(193,193,193,0.75)" stroke-width="2" stroke-linecap="round"/>`;
            }).join("")}
          </svg>
        </div>
      </div>
    </div>
  `;
}

function getFeatureWorkflowMarkup() {
  return `
    <div data-feature-workflow-ghost></div>
    <div data-feature-workflow-card>
      <span data-feature-workflow-tag>High</span>
      <h4>Research</h4>
      <div data-feature-workflow-illustration>
        <div data-feature-workflow-stem></div>
        <div data-feature-workflow-leaf>
          <span></span><span></span><span></span>
        </div>
      </div>
      <div data-feature-workflow-text>
        User research helps you to create an optimal product for users.
      </div>
      <div data-feature-workflow-footer>
        <div data-feature-workflow-avatars>
          <span></span><span></span><span></span>
        </div>
        <span>12 comments</span>
        <span>9 files</span>
      </div>
    </div>
  `;
}

function getFeatureTeamMarkup() {
  return `
    <div data-feature-team-invite>
      <strong>Invite</strong>
      <div data-feature-team-invite-avatars>
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <span>+2</span>
    </div>
    <div data-feature-team-form>
      <h4>Welcome!</h4>
      <div data-feature-team-field>
        <label>Username</label>
        <div></div>
      </div>
      <div data-feature-team-field>
        <label>Email</label>
        <div></div>
      </div>
      <div data-feature-team-field>
        <label>Password</label>
        <div></div>
      </div>
    </div>
  `;
}

function getFeatureShowcaseVisualMarkup(tabId: FeatureShowcaseTabId) {
  switch (tabId) {
    case "client-portal":
      return getFeatureClientMarkup();
    case "kpi-tracking":
      return getFeatureKpiMarkup();
    case "workflow-automation":
      return getFeatureWorkflowMarkup();
    case "team-management":
    default:
      return getFeatureTeamMarkup();
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
        aria-label="Built for high performance tabs"
        data-exchangeup-feature-tabs
      >
        ${tabsMarkup}
      </div>
      ${panelsMarkup}
    </div>
  `;
}

export default function Index() {
  const lenisRef = useRef<Lenis | null>(null);
  const lenisRafRef = useRef<number | null>(null);

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

    const candidates = Array.from(doc.querySelectorAll("section, div"))
      .filter((node) => {
        const text = normalizeText(node.textContent ?? "");
        const rect = (node as HTMLElement).getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          text.includes(FEATURE_SHOWCASE_HEADING) &&
          text.includes(FEATURE_SHOWCASE_SUBHEADING)
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

    if (!anchor || !anchor.parentElement) return;

    anchor.setAttribute("data-exchangeup-feature-original-hidden", "true");
    anchor.style.display = "none";

    const style = doc.createElement("style");
    style.setAttribute("data-exchangeup-feature-showcase-style", "true");
    style.textContent = FEATURE_SHOWCASE_STYLE;
    doc.head.appendChild(style);

    const showcase = doc.createElement("section");
    showcase.setAttribute("data-exchangeup-feature-showcase", "true");
    showcase.setAttribute("data-exchangeup-feature-active", "client-portal");
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

    setActiveTab("client-portal");
    anchor.insertAdjacentElement("afterend", showcase);
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
      if (lines[0]) lines[0].textContent = "The 1031 exchange network";
      if (lines[1]) lines[1].textContent = "built for agents";
    });

    const subheadlineText =
      "Match clients with replacement properties faster using automatic scoring, built-in boot visibility, and a shared agent network designed for 1031 exchanges.";

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
    setupEasySetupCards(frame);
    injectLogoSlider(doc);
    injectFeatureShowcase(doc);
  }, [injectFeatureShowcase, injectLogoSlider, injectNavbarStyles, replaceDashboardScreenshot, replaceHeroRenders, rewriteHeroCopy, setupEasySetupCards]);

  const handleFrameLoad = useCallback((frame: HTMLIFrameElement | null) => {
    cleanIframe(frame);
    setupSmoothScroll(frame);
  }, [cleanIframe, setupSmoothScroll]);

  useEffect(() => destroySmoothScroll, [destroySmoothScroll]);

  return (
    <section
      aria-label="Grovia template homepage"
      className="relative h-full min-h-screen w-full"
    >
      <iframe
        title="Grovia homepage"
        src="/grovia/index.html"
        className="h-[100vh] w-full border-0"
        onLoad={(event) => handleFrameLoad(event.currentTarget)}
      />
    </section>
  );
}

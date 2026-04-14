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
        links[1].setAttribute("href", "/contact");
        links[1].setAttribute("target", "_parent");
        const textEl = links[1].querySelector(
          "[data-framer-component-type='RichTextContainer'] p",
        );
        if (textEl) textEl.textContent = "Book a Demo";
      }
    });
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
    setupEasySetupCards(frame);
    injectLogoSlider(doc);
  }, [injectLogoSlider, injectNavbarStyles, rewriteHeroCopy, setupEasySetupCards]);

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

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
    injectLogoSlider(doc);
  }, [injectLogoSlider, injectNavbarStyles, rewriteHeroCopy]);

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

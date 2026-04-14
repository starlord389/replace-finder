import { useCallback } from "react";

const LOGO_BRANDS = [
  { name: "Pluto Inc", mark: "chevrons" },
  { name: "VitaHealth", mark: "plus" },
  { name: "BoxMedia", mark: "cube" },
  { name: "NovaTech", mark: "shield" },
  { name: "Horizon Labs", mark: "bars" },
  { name: "Vertex AI", mark: "spark" },
] as const;

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
        width: 69px;
        height: 69px;
        display: block;
        color: rgba(148, 144, 136, 0.7);
      }

      @media (max-width: 809.98px) {
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
          width: 54px;
          height: 54px;
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
      if (frame.clientWidth >= 960) {
        navEl.style.width = "730px";
        navEl.style.maxWidth = "calc(100vw - 48px)";
      }

      const contactBtn = navEl.querySelector("a[href='/signup']") as HTMLAnchorElement | null;
      if (contactBtn) {
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
          "font-family: Geist, sans-serif; font-size: 15px; color: #6b6b6b; " +
          "text-decoration: none; padding: 4px 4px; white-space: nowrap; " +
          "line-height: 1; display: inline-flex; align-items: center; " +
          "transition: color 0.2s;";
        loginLink.addEventListener("mouseenter", () => { loginLink.style.color = "#1d1d1d"; });
        loginLink.addEventListener("mouseleave", () => { loginLink.style.color = "#6b6b6b"; });

        contactBtn.parentElement?.insertBefore(loginLink, contactBtn);
      }
    }

    rewriteHeroCopy(doc);
    injectLogoSlider(doc);
  }, [injectLogoSlider, rewriteHeroCopy]);

  return (
    <section
      aria-label="Grovia template homepage"
      className="relative h-full min-h-screen w-full"
    >
      <iframe
        title="Grovia homepage"
        src="/grovia/index.html"
        className="h-[100vh] w-full border-0"
        onLoad={(event) => cleanIframe(event.currentTarget)}
      />
    </section>
  );
}

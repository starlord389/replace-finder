import { expect, test, type Frame, type Page } from "@playwright/test";

type ViewportCase = {
  name: string;
  width: number;
  height: number;
};

const VIEWPORTS: ViewportCase[] = [
  { name: "small phone", width: 390, height: 844 },
  { name: "large phone", width: 430, height: 932 },
  { name: "portrait tablet", width: 768, height: 1024 },
  { name: "landscape tablet", width: 1024, height: 768 },
  { name: "desktop just below", width: 1199, height: 900 },
  { name: "desktop boundary", width: 1200, height: 900 },
  { name: "desktop wide", width: 1440, height: 900 },
];

const TOUCH_BREAKPOINT_MAX = 1199;
const APPROVED_HOW_IT_WORKS_TITLES = [
  "Add your client's property",
  "Filter and find your match",
  "Connect and offer",
];
const LEGACY_HOW_IT_WORKS_TEXT = [
  "Easy setup",
  "Collaborate",
  "Track growth",
  "Create account",
  "To-do tasks",
];

async function openLandingFrame(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });

  const frameHandle = await page.waitForSelector(
    'iframe[title="Grovia homepage"]',
    { timeout: 15_000 },
  );
  const frame = await frameHandle.contentFrame();

  if (!frame) {
    throw new Error("Landing iframe did not attach");
  }

  await frame.waitForSelector("[data-exchangeup-navbar='true']", {
    state: "attached",
    timeout: 15_000,
  });
  await frame.waitForSelector("[data-exchangeup-hero-renders]", {
    state: "attached",
    timeout: 15_000,
  });
  await frame.waitForSelector("[data-exchangeup-logo-slider]", {
    state: "attached",
    timeout: 15_000,
  });

  return frame;
}

async function getViewportSnapshot(frame: Frame) {
  return frame.evaluate(() => {
    const isVisible = (element: Element | null) => {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const rectFor = (element: Element | null) => {
      const rect = element?.getBoundingClientRect();
      if (!rect) return null;

      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    };

    const visibleText = (root: ParentNode = document) => {
      const element = root instanceof Document ? root.body : root;

      return ((element as HTMLElement | null)?.innerText ?? "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const navs = Array.from(
      document.querySelectorAll("[data-exchangeup-navbar='true']"),
    );
    const visibleNav = navs.find(isVisible) ?? navs[0] ?? null;
    const heroCopy =
      document.querySelector("[data-exchangeup-hero-touch-copy]") ??
      Array.from(
        document.querySelectorAll(
          '[data-framer-name="Strategy and growth for modern teams"]',
        ),
      ).find(isVisible) ??
      null;
    const heroRenders = document.querySelector("[data-exchangeup-hero-renders]");
    const logoSlider = document.querySelector("[data-exchangeup-logo-slider]");
    const touchCards = Array.from(
      document.querySelectorAll("[data-exchangeup-touch-card='true']"),
    ).filter(isVisible);
    const touchTitles = Array.from(
      document.querySelectorAll("[data-exchangeup-easy-setup-touch-title]"),
    ).filter(isVisible);
    const touchBodies = Array.from(
      document.querySelectorAll("[data-exchangeup-easy-setup-touch-body]"),
    ).filter(isVisible);
    const visiblePreviews = Array.from(
      document.querySelectorAll("[data-exchangeup-easy-setup-preview]"),
    ).filter(isVisible);
    const touchPreviewVariants = touchCards.map((card) =>
      card
        .querySelector("[data-exchangeup-preview-surface]")
        ?.getAttribute("data-preview-variant"),
    );
    const touchCardsWithPreviewCount = touchCards.filter((card) =>
      card.querySelector(
        "[data-exchangeup-easy-setup-preview] [data-exchangeup-preview-surface]",
      ),
    ).length;

    const touchCardBounds =
      touchCards.length > 0
        ? touchCards.reduce(
            (bounds, card) => {
              const rect = card.getBoundingClientRect();
              return {
                top: Math.min(bounds.top, rect.top),
                bottom: Math.max(bounds.bottom, rect.bottom),
              };
            },
            { top: Number.POSITIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY },
          )
        : null;
    const overlapsTouchCardArea = (element: Element) => {
      if (!touchCardBounds) return false;

      const rect = element.getBoundingClientRect();
      return (
        rect.bottom >= touchCardBounds.top - 12 &&
        rect.top <= touchCardBounds.bottom + 12
      );
    };
    const howItWorksCardAreaText = touchCardBounds
      ? Array.from(document.querySelectorAll("body *"))
          .filter((element) => {
            if (!isVisible(element) || !overlapsTouchCardArea(element)) {
              return false;
            }

            return !Array.from(element.children).some(
              (child) => isVisible(child) && overlapsTouchCardArea(child),
            );
          })
          .map((element) => (element as HTMLElement).innerText ?? "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const overflowingTouchText = [...touchTitles, ...touchBodies].filter(
      (element) =>
        element.scrollWidth > element.clientWidth + 1 ||
        element.scrollHeight > element.clientHeight + 1,
    );

    const previewEscapes = visiblePreviews.filter((preview) => {
      const card = preview.closest("[data-exchangeup-easy-setup-card]");
      const previewRect = preview.getBoundingClientRect();
      const cardRect = card?.getBoundingClientRect();
      if (!cardRect) return false;

      return (
        previewRect.left < cardRect.left - 2 ||
        previewRect.right > cardRect.right + 2 ||
        previewRect.top < cardRect.top - 2 ||
        previewRect.bottom > cardRect.bottom + 2
      );
    });
    const clippedPreviewGlass = Array.from(
      document.querySelectorAll(
        "[data-exchangeup-touch-card='true'] [data-preview-glass]",
      ),
    ).filter(
      (glass) =>
        isVisible(glass) && glass.scrollHeight > glass.clientHeight + 1,
    );

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyText: visibleText(),
      navText: visibleNav ? visibleText(visibleNav) : "",
      navRect: rectFor(visibleNav),
      heroCopyRect: rectFor(heroCopy),
      heroRendersRect: rectFor(heroRenders),
      logoSliderRect: rectFor(logoSlider),
      touchCardCount: touchCards.length,
      touchTitleText: touchTitles.map((element) => element.textContent?.trim()),
      touchCardsWithPreviewCount,
      touchPreviewVariants,
      howItWorksCardAreaText,
      touchTitleFontFamily: touchTitles[0]
        ? window.getComputedStyle(touchTitles[0]).fontFamily
        : "",
      overflowingTouchTextCount: overflowingTouchText.length,
      previewEscapeCount: previewEscapes.length,
      clippedPreviewGlassCount: clippedPreviewGlass.length,
      visibleGroviaText:
        /\bGrovia\b/.test(visibleText()) || /hello@grovia\.io/i.test(visibleText()),
    };
  });
}

test.describe("landing page breakpoint regressions", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      const frame = await openLandingFrame(page);
      const snapshot = await getViewportSnapshot(frame);
      const isTouchViewport = viewport.width <= TOUCH_BREAKPOINT_MAX;

      expect(snapshot.documentWidth).toBeLessThanOrEqual(
        snapshot.viewportWidth + 2,
      );
      expect(snapshot.navText).toContain("1031 Exchange Up");
      expect(snapshot.navRect).not.toBeNull();
      expect(snapshot.navRect!.left).toBeGreaterThanOrEqual(-2);
      expect(snapshot.navRect!.right).toBeLessThanOrEqual(
        snapshot.viewportWidth + 2,
      );
      expect(snapshot.bodyText).toContain(
        "Find your client's next replacement property.",
      );
      expect(snapshot.visibleGroviaText).toBe(false);

      if (isTouchViewport) {
        expect(snapshot.heroCopyRect).not.toBeNull();
        expect(snapshot.heroRendersRect).not.toBeNull();
        expect(snapshot.logoSliderRect).not.toBeNull();
        expect(snapshot.heroRendersRect!.top).toBeGreaterThan(
          snapshot.heroCopyRect!.bottom,
        );
        expect(snapshot.logoSliderRect!.top).toBeGreaterThan(
          snapshot.heroRendersRect!.bottom,
        );
        expect(snapshot.touchCardCount).toBe(3);
        expect(snapshot.touchTitleText).toEqual(
          expect.arrayContaining(APPROVED_HOW_IT_WORKS_TITLES),
        );
        expect(snapshot.howItWorksCardAreaText).toEqual(
          expect.stringContaining(APPROVED_HOW_IT_WORKS_TITLES[0]),
        );
        expect(snapshot.howItWorksCardAreaText).toEqual(
          expect.stringContaining(APPROVED_HOW_IT_WORKS_TITLES[1]),
        );
        expect(snapshot.howItWorksCardAreaText).toEqual(
          expect.stringContaining(APPROVED_HOW_IT_WORKS_TITLES[2]),
        );
        for (const legacyText of LEGACY_HOW_IT_WORKS_TEXT) {
          expect(snapshot.howItWorksCardAreaText).not.toContain(legacyText);
        }
        expect(snapshot.touchCardsWithPreviewCount).toBe(3);
        expect(snapshot.touchPreviewVariants).toEqual(["1", "2", "3"]);
        expect(snapshot.touchTitleFontFamily).toContain("Plus Jakarta Sans");
        expect(snapshot.overflowingTouchTextCount).toBe(0);
        expect(snapshot.previewEscapeCount).toBe(0);
        expect(snapshot.clippedPreviewGlassCount).toBe(0);
      } else {
        expect(snapshot.touchCardCount).toBe(0);
      }
    });
  }
});

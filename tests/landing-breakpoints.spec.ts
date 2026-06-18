import { expect, test, type Page } from "@playwright/test";

/* Breakpoint regression coverage for the NATIVE homepage (src/pages/Home.tsx,
   route "/"). The old Framer-iframe homepage was deleted, so this no longer
   reaches into an iframe — everything renders directly under [data-landing].

   What we guard at every breakpoint:
   - the page is the native React rebuild (a [data-landing] wrapper, no iframe)
   - no horizontal overflow (documentElement.scrollWidth <= innerWidth + 2)
   - the floating nav stays within the viewport and stays branded
   - the hero headline renders
   - the How It Works step titles match the approved copy
   - every anchored marketing section is present */

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

const APPROVED_HOW_IT_WORKS_TITLES = [
  "Add your client's property",
  "Filter and find your match",
  "Connect and offer",
];

// Sections the nav/footer anchor links jump to — each must keep its id.
const EXPECTED_SECTION_IDS = [
  "process",
  "feature",
  "coverage",
  "pricing",
  "roe-calculator",
  "faq",
  "get-started",
];

async function getViewportSnapshot(page: Page) {
  return page.evaluate((expectedIds: string[]) => {
    const norm = (value: string | null | undefined) =>
      (value ?? "").replace(/\s+/g, " ").trim();

    const rectFor = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    };

    const landing = document.querySelector("[data-landing]");
    const nav = document.querySelector('nav[aria-label="Main navigation"]');
    const heroHeadline = document.querySelector("[data-landing] h1");

    const howItWorksTitles = Array.from(
      document.querySelectorAll("[data-landing] .hiw-title"),
    ).map((element) => norm(element.textContent));

    const presentSectionIds = expectedIds.filter(
      (id) => document.getElementById(id) !== null,
    );

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      hasLanding: landing !== null,
      heroHeadline: norm(heroHeadline?.textContent),
      navText: norm(nav?.textContent),
      navRect: rectFor(nav),
      howItWorksTitles,
      presentSectionIds,
    };
  }, EXPECTED_SECTION_IDS);
}

test.describe("native homepage breakpoint regressions", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Native homepage — no iframe; everything renders under [data-landing].
      await page.waitForSelector("[data-landing] h1", { timeout: 15_000 });
      await page.waitForSelector('nav[aria-label="Main navigation"]', {
        timeout: 15_000,
      });

      const snapshot = await getViewportSnapshot(page);

      // The native rebuild mounted (not the deleted Framer iframe).
      expect(snapshot.hasLanding).toBe(true);

      // No horizontal overflow at any breakpoint.
      expect(snapshot.documentWidth).toBeLessThanOrEqual(
        snapshot.viewportWidth + 2,
      );

      // The floating nav stays within the viewport and stays branded.
      expect(snapshot.navText).toContain("1031 Exchange Up");
      expect(snapshot.navRect).not.toBeNull();
      expect(snapshot.navRect!.left).toBeGreaterThanOrEqual(-2);
      expect(snapshot.navRect!.right).toBeLessThanOrEqual(
        snapshot.viewportWidth + 2,
      );

      // Hero headline renders.
      expect(snapshot.heroHeadline).toContain(
        "Find your client's next replacement property.",
      );

      // How It Works step titles match the approved copy, in order.
      expect(snapshot.howItWorksTitles).toEqual(APPROVED_HOW_IT_WORKS_TITLES);

      // Every anchored marketing section is present.
      expect(snapshot.presentSectionIds).toEqual(EXPECTED_SECTION_IDS);
    });
  }
});

import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "minimum", width: 320, height: 760 },
  { name: "small phone", width: 375, height: 812 },
  { name: "Meta common", width: 390, height: 844 },
  { name: "large phone", width: 430, height: 932 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test.describe("Meta agent landing page", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(
        "/meta/agents/replacement-property?utm_source=facebook&campaign_id=campaign-1&adset_id=adset-2&ad_id=ad-3&creative_angle=private-search&placement=instagram_story",
        { waitUntil: "domcontentloaded" },
      );
      await page.waitForSelector("[data-meta-agent-landing] h1");

      const snapshot = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content,
        mainNav: document.querySelector('nav[aria-label="Main navigation"]')?.textContent,
        ctas: Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-cta-location]")).map(
          (cta) => ({ label: cta.textContent?.trim(), href: cta.href }),
        ),
      }));

      expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.viewportWidth + 1);
      expect(snapshot.robots).toBe("noindex, nofollow");
      expect(snapshot.mainNav).toBeUndefined();
      expect(snapshot.ctas).toHaveLength(3);
      for (const cta of snapshot.ctas) {
        const url = new URL(cta.href);
        expect(cta.label).toBe("Find My Client’s Replacement Property");
        expect(url.pathname).toBe("/signup");
        expect(url.searchParams.get("role")).toBe("agent");
        expect(url.searchParams.get("campaign_id")).toBe("campaign-1");
        expect(url.searchParams.get("creative_angle")).toBe("private-search");
      }
    });
  }
});

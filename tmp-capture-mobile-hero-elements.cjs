const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 430, height: 1000 },
    isMobile: true,
    deviceScaleFactor: 2,
  });
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const frame = page.frames().find((f) => f.url().includes("/grovia/index.html"));
  if (!frame) throw new Error("iframe not found");

  const widget = frame.locator("[data-framer-name='Widget'][data-exchangeup-render-replaced='true']").filter({ has: frame.locator("img[src='/landing-hero-list-render.png']") }).nth(1);
  const chart = frame.locator("[data-framer-name='Chart'][data-exchangeup-render-replaced='true']").filter({ has: frame.locator("img[src='/landing-hero-kpi-render.png']") }).nth(1);

  await widget.screenshot({
    path: "c:/Cursor Projects/Exchange marketplace webapp/replace-finder/mobile-hero-widget-direct.png",
  });
  await chart.screenshot({
    path: "c:/Cursor Projects/Exchange marketplace webapp/replace-finder/mobile-hero-chart-direct.png",
  });

  await browser.close();
})();

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const sectionsSource = readFileSync(join(process.cwd(), "src/pages/HomeSections.tsx"), "utf8");

describe("public landing-page audiences", () => {
  it("leads with the continuous opportunity-monitoring value proposition", () => {
    expect(homeSource).toContain("Your Investments. Constantly Monitored");
    expect(homeSource).toContain("for Smarter Opportunities.");
    expect(homeSource).toContain("Start Monitoring — Free");
    expect(homeSource).toContain("See How It Works");
    expect(homeSource).toContain("Add it once. We keep watching.");
    expect(homeSource).toContain("I Own Investment Property");
    expect(homeSource).toContain("I’m a Real Estate Agent");
  });

  it("explains agent and investor value without becoming an open marketplace", () => {
    expect(sectionsSource).toContain("How a Match Actually Happens.");
    expect(sectionsSource).toContain("Turn Your Existing Database Into Continuous Deal Flow.");
    expect(sectionsSource).toContain("Your Property, Monitored for Better Opportunities.");
    expect(sectionsSource).toContain("does not replace the agent");
    expect(sectionsSource).not.toContain("matches against thousands of opportunities");
  });



  it("keeps pricing consistent and non-guaranteeing language on matches", () => {
    expect(sectionsSource).toContain("not guaranteed transactions");
    expect(sectionsSource).toContain("does not constitute financial, tax or investment advice");
    expect(sectionsSource).not.toContain("6 Months Free");
  });
});


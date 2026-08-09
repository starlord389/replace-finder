import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const sectionsSource = readFileSync(join(process.cwd(), "src/pages/HomeSections.tsx"), "utf8");

describe("public landing-page audiences", () => {
  it("leads with easier 1031 replacement-property discovery", () => {
    expect(homeSource).toContain("Finding Your 1031 Replacement Property Just Got A LOT Easier.");
    expect(homeSource).toContain("Register your property. Our data-driven AI continuously monitors investment opportunities");
    expect(homeSource).toContain("Find My Replacement Property");
    expect(homeSource).toContain("Every property added makes the network smarter.");
    expect(homeSource).toContain("I Own Investment Property");
    expect(homeSource).toContain("I’m a Real Estate Agent");
    expect(homeSource).toContain("Don’t Wait for the 45-Day Clock to Start.");
  });

  it("explains agent and investor value without becoming an open marketplace", () => {
    expect(sectionsSource).toContain("How a Match Actually Happens.");
    expect(sectionsSource).toContain("Exchanges Made Easier Across Your Whole Database.");
    expect(sectionsSource).toContain("You already built the database.");
    expect(sectionsSource).toContain("Internal Opportunity Detected");
    expect(sectionsSource).toContain("Your 1031 Exchange, Made Easier.");
    expect(sectionsSource).toContain("does not replace the agent");
    expect(sectionsSource).not.toContain("matches against thousands of opportunities");
  });


  it("routes the ROE calculator into monitoring activation", () => {
    expect(sectionsSource).toContain("Is your equity working as hard as it could?");
    expect(sectionsSource).toContain("Monitor My Opportunities");
  });

  it("keeps pricing consistent and non-guaranteeing language on matches", () => {
    expect(sectionsSource).toContain("not guaranteed transactions");
    expect(sectionsSource).toContain("does not constitute financial, tax or investment advice");
    expect(sectionsSource).not.toContain("6 Months Free");
  });
});

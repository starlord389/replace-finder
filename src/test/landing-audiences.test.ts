import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const sectionsSource = readFileSync(join(process.cwd(), "src/pages/HomeSections.tsx"), "utf8");

describe("public landing-page audiences", () => {
  it("leads with the opportunity-network value proposition", () => {
    expect(homeSource).toContain("More Opportunities.");
    expect(homeSource).toContain("One Smarter Network.");
    expect(homeSource).toContain("For Agents");
    expect(homeSource).toContain("For Investors");
    expect(homeSource).toContain("For Property Owners");
  });

  it("explains agent and investor value without becoming an open marketplace", () => {
    expect(sectionsSource).toContain("One Property Can Create Multiple Opportunities.");
    expect(sectionsSource).toContain("Your Database Could Already Contain Your Next Transaction.");
    expect(sectionsSource).toContain("Know When Your Equity Could Be Working Harder.");
    expect(sectionsSource).toContain("does not replace the agent");
    expect(sectionsSource).not.toContain("matches against thousands of opportunities");
  });

  it("keeps compliant, non-guaranteeing language on matches and the calculator", () => {
    expect(sectionsSource).toContain("not guaranteed transactions");
    expect(sectionsSource).toContain("does not constitute financial, tax or investment advice");
  });
});

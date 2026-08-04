import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const sectionsSource = readFileSync(join(process.cwd(), "src/pages/HomeSections.tsx"), "utf8");

describe("public landing-page audiences", () => {
  it("leads with the shared value for property owners and agents", () => {
    expect(homeSource).toContain("The 1031 Exchange Matching Platform for Property Owners and Their Agents.");
    expect(homeSource).toContain("Investors list the property they own");
    expect(homeSource).toContain("Agents manage the same process");
  });

  it("describes distinct workspaces without turning the product into an open marketplace", () => {
    expect(sectionsSource).toContain("One Network. Two Purpose-Built Workspaces.");
    expect(sectionsSource).toContain("See only matched replacement opportunities");
    expect(sectionsSource).toContain("Connect directly with the listing agent");
    expect(sectionsSource).not.toContain("matches against thousands of opportunities");
  });
});

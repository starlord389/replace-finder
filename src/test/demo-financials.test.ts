import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const demoSource = readFileSync(
  resolve(process.cwd(), "supabase/functions/demo-data/index.ts"),
  "utf8",
);

describe("demo property financials", () => {
  it("keeps every displayed income statement arithmetically coherent", () => {
    expect(demoSource).toContain("const expenses = Math.max(o.gross - noi, 0);");
    expect(demoSource).toContain("gross_rent_roll: o.gross, total_operating_expenses: expenses");

    const fixtures = [...demoSource.matchAll(
      /fin\(\{ ask: ([\d_]+), cap: ([\d.]+), gross: ([\d_]+), occ:/g,
    )];
    expect(fixtures.length).toBeGreaterThanOrEqual(10);

    for (const fixture of fixtures) {
      const askingPrice = Number(fixture[1].replace(/_/g, ""));
      const capRate = Number(fixture[2]);
      const grossIncome = Number(fixture[3].replace(/_/g, ""));
      const noi = Math.round(askingPrice * capRate / 100);
      const expenses = Math.max(grossIncome - noi, 0);

      expect(grossIncome - expenses).toBe(noi);
    }
  });
});

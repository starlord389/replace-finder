import { describe, expect, it } from "vitest";
import { ALL_DEMO_PROPERTIES } from "../../supabase/functions/demo-data/fixtures";

describe("demo property financials", () => {
  it("keeps every displayed income statement arithmetically coherent", () => {
    const properties = ALL_DEMO_PROPERTIES();
    expect(properties.length).toBeGreaterThanOrEqual(10);

    for (const p of properties) {
      const { asking_price, cap_rate, noi, gross_rent_roll, total_operating_expenses } = p.f;
      expect(noi).toBe(Math.round(asking_price * cap_rate / 100));
      expect(gross_rent_roll - total_operating_expenses).toBe(noi);
      expect(total_operating_expenses).toBeGreaterThan(0);
      expect(p.f.annual_revenue).toBe(gross_rent_roll);
      expect(p.f.annual_expenses).toBe(total_operating_expenses);
    }
  });
});

import { describe, expect, it } from "vitest";
import { scorePairExplained } from "../../supabase/functions/_shared/matching-core";
import {
  ALL_DEMO_PROPERTIES,
  BAND_RANGES,
  COUNTERPARTIES,
  INBOUND_CLIENT,
  INBOUND_CRITERIA,
  INBOUND_MATCH,
  INBOUND_PROPERTY,
  INVESTOR_CRITERIA,
  INVESTOR_PROPERTY,
  MATCH_PLAN,
  MAX_ASKING_PRICE,
  MIN_ASKING_PRICE,
  OWN,
  assertValidDemoProperty,
  displayLocation,
  type DemoProperty,
} from "../../supabase/functions/demo-data/fixtures";

const settings = { mortgage_interest_rate: 7, mortgage_amortization_years: 25 };

const byKey = new Map<string, DemoProperty>(ALL_DEMO_PROPERTIES().map((p) => [p.key, p]));

function buyerFixture(key: string) {
  if (key === "investor") return { property: INVESTOR_PROPERTY, criteria: INVESTOR_CRITERIA };
  if (key === "inbound") return { property: INBOUND_PROPERTY, criteria: INBOUND_CRITERIA };
  const own = OWN.find((o) => o.key === key);
  if (!own) throw new Error(`unknown buyer fixture ${key}`);
  return { property: own.property, criteria: own.criteria };
}

function scorePlanned(buyerKey: string, sellerKey: string) {
  const buyer = buyerFixture(buyerKey);
  const candidate = byKey.get(sellerKey);
  if (!candidate) throw new Error(`unknown candidate fixture ${sellerKey}`);
  return scorePairExplained({}, buyer.property.f, candidate, candidate.f, buyer.criteria, settings);
}

describe("demo fixtures", () => {
  it("seeds Massachusetts-only, correctly priced, unlabeled properties", () => {
    const props = ALL_DEMO_PROPERTIES();
    expect(props.length).toBeGreaterThanOrEqual(14);
    for (const p of props) {
      expect(() => assertValidDemoProperty(p)).not.toThrow();
      expect(p.state).toBe("MA");
      expect(p.zip).toMatch(/^\d{5}$/);
      expect(p.f.asking_price).toBeGreaterThanOrEqual(MIN_ASKING_PRICE);
      expect(p.f.asking_price).toBeLessThanOrEqual(MAX_ASKING_PRICE);
      expect((p as any).name).toBeUndefined();
      expect(p.f.noi).toBe(p.f.gross_rent_roll - p.f.total_operating_expenses);
      expect(Math.round(p.f.noi / p.f.asking_price * 1000) / 10).toBeCloseTo(Math.round(p.f.cap_rate * 10) / 10, 1);
      expect(p.f.annual_debt_service).toBeGreaterThanOrEqual(0);
      expect(p.description.length).toBeGreaterThan(40);
    }
    expect(props.every((p) => p.address_is_public)).toBe(false);
    expect(props.some((p) => p.address_is_public)).toBe(true);
  });

  it("labels listings by address visibility, never by a property name", () => {
    const publicProp = ALL_DEMO_PROPERTIES().find((p) => p.address_is_public)!;
    const hiddenProp = ALL_DEMO_PROPERTIES().find((p) => !p.address_is_public)!;
    expect(displayLocation(publicProp)).toContain(publicProp.address);
    expect(displayLocation(hiddenProp)).not.toContain(hiddenProp.address);
    expect(displayLocation(hiddenProp)).toBe(`${hiddenProp.city}, MA ${hiddenProp.zip}`);
  });

  it("uses individual people as clients, never entities", () => {
    const names = [...OWN.map((o) => o.client.client_name), INBOUND_CLIENT.client_name];
    expect(names).toEqual([
      "Sarah Chen",
      "Marcus Rodriguez",
      "Anita Patel",
      "James Wilson",
      "Olivia Bennett",
      "Brennan Stout",
      "Natalie Foster",
    ]);
    const banned = /trust|fund|holdings|capital|llc|lp\b|partners|investments|group|inc\b/i;
    for (const name of names) expect(banned.test(name)).toBe(false);
    for (const o of OWN) expect(o.client.client_company ?? null).toBeNull();
  });

  it("gives every exchange populated, fraction-based criteria", () => {
    const all = [...OWN.map((o) => o.criteria), INVESTOR_CRITERIA, INBOUND_CRITERIA];
    for (const c of all as any[]) {
      expect(c.target_states).toEqual(["MA"]);
      expect(c.target_asset_types.length).toBeGreaterThan(0);
      expect(c.target_metros.length).toBeGreaterThan(0);
      expect(c.target_price_min).toBeGreaterThan(0);
      expect(c.target_price_max).toBeGreaterThanOrEqual(c.target_price_min);
      expect(c.max_ltv).toBeGreaterThan(0);
      expect(c.max_ltv).toBeLessThanOrEqual(0.75);
    }
  });

  it("accepts every planned match with the production engine and the intended quality", () => {
    const totals: Record<string, number> = {};
    for (const planned of [...MATCH_PLAN, { ...INBOUND_MATCH, band: null as any }]) {
      const result = scorePairExplained(
        {},
        buyerFixture(planned.buyer).property.f,
        byKey.get(planned.seller)!,
        byKey.get(planned.seller)!.f,
        buyerFixture(planned.buyer).criteria,
        settings,
      );
      if (!result.ok) throw new Error(`${planned.buyer} → ${planned.seller} rejected: ${(result as any).reason}`);
      const buyerPrice = buyerFixture(planned.buyer).property.f.asking_price;
      expect(byKey.get(planned.seller)!.f.asking_price).toBeGreaterThanOrEqual(buyerPrice);
      totals[`${planned.buyer}→${planned.seller}`] = result.score!.total;
      if (planned.band) {
        const [min, max] = BAND_RANGES[planned.band as keyof typeof BAND_RANGES];
        expect(
          result.score!.total >= min && result.score!.total <= max,
          `${planned.buyer} → ${planned.seller} scored ${result.score!.total}, expected ${planned.band} (${min}-${max})`,
        ).toBe(true);
      }
    }
    const excellent = MATCH_PLAN.filter((m) => m.band === "excellent").length;
    const solid = MATCH_PLAN.filter((m) => m.band === "solid").length;
    expect(excellent).toBeGreaterThanOrEqual(2);
    expect(solid).toBeGreaterThanOrEqual(2);
  });

  it("keeps required storylines and intentionally ineligible inventory", () => {
    expect(MATCH_PLAN.some((m) => m.buyer === "marcus_rodriguez" && m.seller === "brockton_mixed_use")).toBe(true);
    expect(MATCH_PLAN.filter((m) => m.buyer === "marcus_rodriguez").length).toBeGreaterThanOrEqual(2);
    expect(MATCH_PLAN.some((m) => m.buyer === "anita_patel" && m.seller === "chelmsford_industrial" && m.band === "excellent")).toBe(true);
    expect(MATCH_PLAN.some((m) => m.buyer === "james_wilson" && m.seller === "chelmsford_industrial")).toBe(true);
    expect(MATCH_PLAN.some((m) => m.buyer === "james_wilson" && m.seller === "brockton_mixed_use")).toBe(false);
    expect(MATCH_PLAN.filter((m) => m.buyer === "investor").length).toBeGreaterThanOrEqual(2);

    // Candidates that must NOT qualify, proving the engine gates are live.
    for (const [buyer, seller] of [
      ["marcus_rodriguez", "springfield_multifamily"],   // trade-down
      ["marcus_rodriguez", "brookline_medical_office"],  // affordability + type
      ["anita_patel", "lowell_multifamily"],             // affordability + type
      ["james_wilson", "worcester_retail"],              // trade-down + type
    ] as const) {
      expect(scorePlanned(buyer, seller).ok, `${buyer} → ${seller} should be ineligible`).toBe(false);
    }
  });

  it("keeps counterparty listings addressable by agent + street address", () => {
    for (const cp of COUNTERPARTIES) {
      const addresses = cp.properties.map((p) => p.address);
      expect(new Set(addresses).size).toBe(addresses.length);
    }
  });
});

import { describe, expect, it } from "vitest";
import { scorePairExplained } from "../../supabase/functions/_shared/matching-core";
import {
  normalizeReplacementCriteria,
  validateReplacementCriteria,
} from "../../supabase/functions/_shared/replacement-criteria";

const settings = { mortgage_interest_rate: 7.25, mortgage_amortization_years: 30 };
const buyerFinancials = { asking_price: 1_000_000, loan_balance: 400_000, noi: 60_000 };

describe("matching with optional exchange criteria", () => {
  it("produces exactly the default result when every criterion is blank", () => {
    const candidate = { state: "TX", city: "Austin", asset_type: "office", year_built: 2010 };
    const candidateFinancials = { asking_price: 1_500_000, noi: 140_000, occupancy_rate: 90 };
    const baseline = scorePairExplained({}, buyerFinancials, candidate, candidateFinancials, {}, settings);
    const blankCriteria = scorePairExplained(
      {},
      buyerFinancials,
      candidate,
      candidateFinancials,
      {
        target_states: [],
        target_metros: [],
        target_asset_types: [],
        target_price_min: 0,
        target_price_max: 0,
        additional_cash_available: null,
        max_ltv: null,
        min_projected_roe: null,
        preferred_monthly_cash_flow: null,
        require_location_match: false,
        require_asset_type_match: false,
      },
      settings,
    );

    expect(blankCriteria).toEqual(baseline);
  });

  it("uses optional cash only when needed to expand purchasing capacity", () => {
    const candidate = { state: "MA", asset_type: "multifamily" };
    const candidateFinancials = { asking_price: 2_800_000, noi: 280_000 };

    expect(scorePairExplained({}, buyerFinancials, candidate, candidateFinancials, {}, settings)).toMatchObject({
      ok: false,
    });

    const result = scorePairExplained(
      {},
      buyerFinancials,
      candidate,
      candidateFinancials,
      { additional_cash_available: 200_000 },
      settings,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.score.estimated_purchasing_capacity).toBe(3_200_000);
      expect(result.score.estimated_replacement_loan).toBe(2_100_000);
      expect(result.score.estimated_ltv).toBe(0.75);
      expect(result.score.eligibility_reasons.join(" ")).toContain("$100,000");
    }
  });

  it("keeps location and property type soft unless the user requires them", () => {
    const candidate = { state: "GA", city: "Atlanta", asset_type: "office" };
    const candidateFinancials = { asking_price: 1_500_000, noi: 150_000 };
    const preferences = { target_states: ["FL"], target_asset_types: ["multifamily"] };

    expect(scorePairExplained({}, buyerFinancials, candidate, candidateFinancials, preferences, settings).ok).toBe(true);
    expect(scorePairExplained(
      {}, buyerFinancials, candidate, candidateFinancials,
      { ...preferences, require_location_match: true }, settings,
    )).toMatchObject({ ok: false, reason: expect.stringMatching(/required location/) });
    expect(scorePairExplained(
      {}, buyerFinancials, candidate, candidateFinancials,
      { ...preferences, require_asset_type_match: true }, settings,
    )).toMatchObject({ ok: false, reason: expect.stringMatching(/required property-type/) });
  });

  it("honors an optional lower LTV and combines it with only the cash required", () => {
    const candidate = { state: "MA", asset_type: "multifamily" };
    const candidateFinancials = { asking_price: 1_500_000, noi: 150_000 };

    expect(scorePairExplained(
      {}, buyerFinancials, candidate, candidateFinancials, { max_ltv: 0.5 }, settings,
    )).toMatchObject({ ok: false, reason: expect.stringMatching(/affordability ceiling/) });

    const result = scorePairExplained(
      {},
      buyerFinancials,
      candidate,
      candidateFinancials,
      { max_ltv: 0.5, additional_cash_available: 200_000 },
      settings,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.score.estimated_purchasing_capacity).toBe(1_600_000);
      expect(result.score.estimated_replacement_loan).toBe(750_000);
      expect(result.score.estimated_ltv).toBe(0.5);
      expect(result.score.eligibility_reasons.join(" ")).toContain("$150,000");
    }
  });

  it("validates and normalizes criteria before database writes", () => {
    expect(validateReplacementCriteria({})).toEqual([]);
    expect(normalizeReplacementCriteria({})).toMatchObject({
      target_asset_types: [],
      target_states: [],
      target_price_min: 0,
      target_price_max: 0,
      additional_cash_available: null,
      max_ltv: null,
      require_location_match: false,
      require_asset_type_match: false,
    });
    expect(validateReplacementCriteria({ additional_cash_available: -1, max_ltv: 0.9 })).toHaveLength(2);
  });
});

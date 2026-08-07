import { describe, expect, it } from "vitest";
import {
  calculateBoot,
  findStaleActiveMatchIds,
  isInvestorSelfMatch,
  scorePairExplained,
} from "../../supabase/functions/_shared/matching-core";

const settings = { mortgage_interest_rate: 7, mortgage_amortization_years: 25 };

describe("production matching invariants", () => {
  const buyer = {
    asking_price: 2_000_000,
    loan_balance: 1_000_000,
    noi: 170_000,
    annual_debt_service: 80_000,
  };

  it("implements the $2M/$1M boss example exactly", () => {
    const result = scorePairExplained({}, buyer, {}, { asking_price: 4_000_000, noi: 400_000 }, {}, settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.estimated_purchasing_capacity).toBe(4_000_000);
    expect(result.score.estimated_replacement_loan).toBe(3_000_000);
    expect(result.score.estimated_ltv).toBe(0.75);
    expect(result.score.roe_improvement_pp).toBeGreaterThan(0);
  });

  it("uses all exchange equity below the ceiling instead of always borrowing 75%", () => {
    const result = scorePairExplained({}, buyer, {}, { asking_price: 3_000_000, noi: 320_000 }, {}, settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.score.estimated_replacement_loan).toBe(2_000_000);
    expect(result.score.estimated_ltv).toBeCloseTo(2 / 3, 4);
  });

  it("rejects a price even one dollar above the 75% LTV ceiling", () => {
    const result = scorePairExplained({}, buyer, {}, { asking_price: 4_000_001, noi: 500_000 }, {}, settings);
    expect(result.ok).toBe(false);
    if ("reason" in result) expect(result.reason).toContain("exceeds affordability ceiling");
  });

  it("rejects trade-downs and candidates without a better ROE", () => {
    const tradeDown = scorePairExplained({}, buyer, {}, { asking_price: 1_999_999, noi: 300_000 }, {}, settings);
    expect(tradeDown.ok).toBe(false);
    if ("reason" in tradeDown) expect(tradeDown.reason).toContain("trade-up rule");

    const worseReturn = scorePairExplained({}, buyer, {}, { asking_price: 3_000_000, noi: 100_000 }, {}, settings);
    expect(worseReturn.ok).toBe(false);
    if ("reason" in worseReturn) expect(worseReturn.reason).toContain("no ROE upgrade");
  });

  it("keeps the unrequested investor demo match eligible for workflow testing", () => {
    const principal = 1_350_000;
    const monthlyRate = 0.046 / 12;
    const payments = 360;
    const annualDebtService = Math.round(
      ((principal * monthlyRate * Math.pow(1 + monthlyRate, payments))
        / (Math.pow(1 + monthlyRate, payments) - 1)) * 12,
    );
    const result = scorePairExplained(
      { exchange_proceeds: 1_500_000, estimated_equity: 1_500_000 },
      { asking_price: 3_150_000, loan_balance: principal, noi: 166_950, annual_debt_service: annualDebtService },
      { asset_type: "industrial", strategy_type: "core_plus", city: "Charlotte", state: "NC" },
      { asking_price: 3_200_000, noi: 224_000 },
      {},
      settings,
    );

    expect(result.ok).toBe(true);
  });

  it("calculates boot from the modeled buyer loan and ignores seller debt", () => {
    const result = calculateBoot(
      {},
      { asking_price: 2_000_000, loan_balance: 1_000_000 },
      {},
      { asking_price: 3_000_000, loan_balance: 2_999_999 },
    );
    expect(result).toMatchObject({
      estimated_cash_boot: 0,
      estimated_mortgage_boot: 0,
      estimated_total_boot: 0,
      estimated_boot_tax: null,
      boot_status: "no_boot",
    });
  });

  it("blocks investor self-matches without blocking an agent's different clients", () => {
    const property = { agent_id: "same-account" };
    expect(isInvestorSelfMatch({ owner_type: "investor", agent_id: "same-account" }, property)).toBe(true);
    expect(isInvestorSelfMatch({ owner_type: "agent", agent_id: "same-account" }, property)).toBe(false);
  });

  it("identifies stale active recommendations for archival", () => {
    expect(findStaleActiveMatchIds(
      [
        { id: "keep", buyer_exchange_id: "ex", seller_property_id: "a", status: "active" },
        { id: "archive", buyer_exchange_id: "ex", seller_property_id: "b", status: "active" },
        { id: "history", buyer_exchange_id: "ex", seller_property_id: "c", status: "archived" },
      ],
      [{ buyer_exchange_id: "ex", seller_property_id: "a" }],
    )).toEqual(["archive"]);
  });
});

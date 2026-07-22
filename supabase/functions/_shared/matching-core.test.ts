import { assertEquals, assert, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { scorePairExplained, blendFit, calculateBoot } from "./matching-core.ts";

const settings = { mortgage_interest_rate: 7.25, mortgage_amortization_years: 30 };

// Buyer relinquished: $1M price, $400k loan, $60k NOI, no debt service data
// → equity = $600k, buyer levered ROE = (60k - amortDS(400k)) / 600k
const buyerFin = { asking_price: 1_000_000, loan_balance: 400_000, noi: 60_000 };
const buyerExchange = { exchange_proceeds: 600_000 };
const criteria = { target_states: ["MA"], target_asset_types: ["multifamily"] };

Deno.test("scorePairExplained: clean upgrade returns ok with positive ROE improvement", () => {
  // Candidate: $1.5M price (within 4x $600k = $2.4M ceiling), $130k NOI
  // 75% LTV loan on $1.5M = $1.125M at 7.25%/30yr
  const candidate = { state: "MA", asset_type: "multifamily", year_built: 2015 };
  const candidateFin = { asking_price: 1_500_000, noi: 130_000, occupancy_rate: 92 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(r.ok, `expected ok, got: ${!r.ok && r.reason}`);
  if (r.ok) {
    assert(r.score.roe_improvement_pp > 0, "expected positive ROE improvement");
    assert(r.score.total > 0 && r.score.total <= 100);
    assertEquals(r.score.geo, 70); // state match, no metros
    assertEquals(r.score.asset, 100); // asset type match
  }
});

Deno.test("scorePairExplained: affordability rejection", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // $3M > affordability ceiling ($600k / 0.25 = $2.4M)
  const candidateFin = { asking_price: 3_000_000, noi: 250_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if (!r.ok) assertMatch(r.reason, /candidate price .* exceeds affordability/);
});

Deno.test("scorePairExplained: no ROE upgrade rejection", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // Low NOI → candidate ROE well below buyer's
  const candidateFin = { asking_price: 1_500_000, noi: 30_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if (!r.ok) assertMatch(r.reason, /no ROE upgrade/);
});

Deno.test("scorePairExplained: missing buyer financials → skip", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 130_000 };
  const r = scorePairExplained(buyerExchange, { noi: 60_000 }, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if (!r.ok) assertMatch(r.reason, /missing NOI, asking price, or loan balance/);
});

Deno.test("scorePairExplained: missing candidate financials → skip", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, { noi: 100_000 }, criteria, settings);
  assert(!r.ok);
  if (!r.ok) assertMatch(r.reason, /candidate property missing/);
});

Deno.test("blendFit: no criteria → 100 (pure ROE ranking)", () => {
  assertEquals(blendFit(0, 0, 0, {}), 100);
  assertEquals(blendFit(0, 0, 0, { target_states: [], target_asset_types: [], target_strategies: [] }), 100);
});

Deno.test("blendFit: partial criteria only weights expressed dimensions", () => {
  // Only asset expressed, geo/strategy blank → returns just the asset score
  const v = blendFit(50, 80, 20, { target_asset_types: ["multifamily"] });
  assertEquals(v, 80);
});

Deno.test("calculateBoot: candidate cheaper than proceeds → cash boot", () => {
  const b = calculateBoot({ exchange_proceeds: 600_000 }, { loan_balance: 400_000 }, {}, { asking_price: 500_000, loan_balance: 400_000 });
  assertEquals(b.estimated_cash_boot, 100_000);
  assertEquals(b.estimated_mortgage_boot, 0);
  assertEquals(b.boot_status, "significant_boot");
});

Deno.test("calculateBoot: fully consumed proceeds → no boot", () => {
  const b = calculateBoot({ exchange_proceeds: 600_000 }, { loan_balance: 400_000 }, {}, { asking_price: 1_500_000, loan_balance: 1_125_000 });
  assertEquals(b.estimated_cash_boot, 0);
  assertEquals(b.boot_status, "no_boot");
});

Deno.test("calculateBoot: no data → insufficient_data", () => {
  const b = calculateBoot({}, {}, {}, {});
  assertEquals(b.boot_status, "insufficient_data");
  assertEquals(b.estimated_cash_boot, null);
});

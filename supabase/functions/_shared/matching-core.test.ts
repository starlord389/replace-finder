import { assertEquals, assert, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  scorePairExplained,
  blendFit,
  calculateBoot,
  estimatePurchasingCapacity,
  minimumReplacementValue,
  exchangeUpPercentage,
  buildExchangeChains,
  summarizeDiagnostics,
} from "./matching-core.ts";
import { MATCH_CLASSIFICATION } from "./match-config.ts";

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
    assert((r.score.roe_improvement_pp ?? 0) > 0, "expected positive ROE improvement");
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
  if (!r.ok) {
    assertMatch(r.reason, /exceeds estimated purchasing capacity/);
    assertEquals(r.classification, MATCH_CLASSIFICATION.ABOVE_CAPACITY);
  }
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


// ─── Exchange Up directional rules ─────────────────────────────────────────

Deno.test("exchange up: replacement below relinquished value is rejected", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // $800k candidate vs $1M relinquished — great ROE but a downward move.
  const candidateFin = { asking_price: 800_000, noi: 120_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok, "a lower-value replacement must never match");
  if (!r.ok) {
    assertEquals(r.classification, MATCH_CLASSIFICATION.BELOW_VALUE);
    assertMatch(r.reason, /below the Exchange Up minimum/);
  }
});

Deno.test("exchange up: equal-value replacement is allowed", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_000_000, noi: 120_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(r.ok, `equal value should pass the gate, got: ${!r.ok && r.reason}`);
  if (r.ok) {
    assertEquals(r.score.exchange_up_percentage, 0);
    assertEquals(r.score.match_classification, MATCH_CLASSIFICATION.ELIGIBLE);
  }
});

Deno.test("exchange up: min_value_increase raises the floor", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_200_000, noi: 140_000 };
  const strict = { ...criteria, min_value_increase: 500_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, strict, settings);
  assert(!r.ok);
  if (!r.ok) assertEquals(r.classification, MATCH_CLASSIFICATION.BELOW_VALUE);
});

Deno.test("exchange up: percentage and value increase are reported", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 140_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(r.ok);
  if (r.ok) {
    assertEquals(r.score.relinquished_value, 1_000_000);
    assertEquals(r.score.replacement_value, 1_500_000);
    assertEquals(r.score.value_increase, 500_000);
    assertEquals(r.score.exchange_up_percentage, 50);
    assert(r.score.eligibility_reasons.length >= 3);
  }
});

Deno.test("capacity: additional cash and custom max LTV expand buying power", () => {
  const base = estimatePurchasingCapacity(buyerExchange, buyerFin, {});
  assertEquals(Math.round(base.capacity), 2_400_000); // 600k / 0.25

  const withCash = estimatePurchasingCapacity(buyerExchange, buyerFin, { additional_cash_available: 200_000 });
  assertEquals(Math.round(withCash.capacity), 3_200_000); // 800k / 0.25

  const lowLtv = estimatePurchasingCapacity(buyerExchange, buyerFin, { max_ltv: 0.5 });
  assertEquals(Math.round(lowLtv.capacity), 1_200_000);
});

Deno.test("capacity: explicit desired loan amount overrides the LTV implication", () => {
  const c = estimatePurchasingCapacity(buyerExchange, buyerFin, { desired_loan_amount: 400_000 });
  assertEquals(Math.round(c.capacity), 1_000_000);
});

Deno.test("capacity: a candidate above capacity is rejected before ROE is considered", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 2_000_000, noi: 400_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, { ...criteria, max_ltv: 0.5 }, settings);
  assert(!r.ok);
  if (!r.ok) assertEquals(r.classification, MATCH_CLASSIFICATION.ABOVE_CAPACITY);
});

Deno.test("preferences: asset type outside the client's targets is rejected", () => {
  const candidate = { state: "MA", asset_type: "retail" };
  const candidateFin = { asking_price: 1_500_000, noi: 140_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if (!r.ok) assertEquals(r.classification, MATCH_CLASSIFICATION.PREFERENCES);
});

Deno.test("preferences: max_replacement_value caps the upper end", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_800_000, noi: 200_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, { ...criteria, max_replacement_value: 1_500_000 }, settings);
  assert(!r.ok);
  if (!r.ok) assertEquals(r.classification, MATCH_CLASSIFICATION.PREFERENCES);
});

Deno.test("preferences: min_projected_roe below target is rejected", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 130_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, { ...criteria, min_projected_roe: 25 }, settings);
  assert(!r.ok);
  if (!r.ok) assertEquals(r.classification, MATCH_CLASSIFICATION.LOW_ROE);
});

Deno.test("minimumReplacementValue never drops below the relinquished value", () => {
  assertEquals(minimumReplacementValue(1_000_000, { min_replacement_value: 500_000 }), 1_000_000);
  assertEquals(minimumReplacementValue(1_000_000, { min_replacement_value: 1_400_000 }), 1_400_000);
  assertEquals(minimumReplacementValue(1_000_000, { min_value_increase: 250_000 }), 1_250_000);
});

Deno.test("exchangeUpPercentage handles zero and negative deltas", () => {
  assertEquals(exchangeUpPercentage(1_000_000, 1_500_000), 50);
  assertEquals(exchangeUpPercentage(1_000_000, 1_000_000), 0);
  assertEquals(exchangeUpPercentage(0, 1_000_000), null);
});

Deno.test("buildExchangeChains: A → B → C is detected", () => {
  const chains = buildExchangeChains([
    { relinquished_property_id: "A", replacement_property_id: "B", buyer_exchange_id: "ex1" },
    { relinquished_property_id: "B", replacement_property_id: "C", buyer_exchange_id: "ex2" },
  ]);
  assertEquals(chains, [["A", "B", "C"]]);
});

Deno.test("buildExchangeChains: unlinked pairs produce no chain", () => {
  const chains = buildExchangeChains([
    { relinquished_property_id: "A", replacement_property_id: "B", buyer_exchange_id: "ex1" },
    { relinquished_property_id: "X", replacement_property_id: "Y", buyer_exchange_id: "ex2" },
  ]);
  assertEquals(chains, []);
});

Deno.test("summarizeDiagnostics counts classifications and ignores scan rows", () => {
  const s = summarizeDiagnostics([
    { direction: "buyer", candidate_property_id: "p", candidate_exchange_id: null, candidate_label: "scan", status: "skipped", reason: "", classification: "scan" },
    { direction: "buyer", candidate_property_id: "p1", candidate_exchange_id: null, candidate_label: "a", status: "matched", reason: "", classification: MATCH_CLASSIFICATION.ELIGIBLE },
    { direction: "buyer", candidate_property_id: "p2", candidate_exchange_id: null, candidate_label: "b", status: "skipped", reason: "", classification: MATCH_CLASSIFICATION.BELOW_VALUE },
    { direction: "buyer", candidate_property_id: "p3", candidate_exchange_id: null, candidate_label: "c", status: "skipped", reason: "", classification: MATCH_CLASSIFICATION.ABOVE_CAPACITY },
  ]);
  assertEquals(s.evaluated, 3);
  assertEquals(s.eligible, 1);
  assertEquals(s.below_relinquished_value, 1);
  assertEquals(s.above_purchasing_capacity, 1);
});

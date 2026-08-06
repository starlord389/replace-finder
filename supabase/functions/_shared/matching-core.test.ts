import { assertEquals, assert, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  blendFit,
  calculateBoot,
  findStaleActiveMatchIds,
  isInvestorSelfMatch,
  scorePairExplained,
} from "./matching-core.ts";

const settings = { mortgage_interest_rate: 7.25, mortgage_amortization_years: 30 };

// Buyer relinquished: $1M price, $400k loan, $60k NOI, no debt service data
// → equity = $600k, buyer levered ROE = (60k - amortDS(400k)) / 600k
const buyerFin = { asking_price: 1_000_000, loan_balance: 400_000, noi: 60_000 };
const buyerExchange = { exchange_proceeds: 600_000 };
const criteria = { target_states: ["MA"], target_asset_types: ["multifamily"] };

Deno.test("scorePairExplained: clean upgrade returns ok with positive ROE improvement", () => {
  // Candidate: $1.5M price (within 4x $600k = $2.4M ceiling), $130k NOI
  // Full $600k equity is reinvested, so the modeled loan is $900k (60% LTV).
  const candidate = { state: "MA", asset_type: "multifamily", year_built: 2015 };
  const candidateFin = { asking_price: 1_500_000, noi: 130_000, occupancy_rate: 92 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(r.ok, `expected ok, got: ${"reason" in r ? r.reason : "unknown failure"}`);
  if (r.ok) {
    assert((r.score.roe_improvement_pp ?? 0) > 0, "expected positive ROE improvement");
    assert(r.score.total > 0 && r.score.total <= 100);
    assertEquals(r.score.geo, 100); // state match, no metros
    assertEquals(r.score.asset, 100); // asset type match
    assertEquals(r.score.estimated_replacement_loan, 900_000);
    assertEquals(r.score.estimated_ltv, 0.6);
  }
});

Deno.test("scorePairExplained: affordability rejection", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // $3M > affordability ceiling ($600k / 0.25 = $2.4M)
  const candidateFin = { asking_price: 3_000_000, noi: 250_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if ("reason" in r) assertMatch(r.reason, /candidate price .* exceeds affordability/);
});

Deno.test("scorePairExplained: no ROE upgrade rejection", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // Low NOI → candidate ROE well below buyer's
  const candidateFin = { asking_price: 1_500_000, noi: 30_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if ("reason" in r) assertMatch(r.reason, /no ROE upgrade/);
});

Deno.test("scorePairExplained: missing buyer financials → skip", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 130_000 };
  const r = scorePairExplained(buyerExchange, { noi: 60_000 }, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if ("reason" in r) assertMatch(r.reason, /missing NOI, asking price, or loan balance/);
});

Deno.test("scorePairExplained: missing candidate financials → skip", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, { noi: 100_000 }, criteria, settings);
  assert(!r.ok);
  if ("reason" in r) assertMatch(r.reason, /candidate property missing/);
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

Deno.test("calculateBoot: uses buyer equity and modeled new financing, not seller debt", () => {
  const b = calculateBoot({}, { asking_price: 1_000_000, loan_balance: 400_000 }, {}, { asking_price: 500_000, loan_balance: 999_999 });
  assertEquals(b.estimated_cash_boot, 100_000);
  assertEquals(b.estimated_mortgage_boot, 400_000);
  assertEquals(b.boot_status, "significant_boot");
  assertEquals(b.estimated_boot_tax, null);
});

Deno.test("blank optional criteria preserve the default matching result exactly", () => {
  const candidate = { state: "TX", city: "Austin", asset_type: "office", year_built: 2010 };
  const candidateFin = { asking_price: 1_500_000, noi: 140_000, occupancy_rate: 90 };
  const baseline = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, {}, settings);
  const explicitBlanks = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
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
  assertEquals(explicitBlanks, baseline);
});

Deno.test("additional cash expands capacity and uses only the amount the candidate needs", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 2_800_000, noi: 280_000 };

  const withoutCash = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, {}, settings);
  assert(!withoutCash.ok);
  if ("reason" in withoutCash) assertMatch(withoutCash.reason, /exceeds affordability ceiling/);

  const withCash = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { additional_cash_available: 200_000 },
    settings,
  );
  assert(withCash.ok, `expected cash-assisted candidate to qualify, got: ${"reason" in withCash ? withCash.reason : "unknown"}`);
  if (withCash.ok) {
    assertEquals(withCash.score.estimated_purchasing_capacity, 3_200_000);
    assertEquals(withCash.score.estimated_replacement_loan, 2_100_000);
    assertEquals(withCash.score.estimated_ltv, 0.75);
    assert(withCash.score.eligibility_reasons.some((reason) => reason.includes("$100,000")));
  }
});

Deno.test("a lower optional LTV is honored and combines with only the required cash", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 150_000 };

  const withoutCash = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { max_ltv: 0.5 },
    settings,
  );
  assert(!withoutCash.ok);
  if ("reason" in withoutCash) assertMatch(withoutCash.reason, /exceeds affordability ceiling/);

  const withCash = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { max_ltv: 0.5, additional_cash_available: 200_000 },
    settings,
  );
  assert(withCash.ok, `expected lower-LTV candidate to qualify, got: ${"reason" in withCash ? withCash.reason : "unknown"}`);
  if (withCash.ok) {
    assertEquals(withCash.score.estimated_purchasing_capacity, 1_600_000);
    assertEquals(withCash.score.estimated_replacement_loan, 750_000);
    assertEquals(withCash.score.estimated_ltv, 0.5);
    assert(withCash.score.eligibility_reasons.some((reason) => reason.includes("$150,000")));
  }
});

Deno.test("optional strict location and property type only gate when enabled", () => {
  const candidate = { state: "GA", city: "Atlanta", asset_type: "office" };
  const candidateFin = { asking_price: 1_500_000, noi: 150_000 };
  const preferences = { target_states: ["FL"], target_asset_types: ["multifamily"] };

  const soft = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, preferences, settings);
  assert(soft.ok, "soft preferences should rank rather than exclude");

  const hardLocation = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { ...preferences, require_location_match: true },
    settings,
  );
  assert(!hardLocation.ok);
  if ("reason" in hardLocation) assertMatch(hardLocation.reason, /required location/);

  const hardAsset = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { ...preferences, require_asset_type_match: true },
    settings,
  );
  assert(!hardAsset.ok);
  if ("reason" in hardAsset) assertMatch(hardAsset.reason, /required property-type/);
});

Deno.test("optional price, ROE, and monthly cash-flow minimums are enforced only when entered", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  const candidateFin = { asking_price: 1_500_000, noi: 140_000 };

  const abovePrice = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { target_price_max: 1_400_000 },
    settings,
  );
  assert(!abovePrice.ok);
  if ("reason" in abovePrice) assertMatch(abovePrice.reason, /optional maximum replacement price/);

  const belowRoe = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { min_projected_roe: 50 },
    settings,
  );
  assert(!belowRoe.ok);
  if ("reason" in belowRoe) assertMatch(belowRoe.reason, /below the optional .* minimum/);

  const belowCashFlow = scorePairExplained(
    buyerExchange,
    buyerFin,
    candidate,
    candidateFin,
    { preferred_monthly_cash_flow: 50_000 },
    settings,
  );
  assert(!belowCashFlow.ok);
  if ("reason" in belowCashFlow) assertMatch(belowCashFlow.reason, /projected monthly cash flow/);
});

Deno.test("calculateBoot: fully consumed proceeds → no boot", () => {
  const b = calculateBoot({}, { asking_price: 1_000_000, loan_balance: 400_000 }, {}, { asking_price: 1_500_000, loan_balance: 1 });
  assertEquals(b.estimated_cash_boot, 0);
  assertEquals(b.estimated_mortgage_boot, 0);
  assertEquals(b.boot_status, "no_boot");
});

Deno.test("calculateBoot: no data → insufficient_data", () => {
  const b = calculateBoot({}, {}, {}, {});
  assertEquals(b.boot_status, "insufficient_data");
  assertEquals(b.estimated_cash_boot, null);
});

Deno.test("scorePairExplained: replacement cheaper than relinquished → trade-up rejection", () => {
  const candidate = { state: "MA", asset_type: "multifamily" };
  // $900k < $1M relinquished value → violates the 1031 equal-or-greater rule
  const candidateFin = { asking_price: 900_000, noi: 120_000 };
  const r = scorePairExplained(buyerExchange, buyerFin, candidate, candidateFin, criteria, settings);
  assert(!r.ok);
  if ("reason" in r) assertMatch(r.reason, /1031 trade-up rule/);
});

Deno.test("boss example: $2M value and $1M debt supports up to $4M at 75% LTV", () => {
  const buyer = { asking_price: 2_000_000, loan_balance: 1_000_000, noi: 170_000, annual_debt_service: 80_000 };
  const atCeiling = scorePairExplained(
    {}, buyer, {}, { asking_price: 4_000_000, noi: 400_000 }, {},
    { mortgage_interest_rate: 7, mortgage_amortization_years: 25 },
  );
  assert(atCeiling.ok, `expected ceiling candidate to qualify, got: ${"reason" in atCeiling ? atCeiling.reason : "unknown failure"}`);
  if (atCeiling.ok) {
    assertEquals(atCeiling.score.estimated_purchasing_capacity, 4_000_000);
    assertEquals(atCeiling.score.estimated_replacement_loan, 3_000_000);
    assertEquals(atCeiling.score.estimated_ltv, 0.75);
  }

  const aboveCeiling = scorePairExplained(
    {}, buyer, {}, { asking_price: 4_000_001, noi: 500_000 }, {},
    { mortgage_interest_rate: 7, mortgage_amortization_years: 25 },
  );
  assert(!aboveCeiling.ok);
  if ("reason" in aboveCeiling) assertMatch(aboveCeiling.reason, /exceeds affordability ceiling/);
});

Deno.test("self-managed investors cannot match their own account; agents can match different clients", () => {
  const property = { agent_id: "owner-1" };
  assert(isInvestorSelfMatch({ owner_type: "investor", agent_id: "owner-1" }, property));
  assertEquals(isInvestorSelfMatch({ owner_type: "agent", agent_id: "owner-1" }, property), false);
  assertEquals(isInvestorSelfMatch({ owner_type: "investor", agent_id: "owner-2" }, property), false);
});

Deno.test("reconciliation finds active pairs that no longer qualify", () => {
  const stale = findStaleActiveMatchIds(
    [
      { id: "keep", buyer_exchange_id: "ex-1", seller_property_id: "p-1", status: "active" },
      { id: "archive", buyer_exchange_id: "ex-1", seller_property_id: "p-2", status: "active" },
      { id: "already", buyer_exchange_id: "ex-1", seller_property_id: "p-3", status: "archived" },
    ],
    [{ buyer_exchange_id: "ex-1", seller_property_id: "p-1" }],
  );
  assertEquals(stale, ["archive"]);
});

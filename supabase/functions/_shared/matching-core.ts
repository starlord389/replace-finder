import {
  ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP,
  FALLBACK_AMORTIZATION_YEARS,
  FALLBACK_MORTGAGE_RATE,
  FIT_SUBWEIGHTS,
  MATCH_WEIGHTS,
  MAX_COMMERCIAL_LTV,
  QUALITY_TIEBREAKER_MAX_POINTS,
  ROE_IMPROVEMENT_FULL_SCORE_PP,
} from "./match-config.ts";

export interface ScoredMatch {
  buyer_exchange_id: string;
  seller_property_id: string;
  total: number;
  price: number;       // re-purposed: ROE component score (0-100)
  geo: number;
  asset: number;
  strategy: number;
  financial: number;   // re-purposed: quality tiebreaker score (0-100)
  estimated_cash_boot: number | null;
  estimated_mortgage_boot: number | null;
  estimated_total_boot: number | null;
  estimated_boot_tax: number | null;
  boot_status: string;
  direction: "buyer" | "seller";
  other_agent_id: string;
  // ROE columns persisted to matches table
  buyer_current_roe: number | null;
  candidate_roe: number | null;
  roe_improvement_pp: number | null;
  roe_improvement_rel: number | null;
  candidate_annual_debt_service: number | null;
}

interface MatchSettings {
  mortgage_interest_rate: number; // percent, e.g. 7.25
  mortgage_amortization_years: number;
}

async function loadMatchSettings(db: any): Promise<MatchSettings> {
  try {
    const { data } = await db
      .from("app_settings")
      .select("mortgage_interest_rate, mortgage_amortization_years")
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        mortgage_interest_rate: Number(data.mortgage_interest_rate) || FALLBACK_MORTGAGE_RATE,
        mortgage_amortization_years: Number(data.mortgage_amortization_years) || FALLBACK_AMORTIZATION_YEARS,
      };
    }
  } catch (err) {
    console.warn("[matching] failed to load app_settings, using fallbacks", err);
  }
  return {
    mortgage_interest_rate: FALLBACK_MORTGAGE_RATE,
    mortgage_amortization_years: FALLBACK_AMORTIZATION_YEARS,
  };
}

export async function computeMatchesForExchange(
  db: any,
  userId: string,
  exchangeId: string,
  propertyId: string,
): Promise<ScoredMatch[]> {
  const [exchangeRes, propertyRes, settings] = await Promise.all([
    db.from("exchanges").select("*").eq("id", exchangeId).single(),
    db.from("pledged_properties").select("*").eq("id", propertyId).single(),
    loadMatchSettings(db),
  ]);
  if (exchangeRes.error || !exchangeRes.data) throw new Error("Exchange not found");
  if (propertyRes.error || !propertyRes.data) throw new Error("Property not found");

  const exchange = exchangeRes.data;
  const property = propertyRes.data;
  // Workspace isolation: a listing only ever matches candidates in the same
  // workspace (demo↔demo, live↔live). This keeps demo sandbox data out of every
  // real agent's matches, and vice versa.
  const isDemo = Boolean(property?.is_demo);

  const [criteriaRes, propertyFinRes, relinquishedFinRes] = await Promise.all([
    exchange.criteria_id
      ? db.from("replacement_criteria").select("*").eq("id", exchange.criteria_id).single()
      : Promise.resolve({ data: null }),
    db.from("property_financials").select("*").eq("property_id", propertyId).maybeSingle(),
    exchange.relinquished_property_id
      ? db.from("property_financials").select("*").eq("property_id", exchange.relinquished_property_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const criteria = criteriaRes.data;
  const propertyFin = propertyFinRes.data;
  const relinquishedFin = relinquishedFinRes.data;
  const allMatches: ScoredMatch[] = [];

  // Buyer side: this exchange × other people's active properties
  if (criteria) {
    const { data: activeProperties } = await db
      .from("pledged_properties")
      .select("*")
      .eq("status", "active")
      .eq("is_demo", isDemo)
      .neq("agent_id", userId);

    if (activeProperties?.length) {
      const propIds = activeProperties.map((p: any) => p.id);
      const { data: allFinancials } = await db
        .from("property_financials")
        .select("*")
        .in("property_id", propIds);
      const financialMap = new Map((allFinancials || []).map((f: any) => [f.property_id, f]));

      for (const candidateProperty of activeProperties) {
        const candidateFinancials = financialMap.get(candidateProperty.id);
        const scored = scorePair(exchange, relinquishedFin, candidateProperty, candidateFinancials, criteria, settings);
        if (!scored) continue; // failed eligibility
        const boot = calculateBoot(exchange, propertyFin, candidateProperty, candidateFinancials);
        allMatches.push({
          buyer_exchange_id: exchangeId,
          seller_property_id: candidateProperty.id,
          ...scored,
          ...boot,
          direction: "buyer",
          other_agent_id: candidateProperty.agent_id,
        } as ScoredMatch);
      }
    }
  }

  // Seller side: this property × other people's exchanges
  const { data: otherExchanges } = await db
    .from("exchanges")
    .select("*, replacement_criteria(*)")
    .in("status", ["active", "in_identification", "in_closing"])
    .eq("is_demo", isDemo)
    .neq("agent_id", userId);

  if (otherExchanges?.length) {
    const relinquishedPropertyIds = otherExchanges
      .map((row: any) => row.relinquished_property_id)
      .filter(Boolean);
    const { data: otherFinancials } = relinquishedPropertyIds.length
      ? await db.from("property_financials").select("*").in("property_id", relinquishedPropertyIds)
      : { data: [] };
    const otherFinancialMap = new Map((otherFinancials || []).map((f: any) => [f.property_id, f]));

    for (const otherExchange of otherExchanges) {
      const otherCriteria = Array.isArray(otherExchange.replacement_criteria)
        ? otherExchange.replacement_criteria[0]
        : otherExchange.replacement_criteria;
      if (!otherCriteria) continue;

      const buyerRelinquishedFinancials = otherExchange.relinquished_property_id
        ? otherFinancialMap.get(otherExchange.relinquished_property_id)
        : null;

      const scored = scorePair(otherExchange, buyerRelinquishedFinancials, property, propertyFin, otherCriteria, settings);
      if (!scored) continue;

      const boot = calculateBoot(otherExchange, buyerRelinquishedFinancials, property, propertyFin);
      allMatches.push({
        buyer_exchange_id: otherExchange.id,
        seller_property_id: propertyId,
        ...scored,
        ...boot,
        direction: "seller",
        other_agent_id: otherExchange.agent_id,
      } as ScoredMatch);
    }
  }

  return allMatches;
}

export async function persistMatchesAndNotifications(db: any, matches: ScoredMatch[], userId: string) {
  let upsertedCount = 0;
  if (matches.length > 0) {
    const rows = matches.map((m) => ({
      buyer_exchange_id: m.buyer_exchange_id,
      seller_property_id: m.seller_property_id,
      total_score: m.total,
      price_score: m.price,
      geo_score: m.geo,
      asset_score: m.asset,
      strategy_score: m.strategy,
      financial_score: m.financial,
      estimated_cash_boot: m.estimated_cash_boot,
      estimated_mortgage_boot: m.estimated_mortgage_boot,
      estimated_total_boot: m.estimated_total_boot,
      estimated_boot_tax: m.estimated_boot_tax,
      boot_status: m.boot_status,
      buyer_current_roe: m.buyer_current_roe,
      candidate_roe: m.candidate_roe,
      roe_improvement_pp: m.roe_improvement_pp,
      roe_improvement_rel: m.roe_improvement_rel,
      candidate_annual_debt_service: m.candidate_annual_debt_service,
      status: "active",
    }));

    const { data: upserted, error } = await db
      .from("matches")
      .upsert(rows, { onConflict: "buyer_exchange_id,seller_property_id" })
      .select("id");
    if (error) throw error;
    upsertedCount = upserted?.length || 0;
  }

  const notifications = matches.map((match) => ({
    user_id: match.direction === "buyer" ? userId : match.other_agent_id,
    type: "new_match",
    title: "New Match Found",
    message: "A new property/exchange match is available for review.",
    link_to: "/agent/matches",
  }));

  if (notifications.length) {
    await db.from("notifications").insert(notifications);
  }

  return upsertedCount;
}

// ─── ROE-based scoring ──────────────────────────────────────────────────────

interface RoePairScore {
  total: number;
  price: number;       // ROE component score
  geo: number;
  asset: number;
  strategy: number;
  financial: number;   // quality tiebreaker score
  buyer_current_roe: number | null;
  candidate_roe: number | null;
  roe_improvement_pp: number | null;
  roe_improvement_rel: number | null;
  candidate_annual_debt_service: number | null;
}

function scorePair(
  buyerExchange: any,
  relinquishedFin: any,
  candidateProp: any,
  candidateFin: any,
  criteria: any,
  settings: MatchSettings,
): RoePairScore | null {
  // 1. Buyer baseline ROE — requires NOI, price, loan_balance on relinquished.
  //    LEVERED return: subtract the client's existing annual debt service so the
  //    current property is measured the same way as the candidate below (both
  //    after financing). Debt service uses the mortgage the agent entered, or an
  //    amortized estimate on the loan balance; free-and-clear means zero.
  const rNoi = numOrNull(relinquishedFin?.noi);
  const rPrice = numOrNull(relinquishedFin?.asking_price);
  const rLoan = numOrNull(relinquishedFin?.loan_balance);
  if (rNoi == null || rPrice == null || rLoan == null) return null;
  const buyerEquity = rPrice - rLoan;
  if (buyerEquity <= 0) return null;
  const buyerDebtService = relinquishedAnnualDebtService(relinquishedFin, settings);
  const buyerCurrentROE = (rNoi - buyerDebtService) / buyerEquity; // levered cash-on-cash on equity

  // 2. Candidate ROE — requires candidate NOI + asking price
  const cNoi = numOrNull(candidateFin?.noi);
  const cPrice = numOrNull(candidateFin?.asking_price);
  if (cNoi == null || cPrice == null || cPrice <= 0) return null;

  // 3. Affordability sanity: buyer's equity needs to cover the down payment
  const maxAffordable = buyerEquity / (1 - MAX_COMMERCIAL_LTV);
  if (cPrice > maxAffordable) return null;

  // 4. Amortized annual payment on a 75%-LTV loan at admin assumptions
  const loanAmount = MAX_COMMERCIAL_LTV * cPrice;
  const annualPmt = amortizedAnnualPayment(
    loanAmount,
    settings.mortgage_interest_rate,
    settings.mortgage_amortization_years,
  );

  const candidateROE = (cNoi - annualPmt) / buyerEquity;
  const improvementPP = (candidateROE - buyerCurrentROE) * 100;
  // Relative improvement only makes sense against a positive baseline (a negative
  // or zero current return would make the ratio meaningless).
  const improvementRel = buyerCurrentROE > 0 ? candidateROE / buyerCurrentROE - 1 : null;

  // 5. Eligibility gate
  if (improvementPP <= ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP) return null;

  // 6. ROE component score (0..100)
  const roeScore = clamp01(improvementPP / ROE_IMPROVEMENT_FULL_SCORE_PP) * 100;

  // 7. Fit components — neutral (no penalty) when buyer left criteria blank
  const geoScore = scoreGeo(candidateProp, criteria);
  const assetScore = scoreAsset(candidateProp, criteria);
  const strategyScore = scoreStrategy(candidateProp, criteria);
  const fitScore = blendFit(geoScore, assetScore, strategyScore, criteria);

  // 8. Weighted total + quality tiebreaker
  const base =
    roeScore * MATCH_WEIGHTS.roe +
    fitScore * MATCH_WEIGHTS.fit;
  const qualityScore = scoreQuality(candidateProp, candidateFin);
  // qualityScore is 0..100; map to -MAX..+MAX (centered on 50)
  const qualityAdj = ((qualityScore - 50) / 50) * QUALITY_TIEBREAKER_MAX_POINTS;

  const total = Math.max(0, Math.min(100, base + qualityAdj));

  return {
    total: round(total),
    price: round(roeScore),
    geo: round(geoScore),
    asset: round(assetScore),
    strategy: round(strategyScore),
    financial: round(qualityScore),
    buyer_current_roe: round4(buyerCurrentROE),
    candidate_roe: round4(candidateROE),
    roe_improvement_pp: round(improvementPP),
    roe_improvement_rel: improvementRel != null ? round4(improvementRel) : null,
    candidate_annual_debt_service: Math.round(annualPmt),
  };
}

function blendFit(geo: number, asset: number, strategy: number, criteria: any): number {
  // Only count dimensions the buyer actually expressed. Blank = no signal.
  const hasGeo = !!(criteria?.target_states?.length || criteria?.target_metros?.length);
  const hasAsset = !!criteria?.target_asset_types?.length;
  const hasStrategy = !!criteria?.target_strategies?.length;

  const parts: Array<[number, number]> = [];
  if (hasGeo) parts.push([geo, FIT_SUBWEIGHTS.geo]);
  if (hasAsset) parts.push([asset, FIT_SUBWEIGHTS.asset]);
  if (hasStrategy) parts.push([strategy, FIT_SUBWEIGHTS.strategy]);

  if (parts.length === 0) return 100; // no preferences → pure ROE ranking, don't penalize
  const weightSum = parts.reduce((s, [, w]) => s + w, 0);
  return parts.reduce((s, [v, w]) => s + v * w, 0) / weightSum;
}

function scoreGeo(prop: any, criteria: any): number {
  const hasStates = criteria?.target_states?.length > 0;
  const hasMetros = criteria?.target_metros?.length > 0;
  if (!hasStates && !hasMetros) return 50;

  let score = 0;
  if (hasStates && prop.state && criteria.target_states.includes(prop.state)) score += 70;
  if (hasMetros && prop.city) {
    const cityLower = prop.city.toLowerCase();
    if (
      criteria.target_metros.some(
        (metro: string) =>
          cityLower.includes(metro.toLowerCase()) || metro.toLowerCase().includes(cityLower),
      )
    ) {
      score += 30;
    }
  }
  return Math.min(100, score);
}

function scoreAsset(prop: any, criteria: any): number {
  if (!criteria?.target_asset_types?.length || !prop.asset_type) return 50;
  return criteria.target_asset_types.includes(prop.asset_type) ? 100 : 0;
}

function scoreStrategy(prop: any, criteria: any): number {
  if (!criteria?.target_strategies?.length || !prop.strategy_type) return 50;
  return criteria.target_strategies.includes(prop.strategy_type) ? 100 : 20;
}

// Occupancy + building age, returns 0..100 (50 = no signal)
function scoreQuality(prop: any, fin: any): number {
  let score = 0;
  let weight = 0;

  const occupancy = numOrNull(fin?.occupancy_rate);
  if (occupancy != null) {
    score += clamp01((occupancy - 70) / (95 - 70)) * 60;
    weight += 60;
  }

  const yearBuilt = numOrNull(prop?.year_built);
  if (yearBuilt != null) {
    const age = new Date().getUTCFullYear() - yearBuilt;
    score += clamp01((60 - age) / (60 - 10)) * 40;
    weight += 40;
  }

  if (weight === 0) return 50;
  return (score / weight) * 100;
}

function amortizedAnnualPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / years;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  return monthly * 12;
}

/**
 * The client's existing annual debt service on the relinquished property, used
 * to compute their current (levered) ROE. Prefers the actual mortgage the agent
 * entered (`annual_debt_service`); if that's missing but the property carries a
 * loan, falls back to an amortized estimate on the balance at the admin's
 * assumptions. Free-and-clear (no loan) means zero.
 */
function relinquishedAnnualDebtService(fin: any, settings: MatchSettings): number {
  const loan = numOrNull(fin?.loan_balance) ?? 0;
  if (loan <= 0) return 0;
  const actual = numOrNull(fin?.annual_debt_service);
  if (actual != null && actual >= 0) return actual;
  return amortizedAnnualPayment(loan, settings.mortgage_interest_rate, settings.mortgage_amortization_years);
}

function numOrNull(v: any): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function calculateBoot(
  buyerExchange: any,
  buyerFin: any,
  _sellerProp: any,
  sellerFin: any,
): Record<string, any> {
  const proceeds = Number(buyerExchange.exchange_proceeds || 0);
  const askingPrice = Number(sellerFin?.asking_price || 0);
  const buyerLoanBalance = Number(buyerFin?.loan_balance || 0);
  const sellerLoanBalance = Number(sellerFin?.loan_balance || 0);
  if (!proceeds && !askingPrice && !buyerLoanBalance && !sellerLoanBalance) {
    return {
      estimated_cash_boot: null,
      estimated_mortgage_boot: null,
      estimated_total_boot: null,
      estimated_boot_tax: null,
      boot_status: "insufficient_data",
    };
  }

  const cashBoot = Math.max(0, proceeds - askingPrice);
  const mortgageBoot = Math.max(0, buyerLoanBalance - sellerLoanBalance);
  const totalBoot = Math.max(0, cashBoot + mortgageBoot);
  const bootTax = totalBoot * 0.3;

  let bootStatus = "significant_boot";
  if (totalBoot === 0) bootStatus = "no_boot";
  else if (proceeds > 0 && totalBoot < proceeds * 0.05) bootStatus = "minor_boot";

  return {
    estimated_cash_boot: cashBoot,
    estimated_mortgage_boot: mortgageBoot,
    estimated_total_boot: totalBoot,
    estimated_boot_tax: round(bootTax),
    boot_status: bootStatus,
  };
}

/**
 * Inline matching wrapper that swallows all errors. Use from create/update
 * paths so a matching failure never breaks the underlying save.
 */
export async function runMatchingSafe(
  db: any,
  userId: string,
  exchangeId: string,
  propertyId: string,
  reason: string,
): Promise<{ ok: boolean; new_matches?: number; error?: string }> {
  try {
    const matches = await computeMatchesForExchange(db, userId, exchangeId, propertyId);
    const newCount = await persistMatchesAndNotifications(db, matches, userId);
    console.log(`[matching:${reason}] exchange=${exchangeId} new=${newCount}`);
    return { ok: true, new_matches: newCount };
  } catch (err) {
    console.error(`[matching:${reason}] FAILED exchange=${exchangeId}`, err);
    return { ok: false, error: (err as Error).message };
  }
}

import { MATCH_THRESHOLD, MATCH_WEIGHTS } from "./match-config.ts";

export interface ScoredMatch {
  buyer_exchange_id: string;
  seller_property_id: string;
  total: number;
  price: number;
  geo: number;
  asset: number;
  strategy: number;
  financial: number;
  estimated_cash_boot: number | null;
  estimated_mortgage_boot: number | null;
  estimated_total_boot: number | null;
  estimated_boot_tax: number | null;
  boot_status: string;
  direction: "buyer" | "seller";
  other_agent_id: string;
}

export async function computeMatchesForExchange(
  db: any,
  userId: string,
  exchangeId: string,
  propertyId: string,
): Promise<ScoredMatch[]> {
  const [exchangeRes, propertyRes] = await Promise.all([
    db.from("exchanges").select("*").eq("id", exchangeId).single(),
    db.from("pledged_properties").select("*").eq("id", propertyId).single(),
  ]);
  if (exchangeRes.error || !exchangeRes.data) throw new Error("Exchange not found");
  if (propertyRes.error || !propertyRes.data) throw new Error("Property not found");

  const exchange = exchangeRes.data;
  const property = propertyRes.data;

  const [criteriaRes, propertyFinRes] = await Promise.all([
    exchange.criteria_id
      ? db.from("replacement_criteria").select("*").eq("id", exchange.criteria_id).single()
      : Promise.resolve({ data: null }),
    db.from("property_financials").select("*").eq("property_id", propertyId).maybeSingle(),
  ]);

  const criteria = criteriaRes.data;
  const propertyFin = propertyFinRes.data;
  const allMatches: ScoredMatch[] = [];

  // Buyer side: properties for this exchange
  if (criteria) {
    const { data: activeProperties } = await db
      .from("pledged_properties")
      .select("*")
      .eq("status", "active")
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
        const scores = scoreProperty(candidateProperty, candidateFinancials, criteria, exchange);
        if (scores.total < MATCH_THRESHOLD) continue;
        const boot = calculateBoot(exchange, propertyFin, candidateProperty, candidateFinancials);
        allMatches.push({
          buyer_exchange_id: exchangeId,
          seller_property_id: candidateProperty.id,
          ...scores,
          ...boot,
          direction: "buyer",
          other_agent_id: candidateProperty.agent_id,
        } as ScoredMatch);
      }
    }
  }

  // Seller side: exchanges that want this property
  const { data: otherExchanges } = await db
    .from("exchanges")
    .select("*, replacement_criteria(*)")
    .in("status", ["active", "in_identification", "in_closing"])
    .neq("agent_id", userId);

  if (otherExchanges?.length) {
    const relinquishedPropertyIds = otherExchanges.map((row: any) => row.relinquished_property_id).filter(Boolean);
    const { data: otherFinancials } = relinquishedPropertyIds.length
      ? await db.from("property_financials").select("*").in("property_id", relinquishedPropertyIds)
      : { data: [] };
    const otherFinancialMap = new Map((otherFinancials || []).map((f: any) => [f.property_id, f]));

    for (const otherExchange of otherExchanges) {
      const otherCriteria = Array.isArray(otherExchange.replacement_criteria)
        ? otherExchange.replacement_criteria[0]
        : otherExchange.replacement_criteria;
      if (!otherCriteria) continue;

      const scores = scoreProperty(property, propertyFin, otherCriteria, otherExchange);
      if (scores.total < MATCH_THRESHOLD) continue;
      const buyerRelinquishedFinancials = otherExchange.relinquished_property_id
        ? otherFinancialMap.get(otherExchange.relinquished_property_id)
        : null;
      const boot = calculateBoot(otherExchange, buyerRelinquishedFinancials, property, propertyFin);
      allMatches.push({
        buyer_exchange_id: otherExchange.id,
        seller_property_id: propertyId,
        ...scores,
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

function scoreProperty(prop: any, fin: any, criteria: any, exchange: any): Record<string, number> {
  const price = scorePrice(prop, fin, criteria, exchange);
  const geo = scoreGeo(prop, criteria);
  const asset = scoreAsset(prop, criteria);
  const strategy = scoreStrategy(prop, criteria);
  const financial = scoreFinancial(prop, fin, criteria);

  const total =
    price * MATCH_WEIGHTS.price +
    geo * MATCH_WEIGHTS.geo +
    asset * MATCH_WEIGHTS.asset +
    strategy * MATCH_WEIGHTS.strategy +
    financial * MATCH_WEIGHTS.financial;

  return {
    total: round(total),
    price: round(price),
    geo: round(geo),
    asset: round(asset),
    strategy: round(strategy),
    financial: round(financial),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Commercial loans cap out around 75% LTV, so the buyer's equity (exchange_proceeds)
// can stretch to roughly 4x its value as a purchase price without cash out of pocket.
const MAX_COMMERCIAL_LTV = 0.75;
const EQUITY_TO_MAX_PRICE_MULTIPLIER = 1 / (1 - MAX_COMMERCIAL_LTV);

function scorePrice(_prop: any, fin: any, criteria: any, exchange: any): number {
  const askingPrice = Number(fin?.asking_price || 0);
  if (!askingPrice) return 50;

  const proceeds = Number(exchange?.exchange_proceeds || 0);
  const maxBudget = proceeds > 0 ? proceeds * EQUITY_TO_MAX_PRICE_MULTIPLIER : 0;

  // Hard affordability ceiling: if the buyer can't cover this with a 75% LTV loan, reject.
  if (maxBudget > 0 && askingPrice > maxBudget) return 0;

  const userMin = Number(criteria?.target_price_min || 0);
  const userMax = Number(criteria?.target_price_max || 0);

  if (userMin || userMax) {
    // Clamp the user's max to the affordability ceiling.
    const effectiveMax = maxBudget > 0
      ? Math.min(userMax || maxBudget, maxBudget)
      : (userMax || userMin * 3);
    const effectiveMin = userMin || 0;
    if (askingPrice >= effectiveMin && askingPrice <= effectiveMax) return 100;
    const mid = (effectiveMin + effectiveMax) / 2 || effectiveMin || effectiveMax;
    const deviation = Math.abs(askingPrice - mid) / (mid || 1);
    return Math.max(0, 100 - deviation * 100);
  }

  // No user-specified range: prefer bigger properties that fully deploy the buyer's equity.
  if (maxBudget > 0) {
    return Math.min(100, Math.max(0, (askingPrice / maxBudget) * 100));
  }

  // Fallback when we have no equity signal yet: neutral.
  return 50;
}

function scoreGeo(prop: any, criteria: any): number {
  const hasStates = criteria.target_states?.length > 0;
  const hasMetros = criteria.target_metros?.length > 0;
  if (!hasStates && !hasMetros) return 50;

  let score = 0;
  if (hasStates && prop.state && criteria.target_states.includes(prop.state)) score += 70;
  if (hasMetros && prop.city) {
    const cityLower = prop.city.toLowerCase();
    if (criteria.target_metros.some((metro: string) => cityLower.includes(metro.toLowerCase()) || metro.toLowerCase().includes(cityLower))) {
      score += 30;
    }
  }
  return Math.min(100, score);
}

function scoreAsset(prop: any, criteria: any): number {
  if (!criteria.target_asset_types?.length || !prop.asset_type) return 50;
  return criteria.target_asset_types.includes(prop.asset_type) ? 100 : 0;
}

function scoreStrategy(prop: any, criteria: any): number {
  if (!criteria.target_strategies?.length || !prop.strategy_type) return 50;
  return criteria.target_strategies.includes(prop.strategy_type) ? 100 : 20;
}

// "Property quality" score. Rewards higher cap rate, higher occupancy, and newer
// construction so that when a buyer leaves criteria blank we surface better-performing
// properties. Also honours the one buyer preference we still collect (min year built).
function scoreFinancial(prop: any, fin: any, criteria: any): number {
  let score = 0;
  let weight = 0;

  // Cap rate: 0 points at <= 3%, full 40 at >= 8%. Linear in between.
  const capRate = fin?.cap_rate != null ? Number(fin.cap_rate) : null;
  if (capRate != null && !Number.isNaN(capRate)) {
    const normalized = clamp01((capRate - 3) / (8 - 3));
    score += normalized * 40;
    weight += 40;
  }

  // Occupancy: 0 points at <= 70%, full 40 at >= 95%.
  const occupancy = fin?.occupancy_rate != null ? Number(fin.occupancy_rate) : null;
  if (occupancy != null && !Number.isNaN(occupancy)) {
    const normalized = clamp01((occupancy - 70) / (95 - 70));
    score += normalized * 40;
    weight += 40;
  }

  // Year built: 0 points at >= 60yrs old, full 20 within last 10 years.
  const yearBuilt = prop?.year_built ? Number(prop.year_built) : null;
  if (yearBuilt && !Number.isNaN(yearBuilt)) {
    const currentYear = new Date().getUTCFullYear();
    const age = currentYear - yearBuilt;
    const normalized = clamp01((60 - age) / (60 - 10));
    score += normalized * 20;
    weight += 20;
  }

  // If we have no quality signal on the candidate, return neutral.
  if (weight === 0) return 50;

  const qualityScore = (score / weight) * 100;

  // Honour the buyer's year-built minimum if set: properties below it get a penalty.
  const minYear = Number(criteria?.target_year_built_min || 0);
  if (minYear && yearBuilt && yearBuilt < minYear) {
    return Math.max(0, qualityScore - 40);
  }

  return Math.min(100, qualityScore);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function calculateBoot(buyerExchange: any, buyerFin: any, _sellerProp: any, sellerFin: any): Record<string, any> {
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

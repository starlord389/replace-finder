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
  timing: number;
  debtFit: number;
  scaleFit: number;
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
        });
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
      });
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
      timing_score: m.timing,
      debt_fit_score: m.debtFit,
      scale_fit_score: m.scaleFit,
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
  const timing = scoreTiming(criteria);
  const debtFit = scoreDebtFit(fin, criteria);
  const scaleFit = scoreScaleFit(prop, criteria);

  const total =
    price * MATCH_WEIGHTS.price +
    geo * MATCH_WEIGHTS.geo +
    asset * MATCH_WEIGHTS.asset +
    strategy * MATCH_WEIGHTS.strategy +
    financial * MATCH_WEIGHTS.financial +
    timing * MATCH_WEIGHTS.timing +
    debtFit * MATCH_WEIGHTS.debtFit +
    scaleFit * MATCH_WEIGHTS.scaleFit;

  return {
    total: round(total),
    price: round(price),
    geo: round(geo),
    asset: round(asset),
    strategy: round(strategy),
    financial: round(financial),
    timing: round(timing),
    debtFit: round(debtFit),
    scaleFit: round(scaleFit),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function scorePrice(prop: any, fin: any, criteria: any, exchange: any): number {
  const askingPrice = Number(fin?.asking_price || 0);
  if (!askingPrice) return 50;

  const min = Number(criteria.target_price_min || 0);
  const max = Number(criteria.target_price_max || 0);
  if (min || max) {
    const effectiveMax = max || min * 3;
    const effectiveMin = min || 0;
    if (askingPrice >= effectiveMin && askingPrice <= effectiveMax) return 100;
    const mid = (effectiveMin + effectiveMax) / 2 || effectiveMin || effectiveMax;
    const deviation = Math.abs(askingPrice - mid) / mid;
    return Math.max(0, 100 - deviation * 100);
  }

  const proceeds = Number(exchange.exchange_proceeds || 0);
  if (!proceeds) return 50;
  const ratio = askingPrice / proceeds;
  if (ratio >= 0.8 && ratio <= 2.0) return 100;
  if (ratio < 0.8) return Math.max(0, (ratio / 0.8) * 80);
  return Math.max(0, 100 - (ratio - 2.0) * 50);
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

function scoreFinancial(prop: any, fin: any, criteria: any): number {
  const hasCapRange = criteria.target_cap_rate_min || criteria.target_cap_rate_max;
  if (!hasCapRange && !criteria.target_occupancy_min && !criteria.target_year_built_min) return 50;

  let score = 50;
  let factors = 0;

  if (hasCapRange && fin?.cap_rate) {
    factors++;
    const capRate = Number(fin.cap_rate);
    const min = Number(criteria.target_cap_rate_min || 0);
    const max = Number(criteria.target_cap_rate_max || 100);
    if (capRate >= min && capRate <= max) {
      score = 100;
    } else {
      const mid = (min + max) / 2;
      const deviation = Math.abs(capRate - mid) / (mid || 1);
      score = Math.max(0, 100 - deviation * 100);
    }
  }

  let bonus = 0;
  if (criteria.target_occupancy_min && fin?.occupancy_rate && Number(fin.occupancy_rate) >= Number(criteria.target_occupancy_min)) {
    bonus += 20;
  }
  if (criteria.target_year_built_min && prop.year_built && Number(prop.year_built) >= Number(criteria.target_year_built_min)) {
    bonus += 10;
  }

  return Math.min(100, factors > 0 ? score + bonus : 50 + bonus);
}

function scoreTiming(criteria: any): number {
  const urgencyMap: Record<string, number> = {
    immediate: 90,
    "1_3_months": 80,
    standard: 70,
    "3_6_months": 60,
    flexible: 50,
  };
  return urgencyMap[criteria.urgency] || 70;
}

function scoreDebtFit(fin: any, criteria: any): number {
  if (criteria.must_replace_debt === false) return 80;
  if (!criteria.must_replace_debt || !criteria.min_debt_replacement) return 50;
  const requirement = Number(criteria.min_debt_replacement);
  const loanBalance = Number(fin?.loan_balance || 0);
  if (!requirement) return 50;
  if (loanBalance >= requirement) return 100;
  return Math.max(0, (loanBalance / requirement) * 100);
}

function scoreScaleFit(prop: any, criteria: any): number {
  const hasUnits = criteria.target_units_min || criteria.target_units_max;
  const hasSf = criteria.target_sf_min || criteria.target_sf_max;
  if (!hasUnits && !hasSf && !criteria.target_property_classes?.length) return 50;

  let score = 50;
  let factors = 0;
  if (hasUnits && prop.units) {
    factors++;
    const units = Number(prop.units);
    const min = Number(criteria.target_units_min || 0);
    const max = Number(criteria.target_units_max || Infinity);
    if (units >= min && units <= max) {
      score = 100;
    } else {
      const mid = ((min || 0) + (max === Infinity ? min * 2 : max)) / 2;
      const deviation = Math.abs(units - mid) / (mid || 1);
      score = Math.max(0, 100 - deviation * 50);
    }
  }

  if (hasSf && prop.building_square_footage) {
    factors++;
    const sf = Number(prop.building_square_footage);
    const min = Number(criteria.target_sf_min || 0);
    const max = Number(criteria.target_sf_max || Infinity);
    if (sf >= min && sf <= max) {
      score = factors > 1 ? (score + 100) / 2 : 100;
    }
  }

  let bonus = 0;
  if (criteria.target_property_classes?.length && prop.property_class && criteria.target_property_classes.includes(prop.property_class)) {
    bonus += 20;
  }
  return Math.min(100, (factors > 0 ? score : 50) + bonus);
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

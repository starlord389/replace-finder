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

export interface MatchDiagnosticRow {
  direction: "buyer" | "seller";
  candidate_property_id: string;
  candidate_exchange_id: string | null;
  candidate_label: string;
  status: "matched" | "skipped";
  reason: string;
  total?: number;
  roe_improvement_pp?: number | null;
}

export async function computeMatchesForExchange(
  db: any,
  userId: string,
  exchangeId: string,
  propertyId: string,
  diagnostics?: MatchDiagnosticRow[],
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

  const propertyLabel = (p: any) =>
    p ? `${p.asset_type ? prettyLabel(p.asset_type) + " · " : ""}${[p.city, p.state].filter(Boolean).join(", ") || p.property_name || p.id}` : "Property";

  // Buyer side: this exchange × other people's active properties
  if (!criteria && diagnostics) {
    diagnostics.push({
      direction: "buyer",
      candidate_property_id: propertyId,
      candidate_exchange_id: exchangeId,
      candidate_label: "buyer-side scan",
      status: "skipped",
      reason: "no replacement criteria on this exchange",
    });
  }
  if (criteria) {
    const { data: activeProperties } = await db
      .from("pledged_properties")
      .select("*")
      .eq("status", "active")
      .eq("is_demo", isDemo)
      .neq("agent_id", userId);

    if (!activeProperties?.length && diagnostics) {
      diagnostics.push({
        direction: "buyer",
        candidate_property_id: propertyId,
        candidate_exchange_id: exchangeId,
        candidate_label: "buyer-side scan",
        status: "skipped",
        reason: "no active properties from other agents in this workspace",
      });
    }
    if (activeProperties?.length) {
      const propIds = activeProperties.map((p: any) => p.id);
      const { data: allFinancials } = await db
        .from("property_financials")
        .select("*")
        .in("property_id", propIds);
      const financialMap = new Map((allFinancials || []).map((f: any) => [f.property_id, f]));

      for (const candidateProperty of activeProperties) {
        const candidateFinancials = financialMap.get(candidateProperty.id);
        const result = scorePairExplained(exchange, relinquishedFin, candidateProperty, candidateFinancials, criteria, settings);
        if (!result.ok) {
          diagnostics?.push({
            direction: "buyer",
            candidate_property_id: candidateProperty.id,
            candidate_exchange_id: exchangeId,
            candidate_label: propertyLabel(candidateProperty),
            status: "skipped",
            reason: result.reason,
            roe_improvement_pp: result.roe_improvement_pp ?? null,
          });
          continue;
        }
        const scored = result.score;
        const boot = calculateBoot(exchange, propertyFin, candidateProperty, candidateFinancials);
        allMatches.push({
          buyer_exchange_id: exchangeId,
          seller_property_id: candidateProperty.id,
          ...scored,
          ...boot,
          direction: "buyer",
          other_agent_id: candidateProperty.agent_id,
        } as ScoredMatch);
        diagnostics?.push({
          direction: "buyer",
          candidate_property_id: candidateProperty.id,
          candidate_exchange_id: exchangeId,
          candidate_label: propertyLabel(candidateProperty),
          status: "matched",
          reason: "eligible",
          total: scored.total,
          roe_improvement_pp: scored.roe_improvement_pp,
        });
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

  if (!otherExchanges?.length && diagnostics) {
    diagnostics.push({
      direction: "seller",
      candidate_property_id: propertyId,
      candidate_exchange_id: null,
      candidate_label: "seller-side scan",
      status: "skipped",
      reason: "no other agents have active buyer exchanges in this workspace",
    });
  }
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
      if (!otherCriteria) {
        diagnostics?.push({
          direction: "seller",
          candidate_property_id: propertyId,
          candidate_exchange_id: otherExchange.id,
          candidate_label: `exchange ${otherExchange.id.slice(0, 8)}`,
          status: "skipped",
          reason: "counterparty exchange has no replacement criteria",
        });
        continue;
      }

      const buyerRelinquishedFinancials = otherExchange.relinquished_property_id
        ? otherFinancialMap.get(otherExchange.relinquished_property_id)
        : null;

      const result = scorePairExplained(otherExchange, buyerRelinquishedFinancials, property, propertyFin, otherCriteria, settings);
      if (!result.ok) {
        diagnostics?.push({
          direction: "seller",
          candidate_property_id: propertyId,
          candidate_exchange_id: otherExchange.id,
          candidate_label: `exchange ${otherExchange.id.slice(0, 8)}`,
          status: "skipped",
          reason: result.reason,
          roe_improvement_pp: result.roe_improvement_pp ?? null,
        });
        continue;
      }
      const scored = result.score;

      const boot = calculateBoot(otherExchange, buyerRelinquishedFinancials, property, propertyFin);
      allMatches.push({
        buyer_exchange_id: otherExchange.id,
        seller_property_id: propertyId,
        ...scored,
        ...boot,
        direction: "seller",
        other_agent_id: otherExchange.agent_id,
      } as ScoredMatch);
      diagnostics?.push({
        direction: "seller",
        candidate_property_id: propertyId,
        candidate_exchange_id: otherExchange.id,
        candidate_label: `exchange ${otherExchange.id.slice(0, 8)}`,
        status: "matched",
        reason: "eligible",
        total: scored.total,
        roe_improvement_pp: scored.roe_improvement_pp,
      });
    }
  }

  return allMatches;
}

function prettyLabel(s: string): string {
  return s.replace(/_/g, " ");
}


export async function persistMatchesAndNotifications(
  db: any,
  matches: ScoredMatch[],
  userId: string,
  isDemo = false,
) {
  if (matches.length === 0) return 0;

  // Which (buyer_exchange_id, seller_property_id) pairs already exist? Only the
  // genuinely new ones should fire a "New Match" notification — otherwise every
  // re-run / criteria edit re-notifies for matches the agent has already seen.
  const buyerExIds = [...new Set(matches.map((m) => m.buyer_exchange_id))];
  const sellerPropIds = [...new Set(matches.map((m) => m.seller_property_id))];
  const { data: existing } = await db
    .from("matches")
    .select("buyer_exchange_id, seller_property_id")
    .in("buyer_exchange_id", buyerExIds)
    .in("seller_property_id", sellerPropIds);
  const existingSet = new Set(
    (existing ?? []).map((r: any) => `${r.buyer_exchange_id}:${r.seller_property_id}`),
  );

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

  const { error } = await db
    .from("matches")
    .upsert(rows, { onConflict: "buyer_exchange_id,seller_property_id" });
  if (error) throw error;

  // Notify only for genuinely new matches, tagged with the workspace so demo
  // matching stays out of the live feed and is cleaned up on demo reset.
  const newMatches = matches.filter(
    (m) => !existingSet.has(`${m.buyer_exchange_id}:${m.seller_property_id}`),
  );
  if (newMatches.length) {
    // Pull inserted match ids so email deep-links can target a specific match row.
    const { data: insertedMatchRows } = await db
      .from("matches")
      .select("id, buyer_exchange_id, seller_property_id")
      .in("buyer_exchange_id", buyerExIds)
      .in("seller_property_id", sellerPropIds);
    const matchIdByPair = new Map(
      (insertedMatchRows ?? []).map((r: any) => [
        `${r.buyer_exchange_id}:${r.seller_property_id}`,
        r.id,
      ]),
    );

    const notifications = newMatches.map((match) => {
      const matchId = matchIdByPair.get(
        `${match.buyer_exchange_id}:${match.seller_property_id}`,
      );
      const linkTo = matchId
        ? `/agent/matches?listing=${match.buyer_exchange_id}&match=${matchId}`
        : "/agent/matches";
      return {
        user_id: match.direction === "buyer" ? userId : match.other_agent_id,
        type: "new_match",
        title: "New Match Found",
        message: "A new property/exchange match is available for review.",
        link_to: linkTo,
        metadata: { demo: isDemo, match_id: matchId ?? null },
      };
    });
    await db.from("notifications").insert(notifications);

    // Fire new-match emails (skip demo runs so sandbox activity never hits real inboxes).
    if (!isDemo) {
      await sendNewMatchEmails(db, newMatches, matchIdByPair);
    }
  }

  return newMatches.length;
}

async function sendNewMatchEmails(
  db: any,
  newMatches: ScoredMatch[],
  matchIdByPair: Map<string, string>,
) {
  try {
    const APP_URL =
      Deno.env.get("APP_PUBLIC_URL") ??
      Deno.env.get("SITE_URL") ??
      "https://1031exchangeup.com";

    // Collect the ids we need to hydrate labels + recipient info.
    const recipientIds = Array.from(
      new Set(
        newMatches.map((m) =>
          m.direction === "buyer" ? "__SELF__" : m.other_agent_id,
        ).filter((id) => id && id !== "__SELF__"),
      ),
    );
    // The buyer-direction recipient is the caller (userId is not in this scope);
    // callers pass it via matches[].direction === "buyer" → we resolve at map time.
    const buyerExchangeIds = Array.from(
      new Set(newMatches.map((m) => m.buyer_exchange_id)),
    );
    const sellerPropertyIds = Array.from(
      new Set(newMatches.map((m) => m.seller_property_id)),
    );
    const allUserIds = Array.from(
      new Set(newMatches.map((m) => m.other_agent_id).concat(recipientIds)),
    ).filter(Boolean);

    // Also need to know the caller (buyer-side recipient). We infer from
    // exchanges.agent_id for the buyer_exchange_id.
    const [profilesRes, exchangesRes, propertiesRes, clientsRes] = await Promise.all([
      allUserIds.length
        ? db.from("profiles").select("id, email, first_name").in("id", allUserIds)
        : Promise.resolve({ data: [] }),
      db.from("exchanges").select("id, agent_id, client_id").in("id", buyerExchangeIds),
      db.from("pledged_properties").select("id, agent_id, city, state, asset_type").in("id", sellerPropertyIds),
      Promise.resolve({ data: [] }),
    ]);

    // Now we know all agent_ids referenced (buyer-side + seller-side); fetch any missing profiles.
    const allReferenced = new Set<string>();
    (exchangesRes.data ?? []).forEach((e: any) => e.agent_id && allReferenced.add(e.agent_id));
    (propertiesRes.data ?? []).forEach((p: any) => p.agent_id && allReferenced.add(p.agent_id));
    const missing = [...allReferenced].filter(
      (id) => !(profilesRes.data ?? []).some((p: any) => p.id === id),
    );
    let profiles = profilesRes.data ?? [];
    if (missing.length) {
      const { data: extra } = await db
        .from("profiles")
        .select("id, email, first_name")
        .in("id", missing);
      profiles = profiles.concat(extra ?? []);
    }

    // Optional: pull client names for buyer-side listings.
    const clientIds = Array.from(
      new Set((exchangesRes.data ?? []).map((e: any) => e.client_id).filter(Boolean)),
    );
    let clients: any[] = [];
    if (clientIds.length) {
      const { data: cs } = await db
        .from("agent_clients")
        .select("id, client_name")
        .in("id", clientIds);
      clients = cs ?? [];
    }

    const profileById = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
    const exchangeById = new Map<string, any>((exchangesRes.data ?? []).map((e: any) => [e.id, e]));
    const propertyById = new Map<string, any>((propertiesRes.data ?? []).map((p: any) => [p.id, p]));
    const clientById = new Map<string, any>(clients.map((c: any) => [c.id, c]));

    const labelForProperty = (p: any) =>
      p ? `${p.asset_type ? p.asset_type + " · " : ""}${[p.city, p.state].filter(Boolean).join(", ") || "Property"}` : "Property";

    const sends = newMatches.map((m) => {
      const buyerExchange = exchangeById.get(m.buyer_exchange_id);
      const sellerProperty = propertyById.get(m.seller_property_id);
      const buyerAgentId = buyerExchange?.agent_id;
      const sellerAgentId = sellerProperty?.agent_id;
      const recipientId = m.direction === "buyer" ? buyerAgentId : sellerAgentId;
      const recipient = recipientId ? profileById.get(recipientId) : null;
      if (!recipient?.email) return Promise.resolve();

      const matchId = matchIdByPair.get(`${m.buyer_exchange_id}:${m.seller_property_id}`);
      const matchUrl = matchId
        ? `${APP_URL}/agent/matches?listing=${m.buyer_exchange_id}&match=${matchId}`
        : `${APP_URL}/agent/matches?listing=${m.buyer_exchange_id}`;

      const client = buyerExchange?.client_id ? clientById.get(buyerExchange.client_id) : null;
      const yourListingLabel = m.direction === "buyer"
        ? (client?.client_name ? `${client.client_name} — buyer exchange` : "Your buyer exchange")
        : labelForProperty(sellerProperty);
      const matchedPropertyLabel = m.direction === "buyer"
        ? labelForProperty(sellerProperty)
        : (client?.client_name ? `${client.client_name} — buyer exchange` : "Buyer exchange");

      return db.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-match-notification",
          recipientEmail: recipient.email,
          idempotencyKey: matchId ? `new-match-${matchId}-${recipientId}` : undefined,
          templateData: {
            firstName: recipient.first_name || undefined,
            yourListingLabel,
            matchedPropertyLabel,
            matchScore: m.total,
            matchUrl,
            matchesUrl: `${APP_URL}/agent/matches`,
          },
        },
      }).catch((err: any) => {
        console.error("[matching] new-match email send failed", err);
      });
    });

    await Promise.allSettled(sends);
  } catch (err) {
    console.error("[matching] sendNewMatchEmails failed", err);
  }
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

type ScoreResult =
  | { ok: true; score: RoePairScore }
  | { ok: false; reason: string; roe_improvement_pp?: number | null };

function scorePair(
  buyerExchange: any,
  relinquishedFin: any,
  candidateProp: any,
  candidateFin: any,
  criteria: any,
  settings: MatchSettings,
): RoePairScore | null {
  const r = scorePairExplained(buyerExchange, relinquishedFin, candidateProp, candidateFin, criteria, settings);
  return r.ok ? r.score : null;
}

export function scorePairExplained(
  buyerExchange: any,
  relinquishedFin: any,
  candidateProp: any,
  candidateFin: any,
  criteria: any,
  settings: MatchSettings,
): ScoreResult {
  const rNoi = numOrNull(relinquishedFin?.noi);
  const rPrice = numOrNull(relinquishedFin?.asking_price);
  const rLoan = numOrNull(relinquishedFin?.loan_balance);
  if (rNoi == null || rPrice == null || rLoan == null) {
    return { ok: false, reason: "buyer relinquished property missing NOI, asking price, or loan balance" };
  }
  const buyerEquity = rPrice - rLoan;
  if (buyerEquity <= 0) return { ok: false, reason: `buyer has no positive equity (equity = ${Math.round(buyerEquity).toLocaleString()})` };
  const buyerDebtService = relinquishedAnnualDebtService(relinquishedFin, settings);
  const buyerCurrentROE = (rNoi - buyerDebtService) / buyerEquity;

  const cNoi = numOrNull(candidateFin?.noi);
  const cPrice = numOrNull(candidateFin?.asking_price);
  if (cNoi == null || cPrice == null || cPrice <= 0) {
    return { ok: false, reason: "candidate property missing NOI or asking price" };
  }

  const maxAffordable = buyerEquity / (1 - MAX_COMMERCIAL_LTV);
  if (cPrice > maxAffordable) {
    return {
      ok: false,
      reason: `candidate price $${Math.round(cPrice).toLocaleString()} exceeds affordability ceiling $${Math.round(maxAffordable).toLocaleString()} (buyer equity × ${1 / (1 - MAX_COMMERCIAL_LTV)}× at ${MAX_COMMERCIAL_LTV * 100}% LTV)`,
    };
  }

  const loanAmount = MAX_COMMERCIAL_LTV * cPrice;
  const annualPmt = amortizedAnnualPayment(loanAmount, settings.mortgage_interest_rate, settings.mortgage_amortization_years);

  const candidateROE = (cNoi - annualPmt) / buyerEquity;
  const improvementPP = (candidateROE - buyerCurrentROE) * 100;
  const improvementRel = buyerCurrentROE > 0 ? candidateROE / buyerCurrentROE - 1 : null;

  if (improvementPP <= ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP) {
    return {
      ok: false,
      reason: `no ROE upgrade: current ${(buyerCurrentROE * 100).toFixed(2)}% → candidate ${(candidateROE * 100).toFixed(2)}% (Δ ${improvementPP.toFixed(2)}pp, need > ${ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP}pp)`,
      roe_improvement_pp: round(improvementPP),
    };
  }

  const roeScore = clamp01(improvementPP / ROE_IMPROVEMENT_FULL_SCORE_PP) * 100;
  const geoScore = scoreGeo(candidateProp, criteria);
  const assetScore = scoreAsset(candidateProp, criteria);
  const strategyScore = scoreStrategy(candidateProp, criteria);
  const fitScore = blendFit(geoScore, assetScore, strategyScore, criteria);

  const base = roeScore * MATCH_WEIGHTS.roe + fitScore * MATCH_WEIGHTS.fit;
  const qualityScore = scoreQuality(candidateProp, candidateFin);
  const qualityAdj = ((qualityScore - 50) / 50) * QUALITY_TIEBREAKER_MAX_POINTS;

  const total = Math.max(0, Math.min(100, base + qualityAdj));

  return {
    ok: true,
    score: {
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
    },
  };
}


export function blendFit(geo: number, asset: number, strategy: number, criteria: any): number {
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

export function calculateBoot(
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
  isDemo: boolean,
  reason: string,
): Promise<{ ok: boolean; new_matches?: number; error?: string }> {
  try {
    const matches = await computeMatchesForExchange(db, userId, exchangeId, propertyId);
    const newCount = await persistMatchesAndNotifications(db, matches, userId, isDemo);
    console.log(`[matching:${reason}] exchange=${exchangeId} new=${newCount}`);
    return { ok: true, new_matches: newCount };
  } catch (err) {
    console.error(`[matching:${reason}] FAILED exchange=${exchangeId}`, err);
    return { ok: false, error: (err as Error).message };
  }
}

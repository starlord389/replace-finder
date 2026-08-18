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
  estimated_purchasing_capacity: number | null;
  estimated_replacement_loan: number | null;
  estimated_ltv: number | null;
  relinquished_value: number | null;
  replacement_value: number | null;
  value_increase: number | null;
  exchange_up_percentage: number | null;
  match_classification: string;
  eligibility_reasons: string[];
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
  // Deprecated / no-op. Agents may match different clients inside one book of
  // business; self-managed investors are always protected from self-matching.
  // Kept only so older callers passing the flag keep compiling.
  _deprecatedIncludeSameAgent = true,
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

  if (exchange.relinquished_property_id !== propertyId) {
    throw new Error("Property is not the relinquished property linked to this exchange");
  }

  const matchableExchangeStatuses = ["active", "in_identification", "in_closing"];
  const matchableRelinquishedStatuses = ["active", "sold"];
  if (!matchableExchangeStatuses.includes(exchange.status) || !matchableRelinquishedStatuses.includes(property.status)) {
    diagnostics?.push({
      direction: "buyer",
      candidate_property_id: propertyId,
      candidate_exchange_id: exchangeId,
      candidate_label: "matching eligibility",
      status: "skipped",
      reason: `matching is paused while exchange is ${exchange.status} and property is ${property.status}`,
    });
    return [];
  }

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
  // Criteria are intentionally optional for the current product. When blank,
  // affordability and improved return on equity are the only match gates.
  {
    // Same-agent candidates remain eligible for agents serving different
    // clients. Self-managed investors are handled as a single beneficial owner.
    const { data: activePropertiesRaw } = await db
      .from("pledged_properties")
      .select("*")
      .eq("status", "active")
      .eq("is_demo", isDemo);

    // Map each candidate listing to the client behind it so we never match a
    // client to their own property (distinct-opportunity rule).
    const candidateExchangeIds = Array.from(
      new Set((activePropertiesRaw ?? []).map((p: any) => p.exchange_id).filter(Boolean)),
    );
    const { data: candidateExchanges } = candidateExchangeIds.length
      ? await db.from("exchanges").select("id, client_id, agent_id, owner_type, status").in("id", candidateExchangeIds)
      : { data: [] };
    const candidateExchangeById = new Map<string, any>(
      (candidateExchanges ?? []).map((e: any) => [e.id, e]),
    );

    const activeProperties = (activePropertiesRaw ?? []).filter((p: any) => {
      if (p.id === propertyId) return false;                       // itself
      if (p.id === exchange.relinquished_property_id) return false; // this exchange's own relinquished asset
      if (p.exchange_id && p.exchange_id === exchangeId) return false;
      const candidateExchange = p.exchange_id ? candidateExchangeById.get(p.exchange_id) : null;
      if (candidateExchange && !matchableExchangeStatuses.includes(candidateExchange.status)) return false;
      const candidateClient = candidateExchange?.client_id ?? null;
      if (candidateClient && exchange.client_id && candidateClient === exchange.client_id) return false;
      // Agents may surface opportunities across different clients in their own
      // book. A self-managed investor, however, is the same beneficial owner on
      // every exchange in the account and must never be matched to themself.
      if (isInvestorSelfMatch(exchange, p)) return false;
      return true;
    });

    if (!activeProperties?.length && diagnostics) {
      diagnostics.push({
        direction: "buyer",
        candidate_property_id: propertyId,
        candidate_exchange_id: exchangeId,
        candidate_label: "buyer-side scan",
        status: "skipped",
        reason: "no other active properties in this workspace",
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
        const result = scorePairExplained(exchange, relinquishedFin, candidateProperty, candidateFinancials, criteria ?? {}, settings);
        if ("reason" in result) {
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

  // A sold relinquished property can still power the buyer side of an active
  // 1031 exchange, but it must never be offered as a replacement candidate to
  // somebody else.
  if (property.status !== "active") {
    diagnostics?.push({
      direction: "seller",
      candidate_property_id: propertyId,
      candidate_exchange_id: exchangeId,
      candidate_label: propertyLabel(property),
      status: "skipped",
      reason: `seller-side scan skipped because property is ${property.status}`,
    });
    return allMatches;
  }

  // Seller side: this property × every other active buyer exchange. Agents may
  // see in-network opportunities across clients; investors never self-match.
  const { data: otherExchangesRaw } = await db
    .from("exchanges")
    .select("*, replacement_criteria(*)")
    .in("status", ["active", "in_identification", "in_closing"])
    .eq("is_demo", isDemo);
  // Exclude only self-pairings: this same exchange, an exchange whose own
  // relinquished asset IS this property, or the same client on both sides.
  const otherExchanges = (otherExchangesRaw ?? []).filter((e: any) => {
    if (e.id === exchangeId) return false;
    if (e.relinquished_property_id && e.relinquished_property_id === propertyId) return false;
    if (e.client_id && exchange.client_id && e.client_id === exchange.client_id) return false;
    if (isInvestorSelfMatch(e, property)) return false;
    return true;
  });

  if (!otherExchanges?.length && diagnostics) {
    diagnostics.push({
      direction: "seller",
      candidate_property_id: propertyId,
      candidate_exchange_id: null,
      candidate_label: "seller-side scan",
      status: "skipped",
      reason: "no other active buyer exchanges in this workspace",
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
      const buyerRelinquishedFinancials = otherExchange.relinquished_property_id
        ? otherFinancialMap.get(otherExchange.relinquished_property_id)
        : null;

      const result = scorePairExplained(otherExchange, buyerRelinquishedFinancials, property, propertyFin, otherCriteria ?? {}, settings);
      if ("reason" in result) {
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

export function isInvestorSelfMatch(buyerExchange: any, candidateProperty: any): boolean {
  return buyerExchange?.owner_type === "investor" &&
    !!buyerExchange?.agent_id &&
    buyerExchange.agent_id === candidateProperty?.agent_id;
}

export function findStaleActiveMatchIds(
  existing: Array<{ id: string; buyer_exchange_id: string; seller_property_id: string; status: string }>,
  qualified: Array<{ buyer_exchange_id: string; seller_property_id: string }>,
): string[] {
  const qualifiedSet = new Set(
    qualified.map((m) => `${m.buyer_exchange_id}:${m.seller_property_id}`),
  );
  return existing
    .filter((r) => r.status === "active" && !qualifiedSet.has(`${r.buyer_exchange_id}:${r.seller_property_id}`))
    .map((r) => r.id);
}


export async function persistMatchesAndNotifications(
  db: any,
  matches: ScoredMatch[],
  userId: string,
  isDemo = false,
  scope?: { exchangeId: string; propertyId: string },
): Promise<{ new_matches: number; archived_matches: number; active_matches: number }> {
  if (!scope) {
    throw new Error("Matching persistence requires an exchange/property reconciliation scope");
  }

  // Reconcile the complete scope on every run. Previously this function only
  // upserted qualifying pairs, leaving old recommendations visible forever after
  // their financials or listing status stopped qualifying.
  const buyerExIds = [...new Set(matches.map((m) => m.buyer_exchange_id))];
  const sellerPropIds = [...new Set(matches.map((m) => m.seller_property_id))];
  const { data: existing, error: existingError } = await db
    .from("matches")
    .select("id, buyer_exchange_id, seller_property_id, status")
    .or(`buyer_exchange_id.eq.${scope.exchangeId},seller_property_id.eq.${scope.propertyId}`);
  if (existingError) throw existingError;
  const existingSet = new Set(
    (existing ?? []).map((r: any) => `${r.buyer_exchange_id}:${r.seller_property_id}`),
  );
  const staleActiveIds = findStaleActiveMatchIds(existing ?? [], matches);

  let archivedCount = 0;
  if (staleActiveIds.length) {
    // Preserve deal history once either party has started a connection or the
    // buyer has formally identified the candidate.
    const [connectedResult, identifiedResult] = await Promise.all([
      db.from("exchange_connections").select("match_id").in("match_id", staleActiveIds)
        .in("status", ["pending", "accepted", "in_progress", "completed"]),
      db.from("identification_list").select("match_id").in("match_id", staleActiveIds)
        .neq("status", "removed"),
    ]);
    if (connectedResult.error) throw connectedResult.error;
    if (identifiedResult.error) throw identifiedResult.error;
    const connected = connectedResult.data;
    const identified = identifiedResult.data;
    const protectedIds = new Set<string>([
      ...(connected ?? []).map((r: any) => r.match_id),
      ...(identified ?? []).map((r: any) => r.match_id),
    ]);
    const archiveIds = staleActiveIds.filter((id: string) => !protectedIds.has(id));
    if (archiveIds.length) {
      const { error: archiveError } = await db
        .from("matches")
        .update({ status: "archived" })
        .in("id", archiveIds);
      if (archiveError) throw archiveError;
      archivedCount = archiveIds.length;
    }
  }

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
    estimated_purchasing_capacity: m.estimated_purchasing_capacity,
    estimated_replacement_loan: m.estimated_replacement_loan,
    estimated_ltv: m.estimated_ltv,
    relinquished_value: m.relinquished_value,
    replacement_value: m.replacement_value,
    value_increase: m.value_increase,
    exchange_up_percentage: m.exchange_up_percentage,
    match_classification: m.match_classification,
    eligibility_reasons: m.eligibility_reasons,
    status: "active",
  }));

  if (rows.length) {
    const { error } = await db
      .from("matches")
      .upsert(rows, { onConflict: "buyer_exchange_id,seller_property_id" });
    if (error) throw error;
  }

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
    const matchIdByPair = new Map<string, string>(
      (insertedMatchRows ?? []).map((r: any) => [
        `${r.buyer_exchange_id}:${r.seller_property_id}`,
        r.id,
      ]),
    );

    const { data: ownerExchanges } = await db
      .from("exchanges")
      .select("id, owner_type")
      .in("id", buyerExIds);
    const { data: ownerProperties } = await db
      .from("pledged_properties")
      .select("id, exchange_id")
      .in("id", sellerPropIds);
    const sellerExchangeIds = Array.from(
      new Set((ownerProperties ?? []).map((p: any) => p.exchange_id).filter(Boolean)),
    );
    const { data: sellerExchanges } = sellerExchangeIds.length
      ? await db.from("exchanges").select("id, owner_type").in("id", sellerExchangeIds)
      : { data: [] };
    const ownerTypeByExchange = new Map<string, string>(
      [...(ownerExchanges ?? []), ...(sellerExchanges ?? [])]
        .map((e: any) => [e.id, e.owner_type ?? "agent"]),
    );
    const exchangeByProperty = new Map<string, string>(
      (ownerProperties ?? [])
        .filter((p: any) => p.exchange_id)
        .map((p: any) => [p.id, p.exchange_id]),
    );

    const notifications = newMatches.map((match) => {
      const matchId = matchIdByPair.get(
        `${match.buyer_exchange_id}:${match.seller_property_id}`,
      );
      const ownerExchangeId = match.direction === "buyer"
        ? match.buyer_exchange_id
        : exchangeByProperty.get(match.seller_property_id);
      const workspace = ownerExchangeId && ownerTypeByExchange.get(ownerExchangeId) === "investor"
        ? "investor"
        : "agent";
      const linkTo = matchId
        ? `/${workspace}/matches?listing=${match.buyer_exchange_id}&match=${matchId}`
        : `/${workspace}/matches`;
      return {
        user_id: match.direction === "buyer" ? userId : match.other_agent_id,
        type: "new_match",
        title: "New opportunity detected",
        message: "Exchange IQ found a new opportunity for one of your monitored properties. Review the fit and the numbers.",

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

  return {
    new_matches: newMatches.length,
    archived_matches: archivedCount,
    active_matches: matches.length,
  };
}

async function sendNewMatchEmails(
  db: any,
  newMatches: ScoredMatch[],
  matchIdByPair: Map<string, string>,
) {
  try {
    const denoRuntime = (globalThis as unknown as {
      Deno?: { env: { get: (name: string) => string | undefined } };
    }).Deno;
    const APP_URL =
      denoRuntime?.env.get("APP_PUBLIC_URL") ??
      denoRuntime?.env.get("SITE_URL") ??
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
    const [profilesRes, exchangesRes, propertiesRes] = await Promise.all([
      allUserIds.length
        ? db.from("profiles").select("id, email, first_name").in("id", allUserIds)
        : Promise.resolve({ data: [] }),
      db.from("exchanges").select("id, agent_id, client_id, owner_type").in("id", buyerExchangeIds),
      db.from("pledged_properties").select("id, agent_id, exchange_id, city, state, asset_type").in("id", sellerPropertyIds),
    ]);

    // Seller-side recipients may also be self-managed property owners. Hydrate
    // their exchanges so email links return them to the correct workspace.
    const sellerExchangeIds: string[] = Array.from(
      new Set<string>((propertiesRes.data ?? []).map((p: any) => p.exchange_id).filter((id: unknown): id is string => typeof id === "string")),
    );
    const missingSellerExchangeIds = sellerExchangeIds.filter((id) => !buyerExchangeIds.includes(id));
    let exchanges = exchangesRes.data ?? [];
    if (missingSellerExchangeIds.length) {
      const { data: sellerExchanges } = await db
        .from("exchanges")
        .select("id, agent_id, client_id, owner_type")
        .in("id", missingSellerExchangeIds);
      exchanges = exchanges.concat(sellerExchanges ?? []);
    }

    // Now we know all agent_ids referenced (buyer-side + seller-side); fetch any missing profiles.
    const allReferenced = new Set<string>();
    exchanges.forEach((e: any) => e.agent_id && allReferenced.add(e.agent_id));
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
      new Set(exchanges.map((e: any) => e.client_id).filter(Boolean)),
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
    const exchangeById = new Map<string, any>(exchanges.map((e: any) => [e.id, e]));
    const propertyById = new Map<string, any>((propertiesRes.data ?? []).map((p: any) => [p.id, p]));
    const clientById = new Map<string, any>(clients.map((c: any) => [c.id, c]));

    const labelForProperty = (p: any) =>
      p ? `${p.asset_type ? p.asset_type + " · " : ""}${[p.city, p.state].filter(Boolean).join(", ") || "Property"}` : "Property";

    // Respect each recipient's email notification preferences.
    const optedOutOfMatchEmails = new Set<string>();
    if (profiles.length) {
      const { data: prefRows } = await db
        .from("user_notification_preferences")
        .select("user_id, notify_new_match")
        .in("user_id", profiles.map((p: any) => p.id));
      (prefRows ?? []).forEach((row: any) => {
        if (row.notify_new_match === false) optedOutOfMatchEmails.add(row.user_id);
      });
    }

    const sends = newMatches.map((m) => {
      const buyerExchange = exchangeById.get(m.buyer_exchange_id);
      const sellerProperty = propertyById.get(m.seller_property_id);
      const sellerExchange = sellerProperty?.exchange_id ? exchangeById.get(sellerProperty.exchange_id) : null;
      const buyerAgentId = buyerExchange?.agent_id;
      const sellerAgentId = sellerProperty?.agent_id;
      const recipientId = m.direction === "buyer" ? buyerAgentId : sellerAgentId;
      const recipient = recipientId ? profileById.get(recipientId) : null;
      if (!recipient?.email) return Promise.resolve();
      if (recipientId && optedOutOfMatchEmails.has(recipientId)) return Promise.resolve();

      const matchId = matchIdByPair.get(`${m.buyer_exchange_id}:${m.seller_property_id}`);
      const recipientExchange = m.direction === "buyer" ? buyerExchange : sellerExchange;
      const recipientWorkspace = recipientExchange?.owner_type === "investor" ? "investor" : "agent";
      const recipientExchangeId = recipientExchange?.id ?? m.buyer_exchange_id;
      const matchUrl = matchId
        ? `${APP_URL}/${recipientWorkspace}/matches?listing=${recipientExchangeId}&match=${matchId}`
        : `${APP_URL}/${recipientWorkspace}/matches?listing=${recipientExchangeId}`;

      const client = buyerExchange?.client_id ? clientById.get(buyerExchange.client_id) : null;
      const yourListingLabel = m.direction === "buyer"
        ? (buyerExchange?.owner_type === "investor"
          ? "Your exchange"
          : client?.client_name ? `${client.client_name} - buyer exchange` : "Your buyer exchange")
        : labelForProperty(sellerProperty);
      const matchedPropertyLabel = m.direction === "buyer"
        ? labelForProperty(sellerProperty)
        : (buyerExchange?.owner_type === "investor"
          ? "Property owner exchange"
          : client?.client_name ? `${client.client_name} - buyer exchange` : "Buyer exchange");

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
            matchesUrl: `${APP_URL}/${recipientWorkspace}/matches`,
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
  estimated_purchasing_capacity: number | null;
  estimated_replacement_loan: number | null;
  estimated_ltv: number | null;
  relinquished_value: number | null;
  replacement_value: number | null;
  value_increase: number | null;
  exchange_up_percentage: number | null;
  match_classification: string;
  eligibility_reasons: string[];
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

  // Blank optional criteria are deliberately neutral. Additional cash is a
  // ceiling: each candidate uses only what is required by the effective LTV.
  const additionalCashAvailable = Math.max(0, numOrNull(criteria?.additional_cash_available) ?? 0);
  const requestedMaxLtv = positiveCriteriaNumber(criteria?.max_ltv);
  const effectiveMaxLtv = requestedMaxLtv == null
    ? MAX_COMMERCIAL_LTV
    : Math.min(MAX_COMMERCIAL_LTV, Math.max(0, requestedMaxLtv));
  const availableReplacementEquity = buyerEquity + additionalCashAvailable;

  const cNoi = numOrNull(candidateFin?.noi);
  const cPrice = numOrNull(candidateFin?.asking_price);
  if (cNoi == null || cPrice == null || cPrice <= 0) {
    return { ok: false, reason: "candidate property missing NOI or asking price" };
  }

  // IRC §1031 "trade up" rule: to fully defer gain, the replacement property's
  // value must be equal to or greater than the relinquished property's value.
  // Anything cheaper creates boot, so it is never a valid Exchange Up match.
  if (cPrice < rPrice) {
    return {
      ok: false,
      reason: `1031 trade-up rule: candidate price $${Math.round(cPrice).toLocaleString()} is below relinquished value $${Math.round(rPrice).toLocaleString()} - replacement must be equal or greater value`,
    };
  }


  const targetPriceMin = positiveCriteriaNumber(criteria?.target_price_min);
  if (targetPriceMin != null && cPrice < targetPriceMin) {
    return {
      ok: false,
      reason: `candidate price $${Math.round(cPrice).toLocaleString()} is below the optional minimum replacement price $${Math.round(targetPriceMin).toLocaleString()}`,
    };
  }

  const targetPriceMax = positiveCriteriaNumber(criteria?.target_price_max);
  if (targetPriceMax != null && cPrice > targetPriceMax) {
    return {
      ok: false,
      reason: `candidate price $${Math.round(cPrice).toLocaleString()} exceeds the optional maximum replacement price $${Math.round(targetPriceMax).toLocaleString()}`,
    };
  }

  if (criteria?.require_location_match === true && !matchesPreferredLocation(candidateProp, criteria)) {
    return { ok: false, reason: "candidate does not meet the required location preference" };
  }

  if (
    criteria?.require_asset_type_match === true &&
    criteria?.target_asset_types?.length > 0 &&
    !criteria.target_asset_types.includes(candidateProp?.asset_type)
  ) {
    return { ok: false, reason: "candidate does not meet the required property-type preference" };
  }

  const maxAffordable = availableReplacementEquity / (1 - effectiveMaxLtv);
  if (cPrice > maxAffordable) {
    return {
      ok: false,
      reason: `candidate price $${Math.round(cPrice).toLocaleString()} exceeds affordability ceiling $${Math.round(maxAffordable).toLocaleString()} at ${(effectiveMaxLtv * 100).toFixed(0)}% maximum LTV`,
    };
  }

  const minimumEquityAtLtv = cPrice * (1 - effectiveMaxLtv);
  const additionalCashUsed = Math.min(
    additionalCashAvailable,
    Math.max(0, minimumEquityAtLtv - buyerEquity),
  );
  const replacementEquityInvested = buyerEquity + additionalCashUsed;
  const loanAmount = Math.max(0, cPrice - replacementEquityInvested);
  const candidateLtv = loanAmount / cPrice;
  if (candidateLtv > effectiveMaxLtv + 1e-9) {
    return {
      ok: false,
      reason: `modeled loan-to-value ${(candidateLtv * 100).toFixed(2)}% exceeds the ${(effectiveMaxLtv * 100).toFixed(0)}% maximum`,
    };
  }
  const annualPmt = amortizedAnnualPayment(loanAmount, settings.mortgage_interest_rate, settings.mortgage_amortization_years);

  const projectedAnnualCashFlow = cNoi - annualPmt;
  const candidateROE = projectedAnnualCashFlow / replacementEquityInvested;
  const improvementPP = (candidateROE - buyerCurrentROE) * 100;
  const improvementRel = buyerCurrentROE > 0 ? candidateROE / buyerCurrentROE - 1 : null;

  if (improvementPP <= ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP) {
    return {
      ok: false,
      reason: `no ROE upgrade: current ${(buyerCurrentROE * 100).toFixed(2)}% → candidate ${(candidateROE * 100).toFixed(2)}% (Δ ${improvementPP.toFixed(2)}pp, need > ${ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP}pp)`,
      roe_improvement_pp: round(improvementPP),
    };
  }

  const minProjectedRoe = positiveCriteriaNumber(criteria?.min_projected_roe);
  if (minProjectedRoe != null && candidateROE * 100 < minProjectedRoe) {
    return {
      ok: false,
      reason: `projected ROE ${(candidateROE * 100).toFixed(2)}% is below the optional ${minProjectedRoe.toFixed(2)}% minimum`,
      roe_improvement_pp: round(improvementPP),
    };
  }

  const minMonthlyCashFlow = positiveCriteriaNumber(criteria?.preferred_monthly_cash_flow);
  const projectedMonthlyCashFlow = projectedAnnualCashFlow / 12;
  if (minMonthlyCashFlow != null && projectedMonthlyCashFlow < minMonthlyCashFlow) {
    return {
      ok: false,
      reason: `projected monthly cash flow $${Math.round(projectedMonthlyCashFlow).toLocaleString()} is below the optional $${Math.round(minMonthlyCashFlow).toLocaleString()} minimum`,
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
      estimated_purchasing_capacity: Math.round(maxAffordable),
      estimated_replacement_loan: Math.round(loanAmount),
      estimated_ltv: round4(candidateLtv),
      relinquished_value: Math.round(rPrice),
      replacement_value: Math.round(cPrice),
      value_increase: Math.round(cPrice - rPrice),
      exchange_up_percentage: round(((cPrice - rPrice) / rPrice) * 100),
      match_classification: "exchange_up",
      eligibility_reasons: [
        `Replacement value is equal to or above the relinquished value`,
        `Modeled LTV ${(candidateLtv * 100).toFixed(2)}% is within the ${(effectiveMaxLtv * 100).toFixed(0)}% limit`,
        `Projected ROE improves by ${improvementPP.toFixed(2)} percentage points`,
        ...(additionalCashUsed > 0
          ? [`Uses approximately $${Math.round(additionalCashUsed).toLocaleString()} of the available additional cash`]
          : []),
        ...(criteria?.require_location_match === true ? ["Meets the required location preference"] : []),
        ...(criteria?.require_asset_type_match === true ? ["Meets the required property-type preference"] : []),
      ],
    },
  };
}

function positiveCriteriaNumber(value: unknown): number | null {
  const parsed = numOrNull(value);
  if (parsed == null || parsed <= 0) return null;
  return parsed;
}

function matchesPreferredLocation(prop: any, criteria: any): boolean {
  const states = Array.isArray(criteria?.target_states) ? criteria.target_states : [];
  const metros = Array.isArray(criteria?.target_metros) ? criteria.target_metros : [];
  if (!states.length && !metros.length) return true;

  const stateMatches = Boolean(prop?.state && states.includes(prop.state));
  const city = typeof prop?.city === "string" ? prop.city.toLowerCase() : "";
  const metroMatches = Boolean(
    city && metros.some((metro: unknown) => {
      const normalized = typeof metro === "string" ? metro.trim().toLowerCase() : "";
      return normalized && (city.includes(normalized) || normalized.includes(city));
    }),
  );
  return stateMatches || metroMatches;
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

  const stateMatches = Boolean(hasStates && prop.state && criteria.target_states.includes(prop.state));
  let metroMatches = false;
  if (hasMetros && prop.city) {
    const cityLower = prop.city.toLowerCase();
    metroMatches = criteria.target_metros.some(
      (metro: string) =>
        cityLower.includes(metro.toLowerCase()) || metro.toLowerCase().includes(cityLower),
    );
  }

  // A match gets full credit when the user expressed only one geographic
  // dimension. When both are present, preserve the 70/30 state/metro blend.
  if (hasStates && !hasMetros) return stateMatches ? 100 : 0;
  if (hasMetros && !hasStates) return metroMatches ? 100 : 0;
  return (stateMatches ? 70 : 0) + (metroMatches ? 30 : 0);
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
  _buyerExchange: any,
  buyerFin: any,
  _sellerProp: any,
  sellerFin: any,
): Record<string, any> {
  const relinquishedValue = numOrNull(buyerFin?.asking_price);
  const askingPrice = numOrNull(sellerFin?.asking_price);
  const buyerLoanBalance = numOrNull(buyerFin?.loan_balance);
  if (relinquishedValue == null || askingPrice == null || buyerLoanBalance == null) {
    return {
      estimated_cash_boot: null,
      estimated_mortgage_boot: null,
      estimated_total_boot: null,
      estimated_boot_tax: null,
      boot_status: "insufficient_data",
    };
  }

  const buyerEquity = relinquishedValue - buyerLoanBalance;
  if (buyerEquity <= 0) {
    return {
      estimated_cash_boot: null,
      estimated_mortgage_boot: null,
      estimated_total_boot: null,
      estimated_boot_tax: null,
      boot_status: "insufficient_data",
    };
  }

  // Boot depends on the buyer's modeled replacement financing-not the seller's
  // existing mortgage, which is irrelevant unless a specific loan assumption is
  // actually structured. This mirrors the score model: all equity is reinvested
  // and only the remaining purchase price is financed.
  const replacementLoan = Math.max(0, askingPrice - buyerEquity);
  const cashBoot = Math.max(0, buyerEquity - askingPrice);
  const mortgageBoot = Math.max(0, buyerLoanBalance - replacementLoan);
  const totalBoot = Math.max(0, cashBoot + mortgageBoot);

  let bootStatus = "significant_boot";
  if (totalBoot === 0) bootStatus = "no_boot";
  else if (buyerEquity > 0 && totalBoot < buyerEquity * 0.05) bootStatus = "minor_boot";

  return {
    estimated_cash_boot: cashBoot,
    estimated_mortgage_boot: mortgageBoot,
    estimated_total_boot: totalBoot,
    // Tax treatment depends on basis, gain, entity, jurisdiction, and deal
    // structure. A universal 30% estimate presented false precision.
    estimated_boot_tax: null,
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
): Promise<{ ok: boolean; new_matches?: number; archived_matches?: number; active_matches?: number; error?: string }> {
  try {
    const matches = await computeMatchesForExchange(db, userId, exchangeId, propertyId);
    const result = await persistMatchesAndNotifications(
      db,
      matches,
      userId,
      isDemo,
      { exchangeId, propertyId },
    );
    // Relevant-row triggers enqueue work before this inline run. This run has
    // consumed that exact work, so remove its pending queue entries rather than
    // leaving a permanent backlog that implies matching never ran.
    await db.from("match_job_queue").delete()
      .eq("exchange_id", exchangeId).eq("property_id", propertyId).eq("status", "pending");
    console.log(`[matching:${reason}] exchange=${exchangeId} new=${result.new_matches} archived=${result.archived_matches} active=${result.active_matches}`);
    return { ok: true, ...result };
  } catch (err) {
    console.error(`[matching:${reason}] FAILED exchange=${exchangeId}`, err);
    await db.from("match_job_queue").update({
      attempts: 1,
      last_error: (err as Error).message,
    }).eq("exchange_id", exchangeId).eq("property_id", propertyId).eq("status", "pending");
    return { ok: false, error: (err as Error).message };
  }
}

// Demo-workspace builder for 1031 Exchange Up.
//
// Fills (or clears) the CALLER's Demo workspace with a rich, realistic, fully
// isolated Massachusetts dataset designed to exercise every part of the app:
// clients in varied states, listings across every status, a counterparty
// network, engine-verified matches, an inbound match on the caller's own
// listing, connections at different lifecycle stages, message threads,
// notifications, an identification list, and urgent/overdue deadlines.
// EVERYTHING is is_demo=true.
//
// SAFETY: a reset wipes ONLY the caller's own demo rows (agent_id = caller) plus
// the matches/connections/messages/inbound-counterparty exchange that exist solely
// to link the caller to the shared counterparty network. The shared counterparty
// agents' own listings/financials/images/profiles/roles are LEFT INTACT (they are
// re-seeded idempotently and are referenced by other admins' demo workspaces), so
// one admin's reset can never destroy another admin's demo data. It can never touch
// real/live data - everything here is is_demo = true.
//
// Actions: "reset" (default) = wipe caller's demo data then rebuild; "clear" = wipe.
// Admin-only. Runs with the service role.
//
// All fixture data lives in ./fixtures.ts so the invariants (MA-only, $500K-$8M,
// no property labels, individual clients, engine-approved match quality) can be
// unit tested outside Deno.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { calculateBoot, scorePairExplained } from "../_shared/matching-core.ts";
import {
  ALL_DEMO_PROPERTIES,
  BAND_RANGES,
  COUNTERPARTIES,
  INBOUND_CLIENT,
  INBOUND_CRITERIA,
  INBOUND_MATCH,
  INBOUND_PROPERTY,
  INVESTOR_CRITERIA,
  INVESTOR_PROPERTY,
  MATCH_PLAN,
  OWN,
  assertValidDemoProperty,
  dFrom,
  displayLocation,
  type DemoProperty,
  type MatchBand,
} from "./fixtures.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Demo fixtures use the platform defaults so an experimental admin setting
// cannot make the demo reset itself fail. The same production scoring code is
// still used; only the inputs are held stable for repeatable QA.
const MATCH_SETTINGS = { mortgage_interest_rate: 7, mortgage_amortization_years: 25 };

async function buildEngineMatch(
  db: any,
  buyerExchangeId: string,
  sellerPropertyId: string,
  band: MatchBand | null = null,
  opts: Record<string, unknown> = {},
) {
  const [{ data: exchange }, { data: sellerProperty }, { data: sellerFin }] = await Promise.all([
    db.from("exchanges").select("*").eq("id", buyerExchangeId).single(),
    db.from("pledged_properties").select("*").eq("id", sellerPropertyId).single(),
    db.from("property_financials").select("*").eq("property_id", sellerPropertyId).single(),
  ]);
  if (!exchange || !sellerProperty || !sellerFin) throw new Error("Demo match fixture is missing source data");
  const [{ data: buyerFin }, { data: criteria }] = await Promise.all([
    db.from("property_financials").select("*").eq("property_id", exchange.relinquished_property_id).single(),
    exchange.criteria_id
      ? db.from("replacement_criteria").select("*").eq("id", exchange.criteria_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const result = scorePairExplained(exchange, buyerFin, sellerProperty, sellerFin, criteria ?? {}, MATCH_SETTINGS);
  if ("reason" in result) {
    throw new Error(`Invalid demo match ${buyerExchangeId}/${sellerPropertyId}: ${result.reason}`);
  }
  const s = result.score;
  // 1031 trade-up rule is enforced by the engine, but assert it explicitly so a
  // bad fixture fails loudly instead of silently seeding a trade-down.
  if ((s.replacement_value ?? 0) < (s.relinquished_value ?? 0)) {
    throw new Error(`Demo match ${buyerExchangeId}/${sellerPropertyId} violates the trade-up rule`);
  }
  if (band) {
    const [min, max] = BAND_RANGES[band];
    if (s.total < min || s.total > max) {
      throw new Error(
        `Demo match ${buyerExchangeId}/${sellerPropertyId} scored ${s.total}; expected ${band} (${min}-${max})`,
      );
    }
  }
  return {
    buyer_exchange_id: buyerExchangeId,
    seller_property_id: sellerPropertyId,
    total_score: s.total,
    price_score: s.price,
    geo_score: s.geo,
    asset_score: s.asset,
    strategy_score: s.strategy,
    financial_score: s.financial,
    buyer_current_roe: s.buyer_current_roe,
    candidate_roe: s.candidate_roe,
    roe_improvement_pp: s.roe_improvement_pp,
    roe_improvement_rel: s.roe_improvement_rel,
    candidate_annual_debt_service: s.candidate_annual_debt_service,
    estimated_purchasing_capacity: s.estimated_purchasing_capacity,
    estimated_replacement_loan: s.estimated_replacement_loan,
    estimated_ltv: s.estimated_ltv,
    relinquished_value: s.relinquished_value,
    replacement_value: s.replacement_value,
    value_increase: s.value_increase,
    exchange_up_percentage: s.exchange_up_percentage,
    match_classification: s.match_classification,
    eligibility_reasons: s.eligibility_reasons,
    ...calculateBoot(exchange, buyerFin, sellerProperty, sellerFin),
    buyer_agent_viewed: false,
    status: "active",
    ...opts,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const db = createClient(supabaseUrl, serviceRoleKey);
    const { data: isActive, error: accountError } = await db.rpc("is_account_active", { p_user_id: user.id });
    if (accountError || isActive !== true) {
      return json({ error: "Account access is suspended or unavailable" }, 403);
    }
    const { data: roleRow } = await db.from("user_roles").select("user_id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Admin role required" }, 403);

    let action = "reset";
    try { const body = await req.json(); if (body?.action) action = body.action; } catch { /* default */ }

    await clearOwnerDemo(db, user.id);
    if (action === "clear") return json({ cleared: true });
    const counts = await buildOwnerDemo(db, user.id);
    return json({ seeded: counts });
  } catch (err) {
    console.error("demo-data error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

// ── Clear (strictly scoped to the CALLER's own demo footprint) ───────────────
// Deletes only the caller's own demo rows (agent_id = caller) plus the link rows
// that exist solely to connect the caller to the shared counterparty network:
// the connections/messages where the caller is a party, the matches feeding off
// the caller's exchanges, and the single inbound counterparty exchange (+ its
// relinquished property and buyer client) created per-build for the seller-side
// scenario. The shared counterparty agents' own listings, financials, images,
// profiles, roles and clients are deliberately LEFT INTACT - they are re-seeded
// idempotently and are shared across every admin's demo workspace, so this reset
// can never destroy another admin's data. Live data is never touched (is_demo=true).
async function clearOwnerDemo(db: any, ownerId: string) {
  // Investor demo activity must be removed before its referenced properties.
  await db.from("agent_representations").delete().eq("investor_id", ownerId).eq("is_demo", true);
  await db.from("investor_saved_properties").delete().eq("investor_id", ownerId).eq("is_demo", true);
  await db.from("listing_inquiries").delete().eq("investor_id", ownerId).eq("is_demo", true);
  await db.from("notifications").delete().contains("metadata", { demo: true, investor_id: ownerId });

  // 1) Connections where the caller is buyer OR seller. These reach both the
  //    caller's own exchanges and the per-build inbound counterparty exchange.
  const { data: connRows } = await db
    .from("exchange_connections")
    .select("id, buyer_exchange_id, seller_exchange_id")
    .or(`buyer_agent_id.eq.${ownerId},seller_agent_id.eq.${ownerId}`);

  // 2) The caller's own demo exchanges.
  const { data: ownEx } = await db.from("exchanges").select("id, criteria_id, relinquished_property_id, client_id").eq("agent_id", ownerId).eq("is_demo", true);
  const ownExIds = (ownEx ?? []).map((e: any) => e.id);

  // 3) Inbound counterparty exchanges reachable through the caller's connections
  //    that are NOT the caller's own (the seller-side scenario). These are created
  //    fresh per build (not idempotently re-seeded), so the caller must clean them
  //    up - but we resolve them only via the caller's connections, never by a blanket
  //    counterparty-agent scope, so other admins' inbound exchanges are untouched.
  const linkedExIds = new Set<string>();
  for (const c of connRows ?? []) {
    if (c.buyer_exchange_id) linkedExIds.add(c.buyer_exchange_id);
    if (c.seller_exchange_id) linkedExIds.add(c.seller_exchange_id);
  }
  const inboundExIds = [...linkedExIds].filter((id) => !ownExIds.includes(id));

  // Pull the inbound exchanges' own rows so we can remove the per-build
  // counterparty client + relinquished property they introduced.
  let inboundEx: any[] = [];
  if (inboundExIds.length) {
    const { data } = await db.from("exchanges").select("id, criteria_id, relinquished_property_id, client_id").eq("is_demo", true).in("id", inboundExIds);
    inboundEx = data ?? [];
  }

  const allExIds = [...ownExIds, ...inboundEx.map((e: any) => e.id)];
  const allExSet = new Set<string>(allExIds);

  // DEMO connections only. exchange_connections + messages have NO is_demo
  // column, and a single account can also hold REAL live connections, so we must
  // NOT delete by agent_id alone (that would wipe live conversations). Keep only
  // connections that touch one of the caller's demo exchanges (own or inbound).
  const demoConnIds = (connRows ?? [])
    .filter(
      (c: any) =>
        allExSet.has(c.buyer_exchange_id) ||
        (c.seller_exchange_id && allExSet.has(c.seller_exchange_id)),
    )
    .map((c: any) => c.id);

  // Tear down conversations first (messages -> connections), demo-scoped.
  if (demoConnIds.length) {
    await db.from("messages").delete().in("connection_id", demoConnIds);
    await db.from("exchange_connections").delete().in("id", demoConnIds);
  }

  if (allExIds.length) {
    await db.from("identification_list").delete().in("exchange_id", allExIds);
    // Buyer-side matches off these exchanges (incl. the inbound match onto the
    // caller's own listing). Shared counterparty listings stay; only the
    // caller-scoped match rows referencing them are removed.
    await db.from("matches").delete().in("buyer_exchange_id", allExIds);
    await db.from("exchange_timeline").delete().in("exchange_id", allExIds);
    await db.from("exchanges").update({ criteria_id: null, relinquished_property_id: null }).in("id", allExIds);
    const critIds = [...(ownEx ?? []), ...inboundEx].map((e: any) => e.criteria_id).filter(Boolean);
    if (critIds.length) await db.from("replacement_criteria").delete().in("id", critIds);
    await db.from("exchanges").delete().in("id", allExIds);
  }

  // Caller's own demo properties (+ financials/images) and the inbound
  // counterparty relinquished property created per-build. NOT the shared
  // counterparty listings.
  const { data: ownProps } = await db.from("pledged_properties").select("id").eq("is_demo", true).eq("agent_id", ownerId);
  const inboundPropIds = inboundEx.map((e: any) => e.relinquished_property_id).filter(Boolean);
  const propIds = [...new Set([...(ownProps ?? []).map((p: any) => p.id), ...inboundPropIds])];
  if (propIds.length) {
    await db.from("matches").delete().in("seller_property_id", propIds);
    await db.from("property_financials").delete().in("property_id", propIds);
    await db.from("property_images").delete().in("property_id", propIds);
    await db.from("pledged_properties").delete().in("id", propIds);
  }

  // Caller's own demo clients, plus the per-build inbound counterparty buyer
  // client. Shared counterparty agents have no shared clients to preserve.
  await db.from("agent_clients").delete().eq("is_demo", true).eq("agent_id", ownerId);
  const inboundClientIds = inboundEx.map((e: any) => e.client_id).filter(Boolean);
  if (inboundClientIds.length) await db.from("agent_clients").delete().eq("is_demo", true).in("id", inboundClientIds);

  await db.from("notifications").delete().eq("user_id", ownerId).contains("metadata", { demo: true });
}

// ── Build ────────────────────────────────────────────────────────────────────
async function buildOwnerDemo(db: any, ownerId: string) {
  // Fail fast on any fixture that breaks the MA-only / price / coherence rules
  // BEFORE a single row is written.
  for (const p of ALL_DEMO_PROPERTIES()) assertValidDemoProperty(p);

  const prop: Record<string, string> = {};          // internal fixture key -> id
  const fixture: Record<string, DemoProperty> = {}; // internal fixture key -> fixture
  for (const p of ALL_DEMO_PROPERTIES()) fixture[p.key] = p;
  const cpAgent: Record<string, string> = {};       // agent full_name -> id

  // Counterparty agents + their active demo properties.
  for (const cp of COUNTERPARTIES) {
    const id = await resolveAuthUser(db, cp.email, cp.full_name);
    cpAgent[cp.full_name] = id;
    await db.from("profiles").upsert({ id, email: cp.email, full_name: cp.full_name, brokerage_name: cp.brokerage_name, verification_status: "verified" });
    const { data: hasRole } = await db.from("user_roles").select("user_id").eq("user_id", id).eq("role", "agent").maybeSingle();
    if (!hasRole) await mustInsert(db, "user_roles", { user_id: id, role: "agent" });
    for (const p of cp.properties) {
      prop[p.key] = await insertProperty(db, id, p, true, "active", true); // shared → idempotent by address
    }
  }

  // Caller's demo clients + listings.
  const own: { exId: string; key: string }[] = [];
  for (const o of OWN) {
    const client = await insertOne(db, "agent_clients", { agent_id: ownerId, ...o.client, is_demo: true }, "id");
    const propId = await insertProperty(db, ownerId, o.property, true, o.exchange.status === "draft" ? "draft" : "active");
    prop[o.property.key] = propId;
    const ex = await insertOne(db, "exchanges", { agent_id: ownerId, client_id: client.id, relinquished_property_id: propId, is_demo: true, ...o.exchange }, "id");
    const crit = await insertOne(db, "replacement_criteria", { exchange_id: ex.id, ...o.criteria }, "id");
    await db.from("exchanges").update({ criteria_id: crit.id }).eq("id", ex.id);
    await db.from("pledged_properties").update({ exchange_id: ex.id }).eq("id", propId);
    own.push({ exId: ex.id, key: o.key });
  }
  const exFor = (key: string) => own.find((x) => x.key === key)!.exId;

  // Investor-owner demo exchange. The same admin user can switch between the
  // Investor and Agent views, so using the owner as the demo representative
  // makes the entire handoff and action queue testable without impersonation.
  const investorProp = await insertProperty(db, ownerId, INVESTOR_PROPERTY, true, "active");
  prop[INVESTOR_PROPERTY.key] = investorProp;
  const investorEquity = INVESTOR_PROPERTY.f.asking_price - INVESTOR_PROPERTY.f.loan_balance;
  const investorEx = await insertOne(db, "exchanges", {
    agent_id: ownerId,
    client_id: null,
    owner_type: "investor",
    relinquished_property_id: investorProp,
    is_demo: true,
    status: "active",
    exchange_proceeds: investorEquity,
    estimated_equity: investorEquity,
    sale_close_date: dFrom(-10),
    identification_deadline: dFrom(35),
    closing_deadline: dFrom(170),
  }, "id");
  const investorCrit = await insertOne(db, "replacement_criteria", { exchange_id: investorEx.id, ...INVESTOR_CRITERIA }, "id");
  await db.from("exchanges").update({ criteria_id: investorCrit.id }).eq("id", investorEx.id);
  await db.from("pledged_properties").update({ exchange_id: investorEx.id }).eq("id", investorProp);

  const exchangeIdFor = (buyerKey: string) => (buyerKey === "investor" ? investorEx.id : exFor(buyerKey));

  // Buyer-side matches. Every pair is scored by the production engine and its
  // quality band asserted, so the demo can never present fabricated scores or
  // impossible trade-down recommendations.
  const matchRows = await Promise.all(
    MATCH_PLAN.map((planned) =>
      buildEngineMatch(db, exchangeIdFor(planned.buyer), prop[planned.seller], planned.band, {
        ...(planned.buyer === "james_wilson"
          ? { buyer_agent_viewed: true, buyer_agent_viewed_at: dFrom(-1) + "T18:00:00Z" }
          : {}),
        ...(planned.opts ?? {}),
      })
    ),
  );
  const { data: matches, error: mErr } = await db.from("matches").insert(matchRows).select("id, buyer_exchange_id, seller_property_id");
  if (mErr) throw new Error(`matches insert failed: ${mErr.message}`);
  const matchId = (buyerKey: string, sellerKey: string) =>
    (matches ?? []).find((m: any) => m.buyer_exchange_id === exchangeIdFor(buyerKey) && m.seller_property_id === prop[sellerKey])?.id;
  const investorMatchId = matchId("investor", "taunton_multifamily");

  const { data: ownerProfile } = await db.from("profiles").select("email, full_name").eq("id", ownerId).single();
  const activeRep = await insertOne(db, "agent_representations", {
    investor_id: ownerId,
    investor_email: ownerProfile.email,
    agent_id: ownerId,
    agent_email: ownerProfile.email,
    agent_name: ownerProfile.full_name,
    status: "active",
    source: "admin_assignment",
    is_default: true,
    is_demo: true,
    invited_by: ownerId,
    accepted_at: new Date().toISOString(),
  }, "id");
  await mustInsert(db, "exchange_agent_assignments", {
    exchange_id: investorEx.id,
    representation_id: activeRep.id,
    investor_id: ownerId,
    agent_id: ownerId,
    status: "active",
    is_primary: true,
    assigned_by: ownerId,
  });
  if (investorMatchId) {
    await mustInsert(db, "agent_contact_requests", {
      investor_id: ownerId,
      exchange_id: investorEx.id,
      match_id: investorMatchId,
      property_id: prop["taunton_multifamily"],
      representing_agent_id: ownerId,
      status: "requested",
      investor_note: "This one looks like a good fit for me. Can you reach out to the listing agent and find out if it's still available and what they're asking? I'd also like to know what the current rents are and whether the expenses look normal for a building like this before I get too far into it.",
    });
    await mustInsert(db, "agent_match_recommendations", {
      agent_id: ownerId,
      investor_id: ownerId,
      exchange_id: investorEx.id,
      match_id: investorMatchId,
      note: "Strong ROE improvement and a practical fit for the current identification window.",
      response: "pending",
    });
  }
  await mustInsert(db, "agent_representations", {
    investor_id: ownerId,
    investor_email: ownerProfile.email,
    agent_id: cpAgent["Priya Mehta"],
    agent_email: COUNTERPARTIES.find((agent) => agent.full_name === "Priya Mehta")!.email,
    agent_name: "Priya Mehta",
    status: "active",
    source: "admin_assignment",
    is_default: false,
    assign_future_exchanges: false,
    is_demo: true,
    invited_by: ownerId,
    accepted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  });
  const pendingAgentRep = await insertOne(db, "agent_representations", {
    investor_id: ownerId, investor_email: ownerProfile.email, agent_id: cpAgent["Elena Vasquez"],
    agent_email: COUNTERPARTIES.find((agent) => agent.full_name === "Elena Vasquez")!.email,
    agent_name: "Elena Vasquez", status: "awaiting_acceptance", source: "investor_invite",
    is_demo: true, invited_by: ownerId, request_context: {},
  }, "id");
  await mustInsert(db, "representation_invites", {
    representation_id: pendingAgentRep.id,
    direction: "investor_to_agent",
    email: COUNTERPARTIES.find((agent) => agent.full_name === "Elena Vasquez")!.email,
    status: "pending",
    // No exchange is attached: the invite is still pending, so nothing of this
    // investor's may land in the invited agent's pipeline before acceptance.
    metadata: { exchange_ids: [], assign_future: false, is_demo: true },
    created_by: ownerId,
    last_sent_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    send_count: 1,
    delivery_status: "sent",
  });
  await mustInsert(db, "agent_representations", {
    investor_id: ownerId, investor_email: ownerProfile.email, agent_id: null, agent_email: "",
    status: "awaiting_agent", source: "platform_referral", is_demo: true, invited_by: ownerId,
    request_context: { location: "Worcester, MA", property_type: "Multifamily", timing: "Identifying within 35 days", notes: "Demo referral awaiting administrator assignment" },
  });

  // Inbound (seller-side) match: Natalie Foster, represented by a counterparty
  // agent, wants Boston-area small multifamily and matches the caller's own
  // Dorchester listing.
  const jordan = cpAgent["Jordan Alvarez"];
  const inboundClient = await insertOne(db, "agent_clients", { agent_id: jordan, ...INBOUND_CLIENT, is_demo: true }, "id");
  const inboundRelProp = await insertProperty(db, jordan, INBOUND_PROPERTY, true);
  prop[INBOUND_PROPERTY.key] = inboundRelProp;
  const inboundEquity = INBOUND_PROPERTY.f.asking_price - INBOUND_PROPERTY.f.loan_balance;
  const inboundEx = await insertOne(db, "exchanges", { agent_id: jordan, client_id: inboundClient.id, relinquished_property_id: inboundRelProp, is_demo: true, status: "active", exchange_proceeds: inboundEquity, estimated_equity: inboundEquity, identification_deadline: dFrom(40), closing_deadline: dFrom(175) }, "id");
  const inboundCrit = await insertOne(db, "replacement_criteria", { exchange_id: inboundEx.id, ...INBOUND_CRITERIA }, "id");
  await db.from("exchanges").update({ criteria_id: inboundCrit.id }).eq("id", inboundEx.id);
  await db.from("pledged_properties").update({ exchange_id: inboundEx.id }).eq("id", inboundRelProp);
  const inboundMatchRow = await buildEngineMatch(db, inboundEx.id, prop[INBOUND_MATCH.seller]);
  const { data: inboundMatch, error: inboundMatchError } = await db.from("matches").insert(inboundMatchRow).select("id").single();
  if (inboundMatchError) throw new Error(`inbound demo match insert failed: ${inboundMatchError.message}`);

  // Connections at varied lifecycle stages. Agent-to-agent conversations open
  // immediately once either verified agent starts them; no acceptance queue.
  // (a) Other agent started the conversation, no messages yet.
  await mustInsert(db, "exchange_connections", { match_id: matchId("marcus_rodriguez", "brockton_mixed_use"), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: exFor("marcus_rodriguez"), seller_exchange_id: null, status: "accepted", initiated_by: "seller_agent", accepted_at: dFrom(-1) + "T10:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (b) You started the conversation, no messages yet.
  await mustInsert(db, "exchange_connections", { match_id: matchId("anita_patel", "chelmsford_industrial"), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Priya Mehta"], buyer_exchange_id: exFor("anita_patel"), seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-1) + "T11:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (c) Accepted + conversing -> live message thread on Wilson's urgent ID clock.
  const conn = await insertOne(db, "exchange_connections", { match_id: matchId("james_wilson", "chelmsford_industrial"), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Priya Mehta"], buyer_exchange_id: exFor("james_wilson"), seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-2) + "T16:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true }, "id");
  const chelmsford = fixture["chelmsford_industrial"];
  await mustInsert(db, "messages", [
    { connection_id: conn.id, sender_id: cpAgent["Priya Mehta"], content: `Thanks for connecting - the flex building at ${displayLocation(chelmsford)} is available to a 1031 buyer. Happy to send the OM and rent roll.` },
    { connection_id: conn.id, sender_id: ownerId, content: "Appreciate it. My client's on a 9-day ID clock, so speed matters. Can you also share the T-12 and the tenants' lease abstracts?" },
    { connection_id: conn.id, sender_id: cpAgent["Priya Mehta"], content: "Sending the package now. All three tenants are on NNN leases with annual escalators, so the expense load stays predictable." },
    { connection_id: conn.id, sender_id: ownerId, content: "Thanks - reviewing the T-12 with James this afternoon. Can we tour Thursday?" },
  ]);
  // (d) Declined -> "closed (lost)".
  await mustInsert(db, "exchange_connections", { match_id: matchId("anita_patel", "brockton_mixed_use"), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: exFor("anita_patel"), seller_exchange_id: null, status: "declined", initiated_by: "buyer_agent", declined_at: dFrom(-4) + "T12:00:00Z", decline_reason: "Anita passed on the vacant storefront lease-up risk.", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (e) Inbound accepted -> seller-side conversation on the caller's listing.
  if (inboundMatch) {
    await mustInsert(db, "exchange_connections", { match_id: inboundMatch.id, buyer_agent_id: jordan, seller_agent_id: ownerId, buyer_exchange_id: inboundEx.id, seller_exchange_id: exFor("marcus_rodriguez"), status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-1) + "T14:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true });
  }

  // Identification list for Wilson's in-identification exchange (his top pick).
  // Best-effort: this feature's schema may vary, so don't let it break the rebuild.
  try {
    await mustInsert(db, "identification_list", [
      { exchange_id: exFor("james_wilson"), property_id: prop["chelmsford_industrial"], match_id: matchId("james_wilson", "chelmsford_industrial"), position: 1, status: "identified" },
    ]);
  } catch (e) { console.warn("identification_list seed skipped:", (e as Error).message); }

  // Notifications (varied types; some unread). Tagged demo for clean teardown.
  await mustInsert(db, "notifications", [
    { user_id: ownerId, type: "new_match", title: "Qualified new match", message: `${displayLocation(fixture["chelmsford_industrial"])} matched James Wilson's exchange.`, link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "new_match", title: "Qualified new match", message: `${displayLocation(fixture["brockton_mixed_use"])} matched Marcus Rodriguez's exchange.`, link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_request", title: "New agent conversation", message: `Elena Vasquez started a conversation about ${displayLocation(fixture["brockton_mixed_use"])}.`, link_to: "/agent/pipeline", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_accepted", title: "Conversation active", message: "Your conversation with Priya Mehta is ready for messaging.", link_to: "/agent/pipeline", read: true, metadata: { demo: true } },
  ]);

  // Investor view: a realistic shortlist. Direct investor -> listing-agent
  // inquiries were retired; the seeded contact request above exercises the new
  // agent-mediated workflow instead.
  await mustInsert(db, "investor_saved_properties", [
    { investor_id: ownerId, property_id: prop["taunton_multifamily"], is_demo: true },
    { investor_id: ownerId, property_id: prop["worcester_multifamily"], is_demo: true },
  ]);
  return {
    clients: OWN.length + 1,
    listings: OWN.length + 1,
    counterpartyProperties: COUNTERPARTIES.reduce((n, cp) => n + cp.properties.length, 0),
    matches: matchRows.length + 1,
    investorSaved: 2,
    investorInquiries: 0,
    representations: 4,
    representationInvites: 1,
    contactRequests: investorMatchId ? 1 : 0,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve a counterparty auth user idempotently, regardless of how many total
// users exist. We never rely on the default (unpaginated, 50-row, created_at DESC)
// listUsers page - past ~50 users the seeded agents fall off page 1, createUser
// then errors with "already registered", and the seed would abort. Instead:
//   1) look the user up across ALL pages,
//   2) if missing, create it,
//   3) if creation races/“already registered”, re-resolve across all pages.
async function resolveAuthUser(db: any, email: string, fullName: string): Promise<string> {
  const existing = await findAuthUserByEmail(db, email);
  if (existing) return existing;

  const { data: created, error } = await db.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: fullName },
  });
  if (!error) return created.user!.id;

  // Already exists (created concurrently or present beyond page 1) - treat as
  // idempotent and re-resolve rather than aborting the seed.
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("already") || (error as any).status === 422 || (error as any).code === "email_exists") {
    const found = await findAuthUserByEmail(db, email);
    if (found) return found;
  }
  throw error;
}

// Page fully through auth users to find one by exact email (case-insensitive).
async function findAuthUserByEmail(db: any, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 1000; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const hit = users.find((u: any) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (users.length === 0) break; // exhausted - terminate on an empty page, not on a server-capped short page
  }
  return null;
}

// `idempotent` (used for the SHARED counterparty listings, which clearOwnerDemo no
// longer deletes) reuses an existing demo row for this agent + street address
// instead of inserting a duplicate on every rebuild, refreshing its details,
// financials and image so the shared data stays coherent. Property labels are
// retired: `property_name` is always written as null and fixtures are keyed by a
// TypeScript-only internal id. The caller's own + per-build inbound properties
// are deleted on each reset, so they use a plain insert.
async function insertProperty(db: any, agentId: string, p: DemoProperty, isDemo: boolean, status = "active", idempotent = false): Promise<string> {
  assertValidDemoProperty(p);
  const fields = {
    agent_id: agentId,
    property_name: null,
    address: p.address,
    address_is_public: p.address_is_public,
    city: p.city,
    state: p.state,
    zip: p.zip,
    county: p.county,
    unit_suite: p.unit_suite ?? null,
    asset_type: p.asset_type,
    asset_subtype: p.asset_subtype,
    strategy_type: p.strategy_type,
    property_class: p.property_class,
    property_condition: p.property_condition,
    year_built: p.year_built,
    units: p.units,
    building_square_footage: p.sf,
    land_area_acres: p.land_area_acres,
    num_buildings: p.num_buildings,
    num_stories: p.num_stories,
    parking_spaces: p.parking_spaces,
    parking_type: p.parking_type,
    construction_type: p.construction_type,
    roof_type: p.roof_type,
    hvac_type: p.hvac_type,
    zoning: p.zoning,
    amenities: p.amenities,
    description: p.description,
    recent_renovations: p.recent_renovations,
    is_demo: isDemo,
    source: "agent_pledge",
    status,
    listed_at: status === "active" ? new Date().toISOString() : null,
    // Published (active) listings must carry the compliance attestation, otherwise
    // editing a seeded active listing is blocked (Save disabled) until the box is
    // re-checked. Drafts stay unconfirmed so the wizard prompts for it on publish.
    owner_authorization_confirmed: status === "active",
  };

  let propId: string;
  if (idempotent) {
    const { data: existing } = await db.from("pledged_properties")
      .select("id").eq("agent_id", agentId).eq("address", p.address).eq("is_demo", true).maybeSingle();
    if (existing) {
      propId = existing.id;
      const { error: upErr } = await db.from("pledged_properties").update(fields).eq("id", propId);
      if (upErr) throw new Error(`pledged_properties update failed: ${upErr.message}`);
    } else {
      propId = (await insertOne(db, "pledged_properties", fields, "id")).id;
    }
    // Refresh dependent rows idempotently (avoid duplicate financials/images).
    await db.from("property_financials").delete().eq("property_id", propId);
    await db.from("property_images").delete().eq("property_id", propId);
  } else {
    propId = (await insertOne(db, "pledged_properties", fields, "id")).id;
  }

  await mustInsert(db, "property_financials", { property_id: propId, ...p.f });
  await mustInsert(db, "property_images", { property_id: propId, storage_path: p.img, file_name: "cover.jpg", sort_order: 0 });
  return propId;
}

async function insertOne(db: any, table: string, row: any, select: string) {
  const { data, error } = await db.from(table).insert(row).select(select).single();
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
  return data;
}
async function mustInsert(db: any, table: string, rows: any) {
  const { error } = await db.from(table).insert(rows);
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

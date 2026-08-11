// Demo-workspace builder for 1031 Exchange Up.
//
// Fills (or clears) the CALLER's Demo workspace with a rich, realistic, fully
// isolated dataset designed to exercise every part of the app: clients in
// varied states, listings across every status, a counterparty network, matches
// spanning the boot/ROE scenarios, an inbound match on the caller's own listing,
// connections at different lifecycle stages, message threads, notifications, an
// identification list, and urgent/overdue deadlines. EVERYTHING is is_demo=true.
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { calculateBoot, scorePairExplained } from "../_shared/matching-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Coherent financials: NOI = ask x cap and NOI = gross rent - operating
// expenses. Occupancy remains a separately disclosed property metric; the UI
// and listing wizard define gross_rent_roll as the annualized gross-rent input,
// so applying occupancy a second time here would make the displayed income
// statement fail to reconcile. Debt service is amortized on the actual balance/rate.
function fin(o: { ask: number; cap: number; gross: number; occ: number; loan: number; rate: number; maturity: string }) {
  const noi = Math.round(o.ask * o.cap / 100);
  const expenses = Math.max(o.gross - noi, 0);
  const r = o.rate / 100 / 12;
  const monthly = o.loan > 0 ? (o.loan * r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1) : 0;
  return {
    asking_price: o.ask, cap_rate: o.cap, noi,
    gross_rent_roll: o.gross, total_operating_expenses: expenses,
    annual_revenue: o.gross, annual_expenses: expenses,
    occupancy_rate: o.occ, loan_balance: o.loan, loan_rate: o.rate,
    loan_type: o.loan > 0 ? "Fixed-rate" : "Free & clear", loan_maturity_date: o.maturity,
    annual_debt_service: Math.round(monthly * 12),
  };
}

async function buildEngineMatch(
  db: any,
  buyerExchangeId: string,
  sellerPropertyId: string,
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
  // Demo fixtures use the platform defaults so an experimental admin setting
  // cannot make the demo reset itself fail. The same production scoring code is
  // still used; only the inputs are held stable for repeatable QA.
  const settings = { mortgage_interest_rate: 7, mortgage_amortization_years: 25 };
  const result = scorePairExplained(exchange, buyerFin, sellerProperty, sellerFin, criteria ?? {}, settings);
  if ("reason" in result) {
    throw new Error(`Invalid demo match ${buyerExchangeId}/${sellerPropertyId}: ${result.reason}`);
  }
  const s = result.score;
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

const IMG = {
  mf: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
  industrial: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
  medical: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=75&auto=format&fit=crop",
  office: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
};

// ── Counterparty network: 4 Massachusetts agents, 7 active candidate listings ─
// Demographic: mom-and-pop landlords, growing multifamily investors, and
// small-scale commercial. All inventory is in-state (MA).
const COUNTERPARTIES = [
  {
    email: "demo.agent.alvarez@replacefinder.test", full_name: "Jordan Alvarez", brokerage_name: "Alvarez Commercial Group",
    properties: [
      { name: "Elm Park Triple-Deckers", address: "145 Russell St", city: "Worcester", state: "MA", asset_type: "multifamily", strategy_type: "value_add", units: 12, year_built: 1920, sf: 11400,
        description: "Four classic Worcester triple-deckers sold as one package, 12 total units near Elm Park and Clark University. Eight units turned 2021-2024; remaining four are ~$250/mo under market. New rubber roofs on two buildings, separate gas heat, tenants pay heat and electric.",
        f: fin({ ask: 1_650_000, cap: 6.8, gross: 195_000, occ: 95, loan: 900_000, rate: 6.25, maturity: "2031-03-01" }), img: IMG.mf },
      { name: "Shrewsbury Street Storefronts", address: "310 Shrewsbury St", city: "Worcester", state: "MA", asset_type: "retail", strategy_type: "core", units: 5, year_built: 1985, sf: 7800,
        description: "Five-tenant neighborhood retail strip on Worcester's restaurant row. Long-standing local tenants on staggered leases, all reimbursing taxes and insurance. Roof replaced 2021, striped parking for 22 cars.",
        f: fin({ ask: 1_250_000, cap: 7.0, gross: 128_000, occ: 92, loan: 680_000, rate: 5.9, maturity: "2029-09-01" }), img: IMG.retail },
    ],
  },
  {
    email: "demo.agent.mehta@replacefinder.test", full_name: "Priya Mehta", brokerage_name: "Mehta Investment Realty",
    properties: [
      { name: "Merrimack Mill Lofts", address: "88 Market St", city: "Lowell", state: "MA", asset_type: "multifamily", strategy_type: "core_plus", units: 42, year_built: 1998, sf: 41000,
        description: "42-unit converted mill building in downtown Lowell, 96% occupied with a steady renter base from UMass Lowell and the medical corridor. Elevator served, in-unit laundry, on-site parking. Boiler replaced 2022. The largest MA offering currently in the network.",
        f: fin({ ask: 4_950_000, cap: 6.5, gross: 545_000, occ: 96, loan: 2_700_000, rate: 5.75, maturity: "2033-01-01" }), img: IMG.mf },
      { name: "Chelmsford Flex Building", address: "12 Katrina Rd", city: "Chelmsford", state: "MA", asset_type: "industrial", strategy_type: "core_plus", units: 3, year_built: 2004, sf: 21000,
        description: "Three-tenant flex/light industrial building off Route 3, fully leased to established local contractors. 18' clear, three drive-in doors, small office build-outs. Assumable loan at 5.4%.",
        f: fin({ ask: 1_850_000, cap: 7.2, gross: 178_000, occ: 100, loan: 1_000_000, rate: 5.4, maturity: "2032-06-01" }), img: IMG.industrial },
    ],
  },
  {
    email: "demo.agent.brooks@replacefinder.test", full_name: "Daniel Brooks", brokerage_name: "Brooks & Lane CRE",
    properties: [
      { name: "Forest Park Six-Family", address: "45 Sumner Ave", city: "Springfield", state: "MA", asset_type: "multifamily", strategy_type: "value_add", units: 6, year_built: 1925, sf: 6800,
        description: "Six-family in Springfield's Forest Park neighborhood, a straightforward first step up for a small landlord. Two units renovated 2023, four original. Newer roof and updated electrical; rents roughly 15% under market.",
        f: fin({ ask: 725_000, cap: 8.0, gross: 104_000, occ: 90, loan: 400_000, rate: 6.5, maturity: "2030-04-01" }), img: IMG.mf },
    ],
  },
  {
    email: "demo.agent.vasquez@replacefinder.test", full_name: "Elena Vasquez", brokerage_name: "Vasquez Realty Partners",
    properties: [
      { name: "Wollaston Court Apartments", address: "42 Beale St", city: "Quincy", state: "MA", asset_type: "multifamily", strategy_type: "core_plus", units: 24, year_built: 1972, sf: 22800,
        description: "24-unit brick walk-up two blocks from the Wollaston Red Line stop, 95% occupied year-round. Fourteen units updated since 2021, common laundry, 28 off-street spaces. Windows replaced 2020.",
        f: fin({ ask: 3_600_000, cap: 6.0, gross: 355_000, occ: 95, loan: 1_980_000, rate: 5.95, maturity: "2033-08-01" }), img: IMG.mf },
      { name: "Brockton Main Street Mixed-Use", address: "780 Main St", city: "Brockton", state: "MA", asset_type: "mixed_use", strategy_type: "core_plus", units: 9, year_built: 1930, sf: 12400,
        description: "Three ground-floor storefronts over six apartments in downtown Brockton. Residential fully leased; one commercial suite vacant and ready for lease-up. Facade and storefront glass redone 2022.",
        f: fin({ ask: 1_400_000, cap: 7.5, gross: 168_000, occ: 88, loan: 760_000, rate: 6.8, maturity: "2031-11-01" }), img: IMG.retail },
    ],
  },
];

// ── The caller's own clients + relinquished-property listings ─────────────────
const TODAY = new Date();
const dFrom = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const OWN = [
  // Draft - being prepared, not yet in the network.
  { client: { client_name: "Chen Family Investments", client_company: "Chen Family Investments LLC", client_email: "sarah.chen@example.com", client_phone: "(781) 555-0101", notes: "Longtime Medford landlord with two duplexes. Wants to trade up into a single 8-12 unit building closer to the Orange Line. Pre-approved with a local credit union.", status: "active" },
    property: { name: "Highland Street Duplexes", address: "214 Highland Ave", city: "Medford", state: "MA", asset_type: "multifamily", strategy_type: "core_plus", units: 4, year_built: 1955, sf: 4600,
      description: "DRAFT - gathering rent roll and last year's operating statements. Two side-by-side duplexes in Medford, fully occupied, tenants pay all utilities.",
      f: fin({ ask: 1_350_000, cap: 5.2, gross: 118_000, occ: 100, loan: 560_000, rate: 4.6, maturity: "2030-05-01" }), img: IMG.mf },
    exchange: { status: "draft" } },

  // Active - Marcus, small multifamily, mid-clock.
  { client: { client_name: "Marcus Rodriguez", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example", client_phone: "(617) 555-0127", notes: "Second exchange. Owns a Dorchester three-family and is tired of self-managing. Wants a larger MA multifamily with professional management in place.", status: "active" },
    property: { name: "Dorchester Ave Three-Family", address: "1420 Dorchester Ave", city: "Boston", state: "MA", asset_type: "multifamily", strategy_type: "core_plus", units: 3, year_built: 1910, sf: 3900,
      description: "Classic Dorchester three-decker near Fields Corner, fully occupied with long-term tenants. Two units updated 2022, separate utilities, off-street parking for three. Owner-managed for 11 years.",
      f: fin({ ask: 1_250_000, cap: 5.0, gross: 108_000, occ: 100, loan: 500_000, rate: 4.9, maturity: "2031-07-01" }), img: IMG.mf },
    exchange: { status: "active", exchange_proceeds: 750_000, estimated_equity: 750_000, estimated_basis: 420_000, estimated_gain: 330_000, estimated_tax_liability: 82_500, sale_close_date: dFrom(-20), identification_deadline: dFrom(25), closing_deadline: dFrom(160) } },

  // Active - Patel trust, small retail.
  { client: { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example", client_phone: "(978) 555-0163", notes: "Trustee wants passive, low-maintenance income in Massachusetts. Open to small retail or mixed-use with reliable local tenants. No heavy value-add.", status: "active" },
    property: { name: "Beverly Rantoul Retail", address: "210 Rantoul St", city: "Beverly", state: "MA", asset_type: "retail", strategy_type: "core", units: 4, year_built: 1988, sf: 6200,
      description: "Four-tenant retail strip on Rantoul Street with a pharmacy, salon, and two service tenants. All leases reimburse taxes. New roof 2022, repaved lot 2023.",
      f: fin({ ask: 1_100_000, cap: 6.0, gross: 96_000, occ: 100, loan: 420_000, rate: 5.1, maturity: "2030-02-01" }), img: IMG.retail },
    exchange: { status: "active", exchange_proceeds: 680_000, estimated_equity: 680_000, estimated_basis: 390_000, estimated_gain: 290_000, estimated_tax_liability: 72_500, sale_close_date: dFrom(-10), identification_deadline: dFrom(35), closing_deadline: dFrom(170) } },

  // In identification - Wilson, small commercial, URGENT clock (9 days to ID).
  { client: { client_name: "James Wilson", client_email: "jwilson@example.com", client_phone: "(978) 555-0144", notes: "Selling a Haverhill warehouse he's owned since the 90s. Wants small flex or multifamily within an hour of home. ID window closing fast - only actionable MA deals.", status: "active" },
    property: { name: "Haverhill Locke Street Warehouse", address: "55 Locke St", city: "Haverhill", state: "MA", asset_type: "industrial", strategy_type: "value_add", units: 1, year_built: 1978, sf: 18000,
      description: "Single-tenant warehouse near I-495; the tenant's lease expiration is driving the exchange timeline. 18' clear, three dock doors, fenced yard. Office remodeled 2022, roof mid-life.",
      f: fin({ ask: 1_500_000, cap: 6.5, gross: 132_000, occ: 100, loan: 700_000, rate: 5.6, maturity: "2028-11-01" }), img: IMG.industrial },
    exchange: { status: "in_identification", exchange_proceeds: 800_000, estimated_equity: 800_000, estimated_basis: 430_000, estimated_gain: 370_000, estimated_tax_liability: 92_500, sale_close_date: dFrom(-36), identification_deadline: dFrom(9), closing_deadline: dFrom(144) } },

  // In closing - Aurora, small office, closing in 12 days; ID window already passed.
  { client: { client_name: "Aurora Holdings", client_company: "Aurora Holdings Inc.", client_email: "ops@auroraholdings.example", client_phone: "(508) 555-0188", notes: "Small family partnership closing on a Framingham office disposition. Replacement identified; coordinating QI and a local lender. Needs clean execution.", status: "active" },
    property: { name: "Framingham Professional Building", address: "945 Concord St", city: "Framingham", state: "MA", asset_type: "office", strategy_type: "core", units: 1, year_built: 1999, sf: 14000,
      description: "Two-story suburban professional building on Route 126, leased to accounting, insurance, and dental tenants. Surface parking, recent HVAC replacement. Replacement purchase is in closing.",
      f: fin({ ask: 1_800_000, cap: 6.2, gross: 168_000, occ: 92, loan: 900_000, rate: 5.3, maturity: "2032-05-01" }), img: IMG.office },
    exchange: { status: "in_closing", exchange_proceeds: 900_000, estimated_equity: 900_000, estimated_basis: 520_000, estimated_gain: 380_000, estimated_tax_liability: 95_000, sale_close_date: dFrom(-60), identification_deadline: dFrom(-15), closing_deadline: dFrom(12) } },

  // Completed - historical, fully closed.
  { client: { client_name: "Brennan Stout", client_email: "bstout@example.com", client_phone: "(413) 555-0190", notes: "Closed exchange from earlier this year. Kept on file for repeat business; eyeing another small multifamily disposition in Q4.", status: "inactive" },
    property: { name: "Fall River Self Storage", address: "500 Airport Rd", city: "Fall River", state: "MA", asset_type: "industrial", strategy_type: "core", units: 1, year_built: 2010, sf: 22000,
      description: "Small climate-controlled self-storage facility, sold and exchanged earlier this year. Retained for reference.",
      f: fin({ ask: 1_300_000, cap: 6.8, gross: 122_000, occ: 90, loan: 500_000, rate: 5.0, maturity: "2029-01-01" }), img: IMG.industrial },
    exchange: { status: "completed", exchange_proceeds: 800_000, estimated_equity: 800_000, estimated_basis: 450_000, estimated_gain: 350_000, estimated_tax_liability: 87_500, sale_close_date: dFrom(-180), identification_deadline: dFrom(-135), closing_deadline: dFrom(-8), actual_close_date: dFrom(-8) } },
];

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
  const prop: Record<string, string> = {};         // property name -> id
  const cpAgent: Record<string, string> = {};       // agent full_name -> id

  // Counterparty agents + their active demo properties.
  for (const cp of COUNTERPARTIES) {
    const id = await resolveAuthUser(db, cp.email, cp.full_name);
    cpAgent[cp.full_name] = id;
    await db.from("profiles").upsert({ id, email: cp.email, full_name: cp.full_name, brokerage_name: cp.brokerage_name, verification_status: "verified" });
    const { data: hasRole } = await db.from("user_roles").select("user_id").eq("user_id", id).eq("role", "agent").maybeSingle();
    if (!hasRole) await mustInsert(db, "user_roles", { user_id: id, role: "agent" });
    for (const p of cp.properties) {
      prop[p.name] = await insertProperty(db, id, p, true, "active", true); // shared → idempotent
    }
  }

  // Caller's demo clients + listings.
  const own: { exId: string; clientName: string }[] = [];
  for (const o of OWN) {
    const client = await insertOne(db, "agent_clients", { agent_id: ownerId, ...o.client, is_demo: true }, "id");
    const propId = await insertProperty(db, ownerId, o.property, true, o.exchange.status === "draft" ? "draft" : "active");
    prop[o.property.name] = propId;
    const ex = await insertOne(db, "exchanges", { agent_id: ownerId, client_id: client.id, relinquished_property_id: propId, is_demo: true, ...o.exchange }, "id");
    const crit = await insertOne(db, "replacement_criteria", { exchange_id: ex.id, target_asset_types: [], target_states: [], target_price_min: 0, target_price_max: 0 }, "id");
    await db.from("exchanges").update({ criteria_id: crit.id }).eq("id", ex.id);
    await db.from("pledged_properties").update({ exchange_id: ex.id }).eq("id", propId);
    own.push({ exId: ex.id, clientName: o.client.client_name });
  }
  const exFor = (name: string) => own.find((x) => x.clientName === name)!.exId;
  const marcus = exFor("Marcus Rodriguez"), patel = exFor("Patel Family Trust"), wilson = exFor("James Wilson");

  // Investor-owner demo exchange. The same admin user can switch between the
  // Investor and Agent views, so using the owner as the demo representative
  // makes the entire handoff and action queue testable without impersonation.
  const investorProp = await insertProperty(db, ownerId, {
    ...OWN[0].property,
    name: "Owner Demo – Riverside Apartments",
    address: "125 Riverside Drive",
  }, true, "active");
  prop["Owner Demo – Riverside Apartments"] = investorProp;
  const investorEx = await insertOne(db, "exchanges", {
    agent_id: ownerId,
    client_id: null,
    owner_type: "investor",
    relinquished_property_id: investorProp,
    is_demo: true,
    status: "active",
    exchange_proceeds: 1_500_000,
    estimated_equity: 1_500_000,
    identification_deadline: dFrom(35),
    closing_deadline: dFrom(170),
  }, "id");
  const investorCrit = await insertOne(db, "replacement_criteria", { exchange_id: investorEx.id, target_asset_types: [], target_states: [], target_price_min: 0, target_price_max: 0 }, "id");
  await db.from("exchanges").update({ criteria_id: investorCrit.id }).eq("id", investorEx.id);
  await db.from("pledged_properties").update({ exchange_id: investorEx.id }).eq("id", investorProp);

  // Buyer-side matches (the caller's active/in-ID exchanges x candidates).
  // Seed only pairs that the production engine itself approves. This keeps the
  // demo useful as a QA fixture instead of presenting fabricated scores or
  // impossible trade-down recommendations.
  const matchRows = await Promise.all([
    buildEngineMatch(db, marcus, prop["Brockton Main Street Mixed-Use"]),
    buildEngineMatch(db, patel, prop["Chelmsford Flex Building"]),
    buildEngineMatch(db, patel, prop["Brockton Main Street Mixed-Use"]),
    buildEngineMatch(db, wilson, prop["Brockton Main Street Mixed-Use"], { buyer_agent_viewed: true, buyer_agent_viewed_at: dFrom(-1) + "T18:00:00Z" }),
    buildEngineMatch(db, investorEx.id, prop["Brockton Main Street Mixed-Use"]),
    // Leave this second investor-owned match without a contact request so the
    // Investor Demo can exercise the complete "Ask My Agent to Connect" flow.
    buildEngineMatch(db, investorEx.id, prop["Chelmsford Flex Building"]),
  ]);
  const { data: matches, error: mErr } = await db.from("matches").insert(matchRows).select("id, buyer_exchange_id, seller_property_id");
  if (mErr) throw new Error(`matches insert failed: ${mErr.message}`);
  const matchId = (ex: string, p: string) => (matches ?? []).find((m: any) => m.buyer_exchange_id === ex && m.seller_property_id === p)?.id;
  const investorMatchId = matchId(investorEx.id, prop["Brockton Main Street Mixed-Use"]);

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
      property_id: prop["Brockton Main Street Mixed-Use"],
      representing_agent_id: ownerId,
      status: "requested",
      investor_note: "Please confirm the T-12 supports the projected return before contacting the listing agent.",
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
    metadata: { exchange_ids: [investorEx.id], assign_future: false, is_demo: true },
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

  // Inbound (seller-side) match: a counterparty buyer wants Boston-area small
  // multifamily, matched against the caller's own Dorchester listing.
  const jordan = cpAgent["Jordan Alvarez"];
  const inboundClient = await insertOne(db, "agent_clients", { agent_id: jordan, client_name: "Cardinal Multifamily Fund", client_company: "Cardinal Capital", client_email: "acq@cardinalcap.example", client_phone: "(508) 555-0210", notes: "Acquiring small Massachusetts multifamily.", is_demo: true, status: "active" }, "id");
  const inboundRelProp = await insertProperty(db, jordan, { name: "Salem Common Six-Family", address: "18 Winter St", city: "Salem", state: "MA", asset_type: "multifamily", strategy_type: "core_plus", units: 6, year_built: 1962, sf: 6400, description: "Relinquished asset for Cardinal's exchange.", f: fin({ ask: 1_150_000, cap: 3.2, gross: 84_000, occ: 96, loan: 450_000, rate: 4.8, maturity: "2030-09-01" }), img: IMG.mf }, true);
  const inboundEx = await insertOne(db, "exchanges", { agent_id: jordan, client_id: inboundClient.id, relinquished_property_id: inboundRelProp, is_demo: true, status: "active", exchange_proceeds: 700_000, estimated_equity: 700_000, identification_deadline: dFrom(40), closing_deadline: dFrom(175) }, "id");
  const inboundCrit = await insertOne(db, "replacement_criteria", { exchange_id: inboundEx.id, target_asset_types: ["multifamily"], target_states: ["MA"], target_price_min: 900_000, target_price_max: 2_000_000 }, "id");
  await db.from("exchanges").update({ criteria_id: inboundCrit.id }).eq("id", inboundEx.id);
  await db.from("pledged_properties").update({ exchange_id: inboundEx.id }).eq("id", inboundRelProp);
  const inboundMatchRow = await buildEngineMatch(db, inboundEx.id, prop["Dorchester Ave Three-Family"]);
  const { data: inboundMatch, error: inboundMatchError } = await db.from("matches").insert(inboundMatchRow).select("id").single();
  if (inboundMatchError) throw new Error(`inbound demo match insert failed: ${inboundMatchError.message}`);

  // Connections at varied lifecycle stages. Agent-to-agent conversations open
  // immediately once either verified agent starts them; no acceptance queue.
  // (a) Other agent started the conversation, no messages yet.
  await mustInsert(db, "exchange_connections", { match_id: matchId(marcus, prop["Brockton Main Street Mixed-Use"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: marcus, seller_exchange_id: null, status: "accepted", initiated_by: "seller_agent", accepted_at: dFrom(-1) + "T10:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (b) You started the conversation, no messages yet.
  await mustInsert(db, "exchange_connections", { match_id: matchId(patel, prop["Chelmsford Flex Building"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Priya Mehta"], buyer_exchange_id: patel, seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-1) + "T11:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (c) Accepted + conversing -> live message thread.
  const conn = await insertOne(db, "exchange_connections", { match_id: matchId(wilson, prop["Brockton Main Street Mixed-Use"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: wilson, seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-2) + "T16:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true }, "id");
  await mustInsert(db, "messages", [
    { connection_id: conn.id, sender_id: cpAgent["Elena Vasquez"], content: "Thanks for connecting - the Brockton mixed-use is available for a 1031 buyer. Happy to send the OM and rent roll." },
    { connection_id: conn.id, sender_id: ownerId, content: "Appreciate it. My client's on a 9-day ID clock, so speed matters. Can you also share the T-12 and the tenant's lease abstract?" },
    { connection_id: conn.id, sender_id: cpAgent["Elena Vasquez"], content: "Sending the package now. The value-add plan centers on leasing the remaining vacancy and below-market renewals." },
    { connection_id: conn.id, sender_id: ownerId, content: "Thanks - reviewing the T-12 and leasing assumptions with him this afternoon. Can we tour Thursday?" },
  ]);
  // (d) Declined -> "closed (lost)".
  await mustInsert(db, "exchange_connections", { match_id: matchId(patel, prop["Brockton Main Street Mixed-Use"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: patel, seller_exchange_id: null, status: "declined", initiated_by: "buyer_agent", declined_at: dFrom(-4) + "T12:00:00Z", decline_reason: "The office value-add strategy was not a fit for the trust.", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (e) Inbound accepted -> seller-side conversation on the caller's listing.
  if (inboundMatch) {
    await mustInsert(db, "exchange_connections", { match_id: inboundMatch.id, buyer_agent_id: jordan, seller_agent_id: ownerId, buyer_exchange_id: inboundEx.id, seller_exchange_id: marcus, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-1) + "T14:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true });
  }

  // Identification list for Wilson's in-identification exchange (his top picks).
  // Best-effort: this feature's schema may vary, so don't let it break the rebuild.
  try {
    await mustInsert(db, "identification_list", [
      { exchange_id: wilson, property_id: prop["Brockton Main Street Mixed-Use"], match_id: matchId(wilson, prop["Brockton Main Street Mixed-Use"]), position: 1, status: "identified" },
    ]);
  } catch (e) { console.warn("identification_list seed skipped:", (e as Error).message); }

  // Notifications (varied types; some unread). Tagged demo for clean teardown.
  await mustInsert(db, "notifications", [
    { user_id: ownerId, type: "new_match", title: "Qualified new match", message: "Brockton Main Street Mixed-Use (Brockton, MA) matched James Wilson's exchange.", link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "new_match", title: "Qualified new match", message: "Chelmsford Flex Building (Chelmsford, MA) matched the Patel Family Trust exchange.", link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_request", title: "New agent conversation", message: "Elena Vasquez started a conversation about Brockton Main Street Mixed-Use.", link_to: "/agent/pipeline", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_accepted", title: "Conversation active", message: "Your conversation with Elena Vasquez is ready for messaging.", link_to: "/agent/pipeline", read: true, metadata: { demo: true } },
  ]);

  // Investor view: a realistic shortlist. Direct investor -> listing-agent
  // inquiries were retired; the seeded contact request above exercises the new
  // agent-mediated workflow instead.
  await mustInsert(db, "investor_saved_properties", [
    { investor_id: ownerId, property_id: prop["Brockton Main Street Mixed-Use"], is_demo: true },
    { investor_id: ownerId, property_id: prop["Chelmsford Flex Building"], is_demo: true },
  ]);
  return { clients: OWN.length + 1, listings: OWN.length + 1, counterpartyProperties: Object.keys(prop).length - OWN.length - 1, matches: matchRows.length + 1, investorSaved: 2, investorInquiries: 0, representations: 4, representationInvites: 1, contactRequests: investorMatchId ? 1 : 0 };
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
// longer deletes) reuses an existing demo row for this agent+name instead of
// inserting a duplicate on every rebuild, refreshing its financials/image so the
// shared data stays coherent. The caller's own + per-build inbound properties are
// deleted on each reset, so they use a plain insert.
async function insertProperty(db: any, agentId: string, p: any, isDemo: boolean, status = "active", idempotent = false): Promise<string> {
  const fields = {
    agent_id: agentId, property_name: p.name, address: p.address, city: p.city, state: p.state,
    asset_type: p.asset_type, strategy_type: p.strategy_type, units: p.units, year_built: p.year_built,
    building_square_footage: p.sf, description: p.description, is_demo: isDemo,
    source: "agent_pledge", status, listed_at: status === "active" ? new Date().toISOString() : null,
    // Published (active) listings must carry the compliance attestation, otherwise
    // editing a seeded active listing is blocked (Save disabled) until the box is
    // re-checked. Drafts stay unconfirmed so the wizard prompts for it on publish.
    owner_authorization_confirmed: status === "active",
  };

  let propId: string;
  if (idempotent) {
    const { data: existing } = await db.from("pledged_properties")
      .select("id").eq("agent_id", agentId).eq("property_name", p.name).eq("is_demo", true).maybeSingle();
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

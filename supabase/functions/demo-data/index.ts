// Demo-workspace builder for 1031 Exchange Up.
//
// Fills (or clears) the CALLER's Demo workspace with a rich, realistic, fully
// isolated dataset designed to exercise every part of the app: clients in
// varied states, listings across every status, a counterparty network, matches
// spanning the boot/ROE scenarios, an inbound match on the caller's own listing,
// connections at different lifecycle stages, message threads, notifications, an
// identification list, and urgent/overdue deadlines. EVERYTHING is is_demo=true.
//
// SAFETY: every delete is filtered to is_demo = true (and agent_id = caller for
// the caller's own rows). It can never touch real/live data.
//
// Actions: "reset" (default) = wipe caller's demo data then rebuild; "clear" = wipe.
// Admin-only. Runs with the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Coherent financials: NOI = ask x cap; expenses = effective income - NOI; debt
// service amortized on the actual balance/rate. Stored figures are annual.
function fin(o: { ask: number; cap: number; gross: number; occ: number; loan: number; rate: number; maturity: string }) {
  const noi = Math.round(o.ask * o.cap / 100);
  const egi = Math.round(o.gross * o.occ / 100);
  const expenses = Math.max(egi - noi, Math.round(egi * 0.2));
  const r = o.rate / 100 / 12;
  const monthly = o.loan > 0 ? (o.loan * r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1) : 0;
  return {
    asking_price: o.ask, cap_rate: o.cap, noi,
    gross_rent_roll: o.gross, total_operating_expenses: expenses,
    annual_revenue: egi, annual_expenses: expenses,
    occupancy_rate: o.occ, loan_balance: o.loan, loan_rate: o.rate,
    loan_type: o.loan > 0 ? "Fixed-rate" : "Free & clear", loan_maturity_date: o.maturity,
    annual_debt_service: Math.round(monthly * 12),
  };
}

const IMG = {
  mf: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
  industrial: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
  medical: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=75&auto=format&fit=crop",
  office: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
};

// ── Counterparty network: 4 agents, 7 active replacement-candidate properties ─
const COUNTERPARTIES = [
  {
    email: "demo.agent.alvarez@replacefinder.test", full_name: "Jordan Alvarez", brokerage_name: "Alvarez Commercial Group",
    properties: [
      { name: "Sunrise Apartments", address: "1420 N 44th St", city: "Phoenix", state: "AZ", asset_type: "multifamily", strategy_type: "value_add", units: 48, year_built: 1998, sf: 42000,
        description: "Stabilized garden-style community in the Arcadia Lite corridor. 38 of 48 units renovated 2021-2023; remaining 10 classic units offer ~$180/mo mark-to-market upside. New roofs 2019, pool deck refreshed 2022. Easy access to Loop 202 and Sky Harbor.",
        f: fin({ ask: 4_950_000, cap: 6.6, gross: 555_000, occ: 94, loan: 2_700_000, rate: 6.25, maturity: "2031-03-01" }), img: IMG.mf },
      { name: "Mesa Gateway Plaza", address: "2210 S Power Rd", city: "Mesa", state: "AZ", asset_type: "retail", strategy_type: "core", units: 12, year_built: 2007, sf: 18400,
        description: "Fully leased neighborhood strip center at a signalized hard corner near Phoenix-Mesa Gateway Airport. 9 of 12 tenants on NNN leases with staggered expirations; national pharmacy anchor. Roof replaced 2021, LED site lighting 2022.",
        f: fin({ ask: 2_450_000, cap: 6.9, gross: 232_000, occ: 92, loan: 1_320_000, rate: 5.9, maturity: "2029-09-01" }), img: IMG.retail },
    ],
  },
  {
    email: "demo.agent.mehta@replacefinder.test", full_name: "Priya Mehta", brokerage_name: "Mehta Investment Realty",
    properties: [
      { name: "Crosspoint Industrial", address: "880 Industrial Pkwy", city: "Charlotte", state: "NC", asset_type: "industrial", strategy_type: "core_plus", units: 1, year_built: 2012, sf: 78000,
        description: "Single-tenant distribution facility leased to a regional 3PL through 2030 with 2.5% annual escalations. 24' clear, 8 dock-high doors, ESFR, fenced trailer yard. Assumable loan at 5.4%. I-485 access within a mile.",
        f: fin({ ask: 3_200_000, cap: 7.0, gross: 268_000, occ: 100, loan: 1_760_000, rate: 5.4, maturity: "2032-06-01" }), img: IMG.industrial },
      { name: "Queen City Medical Commons", address: "4310 Park Rd", city: "Charlotte", state: "NC", asset_type: "medical_office", strategy_type: "core", units: 14, year_built: 2016, sf: 26500,
        description: "96% occupied multi-tenant medical office adjacent to Atrium Health Pineville. WALT of 5.8 years across imaging, dental, and primary-care tenants. Generator backup, ADA suites, covered drop-off. Lobby refresh 2024.",
        f: fin({ ask: 4_100_000, cap: 6.5, gross: 392_000, occ: 96, loan: 2_250_000, rate: 5.75, maturity: "2033-01-01" }), img: IMG.medical },
    ],
  },
  {
    email: "demo.agent.brooks@replacefinder.test", full_name: "Daniel Brooks", brokerage_name: "Brooks & Lane CRE",
    properties: [
      { name: "Lakeline Flex Park", address: "11500 Lakeline Blvd", city: "Cedar Park", state: "TX", asset_type: "industrial", strategy_type: "value_add", units: 6, year_built: 2009, sf: 41200,
        description: "Six-suite flex/light-industrial park in the Austin growth corridor, 88% leased with two suites in shell condition ready for lease-up. In-place rents ~12% under market. Grade-level doors, 14-18' clear. Suite 4 white-boxed 2024.",
        f: fin({ ask: 2_850_000, cap: 7.3, gross: 296_000, occ: 88, loan: 1_540_000, rate: 6.5, maturity: "2030-04-01" }), img: IMG.industrial },
    ],
  },
  {
    email: "demo.agent.vasquez@replacefinder.test", full_name: "Elena Vasquez", brokerage_name: "Vasquez Realty Partners",
    properties: [
      { name: "Bayshore Court Apartments", address: "3804 W Azeele St", city: "Tampa", state: "FL", asset_type: "multifamily", strategy_type: "core_plus", units: 32, year_built: 2003, sf: 28400,
        description: "Courtyard community a mile from Bayshore Boulevard, 95% occupied. All roofs replaced 2023 post-storm (insurance-grade); 12 units upgraded 2022-2024 with 20 left to renovate. In-unit W/D, gated parking, courtyard pool.",
        f: fin({ ask: 4_600_000, cap: 6.4, gross: 470_000, occ: 95, loan: 2_530_000, rate: 5.95, maturity: "2033-08-01" }), img: IMG.mf },
      { name: "Westshore Corporate Center", address: "501 N Westshore Blvd", city: "Tampa", state: "FL", asset_type: "office", strategy_type: "value_add", units: 1, year_built: 2001, sf: 54000,
        description: "Multi-tenant suburban office in the Westshore submarket, 79% leased with recent spec-suite program driving leasing momentum. Below-market rents, structured parking, fitness center. Priced well below replacement cost.",
        f: fin({ ask: 5_200_000, cap: 7.6, gross: 690_000, occ: 79, loan: 2_900_000, rate: 6.8, maturity: "2031-11-01" }), img: IMG.office },
    ],
  },
];

// ── The caller's own clients + relinquished-property listings ─────────────────
const TODAY = new Date();
const dFrom = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const OWN = [
  // Draft — being prepared, not yet in the network.
  { client: { client_name: "Chen Family Investments", client_company: "Chen Family Investments LLC", client_email: "sarah.chen@example.com", client_phone: "(512) 555-0101", notes: "Repeat client. Sold a duplex portfolio in 2023. Prefers Texas multifamily, hands-off. Pre-approved with regional bank.", status: "active" },
    property: { name: "Riverbend Court", address: "1208 Pleasant Valley Rd", city: "Austin", state: "TX", asset_type: "multifamily", strategy_type: "core_plus", units: 18, year_built: 2008, sf: 16200,
      description: "DRAFT — gathering rent roll and T-12. 18-unit garden community in southeast Austin, 96% occupied, individually metered.",
      f: fin({ ask: 3_150_000, cap: 5.3, gross: 232_000, occ: 96, loan: 1_350_000, rate: 4.6, maturity: "2030-05-01" }), img: IMG.mf },
    exchange: { status: "draft" } },

  // Active — Marcus, multifamily, mid-clock.
  { client: { client_name: "Marcus Rodriguez", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example", client_phone: "(713) 555-0127", notes: "1031 veteran on his fourth exchange. Targets stabilized Sun Belt multifamily or retail. Open to assumable debt. Decisive once numbers pencil.", status: "active" },
    property: { name: "Heights Multifamily 24", address: "2400 Heights Blvd", city: "Houston", state: "TX", asset_type: "multifamily", strategy_type: "core_plus", units: 24, year_built: 2005, sf: 22800,
      description: "24-unit walk-up in Houston Heights. 14 of 24 units renovated 2021-2023; in-place rents ~8% under market on classic units. Roof replaced 2020, individual HVAC, gated parking. Walkable to the Heights hike-and-bike trail and I-10.",
      f: fin({ ask: 3_450_000, cap: 5.4, gross: 270_000, occ: 95, loan: 1_450_000, rate: 4.9, maturity: "2031-07-01" }), img: IMG.mf },
    exchange: { status: "active", exchange_proceeds: 2_000_000, estimated_equity: 2_000_000, estimated_basis: 1_150_000, estimated_gain: 850_000, estimated_tax_liability: 212_500, sale_close_date: dFrom(-20), identification_deadline: dFrom(25), closing_deadline: dFrom(160) } },

  // Active — Patel trust, retail.
  { client: { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example", client_phone: "(305) 555-0163", notes: "Trustee prioritizes passive, credit-tenant income. Open to medical office and net lease. No development or heavy value-add. Quarterly distributions matter.", status: "active" },
    property: { name: "Coral Way Retail Center", address: "5200 Coral Way", city: "Miami", state: "FL", asset_type: "retail", strategy_type: "core", units: 8, year_built: 2010, sf: 18500,
      description: "Eight-suite Coral Way strip center on a hard corner, credit anchor + local service tenants. Facade refresh and TPO roof 2022, hurricane-rated glazing. Stable in-place income with annual bumps.",
      f: fin({ ask: 2_900_000, cap: 5.8, gross: 235_000, occ: 100, loan: 1_220_000, rate: 5.1, maturity: "2030-02-01" }), img: IMG.retail },
    exchange: { status: "active", exchange_proceeds: 2_800_000, estimated_equity: 2_800_000, estimated_basis: 1_600_000, estimated_gain: 1_200_000, estimated_tax_liability: 300_000, sale_close_date: dFrom(-10), identification_deadline: dFrom(35), closing_deadline: dFrom(170) } },

  // In identification — Wilson, industrial, URGENT clock (9 days to ID).
  { client: { client_name: "James Wilson", client_email: "jwilson@example.com", client_phone: "(602) 555-0144", notes: "Selling a Phoenix warehouse; wants industrial near Austin or Charlotte. 45-day window closing fast — only actionable, well-located deals. Cash buyer if needed.", status: "active" },
    property: { name: "Desert Ridge Industrial", address: "9100 N Desert Ridge Dr", city: "Phoenix", state: "AZ", asset_type: "industrial", strategy_type: "value_add", units: 1, year_built: 2001, sf: 65000,
      description: "Single-tenant Phoenix warehouse; lease expires in 14 months, driving the exchange timeline. 20' clear, 6 dock doors, fenced yard. Office remodeled 2022, roof mid-life. Infill location with redevelopment optionality.",
      f: fin({ ask: 3_750_000, cap: 6.2, gross: 305_000, occ: 100, loan: 1_980_000, rate: 5.6, maturity: "2028-11-01" }), img: IMG.industrial },
    exchange: { status: "in_identification", exchange_proceeds: 1_770_000, estimated_equity: 1_770_000, estimated_basis: 1_000_000, estimated_gain: 770_000, estimated_tax_liability: 192_500, sale_close_date: dFrom(-36), identification_deadline: dFrom(9), closing_deadline: dFrom(144) } },

  // In closing — Aurora, office, closing in 12 days; ID window already passed.
  { client: { client_name: "Aurora Holdings", client_company: "Aurora Holdings Inc.", client_email: "ops@auroraholdings.example", client_phone: "(919) 555-0188", notes: "Family office, in closing on a Raleigh office disposition. Replacement identified; coordinating QI and lender. Needs clean execution.", status: "active" },
    property: { name: "Triangle Office Park", address: "120 Research Triangle Pkwy", city: "Raleigh", state: "NC", asset_type: "office", strategy_type: "core", units: 1, year_built: 2015, sf: 48000,
      description: "Class A office near Research Triangle Park, recently re-leased. Conference center, EV charging, structured parking. Lobby modernization 2023. Replacement purchase is in closing.",
      f: fin({ ask: 4_400_000, cap: 5.6, gross: 540_000, occ: 92, loan: 2_340_000, rate: 5.3, maturity: "2032-05-01" }), img: IMG.office },
    exchange: { status: "in_closing", exchange_proceeds: 2_060_000, estimated_equity: 2_060_000, estimated_basis: 1_400_000, estimated_gain: 660_000, estimated_tax_liability: 165_000, sale_close_date: dFrom(-60), identification_deadline: dFrom(-15), closing_deadline: dFrom(12) } },

  // Completed — historical, fully closed.
  { client: { client_name: "Brennan Stout", client_email: "bstout@example.com", client_phone: "(214) 555-0190", notes: "Closed exchange from earlier this year. Kept on file for repeat business; eyeing another disposition in Q4.", status: "inactive" },
    property: { name: "Lamar Self Storage", address: "6601 S Lamar Blvd", city: "Austin", state: "TX", asset_type: "industrial", strategy_type: "core", units: 1, year_built: 2014, sf: 52000,
      description: "Climate-controlled self-storage facility, sold and exchanged earlier this year. Retained for reference.",
      f: fin({ ask: 3_100_000, cap: 6.0, gross: 300_000, occ: 90, loan: 1_300_000, rate: 5.0, maturity: "2029-01-01" }), img: IMG.industrial },
    exchange: { status: "completed", exchange_proceeds: 1_800_000, estimated_equity: 1_800_000, estimated_basis: 1_050_000, estimated_gain: 750_000, estimated_tax_liability: 187_500, sale_close_date: dFrom(-180), identification_deadline: dFrom(-135), closing_deadline: dFrom(-8), actual_close_date: dFrom(-8) } },
];

function factors(total: number) {
  const c = (n: number) => Math.max(20, Math.min(100, Math.round(n)));
  return { price_score: c(total + 1), geo_score: 50, asset_score: 50, strategy_score: 50, financial_score: c(total - 4), timing_score: c(total + 3), scale_fit_score: c(total - 2), debt_fit_score: c(total - 4) };
}
// Match helper: ROE stored as RATIOS (0.052), pp as percentage points, rel as a ratio.
function match(buyerEx: string, sellerProp: string, total: number, curRoe: number, projRoe: number, boot: string, opts: Record<string, unknown> = {}) {
  return {
    buyer_exchange_id: buyerEx, seller_property_id: sellerProp, total_score: total, ...factors(total),
    boot_status: boot, buyer_current_roe: curRoe, candidate_roe: projRoe,
    roe_improvement_pp: Math.round((projRoe - curRoe) * 1000) / 10,
    roe_improvement_rel: curRoe > 0 ? Math.round((projRoe / curRoe - 1) * 100) / 100 : null,
    buyer_agent_viewed: false, status: "active", ...opts,
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

// ── Clear (is_demo only) ─────────────────────────────────────────────────────
async function clearOwnerDemo(db: any, ownerId: string) {
  const { data: exchanges } = await db.from("exchanges").select("id, criteria_id").eq("agent_id", ownerId).eq("is_demo", true);
  const exIds = (exchanges ?? []).map((e: any) => e.id);

  // Counterparty demo exchanges (for the inbound/seller-side match scenario).
  const { data: cpEx } = await db.from("exchanges").select("id, criteria_id").eq("is_demo", true).neq("agent_id", ownerId);
  const allExIds = [...exIds, ...(cpEx ?? []).map((e: any) => e.id)];

  if (allExIds.length) {
    const { data: conns } = await db.from("exchange_connections").select("id").in("buyer_exchange_id", allExIds);
    const connIds = (conns ?? []).map((c: any) => c.id);
    if (connIds.length) { await db.from("messages").delete().in("connection_id", connIds); await db.from("exchange_connections").delete().in("id", connIds); }
    await db.from("identification_list").delete().in("exchange_id", allExIds);
    await db.from("matches").delete().in("buyer_exchange_id", allExIds);
    await db.from("exchange_timeline").delete().in("exchange_id", allExIds);
    await db.from("exchanges").update({ criteria_id: null, relinquished_property_id: null }).in("id", allExIds);
    const critIds = [...(exchanges ?? []), ...(cpEx ?? [])].map((e: any) => e.criteria_id).filter(Boolean);
    if (critIds.length) await db.from("replacement_criteria").delete().in("id", critIds);
    await db.from("exchanges").delete().in("id", allExIds);
  }

  // All demo properties (owner + counterparty) + matches against them + children.
  const { data: props } = await db.from("pledged_properties").select("id").eq("is_demo", true);
  const propIds = (props ?? []).map((p: any) => p.id);
  if (propIds.length) {
    await db.from("matches").delete().in("seller_property_id", propIds);
    await db.from("property_financials").delete().in("property_id", propIds);
    await db.from("property_images").delete().in("property_id", propIds);
    await db.from("pledged_properties").delete().in("id", propIds);
  }

  await db.from("agent_clients").delete().eq("is_demo", true);
  await db.from("notifications").delete().eq("user_id", ownerId).contains("metadata", { demo: true });
}

// ── Build ────────────────────────────────────────────────────────────────────
async function buildOwnerDemo(db: any, ownerId: string) {
  const prop: Record<string, string> = {};         // property name -> id
  const cpAgent: Record<string, string> = {};       // agent full_name -> id

  // Counterparty agents + their active demo properties.
  const { data: userList } = await db.auth.admin.listUsers();
  for (const cp of COUNTERPARTIES) {
    let id = userList?.users.find((u: any) => u.email === cp.email)?.id ?? null;
    if (!id) {
      const { data: created, error } = await db.auth.admin.createUser({ email: cp.email, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: cp.full_name } });
      if (error) throw error;
      id = created.user!.id;
    }
    cpAgent[cp.full_name] = id;
    await db.from("profiles").upsert({ id, email: cp.email, full_name: cp.full_name, brokerage_name: cp.brokerage_name, verification_status: "verified" });
    const { data: hasRole } = await db.from("user_roles").select("user_id").eq("user_id", id).eq("role", "agent").maybeSingle();
    if (!hasRole) await mustInsert(db, "user_roles", { user_id: id, role: "agent" });
    for (const p of cp.properties) {
      prop[p.name] = await insertProperty(db, id, p, true);
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

  // Buyer-side matches (the caller's active/in-ID exchanges x candidates).
  const matchRows = [
    match(marcus, prop["Sunrise Apartments"], 91, 0.052, 0.074, "no_boot", { candidate_annual_debt_service: 199_500 }),
    match(marcus, prop["Lakeline Flex Park"], 86, 0.052, 0.081, "minor_boot", { estimated_cash_boot: 0, estimated_mortgage_boot: 120_000, estimated_total_boot: 120_000, estimated_boot_tax: 30_000, candidate_annual_debt_service: 116_800 }),
    match(marcus, prop["Mesa Gateway Plaza"], 74, 0.052, 0.068, "no_boot", { buyer_agent_viewed: true, buyer_agent_viewed_at: dFrom(-3) + "T15:00:00Z", candidate_annual_debt_service: 94_000 }),
    match(patel, prop["Queen City Medical Commons"], 88, 0.056, 0.072, "no_boot", { candidate_annual_debt_service: 157_600 }),
    match(patel, prop["Crosspoint Industrial"], 81, 0.056, 0.079, "minor_boot", { estimated_cash_boot: 95_000, estimated_mortgage_boot: 0, estimated_total_boot: 95_000, estimated_boot_tax: 23_750, candidate_annual_debt_service: 119_400 }),
    match(patel, prop["Bayshore Court Apartments"], 70, 0.056, 0.069, "no_boot", { candidate_annual_debt_service: 181_000 }),
    match(wilson, prop["Crosspoint Industrial"], 93, 0.064, 0.086, "no_boot", { buyer_agent_viewed: true, buyer_agent_viewed_at: dFrom(-1) + "T18:00:00Z", candidate_annual_debt_service: 119_400 }),
    match(wilson, prop["Lakeline Flex Park"], 89, 0.064, 0.090, "minor_boot", { estimated_cash_boot: 145_000, estimated_mortgage_boot: 0, estimated_total_boot: 145_000, estimated_boot_tax: 36_250, candidate_annual_debt_service: 116_800 }),
    match(wilson, prop["Westshore Corporate Center"], 61, 0.064, 0.071, "significant_boot", { estimated_cash_boot: 0, estimated_mortgage_boot: 920_000, estimated_total_boot: 920_000, estimated_boot_tax: 230_000, candidate_annual_debt_service: 246_000 }),
    match(wilson, prop["Bayshore Court Apartments"], 47, 0.064, null as any, "insufficient_data", { roe_improvement_pp: null, roe_improvement_rel: null }),
  ];
  const { data: matches, error: mErr } = await db.from("matches").insert(matchRows).select("id, buyer_exchange_id, seller_property_id");
  if (mErr) throw new Error(`matches insert failed: ${mErr.message}`);
  const matchId = (ex: string, p: string) => (matches ?? []).find((m: any) => m.buyer_exchange_id === ex && m.seller_property_id === p)?.id;

  // Inbound (seller-side) match: a counterparty buyer wants Houston multifamily,
  // matched against the caller's own Heights listing — exercises "incoming interest".
  const jordan = cpAgent["Jordan Alvarez"];
  const inboundClient = await insertOne(db, "agent_clients", { agent_id: jordan, client_name: "Cardinal Multifamily Fund", client_company: "Cardinal Capital", client_email: "acq@cardinalcap.example", client_phone: "(602) 555-0210", notes: "Acquiring Texas multifamily.", is_demo: true, status: "active" }, "id");
  const inboundRelProp = await insertProperty(db, jordan, { name: "Tempe Town Lake Apartments", address: "60 E Rio Salado Pkwy", city: "Tempe", state: "AZ", asset_type: "multifamily", strategy_type: "core_plus", units: 40, year_built: 2006, sf: 36000, description: "Relinquished asset for Cardinal's exchange.", f: fin({ ask: 6_200_000, cap: 5.2, gross: 470_000, occ: 96, loan: 3_000_000, rate: 4.8, maturity: "2030-09-01" }), img: IMG.mf }, true);
  const inboundEx = await insertOne(db, "exchanges", { agent_id: jordan, client_id: inboundClient.id, relinquished_property_id: inboundRelProp, is_demo: true, status: "active", exchange_proceeds: 3_000_000, estimated_equity: 3_000_000, identification_deadline: dFrom(40), closing_deadline: dFrom(175) }, "id");
  const inboundCrit = await insertOne(db, "replacement_criteria", { exchange_id: inboundEx.id, target_asset_types: ["multifamily"], target_states: ["TX"], target_price_min: 2_500_000, target_price_max: 4_500_000 }, "id");
  await db.from("exchanges").update({ criteria_id: inboundCrit.id }).eq("id", inboundEx.id);
  await db.from("pledged_properties").update({ exchange_id: inboundEx.id }).eq("id", inboundRelProp);
  const { data: inboundMatch } = await db.from("matches").insert(match(inboundEx.id, prop["Heights Multifamily 24"], 84, 0.049, 0.071, "no_boot", { candidate_annual_debt_service: 219_000 })).select("id").single();

  // Connections at varied lifecycle stages.
  // (a) Pending, the OTHER side initiated -> "needs your reply".
  await mustInsert(db, "exchange_connections", { match_id: matchId(marcus, prop["Sunrise Apartments"]), buyer_agent_id: ownerId, seller_agent_id: jordan, buyer_exchange_id: marcus, seller_exchange_id: null, status: "pending", initiated_by: "seller_agent", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (b) Pending, YOU initiated -> "awaiting response".
  await mustInsert(db, "exchange_connections", { match_id: matchId(patel, prop["Queen City Medical Commons"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Priya Mehta"], buyer_exchange_id: patel, seller_exchange_id: null, status: "pending", initiated_by: "buyer_agent", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (c) Accepted + conversing -> live message thread.
  const conn = await insertOne(db, "exchange_connections", { match_id: matchId(wilson, prop["Crosspoint Industrial"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Priya Mehta"], buyer_exchange_id: wilson, seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-2) + "T16:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true }, "id");
  await mustInsert(db, "messages", [
    { connection_id: conn.id, sender_id: cpAgent["Priya Mehta"], content: "Thanks for connecting — Crosspoint is a strong fit for an industrial 1031. Happy to send the OM and rent roll." },
    { connection_id: conn.id, sender_id: ownerId, content: "Appreciate it. My client's on a 9-day ID clock, so speed matters. Can you also share the T-12 and the tenant's lease abstract?" },
    { connection_id: conn.id, sender_id: cpAgent["Priya Mehta"], content: "Sending all three now. Tenant has 6 years left at 2.5% bumps, and the loan is assumable at 5.4% if that helps the debt replacement." },
    { connection_id: conn.id, sender_id: ownerId, content: "The assumable note could seal it — his relinquished debt is $1.98M. Reviewing with him this afternoon; can we tour Thursday?" },
  ]);
  // (d) Declined -> "closed (lost)".
  await mustInsert(db, "exchange_connections", { match_id: matchId(wilson, prop["Westshore Corporate Center"]), buyer_agent_id: ownerId, seller_agent_id: cpAgent["Elena Vasquez"], buyer_exchange_id: wilson, seller_exchange_id: null, status: "declined", initiated_by: "buyer_agent", declined_at: dFrom(-4) + "T12:00:00Z", decline_reason: "Boot exposure too high for the client's basis.", facilitation_fee_status: "pending", facilitation_fee_agreed: false });
  // (e) Inbound accepted -> seller-side conversation on the caller's listing.
  if (inboundMatch) {
    await mustInsert(db, "exchange_connections", { match_id: inboundMatch.id, buyer_agent_id: jordan, seller_agent_id: ownerId, buyer_exchange_id: inboundEx.id, seller_exchange_id: marcus, status: "accepted", initiated_by: "buyer_agent", accepted_at: dFrom(-1) + "T14:00:00Z", facilitation_fee_status: "pending", facilitation_fee_agreed: true });
  }

  // Identification list for Wilson's in-identification exchange (his top picks).
  // Best-effort: this feature's schema may vary, so don't let it break the rebuild.
  try {
    await mustInsert(db, "identification_list", [
      { exchange_id: wilson, property_id: prop["Crosspoint Industrial"], match_id: matchId(wilson, prop["Crosspoint Industrial"]), position: 1, status: "identified" },
      { exchange_id: wilson, property_id: prop["Lakeline Flex Park"], match_id: matchId(wilson, prop["Lakeline Flex Park"]), position: 2, status: "identified" },
    ]);
  } catch (e) { console.warn("identification_list seed skipped:", (e as Error).message); }

  // Notifications (varied types; some unread). Tagged demo for clean teardown.
  await mustInsert(db, "notifications", [
    { user_id: ownerId, type: "new_match", title: "Strong new match — score 93", message: "Crosspoint Industrial (Charlotte, NC) matched James Wilson's exchange.", link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "new_match", title: "New match — score 91", message: "Sunrise Apartments (Phoenix, AZ) matched Marcus Rodriguez's exchange.", link_to: "/agent/matches", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_request", title: "Connection request", message: "Jordan Alvarez wants to connect on Sunrise Apartments.", link_to: "/agent/pipeline", read: false, metadata: { demo: true } },
    { user_id: ownerId, type: "connection_accepted", title: "Connection accepted", message: "Priya Mehta accepted your connection on Crosspoint Industrial.", link_to: "/agent/pipeline", read: true, metadata: { demo: true } },
  ]);

  return { clients: OWN.length + 1, listings: OWN.length, counterpartyProperties: Object.keys(prop).length - OWN.length, matches: matchRows.length + 1 };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function insertProperty(db: any, agentId: string, p: any, isDemo: boolean, status = "active"): Promise<string> {
  const row = await insertOne(db, "pledged_properties", {
    agent_id: agentId, property_name: p.name, address: p.address, city: p.city, state: p.state,
    asset_type: p.asset_type, strategy_type: p.strategy_type, units: p.units, year_built: p.year_built,
    building_square_footage: p.sf, description: p.description, is_demo: isDemo,
    source: "agent_pledge", status, listed_at: status === "active" ? new Date().toISOString() : null,
  }, "id");
  await mustInsert(db, "property_financials", { property_id: row.id, ...p.f });
  await mustInsert(db, "property_images", { property_id: row.id, storage_path: p.img, file_name: "cover.jpg", sort_order: 0 });
  return row.id;
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

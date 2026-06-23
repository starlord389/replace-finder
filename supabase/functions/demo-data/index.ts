// Demo-workspace builder for 1031 Exchange Up.
//
// Fills (or clears) the CALLER's Demo workspace with realistic, fully-isolated
// mock data: a small network of counterparty agents + properties, the caller's
// own demo clients + listings, matches, and a sample conversation. EVERYTHING is
// stamped is_demo = true.
//
// SAFETY: every delete here is filtered to is_demo = true (and, for the caller's
// own rows, agent_id = caller). It can never touch real/live data.
//
// Actions (POST body { "action": "reset" | "clear" }):
//   "reset" (default) - wipe the caller's demo data, then rebuild a fresh set.
//   "clear"           - wipe the caller's demo data only.
//
// Admin-only (the product owner). Runs with the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Mock financials (coherent: NOI = ask x cap; expenses reconcile) ──────────
function buildFinancials(o: {
  ask: number; capRate: number; gsi: number; occupancy: number;
  loanBalance: number; loanRate: number;
}) {
  const noi = Math.round((o.ask * o.capRate) / 100);
  const egi = Math.round((o.gsi * o.occupancy) / 100);
  const expenses = Math.max(egi - noi, Math.round(egi * 0.18));
  const r = o.loanRate / 100 / 12;
  const monthly = o.loanBalance > 0
    ? (o.loanBalance * r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1)
    : 0;
  return {
    asking_price: o.ask,
    cap_rate: o.capRate,
    noi,
    gross_rent_roll: o.gsi,
    total_operating_expenses: expenses,
    annual_revenue: egi,
    annual_expenses: expenses,
    occupancy_rate: o.occupancy,
    loan_balance: o.loanBalance,
    loan_rate: o.loanRate,
    annual_debt_service: Math.round(monthly * 12),
  };
}

const IMG = {
  multifamily: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
  industrial: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
};

// 2 counterparty agents, 3 active demo properties between them.
const COUNTERPARTIES = [
  {
    email: "demo.agent.alvarez@replacefinder.test",
    full_name: "Jordan Alvarez",
    brokerage_name: "Alvarez Commercial Group",
    properties: [
      {
        details: {
          property_name: "Sunrise Apartments", address: "1420 Mockingbird Ln",
          city: "Phoenix", state: "AZ", asset_type: "multifamily",
          units: 48, year_built: 1998, building_square_footage: 42000,
          description: "Stabilized garden-style multifamily in the Arcadia Lite corridor.",
        },
        financials: buildFinancials({ ask: 4_950_000, capRate: 5.9, gsi: 365_000, occupancy: 94, loanBalance: 2_700_000, loanRate: 6.25 }),
        image: IMG.multifamily,
      },
      {
        details: {
          property_name: "Mesa Gateway Plaza", address: "2210 S Power Rd",
          city: "Mesa", state: "AZ", asset_type: "retail",
          units: 12, year_built: 2007, building_square_footage: 18400,
          description: "Fully leased neighborhood strip center at a signalized hard corner.",
        },
        financials: buildFinancials({ ask: 2_450_000, capRate: 6.4, gsi: 196_000, occupancy: 92, loanBalance: 1_320_000, loanRate: 5.9 }),
        image: IMG.retail,
      },
    ],
  },
  {
    email: "demo.agent.mehta@replacefinder.test",
    full_name: "Priya Mehta",
    brokerage_name: "Mehta Investment Realty",
    properties: [
      {
        details: {
          property_name: "Crosspoint Industrial", address: "880 Industrial Pkwy",
          city: "Charlotte", state: "NC", asset_type: "industrial",
          units: 1, year_built: 2012, building_square_footage: 78000,
          description: "Single-tenant distribution facility leased through 2030 with 2.5% escalations.",
        },
        financials: buildFinancials({ ask: 3_200_000, capRate: 6.8, gsi: 245_000, occupancy: 100, loanBalance: 1_760_000, loanRate: 5.4 }),
        image: IMG.industrial,
      },
    ],
  },
];

// The caller's own demo clients + relinquished-property listings.
const OWN = [
  {
    client: { client_name: "Marcus Rodriguez LLC", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example", client_phone: "555-0127", notes: "1031 veteran; targets stabilized multifamily or retail in the Sun Belt." },
    property: {
      details: { property_name: "Heights Multifamily 24", address: "2400 Heights Blvd", city: "Houston", state: "TX", asset_type: "multifamily", units: 24, year_built: 2005, building_square_footage: 22800, description: "24-unit walk-up in Houston Heights." },
      financials: buildFinancials({ ask: 3_450_000, capRate: 5.7, gsi: 250_000, occupancy: 95, loanBalance: 1_450_000, loanRate: 4.9 }),
      image: IMG.multifamily,
    },
    exchange: { exchange_proceeds: 2_000_000, estimated_equity: 2_000_000 },
  },
  {
    client: { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example", client_phone: "555-0163", notes: "Trust sale; trustee wants passive, credit-tenant income." },
    property: {
      details: { property_name: "Coral Way Retail Center", address: "5200 Coral Way", city: "Miami", state: "FL", asset_type: "retail", units: 8, year_built: 2010, building_square_footage: 18500, description: "Eight-suite Coral Way strip center." },
      financials: buildFinancials({ ask: 2_900_000, capRate: 6.1, gsi: 220_000, occupancy: 100, loanBalance: 1_220_000, loanRate: 5.1 }),
      image: IMG.retail,
    },
    exchange: { exchange_proceeds: 2_800_000, estimated_equity: 2_800_000 },
  },
];

function factors(total: number) {
  const c = (n: number) => Math.max(20, Math.min(100, Math.round(n)));
  return {
    price_score: c(total + 1), geo_score: 50, asset_score: 50, strategy_score: 50,
    financial_score: c(total - 4), timing_score: c(total + 3), scale_fit_score: c(total - 2), debt_fit_score: c(total - 4),
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

    // Owner-only: caller must have the admin role.
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

// ── Clear: only ever deletes is_demo rows. ───────────────────────────────────
async function clearOwnerDemo(db: any, ownerId: string) {
  // Caller's demo exchanges + everything hanging off them.
  const { data: exchanges } = await db.from("exchanges").select("id, criteria_id").eq("agent_id", ownerId).eq("is_demo", true);
  const exIds = (exchanges ?? []).map((e: any) => e.id);
  if (exIds.length) {
    const { data: conns } = await db.from("exchange_connections").select("id").in("buyer_exchange_id", exIds);
    const connIds = (conns ?? []).map((c: any) => c.id);
    if (connIds.length) {
      await db.from("messages").delete().in("connection_id", connIds);
      await db.from("exchange_connections").delete().in("id", connIds);
    }
    await db.from("matches").delete().in("buyer_exchange_id", exIds);
    await db.from("exchange_timeline").delete().in("exchange_id", exIds);
    const critIds = (exchanges ?? []).map((e: any) => e.criteria_id).filter(Boolean);
    await db.from("exchanges").update({ criteria_id: null, relinquished_property_id: null }).in("id", exIds);
    if (critIds.length) await db.from("replacement_criteria").delete().in("id", critIds);
    await db.from("exchanges").delete().in("id", exIds);
  }

  // Caller's demo properties + children.
  const { data: props } = await db.from("pledged_properties").select("id").eq("agent_id", ownerId).eq("is_demo", true);
  await deleteProperties(db, (props ?? []).map((p: any) => p.id));

  // Counterparty demo properties + matches against them (seller side).
  const { data: cpProps } = await db.from("pledged_properties").select("id").eq("is_demo", true).neq("agent_id", ownerId);
  const cpIds = (cpProps ?? []).map((p: any) => p.id);
  if (cpIds.length) {
    await db.from("matches").delete().in("seller_property_id", cpIds);
    await deleteProperties(db, cpIds);
  }

  // Caller's demo clients.
  await db.from("agent_clients").delete().eq("agent_id", ownerId).eq("is_demo", true);
}

async function deleteProperties(db: any, propIds: string[]) {
  if (!propIds.length) return;
  await db.from("property_financials").delete().in("property_id", propIds);
  await db.from("property_images").delete().in("property_id", propIds);
  await db.from("pledged_properties").delete().in("id", propIds);
}

// ── Build: counterparties + caller's demo workspace. ─────────────────────────
async function buildOwnerDemo(db: any, ownerId: string) {
  const propByName: Record<string, string> = {};

  // Counterparty agents + their active demo properties.
  const { data: userList } = await db.auth.admin.listUsers();
  for (const cp of COUNTERPARTIES) {
    let cpId = userList?.users.find((u: any) => u.email === cp.email)?.id ?? null;
    if (!cpId) {
      const { data: created, error } = await db.auth.admin.createUser({ email: cp.email, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: cp.full_name } });
      if (error) throw error;
      cpId = created.user!.id;
    }
    await db.from("profiles").upsert({ id: cpId, email: cp.email, full_name: cp.full_name, brokerage_name: cp.brokerage_name, verification_status: "verified" });
    const { data: hasRole } = await db.from("user_roles").select("user_id").eq("user_id", cpId).eq("role", "agent").maybeSingle();
    if (!hasRole) await db.from("user_roles").insert({ user_id: cpId, role: "agent" });

    for (const p of cp.properties) {
      const { data: prop } = await db.from("pledged_properties").insert({ agent_id: cpId, ...p.details, is_demo: true, source: "agent_pledge", status: "active", listed_at: new Date().toISOString() }).select("id").single();
      propByName[p.details.property_name] = prop.id;
      await mustInsert(db, "property_financials", { property_id: prop.id, ...p.financials });
      await mustInsert(db, "property_images", { property_id: prop.id, storage_path: p.image, file_name: "cover.jpg", sort_order: 0 });
    }
  }

  // Caller's demo clients + listings.
  const ownExchanges: { id: string; relinquishedFin: any }[] = [];
  for (const o of OWN) {
    const { data: client } = await db.from("agent_clients").insert({ agent_id: ownerId, ...o.client, is_demo: true, status: "active" }).select("id").single();
    const { data: prop } = await db.from("pledged_properties").insert({ agent_id: ownerId, ...o.property.details, is_demo: true, source: "agent_pledge", status: "active", listed_at: new Date().toISOString() }).select("id").single();
    await mustInsert(db, "property_financials", { property_id: prop.id, ...o.property.financials });
    await mustInsert(db, "property_images", { property_id: prop.id, storage_path: o.property.image, file_name: "cover.jpg", sort_order: 0 });

    // Exchange first, then criteria referencing it, then link them (matches the
    // order create-exchange uses, so replacement_criteria.exchange_id is never null).
    const { data: ex } = await db.from("exchanges").insert({ agent_id: ownerId, client_id: client.id, relinquished_property_id: prop.id, is_demo: true, status: "active", exchange_proceeds: o.exchange.exchange_proceeds, estimated_equity: o.exchange.estimated_equity, identification_deadline: daysFromNow(30), closing_deadline: daysFromNow(165) }).select("id").single();
    const { data: crit } = await db.from("replacement_criteria").insert({ exchange_id: ex.id, target_asset_types: [], target_states: [], target_price_min: 0, target_price_max: 0 }).select("id").single();
    await db.from("exchanges").update({ criteria_id: crit.id }).eq("id", ex.id);
    await db.from("pledged_properties").update({ exchange_id: ex.id }).eq("id", prop.id);
    ownExchanges.push({ id: ex.id, relinquishedFin: o.property.financials });
  }

  // Hardcoded matches (reliable for demos). ROE stored as RATIOS (0.052), pp as
  // percentage points, rel as a ratio — matching the live engine's convention.
  const marcus = ownExchanges[0].id;
  const patel = ownExchanges[1].id;
  const matchRows = [
    { buyer_exchange_id: marcus, seller_property_id: propByName["Sunrise Apartments"], total_score: 94, ...factors(94), boot_status: "no_boot", buyer_current_roe: 0.052, candidate_roe: 0.091, roe_improvement_pp: 3.9, roe_improvement_rel: 0.75, candidate_annual_debt_service: 199_512 },
    { buyer_exchange_id: marcus, seller_property_id: propByName["Mesa Gateway Plaza"], total_score: 82, ...factors(82), boot_status: "minor_boot", estimated_total_boot: 130_000, estimated_boot_tax: 32_500, buyer_current_roe: 0.052, candidate_roe: 0.078, roe_improvement_pp: 2.6, roe_improvement_rel: 0.50, candidate_annual_debt_service: 93_950 },
    { buyer_exchange_id: patel, seller_property_id: propByName["Crosspoint Industrial"], total_score: 88, ...factors(88), boot_status: "no_boot", buyer_current_roe: 0.058, candidate_roe: 0.089, roe_improvement_pp: 3.1, roe_improvement_rel: 0.53, candidate_annual_debt_service: 119_369 },
    { buyer_exchange_id: patel, seller_property_id: propByName["Sunrise Apartments"], total_score: 73, ...factors(73), boot_status: "no_boot", buyer_current_roe: 0.058, candidate_roe: 0.076, roe_improvement_pp: 1.8, roe_improvement_rel: 0.31, candidate_annual_debt_service: 199_512 },
  ].map((m) => ({ ...m, buyer_agent_viewed: false, status: "active" }));
  const { data: matches, error: matchErr } = await db.from("matches").insert(matchRows).select("id, seller_property_id");
  if (matchErr) throw new Error(`matches insert failed: ${matchErr.message}`);

  // One accepted connection + a short message thread, on the Crosspoint match.
  const crosspointMatch = (matches ?? []).find((m: any) => m.seller_property_id === propByName["Crosspoint Industrial"]);
  if (crosspointMatch) {
    const sellerAgentId = (await db.from("pledged_properties").select("agent_id").eq("id", propByName["Crosspoint Industrial"]).single()).data.agent_id;
    const { data: conn } = await db.from("exchange_connections").insert({ match_id: crosspointMatch.id, buyer_agent_id: ownerId, seller_agent_id: sellerAgentId, buyer_exchange_id: patel, seller_exchange_id: null, status: "accepted", initiated_by: "buyer_agent", accepted_at: new Date().toISOString(), facilitation_fee_agreed: true, facilitation_fee_status: "pending" }).select("id").single();
    await mustInsert(db, "messages", [
      { connection_id: conn.id, sender_id: sellerAgentId, content: "Thanks for connecting — Crosspoint is a great industrial 1031 fit. Happy to send the OM." },
      { connection_id: conn.id, sender_id: ownerId, content: "Appreciate it. My client is on a tight ID clock — can you send the T-12 and rent roll?" },
      { connection_id: conn.id, sender_id: sellerAgentId, content: "Sending now. Loan is assumable at 5.4% if that helps the debt replacement." },
    ]);
  }

  return { clients: OWN.length, listings: OWN.length, counterpartyProperties: Object.keys(propByName).length, matches: matchRows.length };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
// Insert that surfaces failures instead of silently swallowing them.
async function mustInsert(db: any, table: string, rows: any) {
  const { error } = await db.from(table).insert(rows);
  if (error) throw new Error(`${table} insert failed: ${error.message}`);
}
function daysFromNow(d: number) { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); }

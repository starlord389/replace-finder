import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEMO_PREFIX = "[Demo]";
const DEMO_AGENT_EMAILS = [
  "demo-agent-1@example.invalid",
  "demo-agent-2@example.invalid",
  "demo-agent-3@example.invalid",
];
const DEMO_AGENT_NAMES = [
  "[Demo] Skyline Brokerage",
  "[Demo] Harborview Realty",
  "[Demo] Summit Capital Advisors",
];
const PHOTO_BUCKET = "property-images";
const PHOTO_COUNT = 6;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return respond({ error: "Unauthorized" }, 401);

    const db = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await db.from("profiles").select("role, full_name").eq("id", user.id).single();
    if (profile?.role !== "agent") return respond({ error: "Agent role required" }, 403);

    const payload = (await req.json().catch(() => ({}))) as { action?: string };
    const action = payload.action ?? "seed";

    if (action === "reset") {
      const summary = await resetDemoData(db, user.id);
      return respond({ ok: true, action: "reset", ...summary });
    }

    if (action === "seed") {
      await resetDemoData(db, user.id);
      const summary = await seedDemoData(db, user.id, profile?.full_name ?? "Your Agency");
      return respond({ ok: true, action: "seed", ...summary });
    }

    return respond({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error("seed-demo-data error", error);
    return respond({ error: (error as Error).message }, 500);
  }
});

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureDemoAgents(db: SupabaseClient): Promise<string[]> {
  const agentIds: string[] = [];

  for (let i = 0; i < DEMO_AGENT_EMAILS.length; i++) {
    const email = DEMO_AGENT_EMAILS[i];
    const name = DEMO_AGENT_NAMES[i];

    const { data: listPage } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = listPage?.users?.find((u) => u.email === email);

    if (existing) {
      agentIds.push(existing.id);
      continue;
    }

    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        full_name: name,
        phone: "555-0100",
        role: "agent",
        mls_number: `DEMO-${1000 + i}`,
        license_state: "CA",
        brokerage_name: name,
        verification_path: "self_certified",
        self_certified_at: new Date().toISOString(),
      },
    });
    if (error || !created?.user) throw error ?? new Error("Failed to create demo agent");
    agentIds.push(created.user.id);
  }

  return agentIds;
}

async function ensurePhotos(db: SupabaseClient): Promise<string[]> {
  const paths: string[] = [];

  for (let i = 1; i <= PHOTO_COUNT; i++) {
    const path = `seed/demo-${i}.jpg`;
    paths.push(path);

    const { data: existingList } = await db.storage.from(PHOTO_BUCKET).list("seed", {
      search: `demo-${i}.jpg`,
      limit: 1,
    });
    if (existingList && existingList.length > 0) continue;

    try {
      const res = await fetch(`https://picsum.photos/seed/property${i}/1200/800`);
      if (!res.ok) throw new Error(`picsum fetch failed: ${res.status}`);
      const blob = await res.blob();
      const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
    } catch (err) {
      console.warn(`Failed to seed photo ${i}:`, err);
    }
  }

  return paths;
}

async function resetDemoData(db: SupabaseClient, currentAgentId: string) {
  const demoAgentIds: string[] = [];
  const { data: listPage } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const u of listPage?.users ?? []) {
    if (DEMO_AGENT_EMAILS.includes(u.email ?? "")) demoAgentIds.push(u.id);
  }

  const counterpartyOrClause = demoAgentIds.length
    ? demoAgentIds.map((id) => `agent_id.eq.${id}`).join(",")
    : null;

  const { data: currentAgentClients } = await db
    .from("agent_clients")
    .select("id")
    .eq("agent_id", currentAgentId)
    .like("client_name", `${DEMO_PREFIX}%`);
  const currentAgentClientIds = (currentAgentClients ?? []).map((c) => c.id);

  let exchangeIds: string[] = [];
  if (currentAgentClientIds.length) {
    const { data } = await db
      .from("exchanges")
      .select("id")
      .in("client_id", currentAgentClientIds);
    exchangeIds = (data ?? []).map((e) => e.id);
  }
  if (counterpartyOrClause) {
    const { data } = await db.from("exchanges").select("id").or(counterpartyOrClause);
    for (const e of data ?? []) if (!exchangeIds.includes(e.id)) exchangeIds.push(e.id);
  }

  if (exchangeIds.length) {
    const { data: connections } = await db
      .from("exchange_connections")
      .select("id")
      .or(`buyer_exchange_id.in.(${exchangeIds.join(",")}),seller_exchange_id.in.(${exchangeIds.join(",")})`);
    const connectionIds = (connections ?? []).map((c) => c.id);
    if (connectionIds.length) {
      await db.from("messages").delete().in("connection_id", connectionIds);
      await db.from("exchange_connections").delete().in("id", connectionIds);
    }

    await db.from("matches").delete().in("buyer_exchange_id", exchangeIds);
    await db.from("exchange_timeline").delete().in("exchange_id", exchangeIds);
    await db.from("replacement_criteria").delete().in("exchange_id", exchangeIds);
    await db.from("exchanges").update({ relinquished_property_id: null, criteria_id: null }).in("id", exchangeIds);
  }

  if (counterpartyOrClause) {
    const { data: counterpartyProps } = await db.from("pledged_properties").select("id").or(counterpartyOrClause);
    const ids = (counterpartyProps ?? []).map((p) => p.id);
    if (ids.length) {
      await db.from("property_images").delete().in("property_id", ids);
      await db.from("property_financials").delete().in("property_id", ids);
      await db.from("matches").delete().in("seller_property_id", ids);
      await db.from("pledged_properties").delete().in("id", ids);
    }
  }

  if (currentAgentClientIds.length) {
    const { data: myProps } = await db
      .from("pledged_properties")
      .select("id")
      .eq("agent_id", currentAgentId)
      .like("property_name", `${DEMO_PREFIX}%`);
    const myPropIds = (myProps ?? []).map((p) => p.id);
    if (myPropIds.length) {
      await db.from("property_images").delete().in("property_id", myPropIds);
      await db.from("property_financials").delete().in("property_id", myPropIds);
      await db.from("matches").delete().in("seller_property_id", myPropIds);
      await db.from("pledged_properties").delete().in("id", myPropIds);
    }
  }

  if (exchangeIds.length) {
    await db.from("exchanges").delete().in("id", exchangeIds);
  }
  if (currentAgentClientIds.length) {
    await db.from("agent_clients").delete().in("id", currentAgentClientIds);
  }

  await db
    .from("notifications")
    .delete()
    .eq("user_id", currentAgentId)
    .like("title", `${DEMO_PREFIX}%`);

  await db
    .from("support_tickets")
    .delete()
    .eq("user_id", currentAgentId)
    .like("subject", `${DEMO_PREFIX}%`);

  for (const id of demoAgentIds) {
    await db.auth.admin.deleteUser(id);
  }

  return { deletedAgents: demoAgentIds.length, deletedExchanges: exchangeIds.length };
}

async function seedDemoData(db: SupabaseClient, agentId: string, agentDisplayName: string) {
  const counterpartyIds = await ensureDemoAgents(db);
  const photoPaths = await ensurePhotos(db);

  const clients = await seedClients(db, agentId);
  const counterpartyProps = await seedCounterpartyProperties(db, counterpartyIds, photoPaths);
  const counterpartyExchanges = await seedCounterpartyExchanges(db, counterpartyIds, counterpartyProps);
  const myExchanges = await seedMyExchanges(db, agentId, clients, photoPaths);
  const matches = await seedMatches(db, myExchanges, counterpartyProps);
  const reverseMatches = await seedReverseMatches(db, counterpartyExchanges, myExchanges);
  await seedConnections(db, agentId, counterpartyIds, myExchanges, counterpartyExchanges, matches, reverseMatches);
  await seedNotifications(db, agentId);
  await seedSupportTicket(db, agentId);

  void agentDisplayName;

  return {
    clients: clients.length,
    myExchanges: myExchanges.length,
    counterpartyProperties: counterpartyProps.length,
    matches: matches.length + reverseMatches.length,
  };
}

interface Client { id: string; name: string }

async function seedClients(db: SupabaseClient, agentId: string): Promise<Client[]> {
  const rows = [
    { client_name: `${DEMO_PREFIX} Alex Morgan`, client_email: "alex.morgan@example.invalid", client_phone: "555-0110", client_company: "Morgan Holdings LLC", status: "active" },
    { client_name: `${DEMO_PREFIX} Priya Shah`, client_email: "priya.shah@example.invalid", client_phone: "555-0111", client_company: "Shah Family Trust", status: "active" },
    { client_name: `${DEMO_PREFIX} Marcus Bell`, client_email: "marcus.bell@example.invalid", client_phone: "555-0112", client_company: "Bell Ventures", status: "active" },
    { client_name: `${DEMO_PREFIX} Dana Park`, client_email: "dana.park@example.invalid", client_phone: "555-0113", client_company: null, status: "inactive" },
  ].map((r) => ({ ...r, agent_id: agentId, notes: "Seeded demo client" }));

  const { data, error } = await db.from("agent_clients").insert(rows).select("id, client_name");
  if (error) throw error;
  return (data ?? []).map((d) => ({ id: d.id as string, name: d.client_name as string }));
}

interface PropertyRef { id: string; agentId: string; askingPrice: number; state: string; assetType: string }

async function seedCounterpartyProperties(
  db: SupabaseClient,
  counterpartyIds: string[],
  photoPaths: string[],
): Promise<PropertyRef[]> {
  const propertyTemplates = [
    { name: "Crescent Ridge Apartments", address: "1450 Crescent Blvd", city: "Austin", state: "TX", zip: "78704", asset: "multifamily", year: 2015, units: 120, sf: 98000, ask: 18500000, noi: 1200000, cap: 6.5, occ: 94, loan: 9000000 },
    { name: "Harbor Point Medical Plaza", address: "200 Harbor Pt", city: "Long Beach", state: "CA", zip: "90802", asset: "medical_office", year: 2008, units: 22, sf: 65000, ask: 14200000, noi: 980000, cap: 6.9, occ: 97, loan: 6200000 },
    { name: "Meridian Industrial Park", address: "4500 Meridian Ave", city: "Phoenix", state: "AZ", zip: "85040", asset: "industrial", year: 2019, units: 8, sf: 145000, ask: 22000000, noi: 1500000, cap: 6.8, occ: 100, loan: 11500000 },
    { name: "Summit Retail Center", address: "900 Summit Pkwy", city: "Denver", state: "CO", zip: "80202", asset: "retail", year: 2010, units: 14, sf: 52000, ask: 9800000, noi: 720000, cap: 7.3, occ: 92, loan: 4500000 },
    { name: "Lakeside Self-Storage", address: "310 Lakeside Dr", city: "Nashville", state: "TN", zip: "37203", asset: "self_storage", year: 2017, units: 620, sf: 78000, ask: 12500000, noi: 900000, cap: 7.2, occ: 89, loan: 5200000 },
    { name: "The Halsted Mixed-Use", address: "2200 Halsted St", city: "Chicago", state: "IL", zip: "60614", asset: "mixed_use", year: 2012, units: 45, sf: 62000, ask: 11750000, noi: 820000, cap: 6.9, occ: 96, loan: 5800000 },
    { name: "Cobalt Net-Lease Portfolio", address: "N/A", city: "Dallas", state: "TX", zip: "75201", asset: "net_lease", year: 2020, units: 5, sf: 42000, ask: 8600000, noi: 540000, cap: 6.3, occ: 100, loan: 3800000 },
    { name: "Sunridge Office Tower", address: "500 Sunridge Ln", city: "Scottsdale", state: "AZ", zip: "85251", asset: "office", year: 2005, units: 38, sf: 140000, ask: 24500000, noi: 1620000, cap: 6.6, occ: 87, loan: 11200000 },
  ];

  const properties: PropertyRef[] = [];

  for (let i = 0; i < propertyTemplates.length; i++) {
    const t = propertyTemplates[i];
    const ownerId = counterpartyIds[i % counterpartyIds.length];
    const photoOffset = i % photoPaths.length;

    const { data: prop, error: propErr } = await db.from("pledged_properties").insert({
      agent_id: ownerId,
      source: "agent_pledge",
      property_name: `${DEMO_PREFIX} ${t.name}`,
      address: t.address,
      city: t.city,
      state: t.state,
      zip: t.zip,
      asset_type: t.asset,
      year_built: t.year,
      units: t.units,
      building_square_footage: t.sf,
      description: `${t.name} is a seeded demo listing used for local testing. Solid in-place cash flow with stabilized tenancy.`,
      status: "active",
      listed_at: new Date().toISOString(),
    }).select("id").single();
    if (propErr || !prop) throw propErr ?? new Error("property insert failed");
    const propertyId = prop.id as string;

    await db.from("property_financials").insert({
      property_id: propertyId,
      asking_price: t.ask,
      noi: t.noi,
      cap_rate: t.cap,
      occupancy_rate: t.occ,
      loan_balance: t.loan,
    });

    const imageRows = [0, 1, 2].map((k) => ({
      property_id: propertyId,
      storage_path: photoPaths[(photoOffset + k) % photoPaths.length],
      file_name: `demo-${(photoOffset + k) % photoPaths.length + 1}.jpg`,
      sort_order: k,
    }));
    await db.from("property_images").insert(imageRows);

    properties.push({ id: propertyId, agentId: ownerId, askingPrice: t.ask, state: t.state, assetType: t.asset });
  }

  return properties;
}

interface CounterpartyExchange { id: string; agentId: string; relinquishedPropertyId: string }

async function seedCounterpartyExchanges(
  db: SupabaseClient,
  counterpartyIds: string[],
  props: PropertyRef[],
): Promise<CounterpartyExchange[]> {
  const results: CounterpartyExchange[] = [];

  for (let i = 0; i < counterpartyIds.length; i++) {
    const agentId = counterpartyIds[i];
    const ownedProps = props.filter((p) => p.agentId === agentId);
    if (!ownedProps.length) continue;
    const relinquishedProp = ownedProps[0];

    const { data: client, error: clientErr } = await db.from("agent_clients").insert({
      agent_id: agentId,
      client_name: `${DEMO_PREFIX} Counterparty Client ${i + 1}`,
      status: "active",
    }).select("id").single();
    if (clientErr || !client) throw clientErr ?? new Error("counterparty client insert failed");

    const { data: exchange, error: exchErr } = await db.from("exchanges").insert({
      agent_id: agentId,
      client_id: client.id,
      status: "active",
      relinquished_property_id: relinquishedProp.id,
      exchange_proceeds: Math.round(relinquishedProp.askingPrice * 0.45),
      estimated_equity: Math.round(relinquishedProp.askingPrice * 0.5),
      sale_close_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      identification_deadline: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      closing_deadline: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    }).select("id").single();
    if (exchErr || !exchange) throw exchErr ?? new Error("counterparty exchange insert failed");

    const { data: criteria, error: critErr } = await db.from("replacement_criteria").insert({
      exchange_id: exchange.id,
      target_asset_types: ["multifamily", "industrial", "retail"],
      target_states: ["CA", "TX", "AZ", "CO"],
      target_price_min: 5000000,
      target_price_max: 30000000,
    }).select("id").single();
    if (critErr || !criteria) throw critErr ?? new Error("counterparty criteria insert failed");

    await db.from("exchanges").update({ criteria_id: criteria.id }).eq("id", exchange.id);
    await db.from("pledged_properties").update({ exchange_id: exchange.id }).eq("id", relinquishedProp.id);

    results.push({ id: exchange.id, agentId, relinquishedPropertyId: relinquishedProp.id });
  }

  return results;
}

interface MyExchange { id: string; clientId: string; status: string; relinquishedPropertyId: string; askingPrice: number }

async function seedMyExchanges(
  db: SupabaseClient,
  agentId: string,
  clients: Client[],
  photoPaths: string[],
): Promise<MyExchange[]> {
  const statuses: Array<{ status: string; ask: number; noi: number; loan: number; offsetDays: number }> = [
    { status: "draft", ask: 4200000, noi: 285000, loan: 2100000, offsetDays: 0 },
    { status: "active", ask: 6800000, noi: 465000, loan: 3400000, offsetDays: 5 },
    { status: "active", ask: 9500000, noi: 680000, loan: 5100000, offsetDays: 10 },
    { status: "in_identification", ask: 7600000, noi: 520000, loan: 3900000, offsetDays: 30 },
    { status: "in_closing", ask: 5400000, noi: 360000, loan: 2700000, offsetDays: 120 },
    { status: "completed", ask: 4900000, noi: 330000, loan: 2400000, offsetDays: 200 },
    { status: "cancelled", ask: 3800000, noi: 260000, loan: 1900000, offsetDays: 45 },
  ];

  const propTemplates = [
    { name: "Willow Creek Flats", city: "Sacramento", state: "CA", asset: "multifamily" },
    { name: "Downtown Dental Arts Plaza", city: "San Jose", state: "CA", asset: "medical_office" },
    { name: "Brookwood Retail Strip", city: "Portland", state: "OR", asset: "retail" },
    { name: "Evergreen Self-Storage", city: "Seattle", state: "WA", asset: "self_storage" },
    { name: "Midtown Mixed-Use", city: "Salt Lake City", state: "UT", asset: "mixed_use" },
    { name: "Pacific Net-Lease Pad", city: "San Diego", state: "CA", asset: "net_lease" },
    { name: "Riverbend Industrial", city: "Reno", state: "NV", asset: "industrial" },
  ];

  const results: MyExchange[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const s = statuses[i];
    const client = clients[i % clients.length];
    const t = propTemplates[i];

    const { data: prop, error: propErr } = await db.from("pledged_properties").insert({
      agent_id: agentId,
      source: "agent_pledge",
      property_name: `${DEMO_PREFIX} ${t.name}`,
      address: `${1000 + i * 10} Main St`,
      city: t.city,
      state: t.state,
      zip: "90000",
      asset_type: t.asset,
      year_built: 2012,
      units: 40,
      building_square_footage: 45000,
      description: `Relinquished property for demo exchange ${i + 1}. Good in-place yield and stabilized occupancy.`,
      status: s.status === "draft" ? "draft" : "active",
      listed_at: s.status === "draft" ? null : new Date().toISOString(),
    }).select("id").single();
    if (propErr || !prop) throw propErr ?? new Error("my property insert failed");
    const propertyId = prop.id as string;

    await db.from("property_financials").insert({
      property_id: propertyId,
      asking_price: s.ask,
      noi: s.noi,
      cap_rate: Number(((s.noi / s.ask) * 100).toFixed(2)),
      occupancy_rate: 93,
      loan_balance: s.loan,
    });

    const imageRows = [0, 1, 2].map((k) => ({
      property_id: propertyId,
      storage_path: photoPaths[(i + k) % photoPaths.length],
      file_name: `demo-${(i + k) % photoPaths.length + 1}.jpg`,
      sort_order: k,
    }));
    await db.from("property_images").insert(imageRows);

    const equity = s.ask - s.loan;
    const proceeds = Math.round(equity - s.ask * 0.05);

    const { data: exchange, error: exchErr } = await db.from("exchanges").insert({
      agent_id: agentId,
      client_id: client.id,
      status: s.status,
      relinquished_property_id: propertyId,
      exchange_proceeds: proceeds,
      estimated_equity: equity,
      sale_close_date: new Date(Date.now() + s.offsetDays * 24 * 3600 * 1000).toISOString().slice(0, 10),
      identification_deadline: new Date(Date.now() + (s.offsetDays + 45) * 24 * 3600 * 1000).toISOString().slice(0, 10),
      closing_deadline: new Date(Date.now() + (s.offsetDays + 180) * 24 * 3600 * 1000).toISOString().slice(0, 10),
    }).select("id").single();
    if (exchErr || !exchange) throw exchErr ?? new Error("my exchange insert failed");

    const { data: criteria, error: critErr } = await db.from("replacement_criteria").insert({
      exchange_id: exchange.id,
      target_asset_types: ["multifamily", "industrial", "retail", "medical_office"],
      target_states: ["CA", "TX", "AZ", "CO", "TN", "IL"],
      target_price_min: Math.round(s.ask * 0.8),
      target_price_max: Math.round(equity * 4),
    }).select("id").single();
    if (critErr || !criteria) throw critErr ?? new Error("criteria insert failed");

    await db.from("exchanges").update({ criteria_id: criteria.id }).eq("id", exchange.id);
    await db.from("pledged_properties").update({ exchange_id: exchange.id }).eq("id", propertyId);

    const timelineRows = [
      { exchange_id: exchange.id, event_type: "created", description: `Exchange created for ${client.name}`, actor_id: agentId },
      { exchange_id: exchange.id, event_type: "property_pledged", description: "Relinquished property added", actor_id: agentId },
      { exchange_id: exchange.id, event_type: "criteria_set", description: "Replacement criteria saved", actor_id: agentId },
    ];
    if (s.status === "in_identification" || s.status === "in_closing" || s.status === "completed") {
      timelineRows.push({ exchange_id: exchange.id, event_type: "match_found", description: "First qualified match surfaced", actor_id: agentId });
      timelineRows.push({ exchange_id: exchange.id, event_type: "connection_initiated", description: "Connection request sent to seller agent", actor_id: agentId });
      timelineRows.push({ exchange_id: exchange.id, event_type: "connection_accepted", description: "Seller agent accepted the connection", actor_id: agentId });
    }
    if (s.status === "in_closing" || s.status === "completed") {
      timelineRows.push({ exchange_id: exchange.id, event_type: "identification_finalized", description: "45-day identification list finalized", actor_id: agentId });
      timelineRows.push({ exchange_id: exchange.id, event_type: "under_contract", description: "Replacement property under contract", actor_id: agentId });
    }
    if (s.status === "completed") {
      timelineRows.push({ exchange_id: exchange.id, event_type: "closed", description: "Exchange closed successfully", actor_id: agentId });
    }
    if (s.status === "cancelled") {
      timelineRows.push({ exchange_id: exchange.id, event_type: "cancelled", description: "Exchange cancelled by client", actor_id: agentId });
    }
    await db.from("exchange_timeline").insert(timelineRows);

    results.push({ id: exchange.id, clientId: client.id, status: s.status, relinquishedPropertyId: propertyId, askingPrice: s.ask });
  }

  return results;
}

interface MatchRef { id: string; exchangeId: string; propertyId: string; sellerAgentId: string }

async function seedMatches(
  db: SupabaseClient,
  myExchanges: MyExchange[],
  counterpartyProps: PropertyRef[],
): Promise<MatchRef[]> {
  const matches: MatchRef[] = [];
  const scoreBands = [96, 89, 82, 76, 71];
  const bootStatuses = ["no_boot", "minor_boot", "significant_boot", "insufficient_data"];

  const activeExchanges = myExchanges.filter((e) => e.status !== "draft" && e.status !== "cancelled");

  let idx = 0;
  for (const exch of activeExchanges) {
    const perExchange = Math.min(3, counterpartyProps.length);
    for (let k = 0; k < perExchange; k++) {
      const prop = counterpartyProps[(idx + k) % counterpartyProps.length];
      const score = scoreBands[(idx + k) % scoreBands.length];
      const boot = bootStatuses[(idx + k) % bootStatuses.length];

      const { data: match, error } = await db.from("matches").insert({
        buyer_exchange_id: exch.id,
        seller_property_id: prop.id,
        total_score: score,
        price_score: score - 2,
        geo_score: score - 4,
        asset_score: score + 1,
        strategy_score: score - 3,
        financial_score: score,
        boot_status: boot,
        estimated_cash_boot: boot === "no_boot" ? 0 : 150000 * (k + 1),
        estimated_mortgage_boot: boot === "no_boot" ? 0 : 200000 * (k + 1),
        estimated_total_boot: boot === "no_boot" ? 0 : 350000 * (k + 1),
        estimated_boot_tax: boot === "no_boot" ? 0 : 95000 * (k + 1),
        status: "active",
      }).select("id").single();
      if (error || !match) {
        if (error?.code === "23505") continue;
        throw error ?? new Error("match insert failed");
      }
      matches.push({ id: match.id as string, exchangeId: exch.id, propertyId: prop.id, sellerAgentId: prop.agentId });
    }
    idx++;
  }

  return matches;
}

interface ReverseMatchRef { id: string; counterpartyExchangeId: string; myPropertyId: string; counterpartyAgentId: string }

async function seedReverseMatches(
  db: SupabaseClient,
  counterpartyExchanges: CounterpartyExchange[],
  myExchanges: MyExchange[],
): Promise<ReverseMatchRef[]> {
  const results: ReverseMatchRef[] = [];
  const eligibleMyExchanges = myExchanges.filter((e) => e.status === "active" || e.status === "in_identification");
  if (!eligibleMyExchanges.length || !counterpartyExchanges.length) return results;

  for (let i = 0; i < Math.min(counterpartyExchanges.length, eligibleMyExchanges.length); i++) {
    const cpExch = counterpartyExchanges[i];
    const myExch = eligibleMyExchanges[i];

    const { data: match, error } = await db.from("matches").insert({
      buyer_exchange_id: cpExch.id,
      seller_property_id: myExch.relinquishedPropertyId,
      total_score: 84 - i * 3,
      price_score: 82,
      geo_score: 80,
      asset_score: 88,
      strategy_score: 78,
      financial_score: 85,
      boot_status: "minor_boot",
      status: "active",
    }).select("id").single();
    if (error || !match) {
      if (error?.code === "23505") continue;
      throw error ?? new Error("reverse match insert failed");
    }
    results.push({
      id: match.id as string,
      counterpartyExchangeId: cpExch.id,
      myPropertyId: myExch.relinquishedPropertyId,
      counterpartyAgentId: cpExch.agentId,
    });
  }

  return results;
}

async function seedConnections(
  db: SupabaseClient,
  agentId: string,
  _counterpartyIds: string[],
  myExchanges: MyExchange[],
  counterpartyExchanges: CounterpartyExchange[],
  matches: MatchRef[],
  reverseMatches: ReverseMatchRef[],
) {
  void _counterpartyIds;
  if (!matches.length && !reverseMatches.length) return;

  const connectionPlans: Array<{
    match: MatchRef | ReverseMatchRef;
    direction: "outgoing" | "incoming";
    status: "pending" | "accepted" | "declined" | "completed";
  }> = [];

  const outgoingMatches = matches.slice(0, 3);
  if (outgoingMatches[0]) connectionPlans.push({ match: outgoingMatches[0], direction: "outgoing", status: "pending" });
  if (outgoingMatches[1]) connectionPlans.push({ match: outgoingMatches[1], direction: "outgoing", status: "accepted" });
  if (outgoingMatches[2]) connectionPlans.push({ match: outgoingMatches[2], direction: "outgoing", status: "completed" });

  const incomingMatches = reverseMatches.slice(0, 2);
  if (incomingMatches[0]) connectionPlans.push({ match: incomingMatches[0], direction: "incoming", status: "pending" });
  if (incomingMatches[1]) connectionPlans.push({ match: incomingMatches[1], direction: "incoming", status: "declined" });

  for (const plan of connectionPlans) {
    const isOutgoing = plan.direction === "outgoing";
    const match = plan.match;

    let buyerExchangeId: string;
    let sellerExchangeId: string | null = null;
    let buyerAgentId: string;
    let sellerAgentId: string;
    let initiatedBy: "buyer_agent" | "seller_agent";

    if (isOutgoing) {
      const m = match as MatchRef;
      buyerExchangeId = m.exchangeId;
      buyerAgentId = agentId;
      sellerAgentId = m.sellerAgentId;
      initiatedBy = "buyer_agent";
      const { data: sellerProp } = await db.from("pledged_properties").select("exchange_id").eq("id", m.propertyId).single();
      if (sellerProp?.exchange_id) sellerExchangeId = sellerProp.exchange_id as string;
    } else {
      const m = match as ReverseMatchRef;
      buyerExchangeId = m.counterpartyExchangeId;
      buyerAgentId = m.counterpartyAgentId;
      sellerAgentId = agentId;
      initiatedBy = "buyer_agent";
      const myExchange = myExchanges.find((e) => e.relinquishedPropertyId === m.myPropertyId);
      if (myExchange) sellerExchangeId = myExchange.id;
    }

    const now = Date.now();
    const row: Record<string, unknown> = {
      match_id: match.id,
      buyer_exchange_id: buyerExchangeId,
      seller_exchange_id: sellerExchangeId,
      buyer_agent_id: buyerAgentId,
      seller_agent_id: sellerAgentId,
      initiated_by: initiatedBy,
      status: plan.status,
      initiated_at: new Date(now - 10 * 24 * 3600 * 1000).toISOString(),
    };

    if (plan.status === "accepted") {
      row.accepted_at = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
      row.facilitation_fee_agreed = true;
      row.facilitation_fee_amount = 15000;
    } else if (plan.status === "declined") {
      row.declined_at = new Date(now - 3 * 24 * 3600 * 1000).toISOString();
      row.decline_reason = "Out of buyer's target price range";
    } else if (plan.status === "completed") {
      row.accepted_at = new Date(now - 60 * 24 * 3600 * 1000).toISOString();
      row.under_contract_at = new Date(now - 45 * 24 * 3600 * 1000).toISOString();
      row.inspection_complete_at = new Date(now - 30 * 24 * 3600 * 1000).toISOString();
      row.financing_approved_at = new Date(now - 15 * 24 * 3600 * 1000).toISOString();
      row.closed_at = new Date(now - 2 * 24 * 3600 * 1000).toISOString();
      row.facilitation_fee_agreed = true;
      row.facilitation_fee_amount = 15000;
      row.facilitation_fee_status = "paid";
    }

    const { data: conn, error: connErr } = await db.from("exchange_connections").insert(row).select("id").single();
    if (connErr || !conn) throw connErr ?? new Error("connection insert failed");
    const connectionId = conn.id as string;

    if (plan.status === "accepted" || plan.status === "completed") {
      const messageRows = [
        { connection_id: connectionId, sender_id: buyerAgentId, content: "Thanks for accepting - looking forward to learning more about the property." },
        { connection_id: connectionId, sender_id: sellerAgentId, content: "Happy to connect. We've attached the OM and T-12 to our listing." },
        { connection_id: connectionId, sender_id: buyerAgentId, content: "My client would like to tour next week. What days work?" },
        { connection_id: connectionId, sender_id: sellerAgentId, content: "Wednesday or Thursday afternoon both work. I'll send a calendar invite." },
      ];
      await db.from("messages").insert(messageRows);
    }
  }
}

async function seedNotifications(db: SupabaseClient, agentId: string) {
  const types = [
    "new_match",
    "match_score_update",
    "connection_request",
    "connection_accepted",
    "connection_declined",
    "connection_milestone",
    "connection_failed",
    "deadline_warning",
    "deadline_critical",
    "exchange_status_change",
    "new_referral",
    "property_status_change",
    "system",
  ];
  const now = Date.now();
  const rows = types.map((type, i) => ({
    user_id: agentId,
    type,
    title: `${DEMO_PREFIX} ${titleFor(type)}`,
    message: messageFor(type),
    link_to: linkFor(type),
    read: i % 3 === 0,
    metadata: { seed: true },
    created_at: new Date(now - i * 3 * 3600 * 1000).toISOString(),
  }));
  await db.from("notifications").insert(rows);
}

function titleFor(type: string): string {
  switch (type) {
    case "new_match": return "New 96% match for Willow Creek Flats";
    case "match_score_update": return "Match score increased to 89%";
    case "connection_request": return "Connection request received";
    case "connection_accepted": return "Connection accepted by seller agent";
    case "connection_declined": return "Connection declined";
    case "connection_milestone": return "Deal reached under-contract";
    case "connection_failed": return "Deal fell through";
    case "deadline_warning": return "45-day identification deadline approaching";
    case "deadline_critical": return "Closing deadline in 5 days";
    case "exchange_status_change": return "Exchange moved to In Closing";
    case "new_referral": return "New client referral assigned to you";
    case "property_status_change": return "Property status changed to Under Contract";
    default: return "System message";
  }
}

function messageFor(type: string): string {
  switch (type) {
    case "new_match": return "A newly pledged property scored 96% against your client's criteria.";
    case "deadline_warning": return "You have 10 days left to finalize the identification list.";
    case "deadline_critical": return "Closing deadline is in 5 days. Confirm the replacement property is on track.";
    default: return "Demo notification seeded for testing.";
  }
}

function linkFor(type: string): string | null {
  if (type.startsWith("connection_")) return "/agent/connections";
  if (type === "new_referral") return "/agent/clients";
  if (type.includes("match")) return "/agent/matches";
  if (type.includes("exchange") || type.includes("deadline") || type.includes("property_status")) return "/agent/exchanges";
  return null;
}

async function seedSupportTicket(db: SupabaseClient, agentId: string) {
  await db.from("support_tickets").insert({
    user_id: agentId,
    subject: `${DEMO_PREFIX} Test ticket - sample support question`,
    message: "This is a seeded support ticket used to exercise the help page and admin support queue.",
    category: "general",
    status: "open",
  });
}

// Seeds a fixed, idempotent staging dataset (is_demo=true) for verifying
// matching, approvals, and notifications end-to-end. Admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STAGING_PASSWORD = "staging-fixture-only-do-not-reuse-9f2a";
const BUYER_EMAIL = "staging-buyer@1031exchangeup.test";
const SELLER_EMAIL = "staging-seller@1031exchangeup.test";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Admin gate: caller must be an admin OR the shared service role key (used by tests).
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace("Bearer ", "");
    const isServiceCall = bearer === serviceRoleKey;
    if (!isServiceCall) {
      if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
    }

    // 1. Ensure staging users exist. auth.admin.listUsers has no email filter,
    //    so we page through pages of 1000 (fine for a small project).
    const buyerId = await ensureUser(db, BUYER_EMAIL);
    const sellerId = await ensureUser(db, SELLER_EMAIL);

    // 2. Wipe previous is_demo rows for these two agents (cascades cover matches).
    for (const uid of [buyerId, sellerId]) {
      await db.from("exchanges").delete().eq("agent_id", uid).eq("is_demo", true);
      await db.from("pledged_properties").delete().eq("agent_id", uid).eq("is_demo", true);
    }
    // Also wipe any orphaned matches for these agents.
    await db.from("matches").delete().in("seller_property_id",
      (await db.from("pledged_properties").select("id").eq("is_demo", true).in("agent_id", [buyerId, sellerId])).data?.map((r: any) => r.id) ?? ["00000000-0000-0000-0000-000000000000"]
    );

    // 3. Insert staging fixtures.
    // Buyer relinquished: $1M price, $400k loan, $60k NOI → equity $600k
    const buyerRelinquished = await insertProperty(db, {
      agent_id: buyerId, is_demo: true, status: "sold",
      property_name: "Staging Buyer Relinquished · Boston MA",
      address: "100 Staging Ave", city: "Boston", state: "MA", zip_code: "02108",
      asset_type: "multifamily", year_built: 1995,
    });
    await insertFinancials(db, buyerRelinquished.id, { asking_price: 1_000_000, loan_balance: 400_000, noi: 60_000, occupancy_rate: 90 });

    // Seller candidate #1 (clean match): $1.5M, $130k NOI, MA multifamily
    const sellerMatch = await insertProperty(db, {
      agent_id: sellerId, is_demo: true, status: "active",
      property_name: "Staging Seller Match · Cambridge MA",
      address: "200 Match St", city: "Cambridge", state: "MA", zip_code: "02139",
      asset_type: "multifamily", year_built: 2015,
    });
    await insertFinancials(db, sellerMatch.id, { asking_price: 1_500_000, noi: 130_000, occupancy_rate: 94 });

    // Seller candidate #2 (affordability rejection): $3M (> $2.4M ceiling)
    const sellerTooExpensive = await insertProperty(db, {
      agent_id: sellerId, is_demo: true, status: "active",
      property_name: "Staging Seller Too Expensive · Cambridge MA",
      address: "300 Pricey Rd", city: "Cambridge", state: "MA", zip_code: "02139",
      asset_type: "multifamily", year_built: 2018,
    });
    await insertFinancials(db, sellerTooExpensive.id, { asking_price: 3_000_000, noi: 250_000, occupancy_rate: 95 });

    // Seller candidate #3 (no ROE upgrade): low NOI
    const sellerLowRoe = await insertProperty(db, {
      agent_id: sellerId, is_demo: true, status: "active",
      property_name: "Staging Seller Low ROE · Cambridge MA",
      address: "400 Weak St", city: "Cambridge", state: "MA", zip_code: "02139",
      asset_type: "multifamily", year_built: 2010,
    });
    await insertFinancials(db, sellerLowRoe.id, { asking_price: 1_500_000, noi: 30_000, occupancy_rate: 78 });

    // Seller candidate #4 (missing financials → skip)
    const sellerNoFin = await insertProperty(db, {
      agent_id: sellerId, is_demo: true, status: "active",
      property_name: "Staging Seller Missing Financials · Cambridge MA",
      address: "500 Blank Way", city: "Cambridge", state: "MA", zip_code: "02139",
      asset_type: "multifamily", year_built: 2005,
    });
    // no property_financials row

    // Buyer's replacement criteria + exchange
    const { data: criteria } = await db.from("replacement_criteria").insert({
      target_states: ["MA"], target_asset_types: ["multifamily"], urgency: "actively_looking",
    }).select("id").single();

    const { data: exchange } = await db.from("exchanges").insert({
      agent_id: buyerId, is_demo: true, status: "active",
      relinquished_property_id: buyerRelinquished.id, criteria_id: criteria!.id,
      exchange_proceeds: 600_000, sale_close_date: new Date().toISOString().slice(0, 10),
    }).select("id").single();

    // Seller-side: buyer-side of seller (another exchange from the seller to prove seller-side scans).
    // Seller relinquished: $800k price, $200k loan, $40k NOI → equity $600k
    const sellerRelinquished = await insertProperty(db, {
      agent_id: sellerId, is_demo: true, status: "sold",
      property_name: "Staging Seller Relinquished · Somerville MA",
      address: "10 Owner Rd", city: "Somerville", state: "MA", zip_code: "02143",
      asset_type: "multifamily", year_built: 2000,
    });
    await insertFinancials(db, sellerRelinquished.id, { asking_price: 800_000, loan_balance: 200_000, noi: 40_000, occupancy_rate: 88 });
    const { data: sellerCriteria } = await db.from("replacement_criteria").insert({
      target_states: ["MA"], target_asset_types: ["multifamily"], urgency: "actively_looking",
    }).select("id").single();
    const { data: sellerExchange } = await db.from("exchanges").insert({
      agent_id: sellerId, is_demo: true, status: "active",
      relinquished_property_id: sellerRelinquished.id, criteria_id: sellerCriteria!.id,
      exchange_proceeds: 600_000, sale_close_date: new Date().toISOString().slice(0, 10),
    }).select("id").single();

    return json({
      ok: true,
      password: STAGING_PASSWORD,
      buyer: { user_id: buyerId, email: BUYER_EMAIL, exchange_id: exchange!.id, relinquished_id: buyerRelinquished.id },
      seller: { user_id: sellerId, email: SELLER_EMAIL, exchange_id: sellerExchange!.id, relinquished_id: sellerRelinquished.id },
      candidates: {
        clean_match: sellerMatch.id,
        affordability_reject: sellerTooExpensive.id,
        no_roe_upgrade: sellerLowRoe.id,
        missing_financials: sellerNoFin.id,
      },
    });
  } catch (err) {
    console.error("seed-staging-dataset error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

async function ensureUser(db: any, email: string): Promise<string> {
  // Page through auth.admin.listUsers to find by email.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      // Reset password so tests can log in deterministically.
      await db.auth.admin.updateUserById(found.id, { password: STAGING_PASSWORD, email_confirm: true });
      // Ensure profile + agent role exist.
      await db.from("profiles").upsert({ id: found.id, email, full_name: email.split("@")[0] }, { onConflict: "id" });
      await db.from("user_roles").upsert({ user_id: found.id, role: "agent" }, { onConflict: "user_id,role" });
      return found.id;
    }
    if (data.users.length < 1000) break;
  }
  const { data, error } = await db.auth.admin.createUser({
    email, password: STAGING_PASSWORD, email_confirm: true,
    user_metadata: { full_name: email.split("@")[0], role: "agent" },
  });
  if (error) throw error;
  return data.user!.id;
}

async function insertProperty(db: any, row: Record<string, any>) {
  const { data, error } = await db.from("pledged_properties").insert(row).select("id").single();
  if (error) throw new Error(`insertProperty ${row.property_name}: ${error.message}`);
  return data as { id: string };
}

async function insertFinancials(db: any, propertyId: string, fin: Record<string, any>) {
  const { error } = await db.from("property_financials").insert({ property_id: propertyId, ...fin });
  if (error) throw new Error(`insertFinancials ${propertyId}: ${error.message}`);
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { computeMatchesForExchange, persistMatchesAndNotifications, type MatchDiagnosticRow } from "../_shared/matching-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    const db = createClient(supabaseUrl, serviceRoleKey);

    const { exchange_id, property_id } = await req.json();
    if (!exchange_id || !property_id) {
      return jsonResponse({ error: "exchange_id and property_id are required" }, 400);
    }

    // Ownership check (this runs with the service-role key, which bypasses RLS):
    // the caller must own BOTH the exchange and the property, and the property
    // must be that exchange's relinquished property. Without this, any agent
    // could match against another agent's exchange/property (IDOR).
    const [{ data: exRow }, { data: propRow }] = await Promise.all([
      db.from("exchanges").select("agent_id, relinquished_property_id, is_demo").eq("id", exchange_id).maybeSingle(),
      db.from("pledged_properties").select("agent_id").eq("id", property_id).maybeSingle(),
    ]);
    if (
      !exRow || !propRow ||
      exRow.agent_id !== userId ||
      propRow.agent_id !== userId ||
      exRow.relinquished_property_id !== property_id
    ) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const allMatches = await computeMatchesForExchange(db, userId, exchange_id, property_id);
    const newMatchCount = await persistMatchesAndNotifications(db, allMatches, userId, !!exRow.is_demo);

    const topMatches = allMatches
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((m) => ({ property_id: m.seller_property_id, score: m.total }));

    return jsonResponse({
      matches_for_exchange: allMatches.filter((m) => m.direction === "buyer").length,
      matches_from_property: allMatches.filter((m) => m.direction === "seller").length,
      total_new_matches: newMatchCount,
      top_matches: topMatches,
    });
  } catch (err) {
    console.error("run-auto-matching error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

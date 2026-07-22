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

    const { exchange_id, property_id, explain, dry_run } = await req.json();
    if (!exchange_id || !property_id) {
      return jsonResponse({ error: "exchange_id and property_id are required" }, 400);
    }

    // Ownership check: caller owns both, OR caller is an admin (for QA/diagnostics).
    const [{ data: exRow }, { data: propRow }, { data: isAdminData }] = await Promise.all([
      db.from("exchanges").select("agent_id, relinquished_property_id, is_demo").eq("id", exchange_id).maybeSingle(),
      db.from("pledged_properties").select("agent_id").eq("id", property_id).maybeSingle(),
      db.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    const isAdmin = isAdminData === true;
    const ownsBoth = exRow && propRow && exRow.agent_id === userId && propRow.agent_id === userId && exRow.relinquished_property_id === property_id;
    if (!exRow || !propRow) return jsonResponse({ error: "Not found" }, 404);
    if (!isAdmin && !ownsBoth) return jsonResponse({ error: "Forbidden" }, 403);
    // For admin diagnostics we need a userId "as whom" we're matching. Use the exchange owner.
    const effectiveUserId = ownsBoth ? userId : exRow.agent_id;

    const diagnostics: MatchDiagnosticRow[] = explain ? [] : undefined as any;
    const allMatches = await computeMatchesForExchange(db, effectiveUserId, exchange_id, property_id, diagnostics);
    const newMatchCount = dry_run
      ? 0
      : await persistMatchesAndNotifications(db, allMatches, effectiveUserId, !!exRow.is_demo);

    const topMatches = allMatches
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((m) => ({ property_id: m.seller_property_id, exchange_id: m.buyer_exchange_id, direction: m.direction, score: m.total, roe_improvement_pp: (m as any).roe_improvement_pp }));

    return jsonResponse({
      matches_for_exchange: allMatches.filter((m) => m.direction === "buyer").length,
      matches_from_property: allMatches.filter((m) => m.direction === "seller").length,
      total_new_matches: newMatchCount,
      top_matches: topMatches,
      dry_run: !!dry_run,
      diagnostics: diagnostics ?? null,
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Weights for 6-dimension scoring
const WEIGHTS = {
  price: 0.25,
  geo: 0.20,
  asset: 0.20,
  strategy: 0.15,
  financial: 0.10,
  timing: 0.10,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Use service role for data access
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: isAdmin } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch request + preferences
    const { data: request, error: reqErr } = await db
      .from("exchange_requests")
      .select("*")
      .eq("id", request_id)
      .single();
    if (reqErr || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await db
      .from("exchange_request_preferences")
      .select("*")
      .eq("request_id", request_id)
      .maybeSingle();

    // Fetch active inventory with financials
    const { data: properties } = await db
      .from("inventory_properties")
      .select("*, inventory_financials(*)")
      .eq("status", "active");

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active inventory properties to match against" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create match run
    const { data: matchRun, error: runErr } = await db
      .from("match_runs")
      .insert({
        request_id,
        status: "pending",
        created_by: userId,
      })
      .select()
      .single();

    if (runErr || !matchRun) {
      return new Response(JSON.stringify({ error: "Failed to create match run" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Score each property
    const results = properties.map((prop: any) => {
      const fin = Array.isArray(prop.inventory_financials)
        ? prop.inventory_financials[0]
        : prop.inventory_financials;

      const priceScore = scorePrice(request, prefs, fin);
      const geoScore = scoreGeo(prefs, prop);
      const assetScore = scoreAsset(prefs, prop);
      const strategyScore = scoreStrategy(prefs, prop);
      const financialScore = scoreFinancial(prefs, fin);
      const timingScore = scoreTiming(request);

      const totalScore =
        priceScore * WEIGHTS.price +
        geoScore * WEIGHTS.geo +
        assetScore * WEIGHTS.asset +
        strategyScore * WEIGHTS.strategy +
        financialScore * WEIGHTS.financial +
        timingScore * WEIGHTS.timing;

      return {
        match_run_id: matchRun.id,
        request_id,
        property_id: prop.id,
        total_score: Math.round(totalScore * 100) / 100,
        price_score: Math.round(priceScore * 100) / 100,
        geo_score: Math.round(geoScore * 100) / 100,
        asset_score: Math.round(assetScore * 100) / 100,
        strategy_score: Math.round(strategyScore * 100) / 100,
        financial_score: Math.round(financialScore * 100) / 100,
        timing_score: Math.round(timingScore * 100) / 100,
      };
    });

    // Insert results
    const { error: insertErr } = await db.from("match_results").insert(results);
    if (insertErr) {
      await db.from("match_runs").update({ status: "failed" }).eq("id", matchRun.id);
      return new Response(JSON.stringify({ error: "Failed to insert match results" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark run as completed
    await db
      .from("match_runs")
      .update({
        status: "completed",
        total_properties_scored: results.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", matchRun.id);

    return new Response(
      JSON.stringify({
        match_run_id: matchRun.id,
        total_scored: results.length,
        top_matches: results
          .sort((a: any, b: any) => b.total_score - a.total_score)
          .slice(0, 5)
          .map((r: any) => ({ property_id: r.property_id, score: r.total_score })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Scoring functions (0-100 scale) ---

function scorePrice(request: any, prefs: any, fin: any): number {
  if (!fin?.asking_price) return 50; // neutral if no price data
  const askingPrice = Number(fin.asking_price);

  // Check against target price range
  if (prefs?.target_price_min || prefs?.target_price_max) {
    const min = Number(prefs.target_price_min || 0);
    const max = Number(prefs.target_price_max || Infinity);
    if (askingPrice >= min && askingPrice <= max) return 100;
    // How far outside the range?
    const mid = (min + max) / 2 || min || max;
    const deviation = Math.abs(askingPrice - mid) / mid;
    return Math.max(0, 100 - deviation * 100);
  }

  // Fallback: compare to exchange proceeds
  const proceeds = Number(request.exchange_proceeds || request.relinquished_estimated_value || 0);
  if (!proceeds) return 50;
  const ratio = askingPrice / proceeds;
  // Ideal: property costs 100-200% of proceeds (leveraged buy)
  if (ratio >= 0.8 && ratio <= 2.0) return 100;
  if (ratio < 0.8) return Math.max(0, ratio / 0.8 * 80);
  return Math.max(0, 100 - (ratio - 2.0) * 50);
}

function scoreGeo(prefs: any, prop: any): number {
  if (!prefs) return 50;
  let score = 0;
  let factors = 0;

  // State match
  if (prefs.target_states?.length > 0 && prop.state) {
    factors++;
    if (prefs.target_states.includes(prop.state)) score += 100;
  }

  // Metro match
  if (prefs.target_metros?.length > 0 && prop.city) {
    factors++;
    const cityLower = prop.city.toLowerCase();
    if (prefs.target_metros.some((m: string) => cityLower.includes(m.toLowerCase()) || m.toLowerCase().includes(cityLower))) {
      score += 100;
    }
  }

  return factors > 0 ? score / factors : 50;
}

function scoreAsset(prefs: any, prop: any): number {
  if (!prefs?.target_asset_types?.length || !prop.asset_type) return 50;
  return prefs.target_asset_types.includes(prop.asset_type) ? 100 : 0;
}

function scoreStrategy(prefs: any, prop: any): number {
  if (!prefs?.target_strategies?.length || !prop.strategy_type) return 50;
  return prefs.target_strategies.includes(prop.strategy_type) ? 100 : 0;
}

function scoreFinancial(prefs: any, fin: any): number {
  if (!fin?.cap_rate || (!prefs?.target_cap_rate_min && !prefs?.target_cap_rate_max)) return 50;
  const capRate = Number(fin.cap_rate);
  const min = Number(prefs.target_cap_rate_min || 0);
  const max = Number(prefs.target_cap_rate_max || 100);
  if (capRate >= min && capRate <= max) return 100;
  const mid = (min + max) / 2;
  const deviation = Math.abs(capRate - mid) / mid;
  return Math.max(0, 100 - deviation * 100);
}

function scoreTiming(request: any): number {
  // Higher urgency = higher timing sensitivity, but all active inventory is "available"
  const urgencyMap: Record<string, number> = {
    immediate: 90,
    "1_3_months": 80,
    "3_6_months": 70,
    "6_12_months": 60,
    flexible: 50,
  };
  return urgencyMap[request.urgency] || 70; // default moderate
}

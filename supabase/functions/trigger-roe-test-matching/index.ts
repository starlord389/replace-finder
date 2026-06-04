// One-off admin trigger: runs the matching engine for the three ROE test
// buyer exchanges using the service role (bypasses user auth). Safe to call
// repeatedly — persistMatchesAndNotifications upserts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  computeMatchesForExchange,
  persistMatchesAndNotifications,
} from "../_shared/matching-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEST_EXCHANGES = [
  { exchange_id: "55555555-eeee-0000-0000-000000000001", property_id: "11111111-aaaa-0000-0000-000000000001", agent_id: "4f826d0b-0373-40ea-829f-c65d8d5a8219" },
  { exchange_id: "55555555-eeee-0000-0000-000000000002", property_id: "11111111-aaaa-0000-0000-000000000002", agent_id: "3ed8c889-fad0-4e63-9b86-dbcfae7fe0e9" },
  { exchange_id: "55555555-eeee-0000-0000-000000000003", property_id: "11111111-aaaa-0000-0000-000000000003", agent_id: "50a076ed-0620-424b-b3ff-84bde2beba83" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const summary: any[] = [];
    for (const t of TEST_EXCHANGES) {
      const matches = await computeMatchesForExchange(db, t.agent_id, t.exchange_id, t.property_id);
      const persisted = await persistMatchesAndNotifications(db, matches, t.agent_id);
      summary.push({
        exchange_id: t.exchange_id,
        candidates_considered: matches.length,
        matches_persisted: persisted,
        eligible: matches
          .filter((m) => m.direction === "buyer")
          .sort((a, b) => b.total - a.total)
          .map((m) => ({
            seller_property_id: m.seller_property_id,
            total: Math.round(m.total * 10) / 10,
            buyer_current_roe: m.buyer_current_roe,
            candidate_roe: m.candidate_roe,
            roe_improvement_pp: m.roe_improvement_pp,
          })),
      });
    }

    return new Response(JSON.stringify({ ok: true, summary }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("trigger-roe-test-matching error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

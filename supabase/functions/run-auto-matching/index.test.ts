import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// Integration tests hit the deployed seed-staging-dataset function, which
// verifies the caller's service-role bearer against its own runtime secret.
// The Deno test runner exposes a different service key than the function's
// deployed env, so an admin JWT is required to run these end-to-end. Set
// RUN_INTEGRATION=1 along with SUPABASE_SERVICE_ROLE_KEY that matches the
// deployed function's env (or an admin access token — see README) to run.
const canRunIntegration = SERVICE.length > 0 && Deno.env.get("RUN_INTEGRATION") === "1";

const STAGING_PASSWORD = "staging-fixture-only-do-not-reuse-9f2a";

async function seed() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-staging-dataset`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE}`, apikey: ANON, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`seed failed: ${JSON.stringify(body)}`);
  return body;
}

async function signInAs(email: string) {
  const client = createClient(SUPABASE_URL, ANON);
  const { data, error } = await client.auth.signInWithPassword({ email, password: STAGING_PASSWORD });
  if (error) throw error;
  return { client, accessToken: data.session!.access_token };
}

Deno.test({ ignore: !canRunIntegration, name: "staging: dry-run diagnostics classify each candidate correctly", fn: async () => {
  const manifest = await seed();
  const { accessToken } = await signInAs(manifest.buyer.email);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/run-auto-matching`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({
      exchange_id: manifest.buyer.exchange_id,
      property_id: manifest.buyer.relinquished_id,
      explain: true,
      dry_run: true,
    }),
  });
  const body = await res.json();
  assertEquals(res.status, 200, `unexpected: ${JSON.stringify(body)}`);
  const diags = body.diagnostics as Array<any>;
  assert(Array.isArray(diags) && diags.length > 0, "expected diagnostics");

  const buyerSide = diags.filter((d) => d.direction === "buyer");
  const matched = buyerSide.filter((d) => d.status === "matched");
  const affordability = buyerSide.find((d) => /exceeds affordability/.test(d.reason));
  const noRoe = buyerSide.find((d) => /no ROE upgrade/.test(d.reason));
  const missingFin = buyerSide.find((d) => /candidate property missing/.test(d.reason));

  assert(matched.length >= 1, `expected ≥1 matched, got 0. diags=${JSON.stringify(buyerSide)}`);
  assert(affordability, "expected an affordability rejection");
  assert(noRoe, "expected a no-ROE-upgrade rejection");
  assert(missingFin, "expected a missing-financials skip");

  assertEquals(body.total_new_matches, 0); // dry-run does not persist
} });

Deno.test({ ignore: !canRunIntegration, name: "staging: persist run writes matches and logs a new-match email", fn: async () => {
  const manifest = await seed();
  const { accessToken } = await signInAs(manifest.buyer.email);
  const admin = createClient(SUPABASE_URL, SERVICE);

  const runStartedAt = new Date().toISOString();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/run-auto-matching`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({
      exchange_id: manifest.buyer.exchange_id,
      property_id: manifest.buyer.relinquished_id,
      explain: true,
      dry_run: false,
    }),
  });
  const body = await res.json();
  assertEquals(res.status, 200, `unexpected: ${JSON.stringify(body)}`);
  assert(body.total_new_matches >= 1, `expected persisted matches, got ${body.total_new_matches}`);

  // Verify the match row exists for the expected buyer/seller pair.
  const { data: matchRow } = await admin
    .from("matches")
    .select("id,total_score,roe_improvement_pp,buyer_exchange_id,seller_property_id")
    .eq("buyer_exchange_id", manifest.buyer.exchange_id)
    .eq("seller_property_id", manifest.candidates.clean_match)
    .maybeSingle();
  assert(matchRow, "expected a matches row for buyer × clean-match candidate");
  assert(matchRow!.total_score > 0);
  assert((matchRow!.roe_improvement_pp ?? 0) > 0);

  // RLS approval path: seller agent should be able to read the same match row.
  const { accessToken: sellerToken } = await signInAs(manifest.seller.email);
  const sellerClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${sellerToken}` } },
  });
  const { data: sellerVisible } = await sellerClient
    .from("matches").select("id").eq("id", matchRow!.id).maybeSingle();
  assert(sellerVisible, "seller agent should see the match under RLS");

  // Email path: assert a new-match email was queued/logged for the buyer.
  const { data: logRows } = await admin
    .from("email_send_log")
    .select("id,template_name,recipient_email,status,created_at")
    .eq("template_name", "new-match-notification")
    .eq("recipient_email", manifest.buyer.email)
    .gte("created_at", runStartedAt)
    .order("created_at", { ascending: false })
    .limit(5);
  assert(logRows && logRows.length > 0, "expected new-match-notification email log for buyer");
} });

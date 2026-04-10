import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function count(table, filters = []) {
  let query = supabase.from(table).select("id", { head: true, count: "exact" });
  for (const [kind, column, value] of filters) {
    if (kind === "eq") query = query.eq(column, value);
    if (kind === "in") query = query.in(column, value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function run() {
  const [activeExchanges, activeMatches, pendingJobs, openTickets] = await Promise.all([
    count("exchanges", [["in", "status", ["active", "in_identification", "in_closing"]]]),
    count("matches", [["eq", "status", "active"]]),
    count("match_job_queue", [["eq", "status", "pending"]]),
    count("support_tickets", [["eq", "status", "open"]]),
  ]);

  const output = {
    checkedAt: new Date().toISOString(),
    activeExchanges,
    activeMatches,
    pendingJobs,
    openTickets,
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error("Verification failed:", error.message);
  process.exit(1);
});

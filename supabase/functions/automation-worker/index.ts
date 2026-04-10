import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { computeMatchesForExchange, persistMatchesAndNotifications } from "../_shared/matching-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json().catch(() => ({}));
    const maxJobs = typeof payload.maxJobs === "number" ? Math.min(payload.maxJobs, 100) : 25;

    const matchingStats = await processMatchingQueue(db, maxJobs);
    const deadlineStats = await processDeadlineNotifications(db);
    const referralStats = await processReferralAssignments(db);

    return json({
      matching: matchingStats,
      deadlines: deadlineStats,
      referrals: referralStats,
    });
  } catch (error) {
    console.error("automation-worker error", error);
    return json({ error: (error as Error).message }, 500);
  }
});

async function processMatchingQueue(db: any, maxJobs: number) {
  const { data: jobs } = await db
    .from("match_job_queue")
    .select("*")
    .eq("status", "pending")
    .lte("available_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(maxJobs);

  if (!jobs?.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      await db.from("match_job_queue").update({ status: "processing", attempts: job.attempts + 1 }).eq("id", job.id);

      const { data: exchange } = await db.from("exchanges").select("agent_id").eq("id", job.exchange_id).single();
      if (!exchange?.agent_id) throw new Error("Missing exchange agent");

      const computed = await computeMatchesForExchange(db, exchange.agent_id, job.exchange_id, job.property_id);
      await persistMatchesAndNotifications(db, computed, exchange.agent_id);

      await db.from("match_job_queue").update({
        status: "completed",
        processed_at: new Date().toISOString(),
      }).eq("id", job.id);

      await db.from("event_outbox").insert({
        event_type: "matching.completed",
        aggregate_type: "exchange",
        aggregate_id: job.exchange_id,
        payload: {
          exchange_id: job.exchange_id,
          property_id: job.property_id,
          match_count: computed.length,
          queue_job_id: job.id,
        },
      });

      processed++;
    } catch (error) {
      failed++;
      await db.from("match_job_queue").update({
        status: "failed",
        last_error: (error as Error).message,
      }).eq("id", job.id);
    }
  }

  return { processed, failed };
}

async function processDeadlineNotifications(db: any) {
  const now = new Date();
  const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const in180Days = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const warningWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: exchanges } = await db
    .from("exchanges")
    .select("id, agent_id, identification_deadline, closing_deadline")
    .in("status", ["active", "in_identification", "in_closing"])
    .or(`identification_deadline.lte.${in45Days},closing_deadline.lte.${in180Days}`);

  if (!exchanges?.length) return { created: 0 };

  let created = 0;
  for (const exchange of exchanges) {
    const notifications = [];
    if (exchange.identification_deadline && exchange.identification_deadline <= warningWindow) {
      notifications.push({
        user_id: exchange.agent_id,
        type: "deadline_warning",
        title: "45-day identification deadline approaching",
        message: "An exchange is within 7 days of the 45-day identification deadline.",
        link_to: `/agent/exchanges/${exchange.id}`,
      });
    }
    if (exchange.closing_deadline && exchange.closing_deadline <= warningWindow) {
      notifications.push({
        user_id: exchange.agent_id,
        type: "deadline_critical",
        title: "180-day closing deadline approaching",
        message: "An exchange is within 7 days of the 180-day closing deadline.",
        link_to: `/agent/exchanges/${exchange.id}`,
      });
    }

    if (notifications.length) {
      await db.from("notifications").insert(notifications);
      created += notifications.length;
    }
  }

  return { created };
}

async function processReferralAssignments(db: any) {
  const { data: pendingReferrals } = await db
    .from("referrals")
    .select("*")
    .eq("status", "pending")
    .is("assigned_agent_id", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (!pendingReferrals?.length) return { assigned: 0 };

  const { data: activeAgents } = await db
    .from("profiles")
    .select("id, role")
    .eq("role", "agent")
    .eq("verification_status", "verified");

  if (!activeAgents?.length) return { assigned: 0 };

  let assigned = 0;
  for (const referral of pendingReferrals) {
    const selectedAgent = activeAgents[assigned % activeAgents.length];
    await db.from("referrals").update({
      assigned_agent_id: selectedAgent.id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
    }).eq("id", referral.id);

    await db.from("notifications").insert({
      user_id: selectedAgent.id,
      type: "connection_request",
      title: "New owner referral assigned",
      message: "A new owner lead has been auto-assigned to you.",
      link_to: "/agent/clients",
    });

    assigned++;
  }

  return { assigned };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

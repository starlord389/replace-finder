import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const migration = source("supabase/migrations/20260811160000_canonical_match_workflow.sql");
const connectionPrecedence = source(
  "supabase/migrations/20260820224500_cancelled_connection_workflow_precedence.sql",
);
const pipeline = source("src/pages/agent/AgentPipeline.tsx");
const kanban = source("src/features/pipeline/components/OpportunityPipelineKanban.tsx");
const actions = source("src/features/matches/components/inbox/useMatchActions.ts");
const helpers = source("src/features/matches/components/inbox/inboxHelpers.ts");

describe("canonical opportunity workflow", () => {
  it("stores one secured state row per match plus an append-only history", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.match_workflow_states");
    expect(migration).toContain("match_id uuid PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.match_workflow_events");
    expect(migration).toContain("ALTER TABLE public.match_workflow_states ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON public.match_workflow_states FROM authenticated");
    expect(migration).toContain("public.can_access_match_workflow(match_id)");
  });

  it("automatically follows durable match, recommendation, client-request, and connection events", () => {
    expect(migration).toContain("trg_sync_match_workflow_match");
    expect(migration).toContain("trg_sync_match_workflow_recommendation");
    expect(migration).toContain("trg_sync_match_workflow_contact_request");
    expect(migration).toContain("trg_sync_match_workflow_connection");
    expect(migration).toContain("trg_normalize_reopened_connection_milestones");
    expect(migration).toContain("'agent_recommendation'");
    expect(migration).toContain("'client_contact_request'");
    expect(migration).toContain("'agent_conversation_started'");
    expect(migration).toContain("'connection_under_contract'");
    expect(migration).toContain("'connection_closed'");
  });

  it("does not mistake a cancelled conversation timestamp for a closed deal", () => {
    const endedBranch = connectionPrecedence.indexOf("IF NEW.status IN ('declined', 'cancelled')");
    const closedBranch = connectionPrecedence.indexOf(
      "ELSIF NEW.status = 'completed' OR NEW.closed_at IS NOT NULL",
    );
    expect(endedBranch).toBeGreaterThan(-1);
    expect(closedBranch).toBeGreaterThan(endedBranch);
    expect(connectionPrecedence).toContain("AND c.status = 'completed'");
    expect(connectionPrecedence).toContain("'connection_status_repair'");
    expect(connectionPrecedence).toContain("AND s.stage_source = 'connection_closed'");
    expect(connectionPrecedence).not.toContain("DROP TRIGGER");
  });

  it("requires a real agent conversation before deal-progress stages", () => {
    expect(migration).toContain("p_stage IN ('in_conversation', 'offer_sent', 'under_contract', 'closed')");
    expect(migration).toContain("Start the agent-to-agent conversation before moving this opportunity to that stage.");
    expect(migration).toContain("An active agent conversation cannot be moved to a pre-conversation stage.");
    expect(migration).toContain("UPDATE public.agent_contact_requests");
    expect(migration).toContain("SET status = 'closed'");
    expect(kanban).toContain("Start the agent conversation first");
    expect(kanban).toContain("The opportunity will move here automatically.");
  });

  it("uses the same seven per-match stages in Next Steps and Pipeline", () => {
    for (const title of [
      "New Opportunity",
      "Sent to Client",
      "Client Interested",
      "In Conversation",
      "Offer Sent",
      "Under Contract",
      "Closed",
    ]) {
      expect(kanban).toContain(`title: "${title}"`);
    }
    expect(pipeline).toContain('relationship.mySide === "buyer"');
    expect(pipeline).toContain("relationship.matchId");
    expect(pipeline).not.toContain("useAgentListings");
    expect(actions).toContain("recordMatchWorkflowStage");
    expect(helpers).toContain("if (rel.workflowStage)");
  });
});

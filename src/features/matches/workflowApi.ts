import { supabase } from "@/integrations/supabase/client";

export type CanonicalWorkflowStage =
  | "new"
  | "sent_to_client"
  | "client_interested"
  | "in_conversation"
  | "offer_sent"
  | "under_contract"
  | "closed"
  | "archived";

export async function recordMatchWorkflowStage(input: {
  matchId: string;
  stage: CanonicalWorkflowStage;
  source?: "manual_next_step" | "pipeline_drag" | "stage_correction" | "external_share" | "reactivate";
  note?: string | null;
}) {
  const { data, error } = await supabase.rpc("record_match_workflow_stage" as any, {
    p_match_id: input.matchId,
    p_stage: input.stage,
    p_source: input.source ?? "manual_next_step",
    p_note: input.note?.trim() || null,
  });
  if (error) throw error;
  return data as CanonicalWorkflowStage;
}

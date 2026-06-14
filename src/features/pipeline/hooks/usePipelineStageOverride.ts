import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StageKey } from "@/features/pipeline/lib/pipelineStages";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";

export interface SetStageInput {
  exchangeId: string;
  stage: StageKey | null;
  userId: string;
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ exchangeId, stage }: SetStageInput) => {
      const { error } = await supabase
        .from("exchanges")
        .update({ pipeline_stage_override: stage })
        .eq("id", exchangeId);
      if (error) throw error;
    },
    onMutate: async ({ exchangeId, stage, userId }) => {
      const key = ["agent-listings", userId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AgentListing[]>(key);
      if (prev) {
        qc.setQueryData<AgentListing[]>(
          key,
          prev.map((l) =>
            l.id === exchangeId ? { ...l, pipelineStageOverride: stage } : l,
          ),
        );
      }
      return { prev, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && ctx.key) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["agent-listings", vars.userId] });
    },
  });
}

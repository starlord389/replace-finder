import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

export function useAgentClientsCount(userId?: string) {
  const { isDemo } = useWorkspaceMode();
  return useQuery({
    queryKey: ["agent-clients-count", userId, isDemo],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("agent_clients")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", userId!)
        .eq("is_demo", isDemo);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
  });
}

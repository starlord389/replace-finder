import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAgentClientsCount(userId?: string) {
  return useQuery({
    queryKey: ["agent-clients-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("agent_clients")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
  });
}

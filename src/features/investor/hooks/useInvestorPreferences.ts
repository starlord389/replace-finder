import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TablesInsert } from "@/integrations/supabase/types";

export function useInvestorPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["investor-preferences", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investor_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (preferences: Omit<TablesInsert<"investor_preferences">, "user_id">) => {
      if (!user) throw new Error("Sign in to update preferences.");
      const { error } = await supabase
        .from("investor_preferences")
        .upsert({ ...preferences, user_id: user.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, save };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

export function useInvestorSavedProperties() {
  const { user, hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const effectiveDemo = isDemo && hasRole("admin");
  const queryClient = useQueryClient();
  const queryKey = ["investor-saved-properties", user?.id, effectiveDemo];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investor_saved_properties")
        .select("id, property_id, created_at")
        .eq("investor_id", user!.id)
        .eq("is_demo", effectiveDemo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ propertyId, saved }: { propertyId: string; saved: boolean }) => {
      if (!user) throw new Error("Sign in to save properties.");
      if (saved) {
        const { error } = await supabase
          .from("investor_saved_properties")
          .delete()
          .eq("investor_id", user.id)
          .eq("property_id", propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("investor_saved_properties").insert({
          investor_id: user.id,
          property_id: propertyId,
          is_demo: effectiveDemo,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    ...query,
    savedIds: new Set((query.data ?? []).map((row) => row.property_id)),
    toggle,
  };
}

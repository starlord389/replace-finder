import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ArticleFeedback } from "../types";

/** The current user's feedback, keyed by article_id, so the UI can show prior votes. */
export function useMyArticleFeedback() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-article-feedback", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Record<string, ArticleFeedback>> => {
      const { data, error } = await supabase
        .from("article_feedback")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, ArticleFeedback> = {};
      for (const row of (data ?? []) as ArticleFeedback[]) map[row.article_id] = row;
      return map;
    },
  });
}

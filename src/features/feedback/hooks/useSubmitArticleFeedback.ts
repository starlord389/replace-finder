import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ArticleType } from "../types";

interface SubmitFeedbackInput {
  articleId: string;
  articleType: ArticleType;
  articleTitle: string;
  helpful: boolean;
  comment?: string;
}

export function useSubmitArticleFeedback() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitFeedbackInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("article_feedback")
        .upsert(
          {
            user_id: user.id,
            article_id: input.articleId,
            article_type: input.articleType,
            article_title: input.articleTitle,
            helpful: input.helpful,
            comment: input.comment?.trim() || null,
          },
          { onConflict: "user_id,article_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-article-feedback", user?.id] });
    },
  });
}

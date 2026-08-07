import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageCircleQuestion, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function InvestorRecommendationCard({ matchId }: { matchId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: recommendation } = useQuery({
    queryKey: ["investor-recommendation", user?.id, matchId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("agent_match_recommendations" as any).select("*").eq("investor_id", user!.id).eq("match_id", matchId).maybeSingle() as any);
      if (error) throw error;
      return data as any;
    },
  });

  if (!recommendation) return null;

  async function respond(response: "interested" | "passed" | "saved" | "question") {
    const note = response === "question" ? prompt("What would you like to ask your agent?") : null;
    if (response === "question" && note === null) return;
    const { error } = await supabase.rpc("respond_to_match_recommendation" as any, {
      p_recommendation_id: recommendation.id,
      p_response: response,
      p_note: note || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Your agent received your response.");
    await queryClient.invalidateQueries({ queryKey: ["investor-recommendation", user?.id, matchId] });
  }

  return (
    <div className="mx-5 mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:mx-8">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Recommended by your agent</p>{recommendation.response !== "pending" && <Badge variant="outline" className="capitalize">{recommendation.response}</Badge>}</div>{recommendation.note && <p className="mt-2 text-sm text-muted-foreground">“{recommendation.note}”</p>}</div>{recommendation.response === "pending" && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => respond("passed")}><ThumbsDown className="mr-1.5 h-3.5 w-3.5" />Pass</Button><Button size="sm" variant="outline" onClick={() => respond("question")}><MessageCircleQuestion className="mr-1.5 h-3.5 w-3.5" />Ask agent</Button><Button size="sm" onClick={() => respond("interested")}><ThumbsUp className="mr-1.5 h-3.5 w-3.5" />Interested</Button></div>}</div>
    </div>
  );
}

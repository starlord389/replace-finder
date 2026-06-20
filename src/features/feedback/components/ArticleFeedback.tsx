import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyArticleFeedback } from "../hooks/useMyArticleFeedback";
import { useSubmitArticleFeedback } from "../hooks/useSubmitArticleFeedback";
import type { ArticleType } from "../types";

interface ArticleFeedbackProps {
  articleId: string;
  articleType: ArticleType;
  articleTitle: string;
}

/** Inline "Was this helpful?" control for a single help article. */
export function ArticleFeedback({ articleId, articleType, articleTitle }: ArticleFeedbackProps) {
  const { data: mine } = useMyArticleFeedback();
  const submit = useSubmitArticleFeedback();
  const prior = mine?.[articleId];

  const [voted, setVoted] = useState<boolean | null>(null);
  const [askComment, setAskComment] = useState(false);
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);

  const settled = prior != null || voted != null;
  const choice = voted ?? prior?.helpful ?? null;

  const vote = (helpful: boolean) => {
    setVoted(helpful);
    submit.mutate({ articleId, articleType, articleTitle, helpful });
    setAskComment(!helpful && !prior); // only prompt for detail on a fresh "No"
  };

  const sendComment = () => {
    submit.mutate(
      { articleId, articleType, articleTitle, helpful: false, comment },
      { onSuccess: () => { setAskComment(false); setCommentSent(true); } },
    );
  };

  if (!settled) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => vote(true)}>
            <ThumbsUp className="h-3.5 w-3.5" />Yes
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => vote(false)}>
            <ThumbsDown className="h-3.5 w-3.5" />No
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border pt-3">
      {askComment ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Sorry this wasn't helpful — what were you looking for?</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Optional: tell us what's missing so we can improve this article."
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7" onClick={sendComment} disabled={submit.isPending}>
              {submit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send feedback"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setAskComment(false)}>Skip</Button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-green-600" />
          {commentSent
            ? "Thanks — we'll use this to improve the article."
            : choice === false
              ? "Thanks for letting us know."
              : "Thanks for your feedback!"}
        </p>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare, Check, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  rel: Relationship;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  fullWidth?: boolean;
}

/** Renders the single primary CTA appropriate for the relationship's stage. */
export function StageActionButton({ rel, size = "sm", variant = "default", fullWidth }: Props) {
  const className = fullWidth ? "w-full" : undefined;

  switch (rel.stage) {
    case "new":
      return (
        <Button asChild size={size} variant={variant} className={className}>
          <Link to={`/agent/matches/${rel.matchId}`}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Send request
          </Link>
        </Button>
      );
    case "incoming":
      return (
        <Button asChild size={size} variant={variant} className={className}>
          <Link to={`/agent/matches/${rel.matchId}`}>
            Review interest <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      );
    case "pending_in":
      return (
        <Button asChild size={size} variant={variant} className={className}>
          <Link to={`/agent/connections/${rel.connectionId}`}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Respond
          </Link>
        </Button>
      );
    case "pending_out":
      return (
        <Button asChild size={size} variant="outline" className={className} disabled>
          <span>Awaiting response</span>
        </Button>
      );
    case "connected":
    case "conversing":
      return (
        <Button asChild size={size} variant={variant} className={className}>
          <Link to={`/agent/matches?id=${rel.id}&tab=conversation`}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            {rel.unreadCount > 0 ? `Reply (${rel.unreadCount})` : rel.stage === "conversing" ? "Open chat" : "Say hello"}
          </Link>
        </Button>
      );
    case "closed_won":
    case "closed_lost":
      return (
        <Button asChild size={size} variant="ghost" className={className}>
          <Link to={`/agent/matches/${rel.matchId}`}>
            View <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      );
  }
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { deriveUiStatus, nextActionsFor, UI_STATUS_LABEL } from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";

interface Props {
  rel: Relationship;
  onOpenConversation?: () => void;
  onSendToClient?: () => void;
}

export function NextActionCard({ rel, onOpenConversation, onSendToClient }: Props) {
  const { state, update } = useMatchLocalState(rel.matchId);
  const status = deriveUiStatus(rel, state);
  const { primary, secondary } = nextActionsFor(status);
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function handle(id: string, label: string) {
    setBusy(id);
    try {
      switch (id) {
        case "send_to_client":
          onSendToClient?.();
          return;
        case "open_conversation":
          onOpenConversation?.();
          return;
        case "mark_interested":
          update({ clientInterestedAt: new Date().toISOString() });
          toast({ title: "Marked Client Interested" });
          return;
        case "request_seller_details":
          toast({ title: "Request sent", description: "We'll notify the listing agent." });
          return;
        case "follow_up_client":
          toast({ title: "Follow-up reminder set", description: "You'll be nudged in 2 days." });
          return;
        case "request_agent_intro":
          toast({ title: "Intro requested", description: "Listing agent will be notified." });
          return;
        case "send_client_questions":
          toast({ title: "Questionnaire sent to client" });
          return;
        case "schedule_call":
          toast({ title: "Open the conversation to propose times." });
          return;
        case "request_documents":
          toast({ title: "Document request sent" });
          return;
        case "start_reviewing_docs":
          update({ reviewingDocs: true });
          toast({ title: "Marked Reviewing Docs" });
          return;
        case "mark_loi_sent":
          update({ loiSentAt: new Date().toISOString() });
          toast({ title: "LOI / Offer logged" });
          return;
        case "mark_under_contract":
          toast({ title: "Update under-contract status from the full match page." });
          return;
        case "archive":
          update({ archivedAt: new Date().toISOString() });
          toast({ title: "Match archived" });
          return;
        case "reactivate":
          update({
            archivedAt: null,
            notFitAt: null,
            clientPassedAt: null,
            sellerUnavailableAt: null,
          });
          toast({ title: "Match reactivated" });
          return;
        case "not_a_fit":
          update({ notFitAt: new Date().toISOString() });
          toast({ title: "Marked Not a Fit" });
          return;
        case "client_passed":
          update({ clientPassedAt: new Date().toISOString() });
          toast({ title: "Marked Client Passed" });
          return;
        default:
          toast({ title: label });
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Next action</h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {UI_STATUS_LABEL[status]}
        </span>
      </div>
      <div className="space-y-2">
        {primary ? (
          <Button
            className="w-full"
            onClick={() => handle(primary.id, primary.label)}
            disabled={busy === primary.id}
          >
            {primary.label}
          </Button>
        ) : (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            This deal is complete. No further action required.
          </p>
        )}
        {secondary.map((a) => (
          <Button
            key={a.id}
            variant={a.tone === "destructive" ? "ghost" : "outline"}
            size="sm"
            className={cn(
              "w-full justify-start",
              a.tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
            )}
            onClick={() => handle(a.id, a.label)}
            disabled={busy === a.id}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

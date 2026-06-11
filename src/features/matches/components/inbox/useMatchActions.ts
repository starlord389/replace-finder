import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { deriveUiStatus, nextActionsFor } from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";

interface Callbacks {
  onOpenConversation?: () => void;
  onSendToClient?: () => void;
}

export function useMatchActions(rel: Relationship, cb: Callbacks = {}) {
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
          cb.onSendToClient?.();
          return;
        case "open_conversation":
          cb.onOpenConversation?.();
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
          update({ reviewingDocs: true, reviewingDocsAt: new Date().toISOString() });
          toast({ title: "Marked Reviewing Docs" });
          return;
        case "mark_loi_sent":
          update({ loiSentAt: new Date().toISOString() });
          toast({ title: "LOI / Offer logged" });
          return;
        case "mark_under_contract":
          update({ underContractAt: new Date().toISOString() });
          toast({ title: "Marked Under Contract" });
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

  return { status, primary, secondary, handle, busy };
}

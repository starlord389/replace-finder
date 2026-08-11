import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { deriveUiStatus, nextActionsForRelationship, statusForAudience } from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";
import { requestAgentContact, startAgentConnection } from "@/features/representation/api";

interface Callbacks {
  onOpenConversation?: () => void;
  onSendToClient?: () => void;
}

export function useMatchActions(
  rel: Relationship,
  cb: Callbacks = {},
  audience: "agent" | "investor" = "agent",
) {
  const { state, update } = useMatchLocalState(rel.matchId);
  const status = statusForAudience(deriveUiStatus(rel, state), audience);
  const actions = nextActionsForRelationship(rel, status, audience);
  const primary = actions.primary;
  const secondary = actions.secondary;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  /**
   * Opens a direct line to the counterparty agent. Creates the connection
   * row on first use. Both sides are already verified agents with authority
   * over their respective exchanges, so no second approval is required.
   */
  async function startConversation() {
    if (!rel.connectionId || rel.connectionStatus === "pending") {
      try {
        const connectionId = await startAgentConnection(
          rel.matchId,
          audience === "agent" ? rel.agentContactRequestId ?? undefined : undefined,
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["unified-relationships"] }),
          queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
        ]);
        if (!connectionId) {
          toast({ title: "Waiting for representation", description: "The property owner is assigning an agent. Your interest has been preserved." });
          return;
        }
      } catch (error: unknown) {
        toast({
          title: "Couldn't start conversation",
          description: error instanceof Error ? error.message : "Unable to start the agent connection.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Conversation ready",
        description: "You can message the listing agent now. They have been notified.",
      });
    }
    update({ conversationStartedAt: state.conversationStartedAt ?? new Date().toISOString() });
    cb.onOpenConversation?.();
  }

  async function handle(id: string, label: string) {
    setBusy(id);
    try {
      switch (id) {
        case "send_to_client":
          cb.onSendToClient?.();
          return;
        case "message_listing_agent":
        case "open_conversation":
          await startConversation();
          return;
        case "request_agent_contact":
          await requestAgentContact(rel.buyerExchangeId, rel.matchId);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
            queryClient.invalidateQueries({ queryKey: ["unified-relationships"] }),
          ]);
          toast({ title: "Request sent", description: "Your agent will review the match and handle contact with the listing agent. If you still need an agent, your request will stay saved." });
          return;
        case "view_agent_request":
          toast({ title: "Your request is in progress", description: "Open My Agent to see representation and request status." });
          return;
        case "decline_client_request": {
          if (!rel.agentContactRequestId) return;
          const reason = window.prompt("Add a short explanation for your client (optional):");
          if (reason === null) return;
          const { error } = await supabase.rpc("decline_agent_contact_request", {
            p_request_id: rel.agentContactRequestId,
            p_note: reason.trim() || null,
          });
          if (error) {
            toast({ title: "Couldn't pass on this request", description: error.message, variant: "destructive" });
            return;
          }
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
            queryClient.invalidateQueries({ queryKey: ["unified-relationships"] }),
          ]);
          toast({ title: "Client request updated", description: "Your client was notified." });
          return;
        }
        case "mark_interested":
          update({ clientInterestedAt: new Date().toISOString() });
          toast({ title: audience === "investor" ? "Marked Interested" : "Marked Client Interested" });
          return;
        case "follow_up_client": {
          const who = rel.clientName ? rel.clientName.split(" ")[0] : "your client";
          toast({ title: `Check in with ${who}`, description: "Reach out to keep this match moving." });
          return;
        }
        case "schedule_call":
          await startConversation();
          toast({ title: "Propose times in the conversation." });
          return;
        case "request_documents":
          await startConversation();
          toast({ title: "Ask for the OM and financials in the conversation." });
          return;
        case "mark_loi_sent":
          update({ loiSentAt: new Date().toISOString() });
          toast({ title: "Offer logged" });
          return;
        case "mark_under_contract":
          update({ underContractAt: new Date().toISOString() });
          toast({ title: "Marked Under Contract" });
          return;
        case "mark_closed":
          update({ closedAt: new Date().toISOString() });
          toast({ title: "Deal closed", description: "Congratulations - great outcome for your client." });
          return;
        case "archive":
          update({ archivedAt: new Date().toISOString() });
          toast({ title: "Match archived" });
          return;
        case "reactivate": {
          // Clearing the local archive flags always reactivates a locally-set-aside
          // match. But when the connection itself was ended at the DB level
          // (counterparty declined/cancelled → stage "closed_lost"), the row stays
          // "archived" no matter what we clear locally. Re-send it as a fresh
          // live conversation so the match can resume without another approval step.
          const counterpartyEnded =
            rel.stage === "closed_lost" &&
            !!rel.connectionId &&
            !!rel.connectionStatus &&
            ["declined", "cancelled"].includes(rel.connectionStatus);
          if (counterpartyEnded) {
            const { error } = await supabase
              .from("exchange_connections")
              .update({
                status: "accepted",
                initiated_by: rel.mySide === "buyer" ? "buyer_agent" : "seller_agent",
                accepted_at: new Date().toISOString(),
                declined_at: null,
                closed_at: null,
                decline_reason: null,
              })
              .eq("id", rel.connectionId!);
            if (error) {
              toast({
                title: "Couldn't reactivate",
                description: error.message,
                variant: "destructive",
              });
              return;
            }
            await queryClient.invalidateQueries({ queryKey: ["unified-relationships"] });
          }
          update({
            archivedAt: null,
            notFitAt: null,
            clientPassedAt: null,
            sellerUnavailableAt: null,
          });
          toast({
            title: "Match reactivated",
            description: counterpartyEnded
              ? "The agent conversation is open again."
              : undefined,
          });
          return;
        }
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
    } catch (error: unknown) {
      toast({
        title: "Couldn't complete this action",
        description: error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  return { status, primary, secondary, handle, busy };
}

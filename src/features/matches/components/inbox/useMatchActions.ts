import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  /**
   * Opens a direct line to the counterparty agent. Creates the connection
   * row on first use (no intro-request handshake — your client's interest
   * is the green light), then drops the agent into the live conversation.
   */
  async function startConversation() {
    // A pending request can only be accepted by the OTHER side. If we initiated
    // it, we're awaiting their response — don't let the requester self-accept and
    // bypass the counterparty's consent.
    if (rel.connectionId && rel.connectionStatus === "pending") {
      const iInitiated =
        rel.connectionInitiatedBy === (rel.mySide === "buyer" ? "buyer_agent" : "seller_agent");
      if (iInitiated) {
        toast({
          title: "Awaiting their response",
          description: "You've already requested to connect — the other agent needs to accept before the conversation opens.",
        });
        return;
      }
      const { error } = await supabase
        .from("exchange_connections")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", rel.connectionId);
      if (error) {
        toast({ title: "Couldn't accept", description: error.message, variant: "destructive" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["unified-relationships"] });
    }
    if (!rel.connectionId) {
      if (!rel.sellerAgentId) {
        toast({
          title: "Can't start conversation",
          description: "The listing agent isn't available for this match.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.from("exchange_connections").insert({
        match_id: rel.matchId,
        buyer_exchange_id: rel.buyerExchangeId,
        buyer_agent_id: rel.buyerAgentId,
        seller_agent_id: rel.sellerAgentId,
        initiated_by: rel.mySide === "seller" ? "seller_agent" : "buyer_agent",
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });
      if (error) {
        toast({
          title: "Couldn't start conversation",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["unified-relationships"] });
      toast({ title: "You're connected", description: "Say hello — messages are private and in-app." });
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
        case "mark_interested":
          update({ clientInterestedAt: new Date().toISOString() });
          toast({ title: "Marked Client Interested" });
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
          toast({ title: "Deal closed", description: "Congratulations — great outcome for your client." });
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
          // connection request so the counterparty can accept again — anything else
          // would be a false success.
          const counterpartyEnded =
            rel.stage === "closed_lost" &&
            !!rel.connectionId &&
            !!rel.connectionStatus &&
            ["declined", "cancelled"].includes(rel.connectionStatus);
          if (counterpartyEnded) {
            const { error } = await supabase
              .from("exchange_connections")
              .update({
                status: "pending",
                initiated_by: rel.mySide === "buyer" ? "buyer_agent" : "seller_agent",
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
              ? "Sent a fresh request — the other agent needs to accept before the conversation reopens."
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
    } finally {
      setBusy(null);
    }
  }

  return { status, primary, secondary, handle, busy };
}

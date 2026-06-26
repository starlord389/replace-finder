import {
  Send, Sparkles, Bell, XCircle, MessageSquare, Phone, FileText,
  FileSignature, FileCheck, Handshake, Archive, RotateCcw, ArrowRight,
  type LucideIcon,
} from "lucide-react";

/** Shared map from a match-action id (see inboxHelpers.nextActionsFor) to its icon. */
export const ACTION_ICONS: Record<string, LucideIcon> = {
  send_to_client: Send,
  not_a_fit: XCircle,
  mark_interested: Sparkles,
  follow_up_client: Bell,
  client_passed: XCircle,
  message_listing_agent: MessageSquare,
  open_conversation: MessageSquare,
  schedule_call: Phone,
  request_documents: FileText,
  mark_loi_sent: FileSignature,
  mark_under_contract: FileCheck,
  mark_closed: Handshake,
  archive: Archive,
  reactivate: RotateCcw,
};

export { ArrowRight };

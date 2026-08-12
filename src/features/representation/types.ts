export type RepresentationStatus =
  | "pending_signup"
  | "pending_verification"
  | "awaiting_agent"
  | "awaiting_acceptance"
  | "awaiting_investor_confirmation"
  | "active"
  | "declined"
  | "expired"
  | "revoked";

export interface Representation {
  id: string;
  investor_id: string | null;
  investor_email: string;
  agent_id: string | null;
  agent_email: string;
  agent_name: string | null;
  status: RepresentationStatus;
  source: "agent_invite" | "investor_invite" | "platform_referral" | "admin_assignment";
  is_default: boolean;
  assign_future_exchanges: boolean;
  is_demo: boolean;
  requested_exchange_id: string | null;
  request_context: {
    location?: string;
    property_type?: string;
    timing?: string;
    notes?: string;
  };
  accepted_at: string | null;
  created_at: string;
  ended_reason: string | null;
}

export interface ExchangeAssignment {
  id: string;
  exchange_id: string;
  representation_id: string;
  investor_id: string;
  agent_id: string;
  status: "active" | "revoked";
  is_primary: boolean;
  can_manage_exchange: boolean;
  can_manage_listing: boolean;
  can_view_documents: boolean;
}

export interface RepresentationInvite {
  id: string;
  representation_id: string;
  direction: "agent_to_investor" | "investor_to_agent";
  email: string;
  token: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  expires_at: string;
  last_sent_at: string | null;
  send_count: number;
  delivery_status: "unknown" | "not_sent" | "sending" | "sent" | "failed";
  delivery_error_code: string | null;
  created_by: string;
  created_at: string;
  metadata?: {
    client_id?: string;
    exchange_ids?: string[];
  };
}

export interface AgentContactRequest {
  id: string;
  investor_id: string;
  exchange_id: string;
  match_id: string;
  property_id: string;
  representing_agent_id: string | null;
  connection_id: string | null;
  status:
    | "waiting_for_agent"
    | "requested"
    | "accepted"
    | "awaiting_counterparty_agent"
    | "contacted"
    | "declined"
    | "closed";
  investor_note: string | null;
  agent_note: string | null;
  requested_at: string;
  acted_at: string | null;
}

export interface AgentConnectionIntent {
  id: string;
  match_id: string;
  buyer_exchange_id: string;
  seller_exchange_id: string | null;
  property_id: string;
  initiating_agent_id: string;
  initiated_by: "buyer_agent" | "seller_agent";
  waiting_on_side: "buyer" | "seller";
  waiting_exchange_id: string;
  waiting_owner_id: string;
  contact_request_id: string | null;
  connection_id: string | null;
  status: "awaiting_representation" | "connected" | "conflict" | "cancelled";
  is_demo: boolean;
  last_requested_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export const representationStatusLabel: Record<RepresentationStatus, string> = {
  pending_signup: "Waiting for signup",
  pending_verification: "Waiting for agent verification",
  awaiting_agent: "Finding an agent",
  awaiting_acceptance: "Waiting for agent",
  awaiting_investor_confirmation: "Your confirmation needed",
  active: "Active",
  declined: "Declined",
  expired: "Expired",
  revoked: "Ended",
};

export const contactRequestStatusLabel: Record<AgentContactRequest["status"], string> = {
  waiting_for_agent: "Agent needed",
  requested: "Ready for your review",
  accepted: "In review",
  awaiting_counterparty_agent: "Waiting for the other owner's agent",
  contacted: "Agents connecting",
  declined: "Agent passed",
  closed: "Closed",
};

export const investorContactRequestStatusLabel: Record<AgentContactRequest["status"], string> = {
  waiting_for_agent: "Waiting for an agent",
  requested: "Sent to your agent",
  accepted: "Agent reviewing",
  awaiting_counterparty_agent: "Other side is assigning an agent",
  contacted: "Agents connecting",
  declined: "Agent passed",
  closed: "Closed",
};

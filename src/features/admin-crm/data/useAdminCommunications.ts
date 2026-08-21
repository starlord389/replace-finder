import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

export type CommunicationChannel =
  | "all"
  | "agent_agent"
  | "client_agent"
  | "notification"
  | "email"
  | "sms"
  | "invitation"
  | "support";

export type CommunicationRecordType =
  | "agent_conversation"
  | "client_agent_thread"
  | "notification"
  | "admin_message"
  | "email_delivery"
  | "sms_message"
  | "representation_invite"
  | "client_invite"
  | "support_ticket";

export type AdminCommunication = {
  recordType: CommunicationRecordType;
  recordId: string;
  channel: Exclude<CommunicationChannel, "all">;
  title: string;
  preview: string;
  status: string;
  messageCount: number;
  unreadCount: number;
  occurredAt: string;
  participantSummary: string;
  primaryUserId: string | null;
  secondaryUserId: string | null;
  isDemo: boolean;
  context: Record<string, unknown>;
};

export type AdminCommunicationItem = {
  itemKey: string;
  senderId: string | null;
  senderName: string;
  senderRole: string;
  body: string;
  subject: string | null;
  status: string;
  createdAt: string;
  readAt: string | null;
  metadata: Record<string, unknown>;
};

export type CommunicationFilters = {
  userId?: string;
  dataScope: "live" | "demo";
  channel?: CommunicationChannel;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type CommunicationPage = {
  rows: AdminCommunication[];
  total: number;
  source: "rpc" | "legacy";
  warning: string | null;
};

type CommunicationItemsPage = {
  rows: AdminCommunicationItem[];
  total: number;
  source: "rpc" | "legacy";
  warning: string | null;
};

const LEGACY_WARNING = "The communications migration has not been applied yet. This temporary read mode does not write sensitive-view audit entries.";

function jsonRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isMissingRpc(error: { code?: string; message?: string }) {
  return error.code === "PGRST202"
    || error.code === "42883"
    || Boolean(error.message?.includes("Could not find the function"));
}

function mapRpcCommunication(row: {
  record_type: string;
  record_id: string;
  channel: string;
  title: string;
  preview: string;
  status: string;
  message_count: number;
  unread_count: number;
  occurred_at: string;
  participant_summary: string;
  primary_user_id: string;
  secondary_user_id: string;
  is_demo: boolean;
  context: Json;
}): AdminCommunication {
  return {
    recordType: row.record_type as CommunicationRecordType,
    recordId: row.record_id,
    channel: row.channel as Exclude<CommunicationChannel, "all">,
    title: row.title,
    preview: row.preview,
    status: row.status,
    messageCount: Number(row.message_count || 0),
    unreadCount: Number(row.unread_count || 0),
    occurredAt: row.occurred_at,
    participantSummary: row.participant_summary,
    primaryUserId: row.primary_user_id || null,
    secondaryUserId: row.secondary_user_id || null,
    isDemo: Boolean(row.is_demo),
    context: jsonRecord(row.context),
  };
}

function mapRpcItem(row: {
  item_key: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  subject: string;
  status: string;
  created_at: string;
  read_at: string;
  metadata: Json;
}): AdminCommunicationItem {
  return {
    itemKey: row.item_key,
    senderId: row.sender_id || null,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    subject: row.subject || null,
    status: row.status,
    createdAt: row.created_at,
    readAt: row.read_at || null,
    metadata: jsonRecord(row.metadata),
  };
}

export function useAdminCommunications(filters: CommunicationFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 30));
  const channel = filters.channel && filters.channel !== "all" ? filters.channel : null;
  return useQuery({
    queryKey: ["admin-communications", filters.userId ?? null, filters.dataScope, channel, filters.status ?? null, filters.search ?? null, page, pageSize],
    queryFn: async (): Promise<CommunicationPage> => {
      const { data, error } = await supabase.rpc("admin_list_communications", {
        p_user_id: filters.userId ?? undefined,
        p_data_scope: filters.dataScope,
        p_channel: channel ?? undefined,
        p_status: filters.status?.trim() || undefined,
        p_search: filters.search?.trim() || undefined,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
      });
      if (!error) {
        const rows = (data ?? []).map(mapRpcCommunication);
        return { rows, total: Number(data?.[0]?.total_count ?? 0), source: "rpc", warning: null };
      }
      if (!isMissingRpc(error)) throw error;
      return loadLegacyCommunications({ ...filters, page, pageSize });
    },
    staleTime: 15_000,
  });
}

export function useAdminCommunicationItems(record: AdminCommunication | null) {
  return useQuery({
    queryKey: ["admin-communication-items", record?.recordType ?? null, record?.recordId ?? null],
    enabled: Boolean(record),
    queryFn: async (): Promise<CommunicationItemsPage> => {
      if (!record) return { rows: [], total: 0, source: "rpc", warning: null };
      const { data, error } = await supabase.rpc("admin_get_communication_items", {
        p_record_type: record.recordType,
        p_record_id: record.recordId,
        p_limit: 250,
        p_offset: 0,
      });
      if (!error) {
        const rows = (data ?? []).map(mapRpcItem);
        return { rows, total: Number(data?.[0]?.total_count ?? 0), source: "rpc", warning: null };
      }
      if (!isMissingRpc(error)) throw error;
      return loadLegacyItems(record);
    },
    staleTime: 10_000,
  });
}

type SafeRepresentationInvite = Pick<Tables<"representation_invites">,
  "id" | "accepted_at" | "accepted_user_id" | "cancelled_at" | "created_at" | "created_by" |
  "delivery_error_code" | "delivery_status" | "direction" | "email" | "expires_at" | "last_sent_at" |
  "representation_id" | "send_count" | "status" | "updated_at">;
type SafeClientInvite = Pick<Tables<"client_invites">,
  "id" | "accepted_at" | "accepted_user_id" | "agent_id" | "client_id" | "created_at" | "email" |
  "expires_at" | "status" | "updated_at">;

async function loadLegacyCommunications(filters: CommunicationFilters): Promise<CommunicationPage> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 30;
  const [
    profilesResult,
    connectionsResult,
    threadsResult,
    notificationsResult,
    adminMessagesResult,
    smsResult,
    representationInvitesResult,
    clientInvitesResult,
    supportResult,
    exchangesResult,
    representationsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone"),
    supabase.from("exchange_connections").select("*").order("updated_at", { ascending: false }).limit(250),
    supabase.from("client_agent_threads").select("*").order("updated_at", { ascending: false }).limit(250),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("admin_messages").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("representation_invites").select("id, accepted_at, accepted_user_id, cancelled_at, created_at, created_by, delivery_error_code, delivery_status, direction, email, expires_at, last_sent_at, representation_id, send_count, status, updated_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("client_invites").select("id, accepted_at, accepted_user_id, agent_id, client_id, created_at, email, expires_at, status, updated_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("support_tickets").select("*").order("updated_at", { ascending: false }).limit(250),
    supabase.from("exchanges").select("id, is_demo").limit(1000),
    supabase.from("agent_representations").select("id, is_demo").limit(1000),
  ]);

  const firstError = [profilesResult, connectionsResult, threadsResult, notificationsResult, adminMessagesResult, smsResult, representationInvitesResult, clientInvitesResult, supportResult, exchangesResult, representationsResult]
    .find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const profiles = profilesResult.data ?? [];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const profileByEmail = new Map(profiles.filter((profile) => profile.email).map((profile) => [profile.email!.toLowerCase(), profile]));
  const exchangeDemoById = new Map((exchangesResult.data ?? []).map((exchange) => [exchange.id, exchange.is_demo]));
  const representationDemoById = new Map((representationsResult.data ?? []).map((representation) => [representation.id, representation.is_demo]));
  const profileName = (id: string | null | undefined, fallback: string) => {
    const profile = id ? profileById.get(id) : null;
    return profile?.full_name || profile?.email || fallback;
  };
  const connectionIds = (connectionsResult.data ?? []).map((row) => row.id);
  const threadIds = (threadsResult.data ?? []).map((row) => row.id);
  const [messagesResult, clientMessagesResult] = await Promise.all([
    connectionIds.length
      ? supabase.from("messages").select("*").in("connection_id", connectionIds).order("created_at", { ascending: false }).limit(2000)
      : Promise.resolve({ data: [] as Tables<"messages">[], error: null }),
    threadIds.length
      ? supabase.from("client_agent_messages").select("*").in("thread_id", threadIds).order("created_at", { ascending: false }).limit(2000)
      : Promise.resolve({ data: [] as Tables<"client_agent_messages">[], error: null }),
  ]);
  if (messagesResult.error) throw messagesResult.error;
  if (clientMessagesResult.error) throw clientMessagesResult.error;

  const rows: AdminCommunication[] = [];
  for (const connection of connectionsResult.data ?? []) {
    const messages = (messagesResult.data ?? []).filter((message) => message.connection_id === connection.id);
    const latest = messages[0];
    const buyer = profileName(connection.buyer_agent_id, "Buyer agent");
    const seller = profileName(connection.seller_agent_id, "Listing agent");
    rows.push({
      recordType: "agent_conversation", recordId: connection.id, channel: "agent_agent",
      title: `${buyer} with ${seller}`, preview: latest?.content || "No messages have been sent yet.", status: connection.status,
      messageCount: messages.length, unreadCount: messages.filter((message) => !message.read_at).length,
      occurredAt: latest?.created_at || connection.updated_at, participantSummary: `${buyer} ↔ ${seller}`,
      primaryUserId: connection.buyer_agent_id, secondaryUserId: connection.seller_agent_id,
      isDemo: Boolean(exchangeDemoById.get(connection.buyer_exchange_id) || (connection.seller_exchange_id && exchangeDemoById.get(connection.seller_exchange_id))),
      context: { connection_id: connection.id, match_id: connection.match_id, buyer_exchange_id: connection.buyer_exchange_id, seller_exchange_id: connection.seller_exchange_id },
    });
  }
  for (const thread of threadsResult.data ?? []) {
    const messages = (clientMessagesResult.data ?? []).filter((message) => message.thread_id === thread.id);
    const latest = messages[0];
    const investor = profileName(thread.investor_id, "Property owner");
    const agent = profileName(thread.agent_id, "Agent");
    rows.push({
      recordType: "client_agent_thread", recordId: thread.id, channel: "client_agent",
      title: `${investor} with ${agent}`, preview: latest?.content || "No messages have been sent yet.", status: "active",
      messageCount: messages.length, unreadCount: messages.filter((message) => !message.read_at).length,
      occurredAt: latest?.created_at || thread.updated_at, participantSummary: `${investor} ↔ ${agent}`,
      primaryUserId: thread.investor_id, secondaryUserId: thread.agent_id,
      isDemo: Boolean((thread.exchange_id && exchangeDemoById.get(thread.exchange_id)) || representationDemoById.get(thread.representation_id)),
      context: { thread_id: thread.id, representation_id: thread.representation_id, exchange_id: thread.exchange_id, match_id: thread.match_id },
    });
  }
  for (const notification of notificationsResult.data ?? []) {
    rows.push({
      recordType: "notification", recordId: notification.id, channel: "notification", title: notification.title,
      preview: notification.message, status: notification.read ? "read" : "unread", messageCount: 1,
      unreadCount: notification.read ? 0 : 1, occurredAt: notification.created_at,
      participantSummary: profileName(notification.user_id, "Account notification"), primaryUserId: notification.user_id,
      secondaryUserId: null, isDemo: Boolean(notification.is_demo) || jsonRecord(notification.metadata).demo === true, context: { notification_type: notification.type, link_to: notification.link_to, emailed_at: notification.emailed_at, email_status: notification.email_status },
    });
  }
  for (const message of adminMessagesResult.data ?? []) {
    const recipient = profileById.get(message.recipient_id) ?? profileByEmail.get(message.recipient_email.toLowerCase());
    rows.push({
      recordType: "admin_message", recordId: message.id, channel: "email", title: message.subject,
      preview: message.message_text, status: message.status, messageCount: 1, unreadCount: 0,
      occurredAt: message.sent_at || message.updated_at, participantSummary: message.recipient_name || message.recipient_email,
      primaryUserId: recipient?.id ?? null, secondaryUserId: null, isDemo: Boolean(message.is_demo) || message.recipient_email.toLowerCase().endsWith("@replacefinder.test"),
      context: { source: "administrator", recipient_email: message.recipient_email, provider_message_id: message.provider_message_id },
    });
  }
  for (const sms of smsResult.data ?? []) {
    const digits = sms.to_number.replace(/\D/g, "").slice(-10);
    const recipient = profiles.find((profile) => (profile.phone || "").replace(/\D/g, "").slice(-10) === digits && digits.length === 10);
    rows.push({
      recordType: "sms_message", recordId: sms.id, channel: "sms", title: sms.purpose?.replace(/_/g, " ") || "Text message",
      preview: sms.body || sms.error_message || "SMS delivery event", status: sms.status, messageCount: 1, unreadCount: 0,
      occurredAt: sms.status_updated_at || sms.updated_at, participantSummary: recipient?.full_name || recipient?.email || sms.to_number,
      primaryUserId: recipient?.id ?? null, secondaryUserId: null, isDemo: Boolean(sms.is_demo) || Boolean(recipient?.email?.endsWith("@replacefinder.test")),
      context: { to_number: sms.to_number, from_number: sms.from_number, purpose: sms.purpose, delivered_at: sms.delivered_at, error_code: sms.error_code },
    });
  }
  for (const invite of representationInvitesResult.data as SafeRepresentationInvite[] ?? []) addRepresentationInvite(rows, invite, profileById, profileByEmail);
  for (const invite of clientInvitesResult.data as SafeClientInvite[] ?? []) addClientInvite(rows, invite, profileById, profileByEmail);
  for (const ticket of supportResult.data ?? []) {
    rows.push({
      recordType: "support_ticket", recordId: ticket.id, channel: "support", title: ticket.subject,
      preview: ticket.message, status: ticket.status, messageCount: ticket.admin_notes?.trim() ? 2 : 1,
      unreadCount: ["open", "in_progress"].includes(ticket.status) ? 1 : 0, occurredAt: ticket.updated_at,
      participantSummary: profileName(ticket.user_id, "Support requester"), primaryUserId: ticket.user_id,
      secondaryUserId: ticket.resolved_by, isDemo: Boolean(ticket.is_demo) || Boolean(profileById.get(ticket.user_id)?.email?.endsWith("@replacefinder.test")),
      context: { category: ticket.category, admin_notes: ticket.admin_notes },
    });
  }

  const term = filters.search?.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (filters.userId && row.primaryUserId !== filters.userId && row.secondaryUserId !== filters.userId) return false;
    if (filters.channel && filters.channel !== "all" && row.channel !== filters.channel) return false;
    if (filters.dataScope === "demo" && !row.isDemo) return false;
    if (filters.dataScope === "live" && row.isDemo) return false;
    if (filters.status?.trim() && row.status.toLowerCase() !== filters.status.trim().toLowerCase()) return false;
    if (term && !`${row.title} ${row.preview} ${row.participantSummary} ${row.status}`.toLowerCase().includes(term)) return false;
    return true;
  }).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const offset = (page - 1) * pageSize;
  return { rows: filtered.slice(offset, offset + pageSize), total: filtered.length, source: "legacy", warning: LEGACY_WARNING };
}

function addRepresentationInvite(
  rows: AdminCommunication[],
  invite: SafeRepresentationInvite,
  profileById: Map<string, Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">>,
  profileByEmail: Map<string, Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">>,
) {
  const sender = profileById.get(invite.created_by);
  const recipient = profileByEmail.get(invite.email.toLowerCase());
  rows.push({
    recordType: "representation_invite", recordId: invite.id, channel: "invitation",
    title: invite.direction === "agent_to_investor" ? "Client workspace invitation" : "Agent representation invitation",
    preview: `Sent to ${invite.email} · ${invite.delivery_status.replace(/_/g, " ")}`, status: invite.status,
    messageCount: invite.send_count, unreadCount: 0, occurredAt: invite.last_sent_at || invite.updated_at,
    participantSummary: `${sender?.full_name || sender?.email || "Inviting account"} → ${invite.email}`,
    primaryUserId: invite.created_by, secondaryUserId: invite.accepted_user_id || recipient?.id || null,
    isDemo: invite.email.toLowerCase().endsWith("@replacefinder.test"),
    context: { representation_id: invite.representation_id, direction: invite.direction, delivery_status: invite.delivery_status, delivery_error_code: invite.delivery_error_code, expires_at: invite.expires_at, accepted_at: invite.accepted_at, cancelled_at: invite.cancelled_at },
  });
}

function addClientInvite(
  rows: AdminCommunication[],
  invite: SafeClientInvite,
  profileById: Map<string, Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">>,
  profileByEmail: Map<string, Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">>,
) {
  const sender = profileById.get(invite.agent_id);
  const recipient = profileByEmail.get(invite.email.toLowerCase());
  rows.push({
    recordType: "client_invite", recordId: invite.id, channel: "invitation", title: "Client workspace invitation",
    preview: `Sent to ${invite.email}`, status: invite.status, messageCount: 1, unreadCount: 0,
    occurredAt: invite.updated_at, participantSummary: `${sender?.full_name || sender?.email || "Agent"} → ${invite.email}`,
    primaryUserId: invite.agent_id, secondaryUserId: invite.accepted_user_id || recipient?.id || null,
    isDemo: invite.email.toLowerCase().endsWith("@replacefinder.test"),
    context: { client_id: invite.client_id, expires_at: invite.expires_at, accepted_at: invite.accepted_at },
  });
}

async function loadLegacyItems(record: AdminCommunication): Promise<CommunicationItemsPage> {
  if (record.recordType === "agent_conversation") {
    const { data, error } = await supabase.from("messages").select("*").eq("connection_id", record.recordId).order("created_at", { ascending: true });
    if (error) throw error;
    const senderIds = [...new Set((data ?? []).map((message) => message.sender_id))];
    const profiles = senderIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", senderIds) : { data: [], error: null };
    if (profiles.error) throw profiles.error;
    const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Agent"]));
    const rows = (data ?? []).map((message): AdminCommunicationItem => ({
      itemKey: message.id, senderId: message.sender_id, senderName: names.get(message.sender_id) || "Agent", senderRole: "agent",
      body: message.content, subject: null, status: message.read_at ? "read" : "unread", createdAt: message.created_at,
      readAt: message.read_at, metadata: { connection_id: message.connection_id },
    }));
    return { rows, total: rows.length, source: "legacy", warning: LEGACY_WARNING };
  }
  if (record.recordType === "client_agent_thread") {
    const { data, error } = await supabase.from("client_agent_messages").select("*").eq("thread_id", record.recordId).order("created_at", { ascending: true });
    if (error) throw error;
    const senderIds = [...new Set((data ?? []).map((message) => message.sender_id))];
    const profiles = senderIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", senderIds) : { data: [], error: null };
    if (profiles.error) throw profiles.error;
    const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Participant"]));
    const rows = (data ?? []).map((message): AdminCommunicationItem => ({
      itemKey: message.id, senderId: message.sender_id, senderName: names.get(message.sender_id) || "Participant", senderRole: "participant",
      body: message.content, subject: null, status: message.read_at ? "read" : "unread", createdAt: message.created_at,
      readAt: message.read_at, metadata: { thread_id: message.thread_id },
    }));
    return { rows, total: rows.length, source: "legacy", warning: LEGACY_WARNING };
  }
  const row: AdminCommunicationItem = {
    itemKey: record.recordId, senderId: null, senderName: record.channel === "support" ? record.participantSummary : "ExchangeUp",
    senderRole: record.channel === "support" ? "user" : "system", body: record.preview, subject: record.title,
    status: record.status, createdAt: record.occurredAt, readAt: null, metadata: record.context,
  };
  return { rows: [row], total: 1, source: "legacy", warning: LEGACY_WARNING };
}

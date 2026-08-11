import { supabase } from "@/integrations/supabase/client";

function firstRow<T>(data: unknown): T {
  return (Array.isArray(data) ? data[0] : data) as T;
}

export async function sendRepresentationInvite(representationId: string) {
  const result = await supabase.functions.invoke("send-representation-invite", {
    body: { representationId },
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function inviteRepresentingAgent(input: {
  email: string;
  name?: string;
  exchangeIds: string[];
  assignFuture: boolean;
  isDemo: boolean;
}) {
  const { data, error } = await supabase.rpc("invite_representing_agent" as any, {
    p_agent_email: input.email,
    p_agent_name: input.name || null,
    p_exchange_ids: input.exchangeIds,
    p_assign_future: input.assignFuture,
    p_is_demo: input.isDemo,
  });
  if (error) throw error;
  const row = firstRow<{ representation_id: string; invite_token: string; invite_status: string }>(data);
  try {
    await sendRepresentationInvite(row.representation_id);
    return { ...row, emailWarning: null };
  } catch (error) {
    return { ...row, emailWarning: error instanceof Error ? error.message : "Email delivery failed" };
  }
}

export async function inviteInvestorClient(input: {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  isDemo: boolean;
}) {
  const { data, error } = await supabase.rpc("invite_investor_client" as any, {
    p_client_name: input.name,
    p_client_email: input.email,
    p_client_phone: input.phone || null,
    p_notes: input.notes || null,
    p_is_demo: input.isDemo,
  });
  if (error) throw error;
  const row = firstRow<{ representation_id: string; invite_token: string; invite_status: string; client_id: string }>(data);
  try {
    await sendRepresentationInvite(row.representation_id);
    return { ...row, emailWarning: null };
  } catch (error) {
    return { ...row, emailWarning: error instanceof Error ? error.message : "Email delivery failed" };
  }
}

export async function inviteExistingInvestorClient(clientId: string) {
  const { data, error } = await supabase.rpc("invite_existing_investor_client" as any, {
    p_client_id: clientId,
  });
  if (error) throw error;
  const row = firstRow<{ representation_id: string; invite_token: string; invite_status: string; client_id: string }>(data);
  try {
    await sendRepresentationInvite(row.representation_id);
    return { ...row, emailWarning: null };
  } catch (error) {
    return { ...row, emailWarning: error instanceof Error ? error.message : "Email delivery failed" };
  }
}

export async function requestAgentReferral(input: {
  exchangeId?: string;
  location?: string;
  propertyType?: string;
  timing?: string;
  notes?: string;
  isDemo: boolean;
}) {
  const { data, error } = await supabase.rpc("request_agent_referral" as any, {
    p_exchange_id: input.exchangeId || null,
    p_property_location: input.location || null,
    p_property_type: input.propertyType || null,
    p_timing: input.timing || null,
    p_notes: input.notes || null,
    p_is_demo: input.isDemo,
  });
  if (error) throw error;
  return data as string;
}

export async function requestAgentContact(exchangeId: string, matchId: string, note?: string) {
  const { data, error } = await supabase.rpc("request_agent_contact" as any, {
    p_exchange_id: exchangeId,
    p_match_id: matchId,
    p_note: note || null,
  });
  if (error) throw error;
  return data as string;
}

export async function startAgentConnection(matchId: string, requestId?: string) {
  const { data, error } = await supabase.rpc("start_agent_connection" as any, {
    p_match_id: matchId,
    p_request_id: requestId || null,
  });
  if (error) throw error;
  return data as string | null;
}

export async function cancelRepresentationInvite(representationId: string) {
  const { error } = await supabase.rpc("cancel_representation_invite" as any, {
    p_representation_id: representationId,
  });
  if (error) throw error;
}

export async function updateRepresentationInvite(input: {
  representationId: string;
  email: string;
  name?: string;
}) {
  const { error } = await supabase.rpc("update_representation_invite_email" as any, {
    p_representation_id: input.representationId,
    p_email: input.email,
    p_name: input.name || null,
  });
  if (error) throw error;
  await sendRepresentationInvite(input.representationId);
}

export async function unassignAgentFromExchange(exchangeId: string, reason?: string) {
  const { error } = await supabase.rpc("unassign_agent_from_exchange" as any, {
    p_exchange_id: exchangeId,
    p_reason: reason || null,
  });
  if (error) throw error;
}

export async function setDefaultRepresentation(representationId: string, assignFuture: boolean) {
  const { error } = await supabase.rpc("set_default_representation" as any, {
    p_representation_id: representationId,
    p_assign_future: assignFuture,
  });
  if (error) throw error;
}

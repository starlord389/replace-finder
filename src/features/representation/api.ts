import { supabase } from "@/integrations/supabase/client";

function firstRow<T>(data: unknown): T {
  return (Array.isArray(data) ? data[0] : data) as T;
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
  const emailResult = await supabase.functions.invoke("send-representation-invite", {
    body: { representationId: row.representation_id },
  });
  return { ...row, emailWarning: emailResult.error?.message ?? null };
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
  const emailResult = await supabase.functions.invoke("send-representation-invite", {
    body: { representationId: row.representation_id },
  });
  return { ...row, emailWarning: emailResult.error?.message ?? null };
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

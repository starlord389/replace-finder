import { supabase } from "@/integrations/supabase/client";

const MOCK_TAG = "__mock__";

/**
 * Removes mock data scoped to this agent. Reverse FK order:
 * notifications → messages → connections → matches → identification list →
 * criteria → property children (financials/images) → properties → clients.
 */
export async function clearAgentMockData(userId: string) {
  // notifications: tagged in metadata
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .filter("metadata->>tag", "eq", MOCK_TAG);

  // Find mock clients (notes contains tag) — drives exchanges
  const { data: clients } = await supabase
    .from("agent_clients")
    .select("id")
    .eq("agent_id", userId)
    .like("notes", `%${MOCK_TAG}%`);
  const clientIds = (clients ?? []).map((c) => c.id);

  // Mock properties (description contains tag)
  const { data: properties } = await supabase
    .from("pledged_properties")
    .select("id")
    .eq("agent_id", userId)
    .like("description", `%${MOCK_TAG}%`);
  const propertyIds = (properties ?? []).map((p) => p.id);

  // Exchanges tied to mock clients
  const { data: exchanges } = await supabase
    .from("exchanges")
    .select("id")
    .eq("agent_id", userId)
    .in("client_id", clientIds.length ? clientIds : ["00000000-0000-0000-0000-000000000000"]);
  const exchangeIds = (exchanges ?? []).map((e) => e.id);

  if (exchangeIds.length) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id")
      .in("buyer_exchange_id", exchangeIds);
    const matchIds = (matches ?? []).map((m) => m.id);

    if (matchIds.length) {
      const { data: connections } = await supabase
        .from("exchange_connections")
        .select("id")
        .in("match_id", matchIds);
      const connIds = (connections ?? []).map((c) => c.id);

      if (connIds.length) {
        await supabase.from("messages").delete().in("connection_id", connIds);
        await supabase.from("exchange_connections").delete().in("id", connIds);
      }
      await supabase.from("matches").delete().in("id", matchIds);
    }

    // ID list entries reference exchanges and properties — remove before both
    await supabase.from("identification_list").delete().in("exchange_id", exchangeIds);

    // Null FK references on exchanges so criteria and properties can be removed.
    // Agents have no DELETE policy on exchanges, so the rows themselves stay.
    await supabase
      .from("exchanges")
      .update({ relinquished_property_id: null, criteria_id: null })
      .in("id", exchangeIds);

    await supabase.from("replacement_criteria").delete().in("exchange_id", exchangeIds);
  }

  if (propertyIds.length) {
    // Children first in case the FK lacks ON DELETE CASCADE
    await supabase.from("property_financials").delete().in("property_id", propertyIds);
    await supabase.from("property_images").delete().in("property_id", propertyIds);
    await supabase.from("property_documents").delete().in("property_id", propertyIds);

    const { error: delErr } = await supabase
      .from("pledged_properties")
      .delete()
      .in("id", propertyIds);
    if (delErr) {
      // Fallback when no DELETE policy: withdraw so they leave all pipelines
      await supabase
        .from("pledged_properties")
        .update({ status: "withdrawn", withdrawn_at: new Date().toISOString() })
        .in("id", propertyIds);
    }
  }

  if (clientIds.length) {
    await supabase.from("agent_clients").delete().in("id", clientIds);
  }
}

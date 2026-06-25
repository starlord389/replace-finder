import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveListingName } from "@/lib/listingDisplay";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

export interface Conversation {
  connectionId: string;
  matchId: string;
  status: string;
  buyerAgentId: string;
  sellerAgentId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyEmail: string | null;
  counterpartyAvatar: string | null;
  propertyName: string;
  propertyAddress: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

async function fetchConversations(userId: string, isDemo: boolean): Promise<Conversation[]> {
  const { data: connections, error } = await supabase
    .from("exchange_connections")
    .select("*")
    .or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`)
    .in("status", ["accepted", "in_progress", "completed"])
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!connections?.length) return [];

  const counterpartyIds = Array.from(
    new Set(
      connections.map((c) => (c.buyer_agent_id === userId ? c.seller_agent_id : c.buyer_agent_id)),
    ),
  );
  const matchIds = connections.map((c) => c.match_id);
  const connectionIds = connections.map((c) => c.id);

  const [profilesRes, matchesRes, messagesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, profile_photo_url").in("id", counterpartyIds),
    supabase.from("matches").select("id, seller_property_id").in("id", matchIds),
    supabase
      .from("messages")
      .select("connection_id, sender_id, content, created_at, read_at")
      .in("connection_id", connectionIds)
      .order("created_at", { ascending: false }),
  ]);

  const propertyIds = Array.from(new Set((matchesRes.data ?? []).map((m) => m.seller_property_id)));
  // Conversation seller properties belong to the counterparty → masked view.
  // Workspace bucketing keys off the connection's own exchanges (below), not
  // this row — the masked row can be absent if the counterparty listing moved
  // to draft, and we must never let a demo thread leak into Live.
  const exchangeIds = Array.from(
    new Set(
      connections.flatMap((c) => [c.seller_exchange_id, c.buyer_exchange_id]).filter(Boolean) as string[],
    ),
  );
  const [{ data: properties }, { data: exchanges }] = await Promise.all([
    supabase
      .from("pledged_properties_secure")
      .select("id, property_name, address, address_is_public, city, state, asset_type, agent_id, is_demo")
      .in("id", propertyIds),
    supabase.from("exchanges").select("id, is_demo").in("id", exchangeIds),
  ]);

  const profilesMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const matchesMap = new Map((matchesRes.data ?? []).map((m) => [m.id, m]));
  const propsMap = new Map((properties ?? []).map((p) => [p.id, p]));
  const exchangeDemoMap = new Map((exchanges ?? []).map((e) => [e.id, e.is_demo]));

  const lastMsgByConn = new Map<string, any>();
  const unreadByConn = new Map<string, number>();
  for (const m of messagesRes.data ?? []) {
    if (!lastMsgByConn.has(m.connection_id)) lastMsgByConn.set(m.connection_id, m);
    if (m.sender_id !== userId && m.read_at === null) {
      unreadByConn.set(m.connection_id, (unreadByConn.get(m.connection_id) ?? 0) + 1);
    }
  }

  return connections
    // Scope to the active workspace from the connection's OWN exchanges (the
    // seller side the thread is about, falling back to the buyer side), which
    // are always present — unlike the masked seller property row, which can
    // disappear when the counterparty listing moves to draft. Only fall back to
    // the property row when both exchanges are unknown, and when even that's
    // missing, exclude rather than risk surfacing a demo thread in Live.
    .filter((c) => {
      const exDemo =
        (c.seller_exchange_id != null ? exchangeDemoMap.get(c.seller_exchange_id) : undefined) ??
        exchangeDemoMap.get(c.buyer_exchange_id);
      if (exDemo !== undefined) return exDemo === isDemo;
      const match = matchesMap.get(c.match_id);
      const prop = match ? propsMap.get(match.seller_property_id) : null;
      return prop ? Boolean((prop as any).is_demo) === isDemo : false;
    })
    .map((c): Conversation => {
      const counterpartyId = c.buyer_agent_id === userId ? c.seller_agent_id : c.buyer_agent_id;
      const profile = profilesMap.get(counterpartyId);
      const match = matchesMap.get(c.match_id);
      const prop = match ? propsMap.get(match.seller_property_id) : null;
      const lastMsg = lastMsgByConn.get(c.id);
      return {
        connectionId: c.id,
        matchId: c.match_id,
        status: c.status,
        buyerAgentId: c.buyer_agent_id,
        sellerAgentId: c.seller_agent_id,
        counterpartyId,
        counterpartyName: profile?.full_name ?? "Unknown agent",
        counterpartyEmail: profile?.email ?? null,
        counterpartyAvatar: profile?.profile_photo_url ?? null,
        // Viewer sees the exact address only if they own this property or the
        // owner published it; otherwise a privacy-safe label.
        propertyName: prop ? resolveListingName(prop, (prop as any).agent_id === userId) : "Property",
        propertyAddress: prop ? [prop.city, prop.state].filter(Boolean).join(", ") : null,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        lastMessageSenderId: lastMsg?.sender_id ?? null,
        unreadCount: unreadByConn.get(c.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const aT = a.lastMessageAt ?? "";
      const bT = b.lastMessageAt ?? "";
      return bT.localeCompare(aT);
    });
}

export function useConversations() {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["conversations", user?.id, isDemo],
    queryFn: () => fetchConversations(user!.id, isDemo),
    enabled: !!user?.id,
  });

  // Realtime: refresh on any new message in any of my connections.
  // Invalidate via the query client (stable) rather than depending on the
  // `query` object — that reference changes every render and was tearing down
  // and re-subscribing the channel on each one.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["conversations", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

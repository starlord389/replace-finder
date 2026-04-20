import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: connections, error } = await supabase
    .from("exchange_connections")
    .select("*")
    .or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`)
    .in("status", ["accepted", "completed"])
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
  const { data: properties } = await supabase
    .from("pledged_properties")
    .select("id, property_name, address, city, state")
    .in("id", propertyIds);

  const profilesMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const matchesMap = new Map((matchesRes.data ?? []).map((m) => [m.id, m]));
  const propsMap = new Map((properties ?? []).map((p) => [p.id, p]));

  const lastMsgByConn = new Map<string, any>();
  const unreadByConn = new Map<string, number>();
  for (const m of messagesRes.data ?? []) {
    if (!lastMsgByConn.has(m.connection_id)) lastMsgByConn.set(m.connection_id, m);
    if (m.sender_id !== userId && m.read_at === null) {
      unreadByConn.set(m.connection_id, (unreadByConn.get(m.connection_id) ?? 0) + 1);
    }
  }

  return connections
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
        propertyName: prop?.property_name ?? "Property",
        propertyAddress: prop ? [prop.address, prop.city, prop.state].filter(Boolean).join(", ") : null,
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
  const query = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user?.id,
  });

  // Realtime: refetch on any new message in any of my connections
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, query]);

  return query;
}

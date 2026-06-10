import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";

export type RelationshipStage =
  | "new"          // match exists, no connection yet (buyer side)
  | "incoming"     // someone matched against my property, no connection initiated (seller side)
  | "pending_out"  // I sent a connection request, awaiting response
  | "pending_in"   // they sent a connection request to me, awaiting my response
  | "connected"    // connection accepted, no messages yet
  | "conversing"   // connection accepted, has messages
  | "closed_won"   // completed
  | "closed_lost"; // declined / cancelled

export interface Relationship {
  // identity
  id: string;                  // canonical id (connectionId if present, else matchId)
  matchId: string;
  connectionId: string | null;

  // perspective
  mySide: "buyer" | "seller";
  stage: RelationshipStage;

  // match scoring
  score: number;
  bootStatus: string;
  estimatedBoot: number | null;
  buyerCurrentRoe: number | null;     // ratio, e.g. 0.062
  candidateRoe: number | null;        // ratio
  roeImprovementPp: number | null;    // percentage points
  roeImprovementRel: number | null;   // ratio, e.g. 0.35 = +35%


  // counterparty (revealed only when connected)
  counterpartyName: string | null;
  counterpartyBrokerage: string | null;
  counterpartyAvatar: string | null;

  // subject property (seller's property, always)
  propertyId: string;
  propertyName: string;
  propertyCity: string | null;
  propertyState: string | null;
  propertyImageUrl: string | null;
  askingPrice: number | null;
  capRate: number | null;

  // client / exchange context
  clientId: string | null;
  clientName: string | null;
  buyerExchangeId: string;
  /** Short label for the buyer's relinquished property (city + state, or asset). */
  relinquishedLabel: string | null;


  // activity
  lastActivityAt: string;       // newest of: messages, connection updates, match created
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  isNewMatch: boolean;          // unread/unviewed match

  // connection meta (if any)
  connectionStatus: string | null;
  connectionInitiatedBy: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  closedAt: string | null;
  underContractAt: string | null;
  inspectionCompleteAt: string | null;
  financingApprovedAt: string | null;
  declineReason: string | null;

  // raw refs for downstream
  buyerAgentId: string;
  sellerAgentId: string | null;
}

async function fetchRelationships(userId: string): Promise<Relationship[]> {
  // 1. My exchanges (for buyer-side matches)
  const { data: exchanges } = await supabase
    .from("exchanges")
    .select("id, client_id, relinquished_property_id")
    .eq("agent_id", userId);
  const myExchangeIds = (exchanges ?? []).map((e) => e.id);
  const relinquishedIds = (exchanges ?? [])
    .map((e: any) => e.relinquished_property_id)
    .filter(Boolean) as string[];
  const exRelMap = new Map<string, string>();
  (exchanges ?? []).forEach((e: any) => {
    if (e.relinquished_property_id) exRelMap.set(e.id, e.relinquished_property_id);
  });

  // 2. My pledged properties (for seller-side matches)
  const { data: myProps } = await supabase
    .from("pledged_properties")
    .select("id, property_name")
    .eq("agent_id", userId);
  const myPropertyIds = (myProps ?? []).map((p) => p.id);


  // 3. Buyer-side matches
  let buyerMatches: any[] = [];
  if (myExchangeIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .in("buyer_exchange_id", myExchangeIds)
      .eq("status", "active");
    buyerMatches = data ?? [];
  }

  // 4. Seller-side matches
  let sellerMatches: any[] = [];
  if (myPropertyIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .in("seller_property_id", myPropertyIds)
      .eq("status", "active");
    sellerMatches = data ?? [];
  }

  // 5. All my connections
  const { data: connections } = await supabase
    .from("exchange_connections")
    .select("*")
    .or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`);
  const connByMatch = new Map<string, any>();
  (connections ?? []).forEach((c) => connByMatch.set(c.match_id, c));

  // 6. Hydrate properties + financials + images (for ALL involved seller properties)
  const allSellerPropIds = Array.from(
    new Set([
      ...buyerMatches.map((m) => m.seller_property_id),
      ...sellerMatches.map((m) => m.seller_property_id),
    ]),
  );

  const [propsRes, finsRes, imgsRes] = allSellerPropIds.length
    ? await Promise.all([
        supabase
          .from("pledged_properties")
          .select("id, property_name, city, state, address")
          .in("id", allSellerPropIds),
        supabase
          .from("property_financials")
          .select("property_id, asking_price, cap_rate")
          .in("property_id", allSellerPropIds),
        supabase
          .from("property_images")
          .select("property_id, storage_path, sort_order")
          .in("property_id", allSellerPropIds)
          .order("sort_order"),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }, { data: [] as any[] }];

  const propMap = new Map((propsRes.data ?? []).map((p: any) => [p.id, p]));
  const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
  const imgMap = new Map<string, any>();
  (imgsRes.data ?? []).forEach((img: any) => {
    if (!imgMap.has(img.property_id)) imgMap.set(img.property_id, img);
  });

  // 7. Client names + relinquished snapshot for my exchanges
  const clientIds = Array.from(new Set((exchanges ?? []).map((e) => e.client_id)));
  const [clientsRes, relPropsRes] = await Promise.all([
    clientIds.length
      ? supabase.from("agent_clients").select("id, client_name").in("id", clientIds)
      : Promise.resolve({ data: [] as any[] }),
    relinquishedIds.length
      ? supabase
          .from("pledged_properties")
          .select("id, property_name, city, state, asset_type")
          .in("id", relinquishedIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const clientMap = new Map((clientsRes.data ?? []).map((c: any) => [c.id, c.client_name]));
  const exClientNameMap = new Map<string, string>();
  const exClientIdMap = new Map<string, string>();
  (exchanges ?? []).forEach((e: any) => {
    exClientNameMap.set(e.id, clientMap.get(e.client_id) || "Client");
    if (e.client_id) exClientIdMap.set(e.id, e.client_id);
  });
  const relPropMap = new Map(
    (relPropsRes.data ?? []).map((p: any) => [p.id, p]),
  );
  function relinquishedLabelFor(exchangeId: string): string | null {
    const propId = exRelMap.get(exchangeId);
    if (!propId) return null;
    const p: any = relPropMap.get(propId);
    if (!p) return null;
    const loc = [p.city, p.state].filter(Boolean).join(", ");
    return loc || p.property_name || null;
  }


  // 8. Counterparty profiles (only for connected relationships)
  const connectedAgentIds = Array.from(
    new Set(
      (connections ?? [])
        .filter((c) =>
          ["accepted", "in_progress", "completed"].includes(c.status),
        )
        .flatMap((c) => [c.buyer_agent_id, c.seller_agent_id])
        .filter((id) => id !== userId),
    ),
  );
  const { data: profiles } = connectedAgentIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, brokerage_name, profile_photo_url")
        .in("id", connectedAgentIds)
    : { data: [] as any[] };
  const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  // 9. Messages (last message per connection + unread count)
  const allConnIds = (connections ?? []).map((c) => c.id);
  const lastMsgByConn = new Map<string, any>();
  const unreadByConn = new Map<string, number>();
  if (allConnIds.length) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("connection_id, sender_id, content, created_at, read_at")
      .in("connection_id", allConnIds)
      .order("created_at", { ascending: false });
    for (const m of msgs ?? []) {
      if (!lastMsgByConn.has(m.connection_id)) lastMsgByConn.set(m.connection_id, m);
      if (m.sender_id !== userId && m.read_at === null) {
        unreadByConn.set(m.connection_id, (unreadByConn.get(m.connection_id) ?? 0) + 1);
      }
    }
  }

  // 10. Build Relationship[]
  const out: Relationship[] = [];
  const seenMatchIds = new Set<string>();

  function deriveStage(
    conn: any,
    mySide: "buyer" | "seller",
    hasMessages: boolean,
  ): RelationshipStage {
    if (!conn) return mySide === "buyer" ? "new" : "incoming";
    switch (conn.status) {
      case "pending":
        return conn.initiated_by === mySide ? "pending_out" : "pending_in";
      case "accepted":
      case "in_progress":
        return hasMessages ? "conversing" : "connected";
      case "completed":
        return "closed_won";
      case "declined":
      case "cancelled":
        return "closed_lost";
      default:
        return "new";
    }
  }

  function build(match: any, mySide: "buyer" | "seller"): Relationship {
    seenMatchIds.add(match.id);
    const conn = connByMatch.get(match.id) ?? null;
    const prop = propMap.get(match.seller_property_id);
    const fin = finMap.get(match.seller_property_id);
    const img = imgMap.get(match.seller_property_id);

    const counterpartyId = conn
      ? (conn.buyer_agent_id === userId ? conn.seller_agent_id : conn.buyer_agent_id)
      : null;
    const cprof = counterpartyId ? profMap.get(counterpartyId) : null;

    const lastMsg = conn ? lastMsgByConn.get(conn.id) : null;
    const unread = conn ? unreadByConn.get(conn.id) ?? 0 : 0;
    const hasMessages = !!lastMsg;
    const stage = deriveStage(conn, mySide, hasMessages);

    // last activity timestamp = newest of message, connection event, match created
    const candidates: string[] = [match.created_at];
    if (conn) {
      candidates.push(conn.updated_at, conn.initiated_at);
      if (conn.accepted_at) candidates.push(conn.accepted_at);
      if (conn.declined_at) candidates.push(conn.declined_at);
      if (conn.closed_at) candidates.push(conn.closed_at);
    }
    if (lastMsg) candidates.push(lastMsg.created_at);
    const lastActivityAt = candidates.sort().reverse()[0];

    const isNewMatch = mySide === "buyer"
      ? !match.buyer_agent_viewed
      : !match.seller_agent_viewed;

    return {
      id: conn?.id ?? match.id,
      matchId: match.id,
      connectionId: conn?.id ?? null,
      mySide,
      stage,
      score: Number(match.total_score),
      bootStatus: match.boot_status,
      estimatedBoot: match.estimated_total_boot,
      buyerCurrentRoe: match.buyer_current_roe != null ? Number(match.buyer_current_roe) : null,
      candidateRoe: match.candidate_roe != null ? Number(match.candidate_roe) : null,
      roeImprovementPp: match.roe_improvement_pp != null ? Number(match.roe_improvement_pp) : null,
      roeImprovementRel: match.roe_improvement_rel != null ? Number(match.roe_improvement_rel) : null,
      counterpartyName: cprof?.full_name ?? null,
      counterpartyBrokerage: cprof?.brokerage_name ?? null,
      counterpartyAvatar: cprof?.profile_photo_url ?? null,

      propertyId: match.seller_property_id,
      propertyName: prop?.property_name ?? "Property",
      propertyCity: prop?.city ?? null,
      propertyState: prop?.state ?? null,
      propertyImageUrl: img ? resolvePropertyImageUrl(img.storage_path) : null,
      askingPrice: fin?.asking_price ? Number(fin.asking_price) : null,
      capRate: fin?.cap_rate ? Number(fin.cap_rate) : null,
      clientId: exClientIdMap.get(match.buyer_exchange_id) ?? null,
      clientName: exClientNameMap.get(match.buyer_exchange_id) ?? null,
      buyerExchangeId: match.buyer_exchange_id,
      relinquishedLabel: relinquishedLabelFor(match.buyer_exchange_id),

      lastActivityAt,
      lastMessagePreview: lastMsg?.content ?? null,
      lastMessageSenderId: lastMsg?.sender_id ?? null,
      unreadCount: unread,
      isNewMatch,
      connectionStatus: conn?.status ?? null,
      connectionInitiatedBy: conn?.initiated_by ?? null,
      acceptedAt: conn?.accepted_at ?? null,
      declinedAt: conn?.declined_at ?? null,
      closedAt: conn?.closed_at ?? null,
      underContractAt: conn?.under_contract_at ?? null,
      inspectionCompleteAt: conn?.inspection_complete_at ?? null,
      financingApprovedAt: conn?.financing_approved_at ?? null,
      declineReason: conn?.decline_reason ?? null,
      buyerAgentId: conn?.buyer_agent_id ?? null,
      sellerAgentId: conn?.seller_agent_id ?? null,
    };
  }

  for (const m of buyerMatches) out.push(build(m, "buyer"));
  for (const m of sellerMatches) {
    if (seenMatchIds.has(m.id)) continue; // dedupe (rare: self-match)
    out.push(build(m, "seller"));
  }

  // newest activity first
  out.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  return out;
}

export function useUnifiedRelationships() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["unified-relationships", user?.id],
    queryFn: () => fetchRelationships(user!.id),
    enabled: !!user?.id,
  });

  // Realtime invalidation on messages or connections changes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`unified-relationships-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["unified-relationships", user.id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchange_connections" },
        () => qc.invalidateQueries({ queryKey: ["unified-relationships", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

// ── Helpers (exported for components) ───────────────────────────

export const STAGE_LABELS: Record<RelationshipStage, string> = {
  new: "New match",
  incoming: "Incoming interest",
  pending_out: "Awaiting response",
  pending_in: "Needs your reply",
  connected: "Connected",
  conversing: "Conversing",
  closed_won: "Closed",
  closed_lost: "Closed (lost)",
};

export function isLiveStage(s: RelationshipStage) {
  return s !== "closed_won" && s !== "closed_lost";
}

export function isConnected(s: RelationshipStage) {
  return s === "connected" || s === "conversing" || s === "closed_won";
}

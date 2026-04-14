import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentLaunchpadProfileSnapshot {
  brokerage_name: string | null;
  brokerage_address: string | null;
  bio: string | null;
  specializations: string[] | null;
  launchpad_completed_at: string | null;
  launchpad_version: string | null;
}

export interface AgentLaunchpadProgressData {
  profile: AgentLaunchpadProfileSnapshot;
  clientCount: number;
  exchangeCount: number;
  matchCount: number;
  connectionCount: number;
  profileComplete: boolean;
}

export function isAgentProfileComplete(profile: Pick<
  AgentLaunchpadProfileSnapshot,
  "brokerage_name" | "brokerage_address" | "bio" | "specializations"
>) {
  return Boolean(
    profile.brokerage_name?.trim() &&
      profile.brokerage_address?.trim() &&
      profile.bio?.trim() &&
      (profile.specializations?.length ?? 0) > 0,
  );
}

async function fetchAgentLaunchpadProgress(userId: string): Promise<AgentLaunchpadProgressData> {
  const [profileRes, clientsRes, exchangesRes, exchangeIdsRes, connectionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("brokerage_name, brokerage_address, bio, specializations, launchpad_completed_at, launchpad_version")
      .eq("id", userId)
      .single(),
    supabase.from("agent_clients").select("id", { count: "exact", head: true }).eq("agent_id", userId),
    supabase.from("exchanges").select("id", { count: "exact", head: true }).eq("agent_id", userId),
    supabase.from("exchanges").select("id").eq("agent_id", userId),
    supabase.from("exchange_connections").select("id", { count: "exact", head: true }).or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`),
  ]);

  const exchangeIds = exchangeIdsRes.data?.map((exchange) => exchange.id) ?? [];
  const matchCount = exchangeIds.length
    ? ((await supabase.from("matches").select("id", { count: "exact", head: true }).in("buyer_exchange_id", exchangeIds)).count ?? 0)
    : 0;

  const profile = {
    brokerage_name: profileRes.data?.brokerage_name ?? null,
    brokerage_address: profileRes.data?.brokerage_address ?? null,
    bio: profileRes.data?.bio ?? null,
    specializations: profileRes.data?.specializations ?? null,
    launchpad_completed_at: profileRes.data?.launchpad_completed_at ?? null,
    launchpad_version: profileRes.data?.launchpad_version ?? null,
  };

  return {
    profile,
    clientCount: clientsRes.count ?? 0,
    exchangeCount: exchangesRes.count ?? 0,
    matchCount,
    connectionCount: connectionsRes.count ?? 0,
    profileComplete: isAgentProfileComplete(profile),
  };
}

export function useAgentLaunchpadProgress(userId?: string) {
  return useQuery({
    queryKey: ["agent-launchpad-progress", userId],
    queryFn: () => fetchAgentLaunchpadProgress(userId!),
    enabled: Boolean(userId),
  });
}

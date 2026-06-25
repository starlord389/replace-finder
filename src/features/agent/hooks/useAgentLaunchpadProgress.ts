import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";

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
  pipelineActivity: number;
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

async function fetchAgentLaunchpadProgress(userId: string, isDemo: boolean): Promise<AgentLaunchpadProgressData> {
  const [profileRes, clientsRes, exchangesRes, exchangeIdsRes, connectionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("brokerage_name, brokerage_address, bio, specializations, launchpad_completed_at, launchpad_version")
      .eq("id", userId)
      .single(),
    // Onboarding progress must reflect ONLY the active workspace. Without the
    // is_demo filter, loading the Demo sandbox (which seeds demo clients and
    // exchanges) would mark the agent's Live launchpad complete, and vice-versa.
    supabase.from("agent_clients").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchanges").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchanges").select("id").eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchange_connections").select("id, buyer_exchange_id, seller_exchange_id").or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`),
  ]);

  const exchangeIds = exchangeIdsRes.data?.map((exchange) => exchange.id) ?? [];
  // matchCount rides on the already-workspace-scoped exchange ids, so it is
  // implicitly scoped to the active workspace too.
  const matchCount = exchangeIds.length
    ? ((await supabase.from("matches").select("id", { count: "exact", head: true }).in("buyer_exchange_id", exchangeIds)).count ?? 0)
    : 0;

  // exchange_connections has no is_demo column, so scope it to the active
  // workspace via the (workspace-scoped) exchanges on each side — the same
  // approach AgentSettings uses when scoping connections for the data export.
  const exchangeIdSet = new Set(exchangeIds);
  const pipelineActivity = (connectionsRes.data ?? []).filter(
    (c) =>
      exchangeIdSet.has(c.buyer_exchange_id) ||
      (c.seller_exchange_id != null && exchangeIdSet.has(c.seller_exchange_id)),
  ).length;

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
    pipelineActivity,
    profileComplete: isAgentProfileComplete(profile),
  };
}

export function useAgentLaunchpadProgress(userId?: string) {
  const { isDemo } = useWorkspaceMode();
  return useQuery({
    queryKey: ["agent-launchpad-progress", userId, isDemo],
    queryFn: () => fetchAgentLaunchpadProgress(userId!, isDemo),
    enabled: Boolean(userId),
  });
}

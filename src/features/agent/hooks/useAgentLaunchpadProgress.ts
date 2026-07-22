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
  launchpad_matching_ack_at: string | null;
  launchpad_matches_ack_at: string | null;
  launchpad_pipeline_ack_at: string | null;
}

export interface AgentLaunchpadProgressData {
  profile: AgentLaunchpadProfileSnapshot;
  clientCount: number;
  exchangeCount: number;
  matchesTouched: boolean;
  pipelineTouched: boolean;
  profileComplete: boolean;
  profileFilledCount: number;
  profileTotalCount: number;
}

const PROFILE_FIELDS = ["brokerage_name", "brokerage_address", "bio", "specializations"] as const;

export function countFilledProfileFields(profile: Pick<
  AgentLaunchpadProfileSnapshot,
  "brokerage_name" | "brokerage_address" | "bio" | "specializations"
>) {
  let filled = 0;
  if (profile.brokerage_name?.trim()) filled++;
  if (profile.brokerage_address?.trim()) filled++;
  if (profile.bio?.trim()) filled++;
  if ((profile.specializations?.length ?? 0) > 0) filled++;
  return filled;
}

export function isAgentProfileComplete(profile: Pick<
  AgentLaunchpadProfileSnapshot,
  "brokerage_name" | "brokerage_address" | "bio" | "specializations"
>) {
  return countFilledProfileFields(profile) === PROFILE_FIELDS.length;
}

async function fetchAgentLaunchpadProgress(userId: string, isDemo: boolean): Promise<AgentLaunchpadProgressData> {
  const [profileRes, clientsRes, exchangesRes, exchangeIdsRes, connectionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("brokerage_name, brokerage_address, bio, specializations, launchpad_completed_at, launchpad_version, launchpad_matching_ack_at, launchpad_matches_ack_at, launchpad_pipeline_ack_at")
      .eq("id", userId)
      .single(),
    // Onboarding progress must reflect ONLY the active workspace. Without the
    // is_demo filter, loading the Demo sandbox (which seeds demo clients and
    // exchanges) would mark the agent's Live launchpad complete, and vice-versa.
    supabase.from("agent_clients").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchanges").select("id", { count: "exact", head: true }).eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchanges").select("id").eq("agent_id", userId).eq("is_demo", isDemo),
    supabase.from("exchange_connections").select("id, status, buyer_exchange_id, seller_exchange_id").or(`buyer_agent_id.eq.${userId},seller_agent_id.eq.${userId}`),
  ]);

  const exchangeIds = exchangeIdsRes.data?.map((exchange) => exchange.id) ?? [];

  // Fallback signal: agent has actually opened a match card (buyer_agent_viewed
  // is set by mark_match_viewed on the review panel). Auto-generated matches
  // do not flip this, so it's a real "did they engage" signal.
  const viewedMatches = exchangeIds.length
    ? await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .in("buyer_exchange_id", exchangeIds)
        .eq("buyer_agent_viewed", true)
    : { count: 0 };
  const anyMatchViewed = (viewedMatches.count ?? 0) > 0;

  // Fallback: any accepted+ connection on the agent's exchanges counts as real
  // pipeline activity even if we didn't stamp the ack yet.
  const exchangeIdSet = new Set(exchangeIds);
  const activeConnection = (connectionsRes.data ?? []).some(
    (c) =>
      (c.status === "accepted" || c.status === "in_progress" || c.status === "completed") &&
      (exchangeIdSet.has(c.buyer_exchange_id) ||
        (c.seller_exchange_id != null && exchangeIdSet.has(c.seller_exchange_id))),
  );

  const profile: AgentLaunchpadProfileSnapshot = {
    brokerage_name: profileRes.data?.brokerage_name ?? null,
    brokerage_address: profileRes.data?.brokerage_address ?? null,
    bio: profileRes.data?.bio ?? null,
    specializations: profileRes.data?.specializations ?? null,
    launchpad_completed_at: profileRes.data?.launchpad_completed_at ?? null,
    launchpad_version: profileRes.data?.launchpad_version ?? null,
    launchpad_matching_ack_at: profileRes.data?.launchpad_matching_ack_at ?? null,
    launchpad_matches_ack_at: profileRes.data?.launchpad_matches_ack_at ?? null,
    launchpad_pipeline_ack_at: profileRes.data?.launchpad_pipeline_ack_at ?? null,
  };

  return {
    profile,
    clientCount: clientsRes.count ?? 0,
    exchangeCount: exchangesRes.count ?? 0,
    matchesTouched: Boolean(profile.launchpad_matches_ack_at) || anyMatchViewed,
    pipelineTouched: Boolean(profile.launchpad_pipeline_ack_at) || activeConnection,
    profileComplete: isAgentProfileComplete(profile),
    profileFilledCount: countFilledProfileFields(profile),
    profileTotalCount: PROFILE_FIELDS.length,
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

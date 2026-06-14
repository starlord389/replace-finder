import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import {
  deriveUiStatus,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";

export type StageKey =
  | "new"
  | "interested"
  | "connected"
  | "loi"
  | "under_contract"
  | "closed";

export const STAGE_KEYS: StageKey[] = [
  "new",
  "interested",
  "connected",
  "loi",
  "under_contract",
  "closed",
];

export const STAGE_RANK: Record<StageKey, number> = {
  new: 0,
  interested: 1,
  connected: 2,
  loi: 3,
  under_contract: 4,
  closed: 5,
};

export const STAGE_DEFS: Array<{
  key: StageKey;
  title: string;
  subtitle: string;
}> = [
  { key: "new", title: "New", subtitle: "Fresh matches to triage" },
  { key: "interested", title: "Interested", subtitle: "Client is engaged" },
  { key: "connected", title: "Connected", subtitle: "Talking to listing agent" },
  { key: "loi", title: "LOI", subtitle: "Offer on the table" },
  { key: "under_contract", title: "Under contract", subtitle: "Working to close" },
  { key: "closed", title: "Closed", subtitle: "Won or archived" },
];

export function uiStatusToStage(s: UiStatus): StageKey | null {
  switch (s) {
    case "new":
      return "new";
    case "sent_to_client":
    case "client_interested":
      return "interested";
    case "in_conversation":
      return "connected";
    case "loi":
      return "loi";
    case "under_contract":
      return "under_contract";
    case "closed":
      return "closed";
    case "archived":
      return null;
  }
}

export function deriveAutoStage(
  listing: AgentListing,
  rels: Relationship[],
): StageKey {
  if (listing.status === "closed" || listing.status === "completed") {
    return "closed";
  }
  let furthest: StageKey = "new";
  for (const r of rels) {
    const ui = deriveUiStatus(r, readMatchLocalState(r.matchId));
    const s = uiStatusToStage(ui);
    if (!s) continue;
    if (STAGE_RANK[s] > STAGE_RANK[furthest]) furthest = s;
  }
  return furthest;
}

export function isValidStageKey(v: string | null | undefined): v is StageKey {
  return !!v && STAGE_KEYS.includes(v as StageKey);
}

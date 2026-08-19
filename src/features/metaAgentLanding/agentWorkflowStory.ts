export type AgentWorkflowStage = "build" | "discover" | "review" | "advance";

export type AgentWorkflowPhaseId =
  | "property-details"
  | "financial-details"
  | "replacement-criteria"
  | "listing-review"
  | "listing-published"
  | "calculating-position"
  | "evaluating-network"
  | "matches"
  | "opening-match"
  | "property-overview"
  | "financial-comparison"
  | "match-rationale"
  | "contact-tab"
  | "listing-agent"
  | "conversation-open"
  | "message-typing"
  | "message-sent";

export type AgentWorkflowSegmentId = "full" | AgentWorkflowStage;

export type AgentWorkflowBuildVisualPhase = "request" | "analyzing" | "results" | "property" | "published";
export type AgentWorkflowDiscoverVisualPhase = "published" | "analyzing" | "results";
export type AgentWorkflowReviewVisualPhase = "results" | "property" | "financials" | "match";

export type AgentWorkflowPhase = {
  id: AgentWorkflowPhaseId;
  stage: AgentWorkflowStage;
  label: string;
  durationMs: number;
};

export const AGENT_WORKFLOW_STORY = [
  { id: "property-details", stage: "build", label: "Adding property information", durationMs: 3_400 },
  { id: "financial-details", stage: "build", label: "Adding listing financials", durationMs: 3_700 },
  { id: "replacement-criteria", stage: "build", label: "Adding optional exchange criteria", durationMs: 3_800 },
  { id: "listing-review", stage: "build", label: "Reviewing the listing", durationMs: 3_300 },
  { id: "listing-published", stage: "build", label: "Listing published", durationMs: 2_200 },
  { id: "calculating-position", stage: "discover", label: "Calculating the exchange position", durationMs: 3_600 },
  { id: "evaluating-network", stage: "discover", label: "Evaluating the property network", durationMs: 3_600 },
  { id: "matches", stage: "discover", label: "Matched properties", durationMs: 4_200 },
  { id: "opening-match", stage: "review", label: "Opening the strongest match", durationMs: 1_800 },
  { id: "property-overview", stage: "review", label: "Reviewing property and location", durationMs: 4_000 },
  { id: "financial-comparison", stage: "review", label: "Comparing the financial position", durationMs: 4_500 },
  { id: "match-rationale", stage: "review", label: "Reviewing why the match fits", durationMs: 4_200 },
  { id: "contact-tab", stage: "advance", label: "Opening the Contact agent tab", durationMs: 1_800 },
  { id: "listing-agent", stage: "advance", label: "Reviewing the listing agent", durationMs: 3_000 },
  { id: "conversation-open", stage: "advance", label: "Opening the agent conversation", durationMs: 1_800 },
  { id: "message-typing", stage: "advance", label: "Writing the first message", durationMs: 4_200 },
  { id: "message-sent", stage: "advance", label: "Message delivered", durationMs: 5_200 },
] as const satisfies readonly AgentWorkflowPhase[];

const phases = (...ids: AgentWorkflowPhaseId[]) => ids.map((id) => {
  const phase = AGENT_WORKFLOW_STORY.find((item) => item.id === id);
  if (!phase) throw new Error(`Unknown agent workflow phase: ${id}`);
  return phase;
});

export const AGENT_WORKFLOW_SEGMENTS = {
  full: [...AGENT_WORKFLOW_STORY],
  build: phases(
    "property-details",
    "financial-details",
    "replacement-criteria",
    "listing-review",
    "listing-published",
  ),
  discover: phases(
    "listing-published",
    "calculating-position",
    "evaluating-network",
    "matches",
  ),
  review: phases(
    "matches",
    "opening-match",
    "property-overview",
    "financial-comparison",
    "match-rationale",
  ),
  advance: phases(
    "match-rationale",
    "contact-tab",
    "listing-agent",
    "conversation-open",
    "message-typing",
    "message-sent",
  ),
} as const satisfies Record<AgentWorkflowSegmentId, readonly AgentWorkflowPhase[]>;

export function getAgentWorkflowSegment(segment: AgentWorkflowSegmentId) {
  return AGENT_WORKFLOW_SEGMENTS[segment];
}

export function getAgentWorkflowPhase(id: AgentWorkflowPhaseId) {
  const phase = AGENT_WORKFLOW_STORY.find((item) => item.id === id);
  if (!phase) throw new Error(`Unknown agent workflow phase: ${id}`);
  return phase;
}

export function getAgentWorkflowBuildVisualPhase(phase: AgentWorkflowPhaseId): AgentWorkflowBuildVisualPhase {
  if (phase === "property-details") return "request";
  if (phase === "financial-details") return "analyzing";
  if (phase === "replacement-criteria") return "results";
  if (phase === "listing-review") return "property";
  return "published";
}

export function getAgentWorkflowDiscoverVisualPhase(phase: AgentWorkflowPhaseId): AgentWorkflowDiscoverVisualPhase {
  if (phase === "listing-published") return "published";
  if (phase === "matches") return "results";
  return "analyzing";
}

export function getAgentWorkflowReviewVisualPhase(phase: AgentWorkflowPhaseId): AgentWorkflowReviewVisualPhase {
  if (phase === "matches" || phase === "opening-match") return "results";
  if (phase === "property-overview") return "property";
  if (phase === "financial-comparison") return "financials";
  return "match";
}

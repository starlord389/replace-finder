import {
  type ReactNode,
  type RefObject,
} from "react";
import {
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";

const WORKFLOW_NAV_ITEMS = [
  "Dashboard",
  "Clients",
  "Pipeline",
  "Listings",
  "Matches",
  "Client Requests",
] as const;

export type AgentWorkflowNavItem = (typeof WORKFLOW_NAV_ITEMS)[number];

export function AgentWorkflowNavigation({
  active,
  matchesCount,
}: {
  active: AgentWorkflowNavItem;
  matchesCount?: number;
}) {
  return (
    <nav className="agent-workflow-master__nav" aria-label="Illustrative agent workspace">
      {WORKFLOW_NAV_ITEMS.map((item) => (
        <span key={item} className={item === active ? "is-active" : undefined}>
          {item}
          {item === "Matches" && matchesCount !== undefined && <i>{matchesCount}</i>}
        </span>
      ))}
    </nav>
  );
}

type AgentWorkflowFrameProps = {
  stageRef: RefObject<HTMLDivElement>;
  phaseId: AgentWorkflowPhaseId;
  cycle: number;
  ariaLabel: string;
  workspace: string;
  privacy: string;
  eyebrow: string;
  heading: string;
  status: string;
  disclosure: string;
  liveClassName?: string;
  visualPhase?: string;
  children: ReactNode;
};

export function AgentWorkflowFrame({
  stageRef,
  phaseId,
  cycle,
  ariaLabel,
  workspace,
  privacy,
  eyebrow,
  heading,
  status,
  disclosure,
  liveClassName,
  visualPhase,
  children,
}: AgentWorkflowFrameProps) {
  return (
    <div ref={stageRef} className="agent-console-stage agent-workflow-master-stage">
      <figure className="agent-console" data-workflow-phase={phaseId} aria-label={ariaLabel}>
        <figcaption className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">{workspace}</span>
          <span className="agent-console__privacy">{privacy}</span>
        </figcaption>

        <div
          key={cycle}
          className={`agent-live-demo agent-workflow-master${liveClassName ? ` ${liveClassName}` : ""}`}
          data-live-phase={visualPhase ?? phaseId}
          data-workflow-phase={phaseId}
        >
          <div className="agent-live-demo__camera">
            <section className="agent-live-demo__workspace">
              <div className="agent-live-demo__workspace-heading">
                <div><small>{eyebrow}</small><strong>{heading}</strong></div>
                <span><i /> {status}</span>
              </div>
              <div className="agent-live-demo__canvas">{children}</div>
            </section>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{status}</p>
        <div className="agent-console__disclosure">{disclosure}</div>
      </figure>
    </div>
  );
}

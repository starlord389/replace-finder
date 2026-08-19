import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAgentWorkflowSegment,
  type AgentWorkflowPhaseId,
  type AgentWorkflowSegmentId,
} from "@/features/metaAgentLanding/agentWorkflowStory";

type PlaybackOptions = {
  loop?: boolean;
  threshold?: number;
};

export function useAgentWorkflowPlayback(
  segment: AgentWorkflowSegmentId,
  { loop = true, threshold = 0.2 }: PlaybackOptions = {},
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const manualOverrideRef = useRef(false);
  const segmentPhases = getAgentWorkflowSegment(segment);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const lastIndex = segmentPhases.length - 1;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!stage || reducedMotion || !("IntersectionObserver" in window)) {
      setPhaseIndex(lastIndex);
      return;
    }

    let active = false;
    const clearTimer = () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    };

    const playPhase = (index: number) => {
      if (!active || manualOverrideRef.current) return;
      clearTimer();
      setPhaseIndex(index);
      timerRef.current = window.setTimeout(() => {
        if (!active || manualOverrideRef.current) return;
        if (index < lastIndex) {
          playPhase(index + 1);
          return;
        }
        if (loop) {
          setCycle((value) => value + 1);
          playPhase(0);
        }
      }, segmentPhases[index].durationMs);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= threshold;
        if (shouldRun && !active) {
          active = true;
          manualOverrideRef.current = false;
          setCycle((value) => value + 1);
          playPhase(0);
          return;
        }
        if (!shouldRun && active) {
          active = false;
          manualOverrideRef.current = false;
          clearTimer();
        }
      },
      { threshold: [0, Math.max(0, threshold - 0.06), threshold, Math.min(1, threshold + 0.08), 0.55] },
    );

    observer.observe(stage);
    return () => {
      active = false;
      manualOverrideRef.current = false;
      clearTimer();
      observer.disconnect();
    };
  }, [loop, segment, segmentPhases, threshold]);

  const goToPhase = useCallback((phaseId: AgentWorkflowPhaseId) => {
    const nextIndex = segmentPhases.findIndex((phase) => phase.id === phaseId);
    if (nextIndex === -1) return;
    manualOverrideRef.current = true;
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    setPhaseIndex(nextIndex);
  }, [segmentPhases]);

  return {
    stageRef,
    segment,
    segmentPhases,
    phase: segmentPhases[phaseIndex],
    phaseIndex,
    cycle,
    isFirstPhase: phaseIndex === 0,
    isLastPhase: phaseIndex === segmentPhases.length - 1,
    goToPhase,
  };
}

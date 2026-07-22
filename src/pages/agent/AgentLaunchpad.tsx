import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import {
  AGENT_LAUNCHPAD_GROUPS,
  AGENT_LAUNCHPAD_STEPS,
  type AgentLaunchpadStepId,
} from "@/content/agentLaunchpad";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import LaunchpadChecklistCard, {
  type LaunchpadStepStatus,
} from "@/components/agent/LaunchpadChecklistCard";

const LAUNCHPAD_VERSION = "v3";

export default function AgentLaunchpad() {
  const { user, profileName } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isDemo } = useWorkspaceMode();
  const [matchingExpanded, setMatchingExpanded] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [showChecklistWhenDone, setShowChecklistWhenDone] = useState(false);

  const { data, isLoading, refetch } = useAgentLaunchpadProgress(user?.id);

  // Auto-expand explainer if already acknowledged so the "done" state is visible.
  useEffect(() => {
    if (data?.profile.launchpad_matching_ack_at && !matchingExpanded) {
      // no-op — don't auto-open, but the step will already show done
    }
  }, [data?.profile.launchpad_matching_ack_at, matchingExpanded]);

  const completionMap = useMemo(() => {
    const profileComplete = data?.profileComplete ?? false;
    const clientComplete = (data?.clientCount ?? 0) > 0;
    const exchangeComplete = (data?.exchangeCount ?? 0) > 0;
    const matchingComplete = Boolean(data?.profile.launchpad_matching_ack_at) || matchingExpanded;
    const matchesComplete = data?.matchesTouched ?? false;
    const pipelineComplete = data?.pipelineTouched ?? false;

    return {
      profile: profileComplete,
      client: clientComplete,
      exchange: exchangeComplete,
      matching: matchingComplete,
      matches: matchesComplete,
      pipeline: pipelineComplete,
    } satisfies Record<AgentLaunchpadStepId, boolean>;
  }, [data, matchingExpanded]);

  const totalSteps = AGENT_LAUNCHPAD_STEPS.length;
  const totalCompleted = Object.values(completionMap).filter(Boolean).length;
  const overallPercent = Math.round((totalCompleted / totalSteps) * 100);
  const allStepsComplete = totalCompleted === totalSteps;

  const firstIncompleteId = useMemo<AgentLaunchpadStepId | null>(() => {
    for (const step of AGENT_LAUNCHPAD_STEPS) {
      if (!completionMap[step.id]) return step.id;
    }
    return null;
  }, [completionMap]);

  const statusFor = (id: AgentLaunchpadStepId): LaunchpadStepStatus => {
    if (completionMap[id]) return "done";
    if (id === "profile" && (data?.profileFilledCount ?? 0) > 0) return "in_progress";
    if (firstIncompleteId === id) return "attention";
    return "todo";
  };

  const progressLabelFor = (id: AgentLaunchpadStepId): string | undefined => {
    if (id === "profile" && data && !completionMap.profile && data.profileFilledCount > 0) {
      return `${data.profileFilledCount} of ${data.profileTotalCount}`;
    }
    return undefined;
  };

  const handleCompleteLaunchpad = async () => {
    if (!user) return;
    setSavingCompletion(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        launchpad_completed_at: new Date().toISOString(),
        launchpad_version: LAUNCHPAD_VERSION,
      })
      .eq("id", user.id);
    setSavingCompletion(false);

    if (error) {
      toast({
        title: "Couldn't finish launchpad",
        description: "Please try again. Your checklist progress is still saved from live data.",
        variant: "destructive",
      });
      return;
    }

    await refetch();
    toast({
      title: "Launchpad complete",
      description: "You're all set. Head to your dashboard to manage the live pipeline.",
    });
    navigate("/agent/dashboard");
  };

  const handleStepClick = (step: (typeof AGENT_LAUNCHPAD_STEPS)[number]) => {
    if (step.isInline) {
      const nextExpanded = !matchingExpanded;
      setMatchingExpanded(nextExpanded);
      // Persist the ack the first time they open it (Live workspace only).
      if (nextExpanded && !isDemo && user && !data?.profile.launchpad_matching_ack_at) {
        supabase
          .from("profiles")
          .update({ launchpad_matching_ack_at: new Date().toISOString() })
          .eq("id", user.id)
          .is("launchpad_matching_ack_at", null)
          .then(() => refetch());
      }
    } else if (step.href) {
      navigate(step.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName = profileName?.split(" ")[0] || "there";

  // Compact "you're set" state
  if (allStepsComplete && !showChecklistWhenDone) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-green-950">
                  You're all set, {firstName}.
                </h1>
                <p className="mt-1 text-sm text-green-800/90">
                  Your workspace is configured and your pipeline is live. Manage everything from the dashboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={handleCompleteLaunchpad} disabled={savingCompletion}>
                    {savingCompletion ? "Saving..." : "Go to dashboard"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowChecklistWhenDone(true)}
                    className="bg-white"
                  >
                    Show checklist
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Personalized header */}
      <div className="space-y-6 pb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Hey {firstName}, here&apos;s your launchpad.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your workspace, then run your pipeline. Each step links to the exact place to act.
          </p>
        </div>

        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Your progress</p>
            <span className="text-sm font-semibold text-foreground">
              {totalCompleted} of {totalSteps} complete ({overallPercent}%)
            </span>
          </div>
          <Progress value={overallPercent} className="h-2.5" />
        </div>
      </div>

      {/* Completion banner when checklist is manually opened */}
      {allStepsComplete && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">You&apos;re all set!</p>
              <p className="text-sm text-green-700">
                Every step is done. Collapse the checklist or head to your dashboard.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              className="bg-white"
              onClick={() => setShowChecklistWhenDone(false)}
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Collapse
            </Button>
            <Button onClick={handleCompleteLaunchpad} disabled={savingCompletion}>
              {savingCompletion ? "Saving..." : "Go to dashboard"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grouped sections */}
      <div className="space-y-6">
        {AGENT_LAUNCHPAD_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const groupSteps = group.steps
            .map((id) => AGENT_LAUNCHPAD_STEPS.find((s) => s.id === id))
            .filter(Boolean) as typeof AGENT_LAUNCHPAD_STEPS;
          const groupDone = groupSteps.filter((s) => completionMap[s.id]).length;

          return (
            <section key={group.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <GroupIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {groupDone}/{groupSteps.length}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                {groupSteps.map((step, idx) => {
                  const complete = completionMap[step.id];
                  const isLast = idx === groupSteps.length - 1;
                  const expanded = step.id === "matching" && matchingExpanded;

                  return (
                    <LaunchpadChecklistCard
                      key={step.id}
                      title={step.title}
                      description={step.description}
                      tip={step.tip}
                      complete={complete}
                      status={statusFor(step.id)}
                      progressLabel={progressLabelFor(step.id)}
                      icon={step.icon}
                      isLast={isLast && !expanded}
                      onClick={() => handleStepClick(step)}
                    >
                      {expanded ? <MatchingExplainer /> : null}
                    </LaunchpadChecklistCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MatchingExplainer() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target className="h-4 w-4 text-primary" />
            Your client&apos;s criteria
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Price range, geography, asset type, strategy, financial fit, and timing — captured on every listing.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Rules-based scoring
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Every potential property is ranked across those dimensions. No AI guesswork, no public MLS — just fit.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Private review
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            You review the top matches first. Only matches you approve become visible to your client.
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Pipeline gives you one board to move every client&apos;s matches from new to closed — so the next property is lined up early.
      </div>
    </div>
  );
}

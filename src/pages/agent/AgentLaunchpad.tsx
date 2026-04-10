import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Building2, Workflow, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AGENT_LAUNCHPAD_GROUPS,
  AGENT_LAUNCHPAD_STEPS,
  type AgentLaunchpadStepId,
  type AgentLaunchpadGroup,
} from "@/content/agentLaunchpad";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import LaunchpadChecklistCard from "@/components/agent/LaunchpadChecklistCard";

const LAUNCHPAD_VERSION = "v1";

export default function AgentLaunchpad() {
  const { user, profileName } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeGroupId, setActiveGroupId] = useState(AGENT_LAUNCHPAD_GROUPS[0].id);
  const [matchingExpanded, setMatchingExpanded] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);

  const { data, isLoading, refetch } = useAgentLaunchpadProgress(user?.id);

  const completionMap = useMemo(() => {
    const profileComplete = data?.profileComplete ?? false;
    const clientComplete = (data?.clientCount ?? 0) > 0;
    const exchangeComplete = (data?.exchangeCount ?? 0) > 0;
    const matchingComplete = matchingExpanded || Boolean(data?.profile.launchpad_completed_at);
    const matchesComplete = (data?.matchCount ?? 0) > 0;
    const connectionComplete = (data?.connectionCount ?? 0) > 0;

    return {
      profile: profileComplete,
      client: clientComplete,
      exchange: exchangeComplete,
      matching: matchingComplete,
      matches: matchesComplete,
      connection: connectionComplete,
    } satisfies Record<AgentLaunchpadStepId, boolean>;
  }, [data, matchingExpanded]);

  const activeGroup = AGENT_LAUNCHPAD_GROUPS.find((g) => g.id === activeGroupId) ?? AGENT_LAUNCHPAD_GROUPS[0];
  const activeSteps = activeGroup.steps.map((stepId) => AGENT_LAUNCHPAD_STEPS.find((s) => s.id === stepId)!);
  const activeGroupCompletedCount = activeSteps.filter((s) => completionMap[s.id]).length;
  const activeGroupTotal = activeSteps.length;
  const activeGroupPercent = Math.round((activeGroupCompletedCount / activeGroupTotal) * 100);

  const totalCompleted = Object.values(completionMap).filter(Boolean).length;
  const allStepsComplete = totalCompleted === AGENT_LAUNCHPAD_STEPS.length;

  function getGroupProgress(group: AgentLaunchpadGroup) {
    const steps = group.steps.map((stepId) => AGENT_LAUNCHPAD_STEPS.find((s) => s.id === stepId)!);
    const completed = steps.filter((s) => completionMap[s.id]).length;
    return Math.round((completed / steps.length) * 100);
  }

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
    navigate("/agent");
  };

  const handleStepClick = (step: (typeof AGENT_LAUNCHPAD_STEPS)[number]) => {
    if (step.isInline) {
      setMatchingExpanded((prev) => !prev);
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

  return (
    <div className="mx-auto max-w-6xl">
      {/* Two-column layout */}
      <div className="flex gap-0 md:gap-0">
        {/* Left: Category sidebar */}
        <div className="hidden w-64 shrink-0 border-r pr-0 md:block">
          <div className="sticky top-4 space-y-1 py-2">
            <h2 className="px-4 pb-3 text-base font-semibold text-foreground">Setup Guide</h2>
            {AGENT_LAUNCHPAD_GROUPS.map((group) => {
              const isActive = group.id === activeGroupId;
              const GroupIcon = group.icon;
              const pct = getGroupProgress(group);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary/5 font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <GroupIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1">{group.title}</span>
                  {pct === 100 && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Main content */}
        <div className="flex-1 md:pl-8">
          {/* Personalized header */}
          <div className="space-y-6 pb-6">
            <h1 className="text-xl font-semibold text-foreground md:text-2xl">
              Hey {firstName}, here&apos;s your personalized setup list with everything you need to get started.
            </h1>

            {/* Mobile group selector */}
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {AGENT_LAUNCHPAD_GROUPS.map((group) => {
                const isActive = group.id === activeGroupId;
                const GroupIcon = group.icon;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveGroupId(group.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border font-medium text-muted-foreground"
                    }`}
                  >
                    <GroupIcon className="h-4 w-4" />
                    {group.title}
                  </button>
                );
              })}
            </div>

            {/* Category progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Your {activeGroup.title} Progress.
                </p>
                <span className="text-sm font-semibold text-foreground">{activeGroupPercent}%</span>
              </div>
              <Progress value={activeGroupPercent} className="h-2.5" />
            </div>
          </div>

          {/* Completion banner */}
          {allStepsComplete && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">You&apos;re all set!</p>
                  <p className="text-sm text-green-700">
                    Your workspace is configured and ready for day-to-day execution.
                  </p>
                </div>
              </div>
              <Button onClick={handleCompleteLaunchpad} disabled={savingCompletion} className="shrink-0">
                {savingCompletion ? "Saving..." : "Go to dashboard"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Checklist items */}
          <div className="overflow-hidden rounded-xl border bg-card">
            {activeSteps.map((step, idx) => {
              const complete = completionMap[step.id];
              const isLast = idx === activeSteps.length - 1;

              return (
                <LaunchpadChecklistCard
                  key={step.id}
                  title={step.title}
                  description={step.description}
                  complete={complete}
                  icon={step.icon}
                  isLast={isLast && !(step.id === "matching" && matchingExpanded)}
                  onClick={() => handleStepClick(step)}
                >
                  {step.id === "matching" && matchingExpanded ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border bg-background p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Building2 className="h-4 w-4 text-primary" />
                            Your exchange
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Property, value, timing, and replacement criteria create the signal the network uses to score fit.
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Workflow className="h-4 w-4 text-primary" />
                            Match scoring
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            The platform evaluates geography, asset type, timing, price, and financial fit to rank opportunities.
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FileSearch className="h-4 w-4 text-primary" />
                            Review and connect
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            You review the best options first, then start a connection when a match is worth pursuing.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        45-day identification and 180-day close windows shape urgency, while the facilitator fee is acknowledged in the connection workflow before deeper collaboration begins.
                      </div>
                    </div>
                  ) : null}
                </LaunchpadChecklistCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

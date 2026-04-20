import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Building2, Workflow, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AGENT_LAUNCHPAD_STEPS,
  type AgentLaunchpadStepId,
} from "@/content/agentLaunchpad";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import LaunchpadChecklistCard from "@/components/agent/LaunchpadChecklistCard";

const LAUNCHPAD_VERSION = "v1";

export default function AgentLaunchpad() {
  const { user, profileName } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const totalSteps = AGENT_LAUNCHPAD_STEPS.length;
  const totalCompleted = Object.values(completionMap).filter(Boolean).length;
  const overallPercent = Math.round((totalCompleted / totalSteps) * 100);
  const allStepsComplete = totalCompleted === totalSteps;

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
    <div className="mx-auto max-w-3xl">
      {/* Personalized header */}
      <div className="space-y-6 pb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
          Hey {firstName}, here&apos;s your personalized setup list with everything you need to get started.
        </h1>

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

      {/* Single flat checklist */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {AGENT_LAUNCHPAD_STEPS.map((step, idx) => {
          const complete = completionMap[step.id];
          const isLast = idx === AGENT_LAUNCHPAD_STEPS.length - 1;

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
  );
}

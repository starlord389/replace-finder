import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LaunchpadChecklistCard, {
  type LaunchpadStepStatus,
} from "@/components/agent/LaunchpadChecklistCard";
import {
  INVESTOR_LAUNCHPAD_GROUPS,
  INVESTOR_LAUNCHPAD_STEPS,
  type InvestorLaunchpadStepId,
} from "@/content/investorLaunchpad";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function InvestorLaunchpad() {
  const { user, profileName } = useAuth();
  const navigate = useNavigate();
  const [matchingExpanded, setMatchingExpanded] = useState(false);
  const [showChecklistWhenDone, setShowChecklistWhenDone] = useState(false);

  const { data: profileProgress, isLoading: profileLoading } = useQuery({
    queryKey: ["investor-launchpad-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, company")
        .eq("id", user!.id)
        .single();
      if (error) throw error;

      const filled = [data.full_name, data.phone, data.company].filter((value) =>
        Boolean(value?.trim()),
      ).length;
      return { filled, total: 3 };
    },
    enabled: Boolean(user?.id),
  });

  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(
    user?.id,
    "investor",
  );
  const { data: relationships = [], isLoading: relationshipsLoading } =
    useUnifiedRelationships("investor");

  const completionMap = useMemo(() => {
    const hasListing = listings.length > 0;
    const hasPublishedExchange = listings.some((listing) => listing.status !== "draft");
    const hasReviewedMatch = relationships.some(
      (relationship) =>
        relationship.mySide === "buyer" &&
        (!relationship.isNewMatch || Boolean(relationship.connectionId)),
    );
    const hasConnection = relationships.some((relationship) => Boolean(relationship.connectionId));

    return {
      profile: profileProgress?.filled === profileProgress?.total,
      listing: hasListing,
      publish: hasPublishedExchange,
      matching: matchingExpanded,
      matches: hasReviewedMatch,
      pipeline: hasConnection,
    } satisfies Record<InvestorLaunchpadStepId, boolean>;
  }, [listings, matchingExpanded, profileProgress, relationships]);

  const totalSteps = INVESTOR_LAUNCHPAD_STEPS.length;
  const totalCompleted = Object.values(completionMap).filter(Boolean).length;
  const overallPercent = Math.round((totalCompleted / totalSteps) * 100);
  const allStepsComplete = totalCompleted === totalSteps;

  const firstIncompleteId = useMemo<InvestorLaunchpadStepId | null>(() => {
    for (const step of INVESTOR_LAUNCHPAD_STEPS) {
      if (!completionMap[step.id]) return step.id;
    }
    return null;
  }, [completionMap]);

  const statusFor = (id: InvestorLaunchpadStepId): LaunchpadStepStatus => {
    if (completionMap[id]) return "done";
    if (id === "profile" && (profileProgress?.filled ?? 0) > 0) return "in_progress";
    if (firstIncompleteId === id) return "attention";
    return "todo";
  };

  const progressLabelFor = (id: InvestorLaunchpadStepId) => {
    if (id !== "profile" || completionMap.profile || !profileProgress) return undefined;
    return `${profileProgress.filled} of ${profileProgress.total}`;
  };

  const handleStepClick = (step: (typeof INVESTOR_LAUNCHPAD_STEPS)[number]) => {
    if (step.isInline) {
      setMatchingExpanded((expanded) => !expanded);
      return;
    }
    if (step.href) navigate(step.href);
  };

  if (profileLoading || listingsLoading || relationshipsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName = profileName?.split(" ")[0] || "there";

  if (allStepsComplete && !showChecklistWhenDone) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-green-950">
                You&apos;re all set, {firstName}.
              </h1>
              <p className="mt-1 text-sm text-green-800/90">
                Your properties, qualified matches, and listing-agent conversations are ready in your investor workspace.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => navigate("/investor/dashboard")}>
                  Go to dashboard
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
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-6 pb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">
            Hey {firstName}, here&apos;s your launchpad.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your exchange, then run your pipeline. Each step links to the exact place to act.
          </p>
        </div>

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

      {allStepsComplete ? (
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
            <Button onClick={() => navigate("/investor/dashboard")}>
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {INVESTOR_LAUNCHPAD_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const groupSteps = group.steps
            .map((id) => INVESTOR_LAUNCHPAD_STEPS.find((step) => step.id === id))
            .filter(Boolean) as typeof INVESTOR_LAUNCHPAD_STEPS;
          const groupDone = groupSteps.filter((step) => completionMap[step.id]).length;

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
                {groupSteps.map((step, index) => {
                  const complete = completionMap[step.id];
                  const expanded = step.id === "matching" && matchingExpanded;
                  const isLast = index === groupSteps.length - 1;

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
                      {expanded ? <InvestorMatchingExplainer /> : null}
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

function InvestorMatchingExplainer() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Calculator className="h-4 w-4 text-primary" />
            Your equity sets the ceiling
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            We calculate exchange equity from your property value and current loan balance, then model replacement buying power at 75% LTV.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Return must improve
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The engine automatically screens properties and shows only candidates with a higher projected return on equity.
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Connect privately
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Qualified properties appear in Matches, where you can start a direct, private conversation with the listing agent.
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        You do not browse unmatched properties or enter replacement criteria. The platform uses your property financials to find stronger exchange opportunities automatically.
      </div>
    </div>
  );
}

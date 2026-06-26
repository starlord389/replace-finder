import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { ClientLeadLine } from "@/features/matches/components/shared/ClientLeadLine";
import { ListingHero } from "./ListingHero";
import { ListingHeaderBar } from "./ListingHeaderBar";
import { OverviewTab } from "./tabs/OverviewTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { LocationTab } from "./tabs/LocationTab";
import { MatchTab } from "./tabs/MatchTab";
import { DocsTab } from "./tabs/DocsTab";
import { NextStepsTab } from "./tabs/NextStepsTab";
import { MatchHistorySheet } from "./MatchHistorySheet";
import { SendToClientDialog } from "./SendToClientDialog";
import { AgentCommsCard } from "./AgentCommsCard";
import { useMatchActions } from "./useMatchActions";

interface Props {
  rel: Relationship;
  rank?: number | null;
  totalInScope?: number;
  previewMode?: boolean;
  /** Tab to open on mount (e.g. "conversation" via a deep link). Falls back to overview if unavailable. */
  initialTab?: string;
}

export function PropertyReviewPanel({ rel, rank, totalInScope, previewMode = false, initialTab }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [tab, setTab] = useState<string>(initialTab ?? "overview");
  const accent = getClientAccent(rel.clientId);
  const qc = useQueryClient();
  const matchId = rel.matchId;

  // Opening a real match marks the caller's side as viewed so the "new matches
  // to review" badge and the unviewed-first sort clear. Skip synthetic preview
  // panels (matchId is `preview-…`, also gated by previewMode) which have no row.
  useEffect(() => {
    if (previewMode || matchId.startsWith("preview-")) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase.rpc("mark_match_viewed", { p_match_id: matchId });
      if (cancelled) return;
      if (error) {
        // Non-fatal: the panel still works, only the "viewed" stamp failed.
        console.error("mark_match_viewed failed", error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["agent-attention"] });
      qc.invalidateQueries({ queryKey: ["unified-relationships"] });
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId, previewMode, qc]);

  // Deal status + actions. Computed even in preview (cheap), but only surfaced
  // when this is a real match — the header CTA and Next-steps tab are gated below.
  const { status, primary, secondary, handle, busy } = useMatchActions(rel, {
    onOpenConversation: () => setTab("conversation"),
    onSendToClient: () => setSendOpen(true),
  });

  const conversationAvailable =
    !previewMode &&
    (status === "in_conversation" ||
      status === "loi" ||
      status === "under_contract" ||
      status === "closed");

  const tabs = [
    { v: "overview", label: "Overview" },
    { v: "financials", label: "Financials" },
    { v: "location", label: "Location" },
    ...(previewMode ? [] : [{ v: "match", label: "Match" }]),
    ...(conversationAvailable ? [{ v: "conversation", label: "Conversation" }] : []),
    { v: "docs", label: "Docs" },
    ...(previewMode ? [] : [{ v: "next", label: "Next steps" }]),
  ];

  // Guard against a requested tab that isn't currently available (e.g. a deep
  // link to "conversation" before the conversation exists) → fall back cleanly.
  const activeTab = tabs.some((t) => t.v === tab) ? tab : "overview";

  return (
    <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card">
      {/* Client identity strip — hidden in investor preview mode */}
      {!previewMode && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-b border-border border-l-[4px] px-5 py-2.5",
            accent.borderLeft,
            accent.soft,
          )}
        >
          <ClientLeadLine
            clientId={rel.clientId}
            clientName={rel.clientName}
            relinquishedLabel={rel.relinquishedLabel}
            size="md"
            pill
          />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Trading out — finding replacement property
          </span>
        </div>
      )}

      {/* Hero with gallery */}
      <ListingHero rel={rel} />

      {/* Price-forward header + pinned primary action */}
      <ListingHeaderBar
        rel={rel}
        previewMode={previewMode}
        status={status}
        primary={primary}
        onPrimary={() => primary && handle(primary.id, primary.label)}
        primaryBusy={!!primary && busy === primary.id}
        onJumpToMatch={previewMode ? undefined : () => setTab("match")}
      />

      {/* One clean column: everything lives in the tabs */}
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <Tabs value={activeTab} onValueChange={setTab} className="w-full">
          <div className="sticky top-0 z-10 mb-6 border-b border-border bg-card/95 py-2 backdrop-blur">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {t.label}
                  {t.v === "conversation" && (
                    <>
                      <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span className="sr-only"> (active)</span>
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0"><OverviewTab rel={rel} /></TabsContent>
          <TabsContent value="financials" className="mt-0"><FinancialsTab rel={rel} /></TabsContent>
          <TabsContent value="location" className="mt-0"><LocationTab rel={rel} /></TabsContent>
          {!previewMode && (
            <TabsContent value="match" className="mt-0"><MatchTab rel={rel} rank={rank} totalInScope={totalInScope} /></TabsContent>
          )}
          {conversationAvailable && (
            <TabsContent value="conversation" className="mt-0">
              <div className="min-h-[520px]">
                <AgentCommsCard rel={rel} />
              </div>
            </TabsContent>
          )}
          <TabsContent value="docs" className="mt-0">
            <DocsTab
              rel={rel}
              conversationAvailable={conversationAvailable}
              onOpenConversation={() => setTab("conversation")}
            />
          </TabsContent>
          {!previewMode && (
            <TabsContent value="next" className="mt-0">
              <NextStepsTab
                rel={rel}
                status={status}
                primary={primary}
                secondary={secondary}
                handle={handle}
                busy={busy}
                onOpenHistory={() => setHistoryOpen(true)}
                onOpenConversation={() => setTab("conversation")}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {!previewMode && (
        <>
          <MatchHistorySheet rel={rel} open={historyOpen} onOpenChange={setHistoryOpen} />
          <SendToClientDialog rel={rel} open={sendOpen} onOpenChange={setSendOpen} />
        </>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { ClientLeadLine } from "@/features/matches/components/shared/ClientLeadLine";
import { ListingHero } from "./ListingHero";
import { ListingFactsBar } from "./ListingFactsBar";
import { ListingSidebar } from "./ListingSidebar";
import { OverviewTab } from "./tabs/OverviewTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { LocationTab } from "./tabs/LocationTab";
import { MatchTab } from "./tabs/MatchTab";
import { DocsTab } from "./tabs/DocsTab";
import { MatchHistorySheet } from "./MatchHistorySheet";
import { SendToClientDialog } from "./SendToClientDialog";
import { AgentCommsCard } from "./AgentCommsCard";
import { deriveUiStatus } from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";

interface Props {
  rel: Relationship;
  rank?: number | null;
  totalInScope?: number;
  previewMode?: boolean;
}

export function PropertyReviewPanel({ rel, rank, totalInScope, previewMode = false }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [tab, setTab] = useState<string>("overview");
  const accent = getClientAccent(rel.clientId);
  const { state } = useMatchLocalState(rel.matchId);
  const status = useMemo(() => deriveUiStatus(rel, state), [rel, state]);
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
  ];

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
        <ListingHero rel={rel} totalPhotos={40} />

        {/* Facts bar */}
        <ListingFactsBar rel={rel} />

        {/* Main grid: content + sticky sidebar */}
        <div className="px-5 py-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:px-8 lg:py-8">
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
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
                        <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-0"><OverviewTab rel={rel} /></TabsContent>
              <TabsContent value="financials" className="mt-0"><FinancialsTab rel={rel} /></TabsContent>
              <TabsContent value="location" className="mt-0"><LocationTab rel={rel} /></TabsContent>
              <TabsContent value="match" className="mt-0"><MatchTab rel={rel} rank={rank} totalInScope={totalInScope} /></TabsContent>
              {conversationAvailable && (
                <TabsContent value="conversation" className="mt-0">
                  <div className="min-h-[520px]">
                    <AgentCommsCard rel={rel} />
                  </div>
                </TabsContent>
              )}
              <TabsContent value="docs" className="mt-0"><DocsTab rel={rel} /></TabsContent>
            </Tabs>
          </div>

          <div className="mt-8 lg:mt-0">
            <ListingSidebar
              rel={rel}
              onOpenHistory={() => setHistoryOpen(true)}
              onJumpToMatch={() => setTab("match")}
              onOpenConversation={() => setTab(conversationAvailable ? "conversation" : "overview")}
              onSendToClient={() => setSendOpen(true)}
            />
          </div>
        </div>
      </div>

      <MatchHistorySheet rel={rel} open={historyOpen} onOpenChange={setHistoryOpen} />
      <SendToClientDialog rel={rel} open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ArrowRight, GripVertical, MapPin, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { recordMatchWorkflowStage, type CanonicalWorkflowStage } from "@/features/matches/workflowApi";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { UiStatus } from "@/features/matches/components/inbox/inboxHelpers";

export type OpportunityStage = Exclude<UiStatus, "archived">;

export const OPPORTUNITY_STAGES: Array<{
  key: OpportunityStage;
  title: string;
  subtitle: string;
}> = [
  { key: "new", title: "New Opportunity", subtitle: "Fresh matches to review" },
  { key: "sent_to_client", title: "Sent to Client", subtitle: "Awaiting client review" },
  { key: "client_interested", title: "Client Interested", subtitle: "Ready for agent outreach" },
  { key: "in_conversation", title: "In Conversation", subtitle: "Agents are communicating" },
  { key: "loi", title: "Offer Sent", subtitle: "Offer or LOI submitted" },
  { key: "under_contract", title: "Under Contract", subtitle: "Working toward closing" },
  { key: "closed", title: "Closed", subtitle: "Completed exchanges" },
];

const STAGE_RANK = Object.fromEntries(
  OPPORTUNITY_STAGES.map((stage, index) => [stage.key, index]),
) as Record<OpportunityStage, number>;

const CANONICAL_STAGE: Record<OpportunityStage, CanonicalWorkflowStage> = {
  new: "new",
  sent_to_client: "sent_to_client",
  client_interested: "client_interested",
  in_conversation: "in_conversation",
  loi: "offer_sent",
  under_contract: "under_contract",
  closed: "closed",
};

function formatMoney(value: number | null) {
  if (!value) return "Price pending";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function OpportunityCard({
  relationship,
  stage,
  dragDisabled,
  overlay = false,
}: {
  relationship: Relationship;
  stage: OpportunityStage;
  dragDisabled: boolean;
  overlay?: boolean;
}) {
  const accent = getClientAccent(relationship.clientId);
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: relationship.matchId,
    data: { stage },
    disabled: dragDisabled || overlay,
  });
  const location = [relationship.propertyCity, relationship.propertyState].filter(Boolean).join(", ");
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-l-4 bg-card p-3.5 shadow-sm transition-shadow",
        accent.borderLeft,
        isDragging && "opacity-40",
        overlay ? "shadow-xl ring-1 ring-primary/30" : "hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted-foreground">
            {relationship.clientName || "Represented property owner"}
          </p>
          <Link to={relationship.openHref} className="mt-0.5 block truncate text-sm font-bold text-foreground hover:text-primary">
            {relationship.propertyName}
          </Link>
        </div>
        {!dragDisabled ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Move ${relationship.propertyName}`}
            className="cursor-grab rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span> : null}
        <span>{formatMoney(relationship.askingPrice)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">{Math.round(relationship.score)} match</Badge>
        {relationship.propertyAssetType ? <Badge variant="outline" className="text-[10px] capitalize">{relationship.propertyAssetType}</Badge> : null}
        {relationship.unreadCount > 0 ? (
          <Badge className="gap-1 text-[10px]"><MessageSquareText className="h-3 w-3" />{relationship.unreadCount} unread</Badge>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-[11px] text-muted-foreground">
        <span>{formatDistanceToNow(new Date(relationship.lastActivityAt), { addSuffix: true })}</span>
        <Link to={relationship.openHref} className="inline-flex items-center font-semibold text-primary hover:underline">
          Open <ArrowRight className="ml-0.5 h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

function OpportunityColumn({
  stage,
  relationships,
  dragDisabled,
}: {
  stage: (typeof OPPORTUNITY_STAGES)[number];
  relationships: Relationship[];
  dragDisabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `opportunity-${stage.key}`, data: { stage: stage.key } });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[320px] w-[310px] shrink-0 flex-col rounded-xl border bg-muted/25 p-3 transition-colors",
        isOver && "bg-primary/5 ring-2 ring-primary/30",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">{stage.title}</h2>
          <p className="text-[11px] text-muted-foreground">{stage.subtitle}</p>
        </div>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold">{relationships.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {relationships.length ? relationships.map((relationship) => (
          <OpportunityCard
            key={relationship.matchId}
            relationship={relationship}
            stage={stage.key}
            dragDisabled={dragDisabled}
          />
        )) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-card/40 p-5 text-center">
            <p className="text-xs text-muted-foreground">No opportunities at this stage</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function OpportunityPipelineKanban({
  relationships,
  stageByMatch,
  audience,
}: {
  relationships: Relationship[];
  stageByMatch: Map<string, OpportunityStage>;
  audience: "agent" | "investor";
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const dragDisabled = audience === "investor";
  const grouped = useMemo(() => {
    const value = Object.fromEntries(OPPORTUNITY_STAGES.map((stage) => [stage.key, []])) as Record<OpportunityStage, Relationship[]>;
    for (const relationship of relationships) {
      const stage = stageByMatch.get(relationship.matchId);
      if (stage) value[stage].push(relationship);
    }
    return value;
  }, [relationships, stageByMatch]);
  const activeRelationship = activeId ? relationships.find((relationship) => relationship.matchId === activeId) : null;
  const activeStage = activeRelationship ? stageByMatch.get(activeRelationship.matchId) : null;

  function handleStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleEnd(event: DragEndEvent) {
    setActiveId(null);
    if (dragDisabled || !event.over) return;
    const relationship = relationships.find((item) => item.matchId === String(event.active.id));
    const fromStage = relationship ? stageByMatch.get(relationship.matchId) : null;
    const toStage = (event.over.data.current as { stage?: OpportunityStage } | undefined)?.stage;
    if (!relationship || !fromStage || !toStage || fromStage === toStage) return;

    if (
      STAGE_RANK[toStage] >= STAGE_RANK.in_conversation
      && !["accepted", "in_progress", "completed"].includes(relationship.connectionStatus || "")
    ) {
      toast({
        title: "Start the agent conversation first",
        description: "Open this match and start the secure agent-to-agent conversation. The opportunity will move here automatically.",
        variant: "destructive",
      });
      return;
    }
    if (
      STAGE_RANK[toStage] < STAGE_RANK.in_conversation
      && ["accepted", "in_progress", "completed"].includes(relationship.connectionStatus || "")
    ) {
      toast({
        title: "This agent conversation is already active",
        description: "An active conversation cannot move back to a pre-conversation stage. Archive the opportunity if it has ended.",
        variant: "destructive",
      });
      return;
    }

    let note: string | null = null;
    if (STAGE_RANK[toStage] < STAGE_RANK[fromStage]) {
      note = window.prompt("Why are you moving this opportunity backward? This reason will be saved in its history.");
      if (note === null) return;
      if (!note.trim()) {
        toast({ title: "A reason is required", description: "Backward stage corrections must include a short explanation.", variant: "destructive" });
        return;
      }
    }
    if (toStage === "closed" && !window.confirm("Mark this opportunity as closed? This records the deal as completed.")) return;

    try {
      await recordMatchWorkflowStage({
        matchId: relationship.matchId,
        stage: CANONICAL_STAGE[toStage],
        source: "pipeline_drag",
        note: note || `Moved from ${fromStage} to ${toStage}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["unified-relationships"] });
      toast({ title: `Moved to ${OPPORTUNITY_STAGES.find((stage) => stage.key === toStage)?.title}` });
    } catch (error: unknown) {
      toast({
        title: "Couldn't move the opportunity",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-3">
        {OPPORTUNITY_STAGES.map((stage) => (
          <OpportunityColumn
            key={stage.key}
            stage={stage}
            relationships={grouped[stage.key]}
            dragDisabled={dragDisabled}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeRelationship && activeStage ? (
          <div className="w-[310px]">
            <OpportunityCard relationship={activeRelationship} stage={activeStage} dragDisabled overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

import { useState } from "react";
import {
  Send, Sparkles, Handshake, FileCheck, FileSignature, Home, CheckCircle2,
  XCircle, Archive, StickyNote, SearchCheck, Banknote, type LucideIcon,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { useMatchLocalState } from "./useMatchLocalState";

interface Props {
  rel: Relationship;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryEvent {
  ts: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Slim reference panel: what actually happened on this match (real,
 * dated events only) plus the agent's private working note.
 */
export function MatchHistorySheet({ rel, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { state, update } = useMatchLocalState(rel.matchId);
  const [note, setNote] = useState(state.agentNote);

  const events: HistoryEvent[] = [];
  const push = (ts: string | null | undefined, label: string, icon: LucideIcon) => {
    if (ts) events.push({ ts, label, icon });
  };

  push(state.sentToClientAt, "Sent to client", Send);
  push(state.clientInterestedAt, "Client marked interested", Sparkles);
  push(rel.acceptedAt, "Connected with listing agent", Handshake);
  push(state.reviewingDocsAt, "Started reviewing documents", SearchCheck);
  push(state.loiSentAt, "LOI / offer sent", FileSignature);
  push(rel.underContractAt ?? state.underContractAt, "Under contract", FileCheck);
  push(rel.inspectionCompleteAt, "Inspection complete", CheckCircle2);
  push(rel.financingApprovedAt, "Financing approved", Banknote);
  push(rel.closedAt, "Deal closed", Home);
  push(state.notFitAt, "Marked not a fit", XCircle);
  push(state.clientPassedAt, "Client passed", XCircle);
  push(rel.declinedAt, "Listing agent declined", XCircle);
  push(state.archivedAt, "Archived", Archive);

  events.sort((a, b) => b.ts.localeCompare(a.ts));

  function saveNote() {
    update({ agentNote: note });
    toast({ title: "Note saved" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>History &amp; notes</SheetTitle>
          <SheetDescription className="truncate">
            {rel.propertyName}
            {rel.clientName ? ` · for ${rel.clientName}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Timeline of real events */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Activity
            </h3>
            {events.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
                No activity yet — actions you take on this match will show up here.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {events.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                      <e.icon className="h-2.5 w-2.5 text-primary" />
                    </span>
                    <p className="text-sm font-medium leading-tight text-foreground">{e.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(e.ts).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Private note */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" /> Private note
            </h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for yourself — only you can see this."
              rows={4}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={saveNote}
              disabled={note === state.agentNote}
            >
              Save note
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

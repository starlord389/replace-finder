import { Check, ArrowRight, MessageSquare, History, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import {
  LIFECYCLE_ORDER, UI_STATUS_LABEL, STATUS_HINTS,
  type UiStatus, type ActionDescriptor,
} from "../inboxHelpers";
import { ACTION_ICONS } from "../actionIcons";

interface Props {
  rel: Relationship;
  status: UiStatus;
  primary: ActionDescriptor | null;
  secondary: ActionDescriptor[];
  handle: (id: string, label: string) => void;
  busy: string | null;
  onOpenHistory: () => void;
  onOpenConversation?: () => void;
}

/**
 * The deal command center — flip here to do anything with this match: see where
 * it stands in the lifecycle, take the next action, advance the deal, or step
 * away. Replaces the old cramped right-hand sidebar.
 */
export function NextStepsTab({
  rel, status, primary, secondary, handle, busy, onOpenHistory, onOpenConversation,
}: Props) {
  const isArchived = status === "archived";
  const currentIdx = isArchived ? -1 : LIFECYCLE_ORDER.indexOf(status);
  const constructive = secondary.filter((a) => a.tone !== "destructive");
  const destructive = secondary.filter((a) => a.tone === "destructive");
  const PrimaryIcon = primary ? ACTION_ICONS[primary.id] ?? ArrowRight : null;
  const showConvoShortcut =
    (status === "in_conversation" || status === "loi" || status === "under_contract") &&
    primary?.id !== "message_listing_agent";

  const brokerage = rel.counterpartyBrokerage ?? "Listing brokerage";
  const brokerageInitials = brokerage
    .split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Lifecycle stepper */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground">Where this deal stands</h3>
          <span className="shrink-0 text-xs font-semibold text-foreground">
            {isArchived ? "Archived" : UI_STATUS_LABEL[status]}
          </span>
        </div>

        <div className="mt-4 flex items-center overflow-x-auto pb-1">
          {LIFECYCLE_ORDER.map((s, i) => {
            const done = !isArchived && i < currentIdx;
            const current = !isArchived && i === currentIdx;
            return (
              <div key={s} className="flex shrink-0 items-center">
                {i > 0 && (
                  <span className={cn("h-0.5 w-5", i <= currentIdx ? "bg-emerald-500" : "bg-border")} />
                )}
                <div className="flex items-center gap-1.5 pr-1">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                      done && "border-emerald-500 bg-emerald-500 text-white",
                      current && "border-primary bg-primary text-primary-foreground",
                      !done && !current && "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-xs",
                      current ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {UI_STATUS_LABEL[s]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{STATUS_HINTS[status]}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {primary ? (
          <Button
            className="h-12 w-full justify-center gap-2 text-sm font-semibold"
            onClick={() => handle(primary.id, primary.label)}
            disabled={busy === primary.id}
          >
            {PrimaryIcon && <PrimaryIcon className="h-4 w-4" />}
            {primary.label}
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Button>
        ) : (
          <div className="rounded-xl border bg-muted/40 px-4 py-4 text-center text-sm text-muted-foreground">
            This match is closed out — no action needed.
          </div>
        )}

        {showConvoShortcut && (
          <Button
            variant="outline"
            className="h-10 w-full justify-center gap-2 text-sm font-semibold"
            onClick={onOpenConversation}
          >
            <MessageSquare className="h-4 w-4" />
            Open conversation
          </Button>
        )}

        {constructive.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {constructive.map((a) => {
              const Icon = ACTION_ICONS[a.id];
              return (
                <Button
                  key={a.id}
                  variant="outline"
                  className="h-10 justify-start gap-2 text-sm font-medium"
                  onClick={() => handle(a.id, a.label)}
                  disabled={busy === a.id}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {a.label}
                </Button>
              );
            })}
          </div>
        )}

        {destructive.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {destructive.map((a) => {
              const Icon = ACTION_ICONS[a.id];
              const label =
                a.id === "not_a_fit" && rel.clientName
                  ? `Not a fit for ${rel.clientName.split(" ")[0]}`
                  : a.label;
              return (
                <Button
                  key={a.id}
                  variant="ghost"
                  className="h-9 gap-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => handle(a.id, a.label)}
                  disabled={busy === a.id}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Listed by — anonymized until the intro is accepted */}
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Listed by</p>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {brokerageInitials || "LB"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{brokerage}</p>
            <p className="truncate text-[11px] text-muted-foreground">Verified listing agent</p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span>
            Contact details stay private until your client expresses interest and the listing agent
            accepts the intro. All messages happen in-app.
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        onClick={onOpenHistory}
      >
        <History className="h-3.5 w-3.5" />
        History &amp; notes
      </Button>
    </div>
  );
}

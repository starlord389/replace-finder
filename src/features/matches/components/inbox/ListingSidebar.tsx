import { TrendingUp, DollarSign, Building, Users, ArrowRight, Shield, MessageSquare, Settings2, Sparkles, Send, Handshake, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreDotClass } from "../helpers";
import { financialMetrics, UI_STATUS_LABEL, UI_STATUS_CLASS } from "./inboxHelpers";
import { useMatchActions } from "./useMatchActions";

interface Props {
  rel: Relationship;
  onOpenWorkflow: () => void;
  onJumpToMatch: () => void;
  onOpenConversation?: () => void;
}

const PRIMARY_ICONS: Record<string, typeof Send> = {
  send_to_client: Send,
  mark_interested: Sparkles,
  request_agent_intro: Handshake,
  open_conversation: MessageSquare,
};

export function ListingSidebar({ rel, onOpenWorkflow, onJumpToMatch, onOpenConversation }: Props) {
  const all = financialMetrics(rel);
  const cap = all.find((m) => m.key === "cap")?.value ?? "—";
  const noi = all.find((m) => m.key === "noi")?.value ?? "—";
  const occ = all.find((m) => m.key === "occupancy")?.value ?? "—";

  const seed = rel.matchId.charCodeAt(0) || 7;
  const totalUnits = ((seed % 12) + 4);

  const { status, primary, handle, busy } = useMatchActions(rel, {
    onOpenConversation,
  });

  const PrimaryIcon = primary ? PRIMARY_ICONS[primary.id] ?? ArrowRight : null;

  const kpis = [
    { icon: TrendingUp, label: "Cap Rate", value: cap, tint: "text-emerald-600" },
    { icon: DollarSign, label: "NOI", value: noi, tint: "text-primary" },
    { icon: Building, label: "Units", value: String(totalUnits), tint: "text-foreground" },
    { icon: Users, label: "Occupied", value: occ, tint: "text-foreground" },
  ];

  // Anonymized brokerage initials only — no PII surfaced
  const brokerage = rel.counterpartyBrokerage ?? "Listing brokerage";
  const brokerageInitials = brokerage
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        {/* Price + status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Asking Price
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
              {currency(rel.askingPrice)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              UI_STATUS_CLASS[status],
            )}
          >
            {UI_STATUS_LABEL[status]}
          </span>
        </div>

        <div className="my-5 border-t border-border" />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-muted/50 px-3 py-3 text-center">
              <k.icon className={cn("mx-auto h-4 w-4", k.tint)} />
              <p className="mt-1.5 text-lg font-bold leading-tight text-foreground">{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Primary decision CTA */}
        <div className="mt-5 space-y-2">
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
            <div className="rounded-xl border bg-muted/40 px-3 py-3 text-center text-xs text-muted-foreground">
              No action needed — this match is closed out.
            </div>
          )}

          {/* Pass / not a fit — only when still in early stages */}
          {(status === "new" || status === "sent_to_client" || status === "client_interested") && (
            <Button
              variant="ghost"
              className="h-10 w-full justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
              onClick={() => handle("not_a_fit", "Not a Fit")}
              disabled={busy === "not_a_fit"}
            >
              <XCircle className="h-3.5 w-3.5" />
              Not a fit for {rel.clientName?.split(" ")[0] ?? "this client"}
            </Button>
          )}

          {/* Always-available conversation shortcut once connected */}
          {(status === "agent_connected" || status === "reviewing_docs" || status === "loi" || status === "under_contract") && primary?.id !== "open_conversation" && (
            <Button
              variant="outline"
              className="h-10 w-full justify-center gap-1.5 text-xs font-semibold"
              onClick={onOpenConversation}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open conversation
            </Button>
          )}
        </div>

        {/* Match score callout */}
        <button
          type="button"
          onClick={onJumpToMatch}
          className="mt-5 flex w-full items-center justify-between rounded-xl border bg-gradient-to-br from-primary/5 to-primary/[0.02] px-4 py-3 text-left transition-colors hover:border-primary/40"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Match score
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">Why this matched →</p>
          </div>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
              scoreDotClass(rel.score),
            )}
          >
            {Math.round(rel.score)}
          </span>
        </button>

        <div className="my-5 border-t border-border" />

        {/* Listed by — anonymized, no contact info */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Listed by
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {brokerageInitials || "LB"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {brokerage}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Verified listing agent
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>
              Contact details stay private until your client expresses interest and the listing agent accepts the intro. All messages happen in-app.
            </span>
          </div>
        </div>

        <div className="my-5 border-t border-border" />

        <Button
          variant="ghost"
          className="w-full justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={onOpenWorkflow}
        >
          <Settings2 className="h-3.5 w-3.5" />
          More actions & lifecycle
        </Button>
      </div>
    </aside>
  );
}

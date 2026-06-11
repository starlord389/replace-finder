import {
  TrendingUp, DollarSign, ArrowRight, Shield, MessageSquare, History,
  Sparkles, Send, Handshake, XCircle, Bell, Phone, FileText,
  FileCheck, FileSignature, Archive, RotateCcw, Scale, PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreDotClass } from "../helpers";
import { financialMetrics, STATUS_HINTS, UI_STATUS_LABEL, UI_STATUS_CLASS } from "./inboxHelpers";
import { LifecycleTracker } from "./LifecycleTracker";
import { useMatchActions } from "./useMatchActions";

interface Props {
  rel: Relationship;
  onOpenHistory: () => void;
  onJumpToMatch: () => void;
  onOpenConversation?: () => void;
  onSendToClient?: () => void;
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  send_to_client: Send,
  not_a_fit: XCircle,
  mark_interested: Sparkles,
  follow_up_client: Bell,
  client_passed: XCircle,
  message_listing_agent: MessageSquare,
  open_conversation: MessageSquare,
  schedule_call: Phone,
  request_documents: FileText,
  mark_loi_sent: FileSignature,
  mark_under_contract: FileCheck,
  mark_closed: Handshake,
  archive: Archive,
  reactivate: RotateCcw,
};

function prettyBoot(bootStatus: string | null): string | null {
  switch (bootStatus) {
    case "no_boot": return "No boot";
    case "minor_boot": return "Minor boot";
    case "significant_boot": return "Significant";
    default: return null;
  }
}

export function ListingSidebar({ rel, onOpenHistory, onJumpToMatch, onOpenConversation, onSendToClient }: Props) {
  const all = financialMetrics(rel);
  const cap = all.find((m) => m.key === "cap")?.value ?? "—";
  const noi = all.find((m) => m.key === "noi")?.value ?? "—";

  const { status, primary, secondary, handle, busy } = useMatchActions(rel, {
    onOpenConversation,
    onSendToClient,
  });

  const PrimaryIcon = primary ? ACTION_ICONS[primary.id] ?? ArrowRight : null;
  const constructive = secondary.filter((a) => a.tone !== "destructive");
  const destructive = secondary.filter((a) => a.tone === "destructive");

  // Real per-deal numbers only — no invented placeholders
  const boot = prettyBoot(rel.bootStatus);
  const roeUplift = rel.roeImprovementPp != null
    ? `${rel.roeImprovementPp >= 0 ? "+" : ""}${rel.roeImprovementPp.toFixed(1)}pp`
    : null;
  const kpis: Array<{ icon: LucideIcon; label: string; value: string; tint: string }> = [
    { icon: TrendingUp, label: "Cap Rate", value: cap, tint: "text-emerald-600" },
    { icon: DollarSign, label: "NOI", value: noi, tint: "text-primary" },
    ...(roeUplift ? [{ icon: PiggyBank, label: "Return Uplift", value: roeUplift, tint: "text-emerald-600" }] : []),
    ...(boot ? [{ icon: Scale, label: "Boot Exposure", value: boot, tint: "text-foreground" }] : []),
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

        {/* Where this deal is */}
        <LifecycleTracker status={status} variant="compact" />
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          {STATUS_HINTS[status]}
        </p>

        {/* What to do next */}
        <div className="mt-4 space-y-2">
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

          {constructive.map((a) => {
            const Icon = ACTION_ICONS[a.id];
            return (
              <Button
                key={a.id}
                variant="outline"
                className="h-9 w-full justify-center gap-1.5 text-xs font-medium"
                onClick={() => handle(a.id, a.label)}
                disabled={busy === a.id}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {a.label}
              </Button>
            );
          })}

          {/* Always-available conversation shortcut once talking */}
          {(status === "in_conversation" || status === "loi" || status === "under_contract") && primary?.id !== "message_listing_agent" && (
            <Button
              variant="outline"
              className="h-9 w-full justify-center gap-1.5 text-xs font-semibold"
              onClick={onOpenConversation}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open conversation
            </Button>
          )}

          {destructive.map((a) => {
            const Icon = ACTION_ICONS[a.id];
            const label = a.id === "not_a_fit" && rel.clientName
              ? `Not a fit for ${rel.clientName.split(" ")[0]}`
              : a.label;
            return (
              <Button
                key={a.id}
                variant="ghost"
                className="h-9 w-full justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                onClick={() => handle(a.id, a.label)}
                disabled={busy === a.id}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </Button>
            );
          })}
        </div>

        <div className="my-5 border-t border-border" />

        {/* Deal numbers — real values only */}
        <div className="grid grid-cols-2 gap-2.5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-muted/50 px-3 py-3 text-center">
              <k.icon className={cn("mx-auto h-4 w-4", k.tint)} />
              <p className="mt-1.5 text-lg font-bold leading-tight text-foreground">{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.label}</p>
            </div>
          ))}
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
          onClick={onOpenHistory}
        >
          <History className="h-3.5 w-3.5" />
          History &amp; notes
        </Button>
      </div>
    </aside>
  );
}

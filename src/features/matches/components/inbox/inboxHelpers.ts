import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { MatchLocalState } from "./useMatchLocalState";

export type UiStatus =
  | "new"
  | "sent_to_client"
  | "client_interested"
  | "agent_connected"
  | "reviewing_docs"
  | "loi"
  | "under_contract"
  | "closed"
  | "archived";

export const UI_STATUS_LABEL: Record<UiStatus, string> = {
  new: "New Match",
  sent_to_client: "Sent to Client",
  client_interested: "Client Interested",
  agent_connected: "Agent Connected",
  reviewing_docs: "Reviewing Docs",
  loi: "LOI / Offer",
  under_contract: "Under Contract",
  closed: "Closed",
  archived: "Archived",
};

export const UI_STATUS_CLASS: Record<UiStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  sent_to_client: "bg-violet-50 text-violet-700 border-violet-200",
  client_interested: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  agent_connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reviewing_docs: "bg-cyan-50 text-cyan-700 border-cyan-200",
  loi: "bg-amber-50 text-amber-800 border-amber-200",
  under_contract: "bg-orange-50 text-orange-800 border-orange-200",
  closed: "bg-secondary text-secondary-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
};

export const LIFECYCLE_ORDER: UiStatus[] = [
  "new",
  "sent_to_client",
  "client_interested",
  "agent_connected",
  "reviewing_docs",
  "loi",
  "under_contract",
  "closed",
];

export const SIDE_EXIT_STATUSES: UiStatus[] = ["archived"];

export function deriveUiStatus(rel: Relationship, local: MatchLocalState): UiStatus {
  if (local.archivedAt || local.notFitAt || local.clientPassedAt || local.sellerUnavailableAt) {
    return "archived";
  }
  if (rel.stage === "closed_won") return "closed";
  if (rel.stage === "closed_lost") return "archived";
  if (rel.underContractAt) return "under_contract";
  if (local.loiSentAt) return "loi";
  if (local.reviewingDocs) return "reviewing_docs";
  if (rel.stage === "connected" || rel.stage === "conversing") return "agent_connected";
  if (local.clientInterestedAt) return "client_interested";
  if (local.sentToClientAt) return "sent_to_client";
  return "new";
}

export const FILTER_TABS: Array<{ key: "all" | UiStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "sent_to_client", label: "Sent" },
  { key: "client_interested", label: "Interested" },
  { key: "agent_connected", label: "Connected" },
  { key: "loi", label: "Offers" },
  { key: "closed", label: "Closed" },
  { key: "archived", label: "Archived" },
];

export interface ActionDescriptor {
  id: string;
  label: string;
  tone?: "primary" | "secondary" | "destructive";
}

export function nextActionsFor(status: UiStatus): {
  primary: ActionDescriptor | null;
  secondary: ActionDescriptor[];
} {
  switch (status) {
    case "new":
      return {
        primary: { id: "send_to_client", label: "Send to Client" },
        secondary: [
          { id: "request_seller_details", label: "Request Seller Details" },
          { id: "not_a_fit", label: "Not a Fit", tone: "destructive" },
        ],
      };
    case "sent_to_client":
      return {
        primary: { id: "mark_interested", label: "Mark Client Interested" },
        secondary: [
          { id: "follow_up_client", label: "Follow Up With Client" },
          { id: "client_passed", label: "Client Passed", tone: "destructive" },
        ],
      };
    case "client_interested":
      return {
        primary: { id: "request_agent_intro", label: "Request Agent Intro" },
        secondary: [{ id: "send_client_questions", label: "Send Client Questions" }],
      };
    case "agent_connected":
      return {
        primary: { id: "open_conversation", label: "Open Conversation" },
        secondary: [
          { id: "schedule_call", label: "Schedule Call" },
          { id: "request_documents", label: "Request Documents" },
          { id: "start_reviewing_docs", label: "Mark Reviewing Docs" },
        ],
      };
    case "reviewing_docs":
      return {
        primary: { id: "mark_loi_sent", label: "Mark LOI / Offer Sent" },
        secondary: [{ id: "archive", label: "Archive", tone: "destructive" }],
      };
    case "loi":
      return {
        primary: { id: "mark_under_contract", label: "Mark Under Contract" },
        secondary: [{ id: "archive", label: "Archive", tone: "destructive" }],
      };
    case "under_contract":
      return {
        primary: { id: "open_conversation", label: "Open Conversation" },
        secondary: [],
      };
    case "closed":
      return { primary: null, secondary: [] };
    case "archived":
      return {
        primary: { id: "reactivate", label: "Reactivate Match" },
        secondary: [],
      };
  }
}

/** Bullets explaining why this property matched — derived heuristically */
export function whyThisMatched(rel: Relationship): string[] {
  const out: string[] = [];
  if (rel.score >= 85) out.push("Strong overall fit across price, geography, and asset type.");
  else if (rel.score >= 70) out.push("Solid fit with minor trade-offs across scoring dimensions.");
  else out.push("Partial fit — worth a closer look on the weaker dimensions.");

  if (rel.askingPrice) out.push(`Asking price ${formatMoney(rel.askingPrice)} sits within your client's replacement budget.`);
  if (rel.propertyCity) out.push(`Located in ${rel.propertyCity}${rel.propertyState ? `, ${rel.propertyState}` : ""} — aligned with target geography.`);
  if (rel.bootStatus === "no_boot") out.push("No boot exposure — full equity replacement looks achievable.");
  else if (rel.bootStatus === "minor_boot") out.push("Minor boot expected — manageable equity gap.");
  if (rel.capRate) out.push(`Projected cap rate of ${rel.capRate.toFixed(1)}% supports a healthy cash-on-cash return.`);
  out.push("Timeline aligns with the 1031 identification and closing windows.");
  return out;
}

/** Match score by category — uses match dims where available, mocks otherwise */
export interface BreakdownDim { label: string; score: number; }
export function matchBreakdown(rel: Relationship): BreakdownDim[] {
  // Deterministic pseudo-variance around the overall score so demo data feels real
  const s = rel.score;
  const seed = rel.matchId.charCodeAt(0) + rel.matchId.charCodeAt(rel.matchId.length - 1);
  const wob = (i: number) => ((seed + i * 7) % 13) - 6; // -6..+6
  const clamp = (v: number) => Math.max(40, Math.min(99, Math.round(v)));
  return [
    { label: "Location Fit", score: clamp(s + wob(1)) },
    { label: "Price Fit", score: clamp(s + wob(2)) },
    { label: "Equity Fit", score: clamp(s + wob(3)) },
    { label: "Debt Replacement Fit", score: clamp(s + wob(4)) },
    { label: "Timeline Fit", score: clamp(s + wob(5)) },
    { label: "Asset Type Fit", score: clamp(s + wob(6)) },
    { label: "Return Profile Fit", score: clamp(s + wob(7)) },
  ];
}

/** Full financial card grid — estimates where data is missing */
export interface FinancialMetric {
  key: string;
  label: string;
  value: string;
  estimated?: boolean;
}
export function financialMetrics(rel: Relationship): FinancialMetric[] {
  const price = rel.askingPrice ?? 0;
  const cap = rel.capRate ?? 0;
  const noi = price && cap ? price * (cap / 100) : null;
  const equityPct = 0.35; // assumed 65% LTV
  const equity = price ? price * equityPct : null;
  const loan = price ? price * (1 - equityPct) : null;
  const annualCashFlow = noi && loan ? noi - loan * 0.065 : null; // 6.5% debt service approx
  const coc = annualCashFlow && equity ? (annualCashFlow / equity) * 100 : null;
  const dscr = noi && loan ? noi / (loan * 0.065) : null;

  return [
    { key: "price", label: "Price", value: price ? formatMoney(price) : "—" },
    { key: "noi", label: "NOI", value: noi ? formatMoney(noi) : "—", estimated: !!noi },
    { key: "cap", label: "Cap Rate", value: cap ? `${cap.toFixed(2)}%` : "—" },
    { key: "coc", label: "Cash-on-Cash", value: coc ? `${coc.toFixed(1)}%` : "—", estimated: true },
    { key: "dscr", label: "DSCR", value: dscr ? dscr.toFixed(2) : "—", estimated: true },
    { key: "occupancy", label: "Occupancy", value: "94%", estimated: true },
    { key: "equity", label: "Required Equity", value: equity ? formatMoney(equity) : "—", estimated: true },
    { key: "loan", label: "Est. Loan Amount", value: loan ? formatMoney(loan) : "—", estimated: true },
    { key: "cashflow", label: "Projected Cash Flow", value: annualCashFlow ? `${formatMoney(annualCashFlow)}/yr` : "—", estimated: true },
  ];
}

function formatMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

export const QUICK_MESSAGES = [
  "Is this property still available?",
  "Can you send the OM?",
  "What is the seller's preferred closing timeline?",
  "Is the seller open to a 1031 buyer?",
  "Can we schedule a call?",
  "My client is interested. Can you share more details?",
];

// ── Sorting & rank reasoning ─────────────────────────────────────

export type SortKey =
  | "best_match"
  | "highest_noi"
  | "highest_cap"
  | "highest_coc"
  | "lowest_price"
  | "best_timeline"
  | "newest"
  | "status";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "best_match", label: "Best Match" },
  { key: "highest_noi", label: "Highest NOI" },
  { key: "highest_cap", label: "Highest Cap Rate" },
  { key: "highest_coc", label: "Highest Cash-on-Cash" },
  { key: "lowest_price", label: "Lowest Price" },
  { key: "best_timeline", label: "Best Timeline Fit" },
  { key: "newest", label: "Newest" },
  { key: "status", label: "Status" },
];

function noiOf(r: Relationship): number {
  return r.askingPrice && r.capRate ? r.askingPrice * (r.capRate / 100) : 0;
}
function cocOf(r: Relationship): number {
  if (!r.askingPrice || !r.capRate) return 0;
  const noi = noiOf(r);
  const loan = r.askingPrice * 0.65;
  const equity = r.askingPrice * 0.35;
  const cf = noi - loan * 0.065;
  return equity > 0 ? (cf / equity) * 100 : 0;
}
function timelineFitOf(r: Relationship): number {
  return matchBreakdown(r).find((d) => d.label === "Timeline Fit")?.score ?? 0;
}

export function sortRelationships<T extends Relationship>(
  rels: T[],
  key: SortKey,
): T[] {
  const arr = [...rels];
  const cmp = (a: T, b: T): number => {
    switch (key) {
      case "highest_noi": return noiOf(b) - noiOf(a);
      case "highest_cap": return (b.capRate ?? 0) - (a.capRate ?? 0);
      case "highest_coc": return cocOf(b) - cocOf(a);
      case "lowest_price": return (a.askingPrice ?? Infinity) - (b.askingPrice ?? Infinity);
      case "best_timeline": return timelineFitOf(b) - timelineFitOf(a);
      case "newest": return b.lastActivityAt.localeCompare(a.lastActivityAt);
      case "status": return a.stage.localeCompare(b.stage);
      case "best_match":
      default: return b.score - a.score;
    }
  };
  arr.sort((a, b) => {
    const p = cmp(a, b);
    if (p !== 0) return p;
    return b.score - a.score || b.lastActivityAt.localeCompare(a.lastActivityAt);
  });
  return arr;
}

/** Short reason why a match ranks where it does — heuristic, deterministic. */
export function rankReason(rel: Relationship): string {
  const dims = matchBreakdown(rel);
  const top = [...dims].sort((a, b) => b.score - a.score).slice(0, 2);
  if (rel.score >= 85) return `Strong ${top[0].label.toLowerCase()} & ${top[1].label.toLowerCase()}`;
  if (rel.score >= 70) return `Good ${top[0].label.toLowerCase()} fit`;
  return `Partial fit — strongest on ${top[0].label.toLowerCase()}`;
}

/** Longer explanation, used in the detail panel header. */
export function rankExplanation(rel: Relationship, rank: number): string {
  const top = [...matchBreakdown(rel)]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((d) => d.label.toLowerCase());
  return `Ranked #${rank} because of its combination of ${top.join(", ")}.`;
}

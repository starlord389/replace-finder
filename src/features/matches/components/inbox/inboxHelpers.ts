import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { MatchLocalState } from "./useMatchLocalState";

export type UiStatus =
  | "new"
  | "sent_to_client"
  | "client_interested"
  | "in_conversation"
  | "loi"
  | "under_contract"
  | "closed"
  | "archived";

export const UI_STATUS_LABEL: Record<UiStatus, string> = {
  new: "New Opportunity",
  sent_to_client: "Sent to Client",
  client_interested: "Client Interested",
  in_conversation: "In Conversation",
  loi: "Offer Sent",
  under_contract: "Under Contract",
  closed: "Closed",
  archived: "Archived",
};

export const UI_STATUS_CLASS: Record<UiStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  sent_to_client: "bg-violet-50 text-violet-700 border-violet-200",
  client_interested: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  in_conversation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  loi: "bg-amber-50 text-amber-800 border-amber-200",
  under_contract: "bg-orange-50 text-orange-800 border-orange-200",
  closed: "bg-secondary text-secondary-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
};

export const LIFECYCLE_ORDER: UiStatus[] = [
  "new",
  "sent_to_client",
  "client_interested",
  "in_conversation",
  "loi",
  "under_contract",
  "closed",
];

export const INVESTOR_LIFECYCLE_ORDER: UiStatus[] = [
  "new",
  "in_conversation",
  "loi",
  "under_contract",
  "closed",
];

/** One-line guidance shown under the stage strip - tells the agent what the stage means for them. */
export const STATUS_HINTS: Record<UiStatus, string> = {
  new: "Fresh match - share it with your client to gauge interest.",
  sent_to_client: "Waiting on your client. Nudge them or log their response.",
  client_interested: "Your client wants it - message the listing agent directly.",
  in_conversation: "You're talking. Request docs, schedule a call, work toward an offer.",
  loi: "Offer on the table. Update once it goes under contract.",
  under_contract: "Under contract - mark it closed once the deal completes.",
  closed: "Deal closed. Nice work.",
  archived: "Archived. Reactivate to resume work on this match.",
};

export const INVESTOR_STATUS_HINTS: Record<UiStatus, string> = {
  new: "Fresh qualified match - review it, then ask your representing agent to contact the other side.",
  sent_to_client: "Review the property and tell your agent when you are ready to move forward.",
  client_interested: "Your interest is recorded. Your agent will handle contact with the listing agent.",
  in_conversation: "Your agent is communicating with the agent on the other side. Follow progress here.",
  loi: "Your agent has logged an offer. Follow the deal status here.",
  under_contract: "Under contract - your agent will keep the exchange milestones current.",
  closed: "Exchange completed.",
  archived: "Archived. Reactivate to resume work on this match.",
};

export const SIDE_EXIT_STATUSES: UiStatus[] = ["archived"];

export function deriveUiStatus(rel: Relationship, local: MatchLocalState): UiStatus {
  // A real completed deal (DB) wins over local archive/not-a-fit flags so a
  // closed-won match never shows as "Archived" just because it was set aside locally.
  if (rel.stage === "closed_won" || local.closedAt) return "closed";
  if (
    local.archivedAt || local.notFitAt || local.clientPassedAt || local.sellerUnavailableAt
    || rel.agentContactRequestStatus === "declined"
    || rel.clientRecommendationResponse === "passed"
  ) {
    return "archived";
  }
  if (rel.stage === "closed_lost") return "archived";
  if (rel.underContractAt || local.underContractAt) return "under_contract";
  if (local.loiSentAt) return "loi";
  if (rel.stage === "connected" || rel.stage === "conversing" || local.conversationStartedAt) {
    return "in_conversation";
  }
  if (
    rel.agentContactRequestStatus
    && !["waiting_for_agent", "declined", "closed"].includes(rel.agentContactRequestStatus)
  ) {
    // A client-originated contact request is stronger than the old local demo
    // flags: the client has already reviewed the match and asked their agent to
    // act, so the agent must never be prompted to send it back to them.
    return "client_interested";
  }
  if (rel.clientRecommendationResponse === "interested") return "client_interested";
  if (["pending", "question", "saved"].includes(rel.clientRecommendationResponse ?? "")) {
    return "sent_to_client";
  }
  if (local.clientInterestedAt) return "client_interested";
  if (local.sentToClientAt) return "sent_to_client";
  return "new";
}

export const FILTER_TABS: Array<{ key: "all" | UiStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "sent_to_client", label: "Sent" },
  { key: "client_interested", label: "Interested" },
  { key: "in_conversation", label: "Talking" },
  { key: "loi", label: "Offers" },
  { key: "closed", label: "Closed" },
  { key: "archived", label: "Archived" },
];

export const INVESTOR_FILTER_TABS: Array<{ key: "all" | UiStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_conversation", label: "Talking" },
  { key: "loi", label: "Offers" },
  { key: "under_contract", label: "Under Contract" },
  { key: "closed", label: "Closed" },
  { key: "archived", label: "Archived" },
];

export function statusForAudience(status: UiStatus, audience: "agent" | "investor"): UiStatus {
  if (audience === "investor" && (status === "sent_to_client" || status === "client_interested")) return "new";
  return status;
}

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
          { id: "message_listing_agent", label: "Message Listing Agent" },
          { id: "not_a_fit", label: "Not a Fit", tone: "destructive" },
        ],
      };
    case "sent_to_client":
      return {
        primary: { id: "mark_interested", label: "Mark Client Interested" },
        secondary: [
          { id: "message_listing_agent", label: "Message Listing Agent" },
          { id: "follow_up_client", label: "Follow Up With Client" },
          { id: "client_passed", label: "Client Passed", tone: "destructive" },
        ],
      };
    case "client_interested":
      return {
        primary: { id: "message_listing_agent", label: "Message Listing Agent" },
        secondary: [{ id: "client_passed", label: "Client Passed", tone: "destructive" }],
      };
    case "in_conversation":
      return {
        primary: { id: "mark_loi_sent", label: "Mark Offer Sent" },
        secondary: [
          { id: "request_documents", label: "Request Documents" },
          { id: "schedule_call", label: "Schedule Call" },
          { id: "archive", label: "Archive", tone: "destructive" },
        ],
      };
    case "loi":
      return {
        primary: { id: "mark_under_contract", label: "Mark Under Contract" },
        secondary: [{ id: "archive", label: "Archive", tone: "destructive" }],
      };
    case "under_contract":
      return {
        primary: { id: "mark_closed", label: "Mark Deal Closed" },
        secondary: [{ id: "archive", label: "Deal Fell Through", tone: "destructive" }],
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

export function nextActionsForAudience(status: UiStatus, audience: "agent" | "investor") {
  if (audience === "investor") {
    if (status === "new") return {
      primary: { id: "request_agent_contact", label: "Ask My Agent to Connect" },
      secondary: [{ id: "not_a_fit", label: "Not a Fit", tone: "destructive" as const }],
    };
    if (["in_conversation", "loi", "under_contract"].includes(status)) return {
      primary: null,
      secondary: [{ id: "archive", label: "Archive", tone: "destructive" as const }],
    };
  }
  return nextActionsFor(status);
}

/**
 * Relationship-aware actions shared by match cards and the full review panel.
 * This prevents the compact card from offering a different workflow than the
 * detail view when an investor already has an active agent-contact request.
 */
export function nextActionsForRelationship(
  rel: Relationship,
  status: UiStatus,
  audience: "agent" | "investor",
) {
  const requestStatus = rel.agentContactRequestStatus;
  if (
    audience === "agent"
    && status === "client_interested"
    && requestStatus
    && !["waiting_for_agent", "declined", "closed"].includes(requestStatus)
  ) {
    const label = requestStatus === "awaiting_counterparty_agent"
      ? "Check Listing Agent Availability"
      : requestStatus === "contacted" && rel.stage === "pending_out"
        ? "Awaiting Listing Agent"
        : requestStatus === "contacted"
          ? "Open Agent Connection"
          : "Contact Listing Agent";
    return {
      primary: { id: "message_listing_agent", label },
      secondary: ["requested", "accepted"].includes(requestStatus)
        ? [{ id: "decline_client_request", label: "Pass on Client Request", tone: "destructive" as const }]
        : [],
    };
  }
  if (audience === "investor" && requestStatus && !["declined", "closed"].includes(requestStatus)) {
    return {
      primary: {
        id: "view_agent_request",
        label: requestStatus === "waiting_for_agent"
          ? "Agent Needed - Request Saved"
          : requestStatus === "awaiting_counterparty_agent"
            ? "Other Side Is Assigning an Agent"
            : requestStatus === "contacted"
              ? "Agents Are Connecting"
              : "Request Sent to My Agent",
      },
      secondary: nextActionsForAudience(status, audience).secondary,
    };
  }
  return nextActionsForAudience(status, audience);
}

// Shared display precision for cap rate so cards and the financials tab agree.
const CAP_RATE_DECIMALS = 2;
export function formatCapRate(cap: number): string {
  return `${cap.toFixed(CAP_RATE_DECIMALS)}%`;
}

const LTV = 0.75; // matches the engine's MAX_COMMERCIAL_LTV

/**
 * One projected-ROE basis shared by the financials card and the cash-on-cash
 * sort, so the displayed return and the ranking can never disagree.
 *  • Prefer the engine's candidate_roe (computed on the buyer's relinquished
 *    equity) when present - `fromEngine` is true.
 *  • Otherwise estimate cash-on-cash on a 25%-down basis, using the engine's
 *    amortized debt service if it persisted it, else the fallback amortization.
 * Returns null when there isn't enough data to compute anything.
 */
export function projectedRoe(rel: Relationship): { pct: number | null; fromEngine: boolean } {
  if (rel.candidateRoe != null) return { pct: rel.candidateRoe * 100, fromEngine: true };
  const price = rel.askingPrice ?? 0;
  const cap = rel.capRate ?? 0;
  if (!price || !cap) return { pct: null, fromEngine: false };
  const noi = price * (cap / 100);
  const loan = rel.estimatedReplacementLoan ?? price * LTV;
  const equity = price - loan;
  const debtService = rel.candidateAnnualDebtService ?? estimateAnnualDebtService(loan);
  if (equity <= 0) return { pct: null, fromEngine: false };
  return { pct: ((noi - debtService) / equity) * 100, fromEngine: false };
}

/** Bullets explaining why this property matched - derived heuristically */
export function whyThisMatched(rel: Relationship): string[] {
  const out: string[] = [];
  if (rel.roeImprovementPp != null) {
    out.push(`Projected return on equity improves by ${rel.roeImprovementPp.toFixed(1)} percentage points.`);
  } else {
    out.push("Exchange IQ™ projects a better return on equity than the current property.");
  }
  if (rel.estimatedPurchasingCapacity != null) {
    out.push(`Asking price is within the ${formatMoney(rel.estimatedPurchasingCapacity)} purchasing ceiling at the platform's 75% maximum LTV.`);
  } else {
    out.push("Asking price is within the exchange-equity ceiling at the platform's 75% maximum LTV.");
  }

  // Only claim a dimension fits when the engine actually scored it that way -
  // don't assert budget / geography / timeline fit we haven't verified.
  if ((rel.geoScore ?? 0) >= 70 && rel.propertyCity) {
    out.push(`Located in ${rel.propertyCity}${rel.propertyState ? `, ${rel.propertyState}` : ""} - strong location fit with the client's target geography.`);
  } else if (rel.propertyCity) {
    out.push(`Located in ${rel.propertyCity}${rel.propertyState ? `, ${rel.propertyState}` : ""}.`);
  }
  if (rel.bootStatus === "no_boot") out.push("No modeled boot under the full-equity reinvestment assumptions.");
  else if (rel.bootStatus === "minor_boot") out.push("Minor boot expected - manageable equity gap.");
  else if (rel.bootStatus === "significant_boot") out.push("Significant boot expected - a meaningful taxable gap; structure the exchange carefully.");
  if (rel.capRate) out.push(`Projected cap rate of ${formatCapRate(rel.capRate)}.`);
  if (rel.askingPrice) out.push(`Asking price ${formatMoney(rel.askingPrice)}.`);
  return out;
}

/** Match score by dimension - uses the engine's REAL persisted factor scores.
 *  Fit dimensions sit at 50 (neutral) when the client expressed no preference,
 *  which is the honest picture now that matching is ROE-driven. */
export interface BreakdownDim { label: string; score: number; }
export function matchBreakdown(rel: Relationship): BreakdownDim[] {
  const dim = (v: number | null) => Math.max(0, Math.min(100, Math.round(v ?? 50)));
  return [
    { label: "Return (ROE)", score: dim(rel.roeScore) },
    { label: "Location Fit", score: dim(rel.geoScore) },
    { label: "Asset Type Fit", score: dim(rel.assetScore) },
    { label: "Strategy Fit", score: dim(rel.strategyScore) },
    { label: "Property Quality", score: dim(rel.qualityScore) },
  ];
}

/** Full financial card grid - estimates where data is missing */
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
  const engineLoan = rel.estimatedReplacementLoan;
  const loan = price ? (engineLoan ?? price * LTV) : null;
  const equity = price && loan != null ? price - loan : null;
  // Prefer the engine's amortized debt service; otherwise estimate at the same assumptions.
  const debtService = rel.candidateAnnualDebtService ?? (loan ? estimateAnnualDebtService(loan) : null);
  const annualCashFlow = noi != null && debtService != null ? noi - debtService : null;
  // Single shared ROE basis (engine candidate_roe when present, else 25%-down cash-on-cash).
  const roe = projectedRoe(rel);
  const dscr = noi != null && debtService ? noi / debtService : null;
  const fromEngine = rel.candidateAnnualDebtService != null || engineLoan != null;
  const modeledLtv = rel.estimatedLtv ?? (price && loan != null ? loan / price : null);

  return [
    { key: "price", label: "Price", value: price ? formatMoney(price) : "-" },
    { key: "noi", label: "NOI", value: noi ? formatMoney(noi) : "-" },
    { key: "cap", label: "Cap Rate", value: cap ? formatCapRate(cap) : "-" },
    { key: "coc", label: "Projected ROE", value: roe.pct != null ? `${roe.pct.toFixed(1)}%` : "-", estimated: !roe.fromEngine },
    { key: "dscr", label: "DSCR", value: dscr ? dscr.toFixed(2) : "-", estimated: !fromEngine },
    { key: "occupancy", label: "Occupancy", value: rel.occupancy != null ? `${Math.round(rel.occupancy)}%` : "-" },
    { key: "equity", label: "Equity Reinvested", value: equity != null ? formatMoney(equity) : "-", estimated: !fromEngine },
    { key: "loan", label: "Modeled Loan", value: loan != null ? formatMoney(loan) : "-", estimated: !fromEngine },
    { key: "ltv", label: "Modeled LTV", value: modeledLtv != null ? `${(modeledLtv * 100).toFixed(1)}%` : "-", estimated: !fromEngine },
    { key: "cashflow", label: "Projected Cash Flow", value: annualCashFlow != null ? `${formatMoney(annualCashFlow)}/yr` : "-", estimated: !fromEngine },
  ];
}

// Amortized annual payment at the platform's default financing assumptions -
// mirrors the match engine's FALLBACK_MORTGAGE_RATE / FALLBACK_AMORTIZATION_YEARS
// so display estimates line up with the engine when its value isn't persisted.
function estimateAnnualDebtService(principal: number, annualRatePct = 7.0, years = 25): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / years;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  return monthly * 12;
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

export const INVESTOR_QUICK_MESSAGES = [
  "Is this property still available?",
  "Can you send the OM?",
  "What is the seller's preferred closing timeline?",
  "Is the seller open to a 1031 buyer?",
  "Can we schedule a call?",
  "I'm interested. Can you share more details?",
];

// ── Sorting & rank reasoning ─────────────────────────────────────

export type SortKey =
  | "best_match"
  | "highest_noi"
  | "highest_cap"
  | "highest_coc"
  | "lowest_price"
  | "newest"
  | "status";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "best_match", label: "Best Match" },
  { key: "highest_noi", label: "Highest NOI" },
  { key: "highest_cap", label: "Highest Cap Rate" },
  { key: "highest_coc", label: "Highest Cash-on-Cash" },
  { key: "lowest_price", label: "Lowest Price" },
  { key: "newest", label: "Newest" },
  { key: "status", label: "Status" },
];

function noiOf(r: Relationship): number {
  return r.askingPrice && r.capRate ? r.askingPrice * (r.capRate / 100) : 0;
}
function cocOf(r: Relationship): number {
  // Same basis the financials card displays, so the "Highest Cash-on-Cash"
  // ranking always matches the Projected ROE shown on each row.
  return projectedRoe(r).pct ?? 0;
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

/** Short reason grounded in the two rules that qualify investor matches. */
export function rankReason(rel: Relationship): string {
  const roe = rel.roeImprovementPp;
  const ltv = rel.estimatedLtv;
  if (roe != null && ltv != null) {
    return `ROE +${roe.toFixed(1)} pts · ${(ltv * 100).toFixed(1)}% LTV`;
  }
  if (roe != null) return `ROE improves by ${roe.toFixed(1)} pts`;
  if (ltv != null) return `Within ${(ltv * 100).toFixed(1)}% modeled LTV`;
  return "Qualified ROE upgrade";
}

/** Longer explanation, used in the detail panel header. */
export function rankExplanation(rel: Relationship, rank: number): string {
  const reasons: string[] = [];
  if (rel.roeImprovementPp != null) {
    reasons.push(`projected ROE improves by ${rel.roeImprovementPp.toFixed(1)} percentage points`);
  }
  if (rel.estimatedLtv != null) {
    reasons.push(`modeled financing is ${(rel.estimatedLtv * 100).toFixed(1)}% LTV`);
  }
  if (rel.estimatedPurchasingCapacity != null && rel.askingPrice != null) {
    reasons.push(`the ${formatMoney(rel.askingPrice)} price is within the ${formatMoney(rel.estimatedPurchasingCapacity)} purchasing ceiling`);
  }
  if (reasons.length === 0) {
    return `Ranked #${rank} based on its qualified ROE improvement and affordability.`;
  }
  return `Ranked #${rank} because ${reasons.join(" and ")}.`;
}

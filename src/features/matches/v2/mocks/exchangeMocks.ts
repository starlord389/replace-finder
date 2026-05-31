// Deterministic mock fields for the v2 Exchange Workspace.
// Single isolation point — swap each field for a real backend value when the
// schema catches up. Hash is keyed on the exchange id so values are stable
// across reloads but vary across exchanges.

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface ExchangeMockEnrichment {
  /** ISO date string — used only when the real exchange has no identification_deadline */
  deadlineAt: string;
  daysRemaining: number;
  /** Soft status fallback */
  exchangeStatus: "Identifying" | "Negotiating" | "Under Contract" | "Closing Soon";
  /** Replacement value fallback */
  relinquishedValueFallback: number;
}

const STATUSES: ExchangeMockEnrichment["exchangeStatus"][] = [
  "Identifying",
  "Negotiating",
  "Under Contract",
  "Closing Soon",
];

export function enrichExchange(exchangeId: string): ExchangeMockEnrichment {
  const h = hashId(exchangeId);
  const daysRemaining = 12 + (h % 75); // 12..86
  const deadlineAt = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString();
  const exchangeStatus = STATUSES[h % STATUSES.length];
  const relinquishedValueFallback = 2_000_000 + (h % 90) * 100_000; // $2M–$10.9M
  return { deadlineAt, daysRemaining, exchangeStatus, relinquishedValueFallback };
}

/** Days remaining from an ISO date string. Negative if overdue. */
export function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

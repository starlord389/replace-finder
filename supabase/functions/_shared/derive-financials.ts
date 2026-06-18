// Derives the stored financial columns from the four numbers an agent now
// enters: asking price, gross rent roll, total operating expenses, loan
// balance. NOI = gross rent roll − total operating expenses (occupancy is
// assumed 100%, so the rent roll is the effective gross income); cap rate =
// NOI / asking price. Occupancy is persisted as 100.
//
// This is the server-side source of truth used by both create-exchange and
// update-exchange so the stored NOI / cap rate feeding the match engine are
// always consistent regardless of what the client sends.

export const ASSUMED_OCCUPANCY_RATE = 100;

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function deriveFinancialColumns(financials: Record<string, unknown>) {
  const askingPrice = toNumber(financials.asking_price);
  const grossRentRoll = toNumber(financials.gross_rent_roll);
  const totalOperatingExpenses = toNumber(financials.total_operating_expenses);
  const loanBalance = toNumber(financials.loan_balance);

  const noi =
    grossRentRoll != null && totalOperatingExpenses != null
      ? grossRentRoll - totalOperatingExpenses
      : null;
  const capRate =
    noi != null && askingPrice != null && askingPrice > 0
      ? (noi / askingPrice) * 100
      : null;

  return {
    asking_price: askingPrice,
    gross_rent_roll: grossRentRoll,
    total_operating_expenses: totalOperatingExpenses,
    noi,
    cap_rate: capRate,
    occupancy_rate: ASSUMED_OCCUPANCY_RATE,
    loan_balance: loanBalance,
  };
}

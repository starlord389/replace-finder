// Shared numeric validation for the exchange wizard financials.
// Used by create-exchange and update-exchange edge functions.

export interface FinancialsValidationError {
  field: string;
  message: string;
}

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

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

/**
 * Validate the financials block from a create/update payload.
 *
 * - `mode = "create"`: all four required fields must be present and valid.
 * - `mode = "update"`: only fields that are present in the payload are checked,
 *   but if they're present they must satisfy the rule.
 */
export function validateFinancials(
  financials: Record<string, unknown> | null | undefined,
  mode: "create" | "update" = "create",
): FinancialsValidationError[] {
  const errors: FinancialsValidationError[] = [];
  if (!financials) {
    if (mode === "create") {
      errors.push({ field: "financials", message: "Financials are required" });
    }
    return errors;
  }

  // Agents now enter four numbers; NOI, cap rate, and occupancy (assumed 100%)
  // are derived from these by the create/update functions.
  const required = [
    "asking_price",
    "gross_rent_roll",
    "total_operating_expenses",
    "loan_balance",
  ] as const;

  for (const field of required) {
    const raw = financials[field];
    const present = isPresent(raw);

    if (!present) {
      if (mode === "create") {
        errors.push({ field, message: `${field} is required` });
      }
      continue;
    }

    const num = toNumber(raw);
    if (num === null) {
      errors.push({ field, message: `${field} must be a valid number` });
      continue;
    }

    switch (field) {
      case "asking_price":
        if (num <= 0) errors.push({ field, message: "Asking price must be greater than 0" });
        break;
      case "gross_rent_roll":
        if (num < 0) errors.push({ field, message: "Gross rent roll must be 0 or greater" });
        break;
      case "total_operating_expenses":
        if (num < 0) errors.push({ field, message: "Total operating expenses must be 0 or greater" });
        break;
      case "loan_balance":
        if (num < 0) errors.push({ field, message: "Loan balance must be 0 or greater" });
        break;
    }
  }

  // Optional: annual debt service (the owner's mortgage), if provided, must be valid.
  if (isPresent(financials.annual_debt_service)) {
    const debt = toNumber(financials.annual_debt_service);
    if (debt === null) {
      errors.push({ field: "annual_debt_service", message: "annual_debt_service must be a valid number" });
    } else if (debt < 0) {
      errors.push({ field: "annual_debt_service", message: "annual_debt_service must be 0 or greater" });
    }
  }

  return errors;
}

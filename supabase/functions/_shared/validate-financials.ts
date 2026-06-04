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

  const required = ["asking_price", "noi", "loan_balance", "occupancy_rate"] as const;

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
      case "noi":
        if (num < 0) errors.push({ field, message: "NOI must be 0 or greater" });
        break;
      case "loan_balance":
        if (num < 0) errors.push({ field, message: "Loan balance must be 0 or greater" });
        break;
      case "occupancy_rate":
        if (num < 0 || num > 100) {
          errors.push({ field, message: "Occupancy rate must be between 0 and 100" });
        }
        break;
    }
  }

  return errors;
}

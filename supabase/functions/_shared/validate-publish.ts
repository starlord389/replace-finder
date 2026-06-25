// Server-side publish gate. Mirrors validatePublish in
// src/pages/agent/EditExchange.tsx so a listing cannot go active without the
// fields a buyer/the network relies on. Financial numeric validity is handled
// separately by validate-financials.ts; this focuses on the required
// property-level fields and the owner-authorization attestation.
//
// Used by create-exchange (on activate) and update-exchange (on publish).

export interface PublishValidationError {
  field: string;
  message: string;
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
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

/**
 * Validate that a property + financials record is complete enough to publish.
 * Accepts plain records so callers can pass either a client payload or a row
 * read back from the database.
 */
export function validatePublish(
  property: Record<string, unknown> | null | undefined,
  financials: Record<string, unknown> | null | undefined,
): PublishValidationError[] {
  const errors: PublishValidationError[] = [];

  if (!property) {
    errors.push({ field: "property", message: "Property details are required to publish" });
  } else {
    if (!nonEmptyString(property.city)) {
      errors.push({ field: "city", message: "City is required to publish" });
    }
    if (!nonEmptyString(property.state)) {
      errors.push({ field: "state", message: "State is required to publish" });
    }
    if (!nonEmptyString(property.asset_type)) {
      errors.push({ field: "asset_type", message: "Asset type is required to publish" });
    }
    if (property.owner_authorization_confirmed !== true) {
      errors.push({
        field: "owner_authorization_confirmed",
        message: "You must confirm you have authorization to market this property before publishing",
      });
    }
  }

  if (!financials) {
    errors.push({ field: "financials", message: "Financials are required to publish" });
  } else {
    const askingPrice = toNumber(financials.asking_price);
    if (askingPrice === null || askingPrice <= 0) {
      errors.push({ field: "asking_price", message: "Asking price is required to publish" });
    }
  }

  return errors;
}

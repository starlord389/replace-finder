import { ASSET_TYPE_LABELS } from "@/lib/constants";

// Centralized display-name logic for a pledged property / listing.
//
// A property's street address is sensitive: it is only revealed to OTHER agents
// when the listing agent flips `address_is_public` on. The owner of the listing
// and admins always see the exact address. Everyone else sees a privacy-safe
// location label ("City, ST ZIP") that never leaks the street.

export interface ListingNameInput {
  property_name?: string | null;
  address?: string | null;
  address_is_public?: boolean | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  asset_type?: string | null;
}

function assetLabel(assetType?: string | null): string | null {
  if (!assetType) return null;
  return ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS] ?? null;
}

/** Format a privacy-safe location as "City, ST ZIP". */
export function getListingLocationLabel(p: ListingNameInput): string {
  const city = p.city?.trim();
  const state = p.state?.trim();
  const zip = p.zip?.trim();
  const stateZip = [state, zip].filter(Boolean).join(" ");
  return [city, stateZip].filter(Boolean).join(", ");
}

/** The title to show when the exact address must stay hidden. Never the street. */
export function getPrivateListingLabel(p: ListingNameInput): string {
  const loc = getListingLocationLabel(p);
  if (loc) return loc;
  const asset = assetLabel(p.asset_type);
  if (asset) return asset;
  return "Off-market property";
}

/**
 * Resolve the name to display for a listing.
 *
 * Pass `canSeeExactAddress = true` when the viewer is the listing's owner or an
 * admin. For everyone else it stays false, and the street address only appears
 * if the owner made it public via the toggle.
 */
export function resolveListingName(
  p: ListingNameInput | null | undefined,
  canSeeExactAddress: boolean,
): string {
  if (!p) return "Off-market property";
  const addr = p.address?.trim();
  if (addr && (canSeeExactAddress || p.address_is_public)) return addr;
  return getPrivateListingLabel(p);
}

/**
 * Return a copy of a property row safe to hand to a given viewer: the street
 * address is removed unless the viewer is allowed to see it, and `property_name`
 * is replaced with the resolved display label. Use this when passing a
 * counterparty's property object down into UI that might read `.address`.
 */
export function sanitizeListingForViewer<T extends ListingNameInput>(
  p: T,
  canSeeExactAddress: boolean,
): T {
  const reveal = canSeeExactAddress || !!p.address_is_public;
  return {
    ...p,
    address: reveal ? (p.address ?? null) : null,
    property_name: resolveListingName(p, canSeeExactAddress),
  };
}

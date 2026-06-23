import { ASSET_TYPE_LABELS } from "@/lib/constants";

// Centralized display-name logic for a pledged property / listing.
//
// A property's street address is sensitive: it is only revealed to OTHER agents
// when the listing agent flips `address_is_public` on. The owner of the listing
// and admins always see the exact address. Everyone else sees a privacy-safe
// label (a legacy name, or "<Asset> in <City, ST>") that never leaks the street.

export interface ListingNameInput {
  property_name?: string | null;
  address?: string | null;
  address_is_public?: boolean | null;
  city?: string | null;
  state?: string | null;
  asset_type?: string | null;
}

function assetLabel(assetType?: string | null): string | null {
  if (!assetType) return null;
  return ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS] ?? null;
}

/** The label to show when the exact address must stay hidden. Never the street. */
export function getPrivateListingLabel(p: ListingNameInput): string {
  if (p.property_name && p.property_name.trim()) return p.property_name.trim();
  const asset = assetLabel(p.asset_type);
  const loc = [p.city, p.state].filter(Boolean).join(", ");
  if (asset && loc) return `${asset} in ${loc}`;
  if (loc) return `Property in ${loc}`;
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

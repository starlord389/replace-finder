import { supabase } from "@/integrations/supabase/client";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
/** Signed URLs live for an hour; we refresh a little early to avoid flicker. */
export const AVATAR_SIGNED_URL_TTL_SECONDS = 3600;
export const AVATAR_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * Legacy avatars were stored as absolute public URLs (agent-avatars bucket).
 * Everything else is an object path inside the private `profile-avatars`
 * bucket, e.g. `<user-id>/avatar-<timestamp>.jpg`.
 */
export function isLegacyAvatarUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

type CacheEntry = { url: string; expiresAt: number };
const signedUrlCache = new Map<string, CacheEntry>();

export function invalidateAvatarUrl(path: string) {
  signedUrlCache.delete(path);
}

/** Drops every cached signed URL (identity change, sign-out, manual reset). */
export function clearAvatarUrlCache() {
  signedUrlCache.clear();
}

let cachedIdentity: string | null = null;

/**
 * Signed URLs are minted against a specific access token, so they must never
 * be reused across identities in the same browser tab.
 */
export function syncAvatarCacheWithAuthIdentity(userId: string | null | undefined) {
  const next = userId ?? null;
  if (next === cachedIdentity) return false;
  cachedIdentity = next;
  clearAvatarUrlCache();
  return true;
}

// Self-contained subscription: any sign-in, sign-out, or user switch resets the cache.
supabase.auth?.onAuthStateChange?.((_event, session) => {
  syncAvatarCacheWithAuthIdentity(session?.user?.id ?? null);
});

export type ResolvedAvatar = {
  url: string;
  /** Epoch ms at which a mounted avatar should re-sign. Null for legacy URLs. */
  refreshAt: number | null;
};

/**
 * Resolves a stored `profiles.profile_photo_url` value into something an
 * <img> can render. Returns null when the avatar cannot be signed (no
 * permission, missing object) so callers can fall back to initials.
 */
export async function resolveAvatar(value: string | null | undefined): Promise<ResolvedAvatar | null> {
  const path = value?.trim();
  if (!path) return null;
  if (isLegacyAvatarUrl(path)) return { url: path, refreshAt: null };

  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return { url: cached.url, refreshAt: cached.expiresAt };

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    signedUrlCache.delete(path);
    return null;
  }
  const expiresAt = Date.now() + AVATAR_SIGNED_URL_TTL_SECONDS * 1000 - AVATAR_REFRESH_MARGIN_MS;
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt });
  return { url: data.signedUrl, refreshAt: expiresAt };
}

export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  return (await resolveAvatar(value))?.url ?? null;
}

export function avatarInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

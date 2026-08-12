import { supabase } from "@/integrations/supabase/client";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
/** Signed URLs live for an hour; we refresh a little early to avoid flicker. */
export const AVATAR_SIGNED_URL_TTL_SECONDS = 3600;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

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

/**
 * Resolves a stored `profiles.profile_photo_url` value into something an
 * <img> can render. Returns null when the avatar cannot be signed (no
 * permission, missing object) so callers can fall back to initials.
 */
export async function resolveAvatarUrl(value: string | null | undefined): Promise<string | null> {
  const path = value?.trim();
  if (!path) return null;
  if (isLegacyAvatarUrl(path)) return path;

  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    signedUrlCache.delete(path);
    return null;
  }
  signedUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + AVATAR_SIGNED_URL_TTL_SECONDS * 1000 - REFRESH_MARGIN_MS,
  });
  return data.signedUrl;
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

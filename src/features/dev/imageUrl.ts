import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a property image storage path to a public URL. If the stored
 * `storage_path` is already a full http(s) URL (used by mock seed data
 * pointing at Unsplash), it's returned as-is.
 */
export function resolvePropertyImageUrl(storagePath: string): string {
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  return supabase.storage.from("property-images").getPublicUrl(storagePath).data.publicUrl;
}

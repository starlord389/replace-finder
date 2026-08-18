import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type NotificationPrefs = Tables<"user_notification_preferences">;

export const PREF_KEYS = [
  "notify_new_match",
  "notify_connection_request",
  "notify_connection_accepted",
  "notify_new_message",
  "notify_listing_inquiry",
  "notify_deadline_reminder",
  "notify_weekly_digest",
  "notify_account_updates",
  "notify_product_updates",
] as const;

export type PrefKey = (typeof PREF_KEYS)[number];

const DEFAULTS = PREF_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Record<PrefKey, boolean>,
);

export function useNotificationPrefs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-prefs", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return (data ?? {
        user_id: user.id,
        ...DEFAULTS,
        id: "",
        created_at: "",
        updated_at: "",
      }) as NotificationPrefs;
    },
    enabled: !!user?.id,
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<NotificationPrefs>) => {
      if (!user?.id) return;
      // Merge the patch onto the user's CURRENT prefs (not DEFAULTS) so toggling
      // one switch never silently re-enables the others. Falls back to DEFAULTS
      // only when no row exists yet (first save).
      const current = qc.getQueryData<NotificationPrefs>(["notification-prefs", user.id]);
      const base = (current ?? DEFAULTS) as Record<string, unknown>;
      const merged: Record<string, unknown> = {};
      for (const key of PREF_KEYS) {
        merged[key] = base[key] ?? true;
      }
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({ ...merged, ...patch, user_id: user.id }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onMutate: async (patch) => {
      if (!user?.id) return;
      const key = ["notification-prefs", user.id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<NotificationPrefs>(key);
      if (previous) qc.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (user?.id && context?.previous) {
        qc.setQueryData(["notification-prefs", user.id], context.previous);
      }
      toast.error("Failed to save preferences");
    },
    onSuccess: () => {
      toast.success("Preferences saved");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs", user?.id] });
    },
  });

  return { ...query, update };
}

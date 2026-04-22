import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type NotificationPrefs = Tables<"user_notification_preferences">;

const DEFAULTS = {
  notify_new_match: true,
  notify_connection_request: true,
  notify_connection_accepted: true,
  notify_new_message: true,
  notify_deadline_reminder: true,
};

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
      return data ?? { user_id: user.id, ...DEFAULTS, id: "", created_at: "", updated_at: "" } as NotificationPrefs;
    },
    enabled: !!user?.id,
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<NotificationPrefs>) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({ user_id: user.id, ...DEFAULTS, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-prefs", user?.id] });
      toast.success("Preferences saved");
    },
    onError: () => toast.error("Failed to save preferences"),
  });

  return { ...query, update };
}

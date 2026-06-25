import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import type { Tables } from "@/integrations/supabase/types";

export type NotificationRow = Tables<"notifications">;

async function fetchNotifications(userId: string, isDemo: boolean): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  // Notifications have no demo column, so scope by the demo flag we set in
  // metadata — demo notifications only show in Demo, real ones only in Live.
  return (data ?? []).filter((n) => Boolean((n.metadata as any)?.demo) === isDemo);
}

export function useNotifications() {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const qc = useQueryClient();
  // Unique per hook instance so multiple consumers (bell, mobile bell, page)
  // don't share/clobber the same realtime channel.
  const channelId = useId();

  const query = useQuery({
    queryKey: ["notifications", user?.id, isDemo],
    queryFn: () => fetchNotifications(user!.id, isDemo),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc, channelId]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      // Only mark the CURRENT workspace's unread (notifications carry no demo
      // column, so target the already demo-scoped rows by id) — otherwise this
      // would also clear the other workspace's unread.
      const ids = (query.data ?? []).filter((n) => !n.read).map((n) => n.id);
      if (ids.length === 0) return;
      await supabase.from("notifications").update({ read: true }).in("id", ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.read).length;

  return { ...query, unreadCount, markAllRead, markOneRead };
}

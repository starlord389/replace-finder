import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useSidebarBadges() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sidebar-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return { unreadMessages: 0, pendingConnections: 0 };

      const { data: conns } = await supabase
        .from("exchange_connections")
        .select("id")
        .or(`buyer_agent_id.eq.${user.id},seller_agent_id.eq.${user.id}`)
        .in("status", ["accepted", "completed"]);

      const connectionIds = (conns ?? []).map((c) => c.id);

      let unreadMessages = 0;
      if (connectionIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("connection_id", connectionIds)
          .neq("sender_id", user.id)
          .is("read_at", null);
        unreadMessages = count ?? 0;
      }

      const { count: pendingCount } = await supabase
        .from("exchange_connections")
        .select("id", { count: "exact", head: true })
        .eq("seller_agent_id", user.id)
        .eq("status", "pending");

      return {
        unreadMessages,
        pendingConnections: pendingCount ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`sidebar-badges-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["sidebar-badges", user.id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exchange_connections" },
        () => qc.invalidateQueries({ queryKey: ["sidebar-badges", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useMarkRead(connectionId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!connectionId || !user?.id) return;

    const markRead = async () => {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("connection_id", connectionId)
        .neq("sender_id", user.id)
        .is("read_at", null);
      if (!error) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    // Clear unread when the thread opens…
    markRead();

    // …and keep clearing while it stays open: a message that arrives in real
    // time should not inflate the inbox unread badge for a thread the user is
    // already looking at.
    const channel = supabase
      .channel(`mark-read-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          if ((payload.new as { sender_id?: string })?.sender_id !== user.id) markRead();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, user?.id, qc]);
}

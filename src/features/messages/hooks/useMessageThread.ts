import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ThreadMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useMessageThread(connectionId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["message-thread", connectionId],
    queryFn: async (): Promise<ThreadMessage[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", connectionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!connectionId,
  });

  // Realtime subscription scoped to this connection
  useEffect(() => {
    if (!connectionId) return;
    const channel = supabase
      .channel(`thread-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${connectionId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["message-thread", connectionId] });
          qc.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, qc]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !connectionId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("messages")
        .insert({ connection_id: connectionId, sender_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-thread", connectionId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return { ...query, send };
}

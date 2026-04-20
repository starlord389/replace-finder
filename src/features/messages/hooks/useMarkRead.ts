import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useMarkRead(connectionId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!connectionId || !user?.id) return;
    (async () => {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("connection_id", connectionId)
        .neq("sender_id", user.id)
        .is("read_at", null);
      if (!error) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    })();
  }, [connectionId, user?.id, qc]);
}

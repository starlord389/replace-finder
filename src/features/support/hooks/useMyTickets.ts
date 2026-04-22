import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SupportTicket } from "../types";

export function useMyTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });
}

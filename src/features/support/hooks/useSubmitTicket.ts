import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TicketCategory } from "../types";

interface SubmitTicketInput {
  subject: string;
  message: string;
  category: TicketCategory;
}

export function useSubmitTicket() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitTicketInput) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: input.subject.trim(),
          message: input.message.trim(),
          category: input.category,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tickets", user?.id] });
    },
  });
}

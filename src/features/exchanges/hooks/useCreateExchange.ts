import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExchange, type CreateExchangeRequest } from "@/features/exchanges/api/createExchange";
import { trackEvent } from "@/lib/telemetry";

export function useCreateExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateExchangeRequest) => {
      trackEvent("exchange_create_requested", { activate: request.activate });
      return createExchange(request);
    },
    onSuccess: () => {
      // Live query keys only (agent-dashboard / agent-matches were no-ops).
      for (const key of [
        "agent-exchanges", "agent-listings", "agent-pipeline", "agent-attention",
        "unified-relationships", "client-listings", "client-activity",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

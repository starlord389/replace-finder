import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateExchange, type UpdateExchangeRequest } from "@/features/exchanges/api/updateExchange";
import { trackEvent } from "@/lib/telemetry";

export function useUpdateExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateExchangeRequest) => {
      trackEvent("exchange_update_requested", { intent: request.intent });
      return updateExchange(request);
    },
    onSuccess: (_data, vars) => {
      // Live query keys only (agent-dashboard / agent-matches were no-ops).
      for (const key of [
        "agent-exchanges", "agent-listings", "agent-pipeline", "agent-attention",
        "unified-relationships", "client-listings", "client-activity",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      queryClient.invalidateQueries({ queryKey: ["exchange-detail", vars.exchangeId] });
    },
  });
}

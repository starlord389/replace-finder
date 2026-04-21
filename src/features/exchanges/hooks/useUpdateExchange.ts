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
      queryClient.invalidateQueries({ queryKey: ["agent-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["agent-exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["agent-matches"] });
      queryClient.invalidateQueries({ queryKey: ["exchange-detail", vars.exchangeId] });
    },
  });
}

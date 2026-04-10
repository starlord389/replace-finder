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
      queryClient.invalidateQueries({ queryKey: ["agent-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["agent-exchanges"] });
      queryClient.invalidateQueries({ queryKey: ["agent-matches"] });
    },
  });
}

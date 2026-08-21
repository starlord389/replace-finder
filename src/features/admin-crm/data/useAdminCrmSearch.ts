import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminSearchItem } from "@/features/admin/hooks/useAdminCommandCenter";

const supportedTypes = new Set<AdminSearchItem["type"]>([
  "User",
  "Exchange",
  "Property",
  "Connection",
  "Demo",
  "Lead",
  "Ticket",
  "Event",
]);

export function useAdminCrmSearch(scope: "live" | "demo", search: string, enabled = true) {
  const term = search.trim();
  return useQuery<AdminSearchItem[]>({
    queryKey: ["admin-crm-search", scope, term],
    enabled: enabled && term.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_search_crm", {
        p_data_scope: scope,
        p_search: term,
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []).flatMap((row) => {
        if (!supportedTypes.has(row.result_type as AdminSearchItem["type"])) return [];
        return [{
          id: row.id,
          type: row.result_type as AdminSearchItem["type"],
          title: row.title,
          subtitle: row.subtitle,
          href: row.href,
        }];
      });
    },
  });
}

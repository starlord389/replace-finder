import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminCrmRecordType = "property" | "exchange" | "match" | "connection";

export type AdminCrmDirectoryItem<TRecord, TContext> = {
  record: TRecord;
  context: TContext;
};

export type AdminCrmDirectoryResult<TRecord, TContext> = {
  records: AdminCrmDirectoryItem<TRecord, TContext>[];
  totalCount: number;
  summary: Record<string, number>;
  availableStatuses: string[];
};

type Params = {
  recordType: AdminCrmRecordType;
  dataScope: "live" | "demo";
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
};

function numberSummary(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, Number(item ?? 0)]),
  );
}

export function useAdminCrmDirectory<TRecord, TContext>({
  recordType,
  dataScope,
  search = "",
  status = "all",
  page,
  pageSize,
}: Params) {
  return useQuery<AdminCrmDirectoryResult<TRecord, TContext>>({
    queryKey: ["admin-crm-directory", recordType, dataScope, search, status, page, pageSize],
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_crm_records", {
        p_record_type: recordType,
        p_data_scope: dataScope,
        p_search: search.trim() || undefined,
        p_status: status === "all" ? undefined : status,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row) throw new Error("The admin directory returned no response.");
      return {
        records: (Array.isArray(row.records) ? row.records : []) as AdminCrmDirectoryItem<TRecord, TContext>[],
        totalCount: Number(row.total_count ?? 0),
        summary: numberSummary(row.summary),
        availableStatuses: Array.isArray(row.available_statuses) ? row.available_statuses : [],
      };
    },
  });
}


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  mortgage_interest_rate: number;
  mortgage_amortization_years: number;
  updated_at: string;
  updated_by: string | null;
}

const QUERY_KEY = ["app-settings"];

export function useAppSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AppSettings | null> => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("id, mortgage_interest_rate, mortgage_amortization_years, updated_at, updated_by")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AppSettings | null;
    },
  });
}

export interface UpdateAppSettingsInput {
  id: string;
  mortgage_interest_rate: number;
  mortgage_amortization_years: number;
}

export function useUpdateAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAppSettingsInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("app_settings")
        .update({
          mortgage_interest_rate: input.mortgage_interest_rate,
          mortgage_amortization_years: input.mortgage_amortization_years,
          updated_by: userData.user?.id ?? null,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

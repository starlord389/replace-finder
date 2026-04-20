import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CLOSED_WINDOW_DAYS = 30;

export interface PipelineBucket {
  count: number;
  totalProceeds: number;
  hasAnyValue: boolean;
}

export interface AgentPipelineData {
  active: PipelineBucket;
  inIdentification: PipelineBucket;
  inClosing: PipelineBucket;
  closedLast30: PipelineBucket;
  brokerageName: string | null;
}

interface ExchangeRow {
  id: string;
  status: string;
  exchange_proceeds: number | null;
  actual_close_date: string | null;
}

function bucketFrom(rows: ExchangeRow[]): PipelineBucket {
  let total = 0;
  let hasAnyValue = false;
  for (const row of rows) {
    if (row.exchange_proceeds != null) {
      total += Number(row.exchange_proceeds);
      hasAnyValue = true;
    }
  }
  return { count: rows.length, totalProceeds: total, hasAnyValue };
}

async function fetchAgentPipeline(
  userId: string,
): Promise<AgentPipelineData> {
  const [exchangesRes, profileRes] = await Promise.all([
    supabase
      .from("exchanges")
      .select("id, status, exchange_proceeds, actual_close_date")
      .eq("agent_id", userId),
    supabase
      .from("profiles")
      .select("brokerage_name")
      .eq("id", userId)
      .single(),
  ]);

  const exchanges = (exchangesRes.data ?? []) as ExchangeRow[];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CLOSED_WINDOW_DAYS);

  const active: ExchangeRow[] = [];
  const inIdentification: ExchangeRow[] = [];
  const inClosing: ExchangeRow[] = [];
  const closedLast30: ExchangeRow[] = [];

  for (const ex of exchanges) {
    if (ex.status === "draft" || ex.status === "active") {
      active.push(ex);
    } else if (ex.status === "in_identification") {
      inIdentification.push(ex);
    } else if (ex.status === "in_closing") {
      inClosing.push(ex);
    } else if (
      ex.status === "completed" &&
      ex.actual_close_date &&
      new Date(ex.actual_close_date) >= cutoff
    ) {
      closedLast30.push(ex);
    }
  }

  return {
    active: bucketFrom(active),
    inIdentification: bucketFrom(inIdentification),
    inClosing: bucketFrom(inClosing),
    closedLast30: bucketFrom(closedLast30),
    brokerageName: profileRes.data?.brokerage_name ?? null,
  };
}

export function useAgentPipelineQuery(userId?: string) {
  return useQuery({
    queryKey: ["agent-pipeline", userId],
    queryFn: () => fetchAgentPipeline(userId!),
    enabled: Boolean(userId),
  });
}

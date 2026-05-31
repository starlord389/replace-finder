import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAgentExchangesQuery, type AgentExchangeRow } from "@/features/agent/hooks/useAgentExchangesQuery";
import {
  useUnifiedRelationships,
  type Relationship,
} from "@/features/matches/hooks/useUnifiedRelationships";
import {
  sortRelationships,
  type UiStatus,
  deriveUiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import { enrichExchange, daysFromNow } from "../mocks/exchangeMocks";

export interface WorkspaceExchange {
  id: string;
  /** Real row when available — null when an exchange has matches but is not in the agent's exchanges table (rare). */
  raw: AgentExchangeRow | null;
  clientName: string;
  relinquishedAddress: string | null;
  relinquishedCity: string | null;
  relinquishedState: string | null;
  relinquishedValue: number | null;
  identificationDeadline: string | null;
  daysRemaining: number | null;
  status: string;
  /** Pre-sorted (best match first) */
  matches: Relationship[];
  matchCount: number;
  bestScore: number;
}

interface Result {
  isLoading: boolean;
  exchanges: WorkspaceExchange[];
  byId: Map<string, WorkspaceExchange>;
  defaultExchangeId: string | null;
  /** All relationships (already loaded, useful for global counts). */
  allMatches: Relationship[];
}

/** Groups loaded relationships by exchange and enriches with real + mock data. */
export function useWorkspaceExchanges(): Result {
  const { user } = useAuth();
  const matchesQuery = useUnifiedRelationships();
  const exchangesQuery = useAgentExchangesQuery(user?.id);

  const rels = matchesQuery.data ?? [];
  const rows = exchangesQuery.data ?? [];

  return useMemo<Result>(() => {
    const matchesByExchange = new Map<string, Relationship[]>();
    for (const r of rels) {
      const arr = matchesByExchange.get(r.buyerExchangeId) ?? [];
      arr.push(r);
      matchesByExchange.set(r.buyerExchangeId, arr);
    }

    // Build a deterministic union: every agent exchange + any extras that have matches
    const idSet = new Set<string>();
    rows.forEach((r) => idSet.add(r.id));
    rels.forEach((r) => idSet.add(r.buyerExchangeId));

    const list: WorkspaceExchange[] = Array.from(idSet).map((id) => {
      const row = rows.find((r) => r.id === id) ?? null;
      const matches = sortRelationships(matchesByExchange.get(id) ?? [], "best_match");
      const enrichment = enrichExchange(id);
      const realDays = daysFromNow(row?.identification_deadline ?? null);
      const days = realDays ?? enrichment.daysRemaining;
      const bestScore = matches.length ? Math.max(...matches.map((m) => m.score)) : 0;
      return {
        id,
        raw: row,
        clientName:
          row?.agent_clients?.client_name ??
          matches[0]?.clientName ??
          "Client",
        relinquishedAddress: row?.pledged_properties?.address ?? null,
        relinquishedCity: row?.pledged_properties?.city ?? null,
        relinquishedState: row?.pledged_properties?.state ?? null,
        relinquishedValue:
          row?.exchange_proceeds != null
            ? Number(row.exchange_proceeds)
            : enrichment.relinquishedValueFallback,
        identificationDeadline:
          row?.identification_deadline ?? enrichment.deadlineAt,
        daysRemaining: days,
        status: row?.status ?? enrichment.exchangeStatus,
        matches,
        matchCount: matches.length,
        bestScore,
      };
    });

    // Sort exchanges: most matches first, then soonest deadline
    list.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999);
    });

    const byId = new Map(list.map((e) => [e.id, e]));
    // Prefer first exchange with matches; fall back to first overall.
    const defaultExchangeId =
      list.find((e) => e.matchCount > 0)?.id ?? list[0]?.id ?? null;

    return {
      isLoading: matchesQuery.isLoading || exchangesQuery.isLoading,
      exchanges: list,
      byId,
      defaultExchangeId,
      allMatches: rels,
    };
  }, [rels, rows, matchesQuery.isLoading, exchangesQuery.isLoading]);
}

/** UI status for a single relationship (reads local state). Reusable. */
export function relStatus(rel: Relationship): UiStatus {
  return deriveUiStatus(rel, readMatchLocalState(rel.matchId));
}

import { differenceInDays, parseISO } from "date-fns";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import {
  deriveAutoStage,
  isValidStageKey,
  type StageKey,
} from "./pipelineStages";

export interface ListingMeta {
  listing: AgentListing;
  rels: Relationship[];
  autoStage: StageKey;
  stage: StageKey;
  isOverridden: boolean;
  matchCount: number;
  bestScore: number | null;
  lastActivityAt: string | null;
  nearestDeadlineDays: number | null;
  nearestDeadlineType: "identification" | "closing" | null;
}

function daysFromNow(iso: string | null): number | null {
  if (!iso) return null;
  try {
    return differenceInDays(parseISO(iso), new Date());
  } catch {
    return null;
  }
}

export function buildListingMeta(
  listings: AgentListing[],
  relationships: Relationship[],
): ListingMeta[] {
  const byExchange = new Map<string, Relationship[]>();
  for (const r of relationships) {
    const arr = byExchange.get(r.buyerExchangeId) ?? [];
    arr.push(r);
    byExchange.set(r.buyerExchangeId, arr);
  }

  return listings.map((listing) => {
    const rels = byExchange.get(listing.id) ?? [];
    const autoStage = deriveAutoStage(listing, rels);
    const override = isValidStageKey(listing.pipelineStageOverride)
      ? (listing.pipelineStageOverride as StageKey)
      : null;
    const stage = override ?? autoStage;

    let bestScore: number | null = null;
    let lastActivityAt: string | null = null;
    for (const r of rels) {
      if (bestScore === null || r.score > bestScore) bestScore = r.score;
      if (!lastActivityAt || r.lastActivityAt > lastActivityAt) {
        lastActivityAt = r.lastActivityAt;
      }
    }

    const idDays = daysFromNow(listing.identificationDeadline);
    const clDays = daysFromNow(listing.closingDeadline);
    let nearestDeadlineDays: number | null = null;
    let nearestDeadlineType: "identification" | "closing" | null = null;
    if (idDays !== null && idDays >= 0) {
      nearestDeadlineDays = idDays;
      nearestDeadlineType = "identification";
    }
    if (clDays !== null && clDays >= 0) {
      if (nearestDeadlineDays === null || clDays < nearestDeadlineDays) {
        nearestDeadlineDays = clDays;
        nearestDeadlineType = "closing";
      }
    }

    return {
      listing,
      rels,
      autoStage,
      stage,
      isOverridden: override !== null && override !== autoStage,
      matchCount: rels.length,
      bestScore,
      lastActivityAt,
      nearestDeadlineDays,
      nearestDeadlineType,
    };
  });
}

export type SortKey = "activity" | "deadline" | "value" | "score";

export interface PipelineFilters {
  search: string;
  clientIds: string[];
  assetTypes: string[];
  sort: SortKey;
  riskOnly: boolean;
}

export const DEFAULT_FILTERS: PipelineFilters = {
  search: "",
  clientIds: [],
  assetTypes: [],
  sort: "activity",
  riskOnly: false,
};

export function applyFilters(
  rows: ListingMeta[],
  filters: PipelineFilters,
): ListingMeta[] {
  const q = filters.search.trim().toLowerCase();
  const filtered = rows.filter((m) => {
    if (filters.clientIds.length > 0) {
      if (!m.listing.clientId || !filters.clientIds.includes(m.listing.clientId)) {
        return false;
      }
    }
    if (filters.assetTypes.length > 0) {
      if (!m.listing.assetType || !filters.assetTypes.includes(m.listing.assetType)) {
        return false;
      }
    }
    if (filters.riskOnly) {
      if (m.nearestDeadlineDays === null || m.nearestDeadlineDays > 14) return false;
    }
    if (q) {
      const hay = [
        m.listing.clientName,
        m.listing.propertyName,
        m.listing.address,
        m.listing.city,
        m.listing.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  return filtered;
}

export function sortListings(
  rows: ListingMeta[],
  sort: SortKey,
): ListingMeta[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    switch (sort) {
      case "activity": {
        const at = a.lastActivityAt ?? a.listing.createdAt;
        const bt = b.lastActivityAt ?? b.listing.createdAt;
        return bt.localeCompare(at);
      }
      case "deadline": {
        const ad = a.nearestDeadlineDays ?? Number.POSITIVE_INFINITY;
        const bd = b.nearestDeadlineDays ?? Number.POSITIVE_INFINITY;
        return ad - bd;
      }
      case "value": {
        return (b.listing.askingPrice ?? 0) - (a.listing.askingPrice ?? 0);
      }
      case "score": {
        return (b.bestScore ?? -1) - (a.bestScore ?? -1);
      }
      default:
        return 0;
    }
  });
  return copy;
}

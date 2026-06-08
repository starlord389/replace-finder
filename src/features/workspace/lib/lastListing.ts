const KEY = (uid: string) => `workspace:lastListing:${uid}`;
const FKEY = (uid: string) => `workspace:filters:${uid}`;

export function getLastListing(userId: string | undefined): string | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY(userId));
  } catch {
    return null;
  }
}

export function setLastListing(userId: string | undefined, listingId: string) {
  if (!userId || typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(userId), listingId);
  } catch {
    /* ignore */
  }
}

export interface SwitcherFilters {
  q: string;
  clientIds: string[];
  statuses: string[];
  assetTypes: string[];
  states: string[];
  priceMin: number | null;
  priceMax: number | null;
}

export const EMPTY_SWITCHER_FILTERS: SwitcherFilters = {
  q: "",
  clientIds: [],
  statuses: [],
  assetTypes: [],
  states: [],
  priceMin: null,
  priceMax: null,
};

export function getSavedFilters(userId: string | undefined): SwitcherFilters {
  if (!userId || typeof window === "undefined") return EMPTY_SWITCHER_FILTERS;
  try {
    const raw = localStorage.getItem(FKEY(userId));
    if (!raw) return EMPTY_SWITCHER_FILTERS;
    return { ...EMPTY_SWITCHER_FILTERS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_SWITCHER_FILTERS;
  }
}

export function saveFilters(userId: string | undefined, filters: SwitcherFilters) {
  if (!userId || typeof window === "undefined") return;
  try {
    localStorage.setItem(FKEY(userId), JSON.stringify(filters));
  } catch {
    /* ignore */
  }
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Search, SlidersHorizontal, X, Clock } from "lucide-react";
import { propertyImage } from "@/features/matches/components/inbox/propertyImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { ASSET_TYPE_LABELS, EXCHANGE_STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import {
  EMPTY_SWITCHER_FILTERS,
  getLastListing,
  getSavedFilters,
  saveFilters,
  type SwitcherFilters,
} from "../lib/lastListing";

function fmtPrice(v: number | null) {
  if (v == null) return "";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export function ListingSwitcher({ listings }: { listings: AgentListing[] }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SwitcherFilters>(EMPTY_SWITCHER_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setFilters(getSavedFilters(user.id));
      setHydrated(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (hydrated && user?.id) saveFilters(user.id, filters);
  }, [filters, hydrated, user?.id]);

  const lastListingId = user?.id ? getLastListing(user.id) : null;
  const lastListing = lastListingId ? listings.find((l) => l.id === lastListingId) : null;

  const facets = useMemo(() => {
    const clients = new Map<string, string>();
    const statuses = new Set<string>();
    const assets = new Set<string>();
    const states = new Set<string>();
    for (const l of listings) {
      if (l.clientId) clients.set(l.clientId, l.clientName ?? "Unnamed");
      if (l.status) statuses.add(l.status);
      if (l.assetType) assets.add(l.assetType);
      if (l.state) states.add(l.state);
    }
    return {
      clients: Array.from(clients.entries()).sort((a, b) => a[1].localeCompare(b[1])),
      statuses: Array.from(statuses).sort(),
      assets: Array.from(assets).sort(),
      states: Array.from(states).sort(),
    };
  }, [listings]);

  const filtered = useMemo(() => {
    const term = filters.q.trim().toLowerCase();
    return listings.filter((l) => {
      if (term) {
        const hay = [l.propertyName, l.address, l.city, l.state, l.clientName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filters.clientIds.length && (!l.clientId || !filters.clientIds.includes(l.clientId)))
        return false;
      if (filters.statuses.length && !filters.statuses.includes(l.status)) return false;
      if (filters.assetTypes.length && (!l.assetType || !filters.assetTypes.includes(l.assetType)))
        return false;
      if (filters.states.length && (!l.state || !filters.states.includes(l.state))) return false;
      if (filters.priceMin != null && (l.askingPrice == null || l.askingPrice < filters.priceMin))
        return false;
      if (filters.priceMax != null && (l.askingPrice == null || l.askingPrice > filters.priceMax))
        return false;
      return true;
    });
  }, [listings, filters]);

  const groups = useMemo(() => {
    const map = new Map<string, { clientId: string | null; clientName: string; items: AgentListing[] }>();
    for (const l of filtered) {
      const key = l.clientId ?? "_unassigned";
      const name = l.clientName ?? "Unassigned";
      if (!map.has(key)) map.set(key, { clientId: l.clientId, clientName: name, items: [] });
      map.get(key)!.items.push(l);
    }
    return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [filtered]);

  const activeCount =
    filters.clientIds.length +
    filters.statuses.length +
    filters.assetTypes.length +
    filters.states.length +
    (filters.priceMin != null ? 1 : 0) +
    (filters.priceMax != null ? 1 : 0);

  function toggle<K extends keyof SwitcherFilters>(key: K, val: string) {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...prev, [key]: next };
    });
  }

  function clearAll() {
    setFilters({ ...EMPTY_SWITCHER_FILTERS, q: filters.q });
  }

  return (
    <div className="space-y-3">
      {lastListing && (
        <Link
          to={`/agent/workspace/${lastListing.id}`}
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 transition-colors hover:bg-primary/10"
        >
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Continue where you left off
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {lastListing.propertyName || lastListing.address || "Untitled"}
              {lastListing.clientName && (
                <span className="text-muted-foreground"> · {lastListing.clientName}</span>
              )}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search by property, location, or client…"
            className="pl-9"
          />
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={clearAll}>
            Reset
          </Button>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="shrink-0">
              <SlidersHorizontal className="mr-1.5 h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] max-h-[70vh] overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Filters</p>
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                    Clear all
                  </Button>
                )}
              </div>

              {facets.clients.length > 0 && (
                <FilterGroup label="Client">
                  {facets.clients.map(([id, name]) => (
                    <FilterCheck
                      key={id}
                      checked={filters.clientIds.includes(id)}
                      onChange={() => toggle("clientIds", id)}
                      label={name}
                    />
                  ))}
                </FilterGroup>
              )}

              {facets.statuses.length > 0 && (
                <FilterGroup label="Status">
                  {facets.statuses.map((s) => (
                    <FilterCheck
                      key={s}
                      checked={filters.statuses.includes(s)}
                      onChange={() => toggle("statuses", s)}
                      label={EXCHANGE_STATUS_LABELS[s] ?? s}
                    />
                  ))}
                </FilterGroup>
              )}

              {facets.assets.length > 0 && (
                <FilterGroup label="Asset type">
                  {facets.assets.map((a) => (
                    <FilterCheck
                      key={a}
                      checked={filters.assetTypes.includes(a)}
                      onChange={() => toggle("assetTypes", a)}
                      label={(ASSET_TYPE_LABELS as Record<string, string>)[a] ?? a}
                    />
                  ))}
                </FilterGroup>
              )}

              {facets.states.length > 0 && (
                <FilterGroup label="State">
                  <div className="flex flex-wrap gap-1.5">
                    {facets.states.map((s) => {
                      const active = filters.states.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggle("states", s)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </FilterGroup>
              )}

              <FilterGroup label="Asking price (USD)">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        priceMin: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax ?? ""}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        priceMax: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </FilterGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.clientIds.map((id) => {
            const name = facets.clients.find(([cid]) => cid === id)?.[1] ?? id;
            return (
              <FilterChip key={`c-${id}`} label={name} onRemove={() => toggle("clientIds", id)} />
            );
          })}
          {filters.statuses.map((s) => (
            <FilterChip
              key={`s-${s}`}
              label={EXCHANGE_STATUS_LABELS[s] ?? s}
              onRemove={() => toggle("statuses", s)}
            />
          ))}
          {filters.assetTypes.map((a) => (
            <FilterChip
              key={`a-${a}`}
              label={(ASSET_TYPE_LABELS as Record<string, string>)[a] ?? a}
              onRemove={() => toggle("assetTypes", a)}
            />
          ))}
          {filters.states.map((s) => (
            <FilterChip key={`st-${s}`} label={s} onRemove={() => toggle("states", s)} />
          ))}
          {filters.priceMin != null && (
            <FilterChip
              label={`Min ${fmtPrice(filters.priceMin)}`}
              onRemove={() => setFilters((f) => ({ ...f, priceMin: null }))}
            />
          )}
          {filters.priceMax != null && (
            <FilterChip
              label={`Max ${fmtPrice(filters.priceMax)}`}
              onRemove={() => setFilters((f) => ({ ...f, priceMax: null }))}
            />
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {listings.length} listing{listings.length === 1 ? "" : "s"}
      </p>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          No listings match your filters.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const accent = getClientAccent(g.clientId);
            return (
              <section key={g.clientId ?? "_unassigned"} className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-3">
                  <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {g.clientName}
                  </h2>
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {g.items.length} {g.items.length === 1 ? "Listing" : "Listings"}
                  </span>
                </div>

                <ul className="space-y-3">
                  {g.items.map((l) => {
                    const title =
                      l.propertyName ||
                      l.address ||
                      (l.status === "draft" ? "Draft listing" : "Untitled");
                    const loc = [l.city, l.state].filter(Boolean).join(", ");
                    const isLast = l.id === lastListingId;
                    const assetLabel = l.assetType
                      ? (ASSET_TYPE_LABELS as Record<string, string>)[l.assetType] ?? l.assetType
                      : null;
                    const statusLabel = EXCHANGE_STATUS_LABELS[l.status] ?? l.status;
                    const statusDot =
                      l.status === "closing"
                        ? "bg-amber-500"
                        : l.status === "identification"
                          ? "bg-emerald-500"
                          : l.status === "draft"
                            ? "bg-muted-foreground/40"
                            : "bg-primary";
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/agent/workspace/${l.id}`}
                          className="group flex overflow-hidden rounded-md border bg-card shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="relative hidden w-64 shrink-0 overflow-hidden bg-muted sm:block">
                            <img
                              src={propertyImage(null, l.id)}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-8">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
                                    {title}
                                  </h3>
                                  {isLast && (
                                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                      Last viewed
                                    </span>
                                  )}
                                </div>
                                {loc && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {loc}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xl font-semibold text-foreground">
                                  {l.askingPrice != null ? fmtPrice(l.askingPrice) : "—"}
                                </p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Asking Price
                                </p>
                              </div>
                            </div>

                            <div className="flex items-end justify-between gap-4 border-t pt-5">
                              <div className="flex gap-8">
                                {assetLabel && (
                                  <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      Asset Type
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      {assetLabel}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Status
                                  </p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
                                    <p className="text-sm font-medium text-foreground">
                                      {statusLabel}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <span className="border-b border-foreground pb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:border-muted-foreground group-hover:text-muted-foreground">
                                View Details
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <Label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm font-normal hover:bg-muted/50">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="truncate">{label}</span>
    </Label>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs text-foreground hover:bg-muted"
    >
      {label}
      <X className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

import { Fragment, useMemo } from "react";
import { Search, X, ArrowUpDown, SlidersHorizontal, Check, Users, Filter as FilterIcon, Building2, ChevronDown, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { PropertyMatchCard } from "./PropertyMatchCard";
import {
  FILTER_TABS,
  SORT_OPTIONS,
  type UiStatus,
  type SortKey,
} from "./inboxHelpers";
import { EMPTY_FILTERS, type MatchFilters } from "./SortFilterBar";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

export interface InboxListingOption {
  exchangeId: string;
  propertyLabel: string;
  city: string | null;
  state: string | null;
  status: string;
}

export interface InboxClientGroup {
  clientId: string | null;
  clientName: string;
  listings: InboxListingOption[];
}

interface Props {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filter: "all" | UiStatus;
  onFilterChange: (f: "all" | UiStatus) => void;
  counts: Record<"all" | UiStatus, number>;
  sort: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: MatchFilters;
  onFiltersChange: (f: MatchFilters) => void;
  scopeRels: Relationship[];
  rankMap: Map<string, number>;
  groupByClient?: boolean;
  onGroupByClientChange?: (v: boolean) => void;
  /** Optional client → property selector to pivot listings from the toolbar. */
  clients?: InboxClientGroup[];
  activeClientId?: string | null;
  activeExchangeId?: string;
  onSelectExchange?: (exchangeId: string) => void;
  /** Optional "All clients" entry — when provided, surfaces an "All clients" option at the top of the client dropdown. */
  onSelectAllClients?: () => void;
  /** Optional "All properties for this client" entry — when provided, surfaces an option at the top of the property dropdown. */
  onSelectAllPropertiesForClient?: (clientId: string | null) => void;
  /** Label for the active client when the global "All clients" mode is active. */
  allClientsActive?: boolean;
  /** Label for the active property when the "All properties" mode is active. */
  allPropertiesActive?: boolean;
}

export function InboxList({
  rels,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  groupByClient = false,
  onGroupByClientChange,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  scopeRels,
  rankMap,
  clients,
  activeClientId,
  activeExchangeId,
  onSelectExchange,
  onSelectAllClients,
  onSelectAllPropertiesForClient,
  allClientsActive = false,
  allPropertiesActive = false,
}: Props) {
  const totalInScope = scopeRels.length;
  const showingCount = rels.length;

  const statusTab = FILTER_TABS.find((t) => t.key === filter) ?? FILTER_TABS[0];
  const sortOption = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0];

  const activeClient = useMemo(
    () => clients?.find((c) => (c.clientId ?? "") === (activeClientId ?? "")) ?? null,
    [clients, activeClientId],
  );
  const activeListing = useMemo(
    () => activeClient?.listings.find((l) => l.exchangeId === activeExchangeId) ?? null,
    [activeClient, activeExchangeId],
  );
  const showSwitcher = !!(clients && clients.length > 0 && (onSelectExchange || onSelectAllClients));




  const allStates = useMemo(() => {
    const s = new Set<string>();
    scopeRels.forEach((r) => r.propertyState && s.add(r.propertyState));
    return [...s].sort();
  }, [scopeRels]);

  const advFilterCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.states.length > 0 ? 1 : 0) +
    (filters.priceMin != null ? 1 : 0) +
    (filters.priceMax != null ? 1 : 0);

  const anyActive =
    !!search.trim() || filter !== "all" || advFilterCount > 0;

  function clearAll() {
    onSearchChange("");
    onFilterChange("all");
    onFiltersChange(EMPTY_FILTERS);
  }

  function toggleState(st: string) {
    onFiltersChange({
      ...filters,
      states: filters.states.includes(st)
        ? filters.states.filter((x) => x !== st)
        : [...filters.states, st],
    });
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      {/* Compact toolbar */}
      <div className="shrink-0 border-b border-border bg-muted/30">
        {showSwitcher && (
          <ListingSwitcherRow
            clients={clients!}
            activeClient={activeClient}
            activeListing={activeListing}
            allClientsActive={allClientsActive}
            allPropertiesActive={allPropertiesActive}
            onSelectExchange={onSelectExchange}
            onSelectAllClients={onSelectAllClients}
            onSelectAllPropertiesForClient={onSelectAllPropertiesForClient}
          />
        )}
        <div className="flex items-center gap-1.5 p-2">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search property, city, or client…"
              className="h-9 border-border bg-background pl-8 pr-8 text-sm shadow-sm focus-visible:ring-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 shrink-0 gap-1.5 bg-background px-2.5 text-xs font-medium",
                  filter !== "all" && "border-primary/40 bg-primary/5 text-primary",
                )}
              >
                <FilterIcon className="h-3.5 w-3.5" />
                <span>{statusTab.label}</span>
                <span className="rounded-sm bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
                  {counts[filter] ?? 0}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {FILTER_TABS.map((t) => {
                const active = filter === t.key;
                return (
                  <DropdownMenuItem
                    key={t.key}
                    onSelect={() => onFilterChange(t.key)}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-2">
                      {active ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <span className="h-3 w-3" />
                      )}
                      {t.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {counts[t.key] ?? 0}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5 bg-background px-2.5 text-xs font-medium"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{sortOption.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {SORT_OPTIONS.map((o) => (
                <DropdownMenuItem
                  key={o.key}
                  onSelect={() => onSortChange(o.key)}
                  className="flex items-center gap-2 text-xs"
                >
                  {sort === o.key ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <span className="h-3 w-3" />
                  )}
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Advanced filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 shrink-0 gap-1.5 bg-background px-2.5 text-xs font-medium",
                  advFilterCount > 0 && "border-primary/40 bg-primary/5 text-primary",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {advFilterCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {advFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold">Filter matches</p>
                {advFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onFiltersChange(EMPTY_FILTERS)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-medium">Min match score</span>
                    <span className="text-muted-foreground">{filters.minScore}</span>
                  </div>
                  <Slider
                    value={[filters.minScore]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([v]) => onFiltersChange({ ...filters, minScore: v })}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium">Price range</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin ?? ""}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          priceMin: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax ?? ""}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          priceMax: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {allStates.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium">Market</p>
                    <div className="flex flex-wrap gap-1">
                      {allStates.map((st) => {
                        const active = filters.states.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => toggleState(st)}
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {st}
                            {active && <X className="ml-1 inline h-2.5 w-2.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips + group toggle + result count */}
        {(anyActive || totalInScope > 0 || !!onGroupByClientChange) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 px-2.5 py-1.5">
            {search.trim() && (
              <ActiveChip
                label={`"${search.trim()}"`}
                onClear={() => onSearchChange("")}
              />
            )}
            {filter !== "all" && (
              <ActiveChip
                label={statusTab.label}
                onClear={() => onFilterChange("all")}
              />
            )}
            {filters.minScore > 0 && (
              <ActiveChip
                label={`Score ≥ ${filters.minScore}`}
                onClear={() => onFiltersChange({ ...filters, minScore: 0 })}
              />
            )}
            {filters.priceMin != null && (
              <ActiveChip
                label={`Min $${filters.priceMin.toLocaleString()}`}
                onClear={() => onFiltersChange({ ...filters, priceMin: null })}
              />
            )}
            {filters.priceMax != null && (
              <ActiveChip
                label={`Max $${filters.priceMax.toLocaleString()}`}
                onClear={() => onFiltersChange({ ...filters, priceMax: null })}
              />
            )}
            {filters.states.map((st) => (
              <ActiveChip
                key={st}
                label={st}
                onClear={() => toggleState(st)}
              />
            ))}
            {anyActive && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-0.5 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            {onGroupByClientChange && (
              <button
                type="button"
                onClick={() => onGroupByClientChange(!groupByClient)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  groupByClient
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Users className="h-3 w-3" />
                Group by client
              </button>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{showingCount}</span>
              {" "}of {totalInScope}
            </span>
          </div>
        )}
      </div>


      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {rels.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-foreground">No matches</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different filter or search.
            </p>
            {anyActive && (
              <Button variant="outline" size="sm" className="mt-3" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </div>
        ) : groupByClient ? (
          <GroupedList
            rels={rels}
            selectedId={selectedId}
            onSelect={onSelect}
            rankMap={rankMap}
          />
        ) : (
          <ul className="space-y-2">
            {rels.map((r) => (
              <li key={r.id}>
                <PropertyMatchCard
                  rel={r}
                  selected={r.id === selectedId}
                  onSelect={() => onSelect(r)}
                  rank={rankMap.get(r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-0.5 pl-2 pr-1 text-[11px] font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

interface GroupedListProps {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  rankMap: Map<string, number>;
}

function GroupedList({ rels, selectedId, onSelect, rankMap }: GroupedListProps) {
  const groups: Array<{ clientId: string | null; clientName: string; items: Relationship[] }> = [];
  const indexByKey = new Map<string, number>();
  for (const r of rels) {
    const key = r.clientId ?? `__${r.clientName ?? "client"}`;
    let idx = indexByKey.get(key);
    if (idx == null) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ clientId: r.clientId, clientName: r.clientName ?? "Client", items: [] });
    }
    groups[idx].items.push(r);
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const accent = getClientAccent(g.clientId);
        return (
          <Fragment key={g.clientId ?? g.clientName}>
            <div
              className={cn(
                "sticky top-0 z-[1] -mx-2 flex items-center justify-between gap-2 border-y px-3 py-1.5 backdrop-blur",
                accent.soft,
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} />
                <span className={cn("truncate text-xs font-semibold", accent.fg)}>
                  {g.clientName}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                {g.items.length} match{g.items.length === 1 ? "" : "es"}
              </span>
            </div>
            <ul className="space-y-2">
              {g.items.map((r) => (
                <li key={r.id}>
                  <PropertyMatchCard
                    rel={r}
                    selected={r.id === selectedId}
                    onSelect={() => onSelect(r)}
                    rank={rankMap.get(r.id)}
                    hideClientLead
                  />
                </li>
              ))}
            </ul>
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Listing switcher row ─────────────────────────────────────────

interface ListingSwitcherRowProps {
  clients: InboxClientGroup[];
  activeClient: InboxClientGroup | null;
  activeListing: InboxListingOption | null;
  allClientsActive?: boolean;
  allPropertiesActive?: boolean;
  onSelectExchange?: (exchangeId: string) => void;
  onSelectAllClients?: () => void;
  onSelectAllPropertiesForClient?: (clientId: string | null) => void;
}

function ListingSwitcherRow({
  clients,
  activeClient,
  activeListing,
  allClientsActive = false,
  allPropertiesActive = false,
  onSelectExchange,
  onSelectAllClients,
  onSelectAllPropertiesForClient,
}: ListingSwitcherRowProps) {
  const accent = getClientAccent(allClientsActive ? null : activeClient?.clientId ?? null);

  function pickClient(c: InboxClientGroup) {
    if (onSelectAllPropertiesForClient) {
      // Global mode: scope to this client's matches, stay on global page.
      onSelectAllPropertiesForClient(c.clientId);
      return;
    }
    if (!c.listings.length || !onSelectExchange) return;
    onSelectExchange(c.listings[0].exchangeId);
  }

  function pickListing(exchangeId: string) {
    onSelectExchange?.(exchangeId);
  }

  const clientLabel = allClientsActive
    ? "All clients"
    : activeClient?.clientName ?? "Select client";

  const propertyLabel = allClientsActive
    ? "All properties"
    : allPropertiesActive
      ? `All ${activeClient?.clientName ?? ""} properties`.trim()
      : activeListing?.propertyLabel ?? "Select property";

  const propertyDisabled =
    allClientsActive || !activeClient || activeClient.listings.length === 0;

  return (
    <div className="flex items-center gap-1.5 border-b border-border/60 px-2 py-2">
      {/* Client */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "group inline-flex h-9 min-w-0 max-w-[46%] items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium shadow-sm transition-colors hover:border-primary/40",
              allClientsActive && "border-primary/40 bg-primary/5",
            )}
          >
            {allClientsActive ? (
              <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} />
                <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
            <span className="truncate text-foreground">{clientLabel}</span>
            <ChevronDown className="ml-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {onSelectAllClients && (
            <>
              <DropdownMenuItem
                onSelect={() => onSelectAllClients()}
                className="flex items-center gap-2 text-xs"
              >
                {allClientsActive ? (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">All clients</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Clients
          </DropdownMenuLabel>
          {clients.map((c) => {
            const ca = getClientAccent(c.clientId);
            const active =
              !allClientsActive &&
              (c.clientId ?? "") === (activeClient?.clientId ?? "__none");
            return (
              <DropdownMenuItem
                key={c.clientId ?? c.clientName}
                onSelect={() => pickClient(c)}
                disabled={!c.listings.length && !onSelectAllPropertiesForClient}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {active ? (
                    <Check className="h-3 w-3 shrink-0 text-primary" />
                  ) : (
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", ca.dot)} />
                  )}
                  <span className="truncate font-medium text-foreground">
                    {c.clientName}
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {c.listings.length}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-muted-foreground">/</span>

      {/* Property */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={propertyDisabled}
            className={cn(
              "group inline-flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium shadow-sm transition-colors hover:border-primary/40 disabled:opacity-60",
              allPropertiesActive && "border-primary/40 bg-primary/5",
            )}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground">{propertyLabel}</span>
            {!allPropertiesActive &&
              !allClientsActive &&
              activeListing &&
              (activeListing.city || activeListing.state) && (
                <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                  · {[activeListing.city, activeListing.state].filter(Boolean).join(", ")}
                </span>
              )}
            <ChevronDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {onSelectAllPropertiesForClient && activeClient && !allClientsActive && (
            <>
              <DropdownMenuItem
                onSelect={() => onSelectAllPropertiesForClient(activeClient.clientId)}
                className="flex items-center gap-2 text-xs"
              >
                {allPropertiesActive ? (
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">
                  All {activeClient.clientName} properties
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {activeClient?.clientName ?? "Properties"} ·{" "}
            {activeClient?.listings.length ?? 0}
          </DropdownMenuLabel>
          {(activeClient?.listings ?? []).map((l) => {
            const active =
              !allPropertiesActive && l.exchangeId === activeListing?.exchangeId;
            const loc = [l.city, l.state].filter(Boolean).join(", ");
            return (
              <DropdownMenuItem
                key={l.exchangeId}
                onSelect={() => pickListing(l.exchangeId)}
                className="flex items-start gap-2 text-xs"
              >
                {active ? (
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <span className="mt-0.5 h-3 w-3 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {l.propertyLabel}
                  </span>
                  {loc && (
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {loc}
                    </span>
                  )}
                </span>
              </DropdownMenuItem>
            );
          })}
          {activeClient && activeClient.listings.length === 0 && (
            <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
              No listings for this client.
            </div>
          )}
        </DropdownMenuContent>

      </DropdownMenu>
    </div>
  );
}

import { useDeferredValue, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { useAdminCommandCenter } from "@/features/admin/hooks/useAdminCommandCenter";
import { CrmPageHeader, MetricTile } from "@/features/admin-crm/components/CrmPrimitives";
import { useAdminCrmDirectory, type AdminCrmRecordType } from "@/features/admin-crm/data/useAdminCrmDirectory";
import { useAdminCrmScope } from "@/features/admin-crm/layout/AdminCrmScope";
import { exchangeManagedForLabel, exchangeOwnerTypeLabel } from "@/features/admin/lib/accountTypes";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { resolveListingName } from "@/lib/listingDisplay";
import { AlertTriangle, ArrowRight, Building2, ChevronLeft, ChevronRight, CircleDollarSign, Database, Handshake, Home, ImageOff, Loader2, MessageSquare, RefreshCw, Search, Sparkles } from "lucide-react";

type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type Match = Tables<"matches">;
type Connection = Tables<"exchange_connections">;
type Message = Tables<"messages">;
type Financials = Tables<"property_financials">;
type PropertyImage = Tables<"property_images">;
type DirectoryRecord = Exchange | Property | Match | Connection;
type DirectoryContext = {
  exchange?: Exchange | null;
  financials?: Financials | null;
  image?: PropertyImage | null;
  owner_name?: string | null;
  client_name?: string | null;
  match_count?: number;
  relationship?: string;
  current_property?: Property | null;
  candidate_property?: Property | null;
  candidate_financials?: Financials | null;
  candidate_image?: PropertyImage | null;
  connection?: Connection | null;
  latest_message?: Message | null;
  message_count?: number;
  buyer_name?: string | null;
  seller_name?: string | null;
};
type StagingDatasetManifest = { buyer?: { exchange_id?: string }; seller?: { exchange_id?: string } };

const PAGE_SIZE = 25;

function fmtDate(value: string | null) { return value ? new Date(value).toLocaleDateString() : "—"; }
function money(value: number | null | undefined) { return value != null ? `$${Math.round(value).toLocaleString()}` : "—"; }
function pretty(value: string | null | undefined) { return value ? value.replace(/_/g, " ") : "—"; }
function formatPercent(value: number | null | undefined) { return value == null ? "—" : `${value.toFixed(2)}%`; }

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200", accepted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200", closed: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-muted text-muted-foreground", pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200", in_identification: "bg-amber-100 text-amber-800 border-amber-200",
  in_closing: "bg-blue-100 text-blue-800 border-blue-200", under_contract: "bg-blue-100 text-blue-800 border-blue-200",
  declined: "bg-red-100 text-red-800 border-red-200", failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200", withdrawn: "bg-muted text-muted-foreground",
};

function StatusPill({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[value] || "bg-muted text-muted-foreground"}`}>{pretty(value)}</span>;
}

export default function AdminDeals({ mode = "opportunities" }: { mode?: "opportunities" | "properties" }) {
  const { scope, isDemo } = useAdminCrmScope();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = mode === "properties" ? "properties" : ["exchanges", "matches", "connections"].includes(requestedTab ?? "") ? requestedTab! : "matches";
  const recordType: AdminCrmRecordType = mode === "properties"
    ? "property"
    : activeTab === "matches"
      ? "match"
      : activeTab === "exchanges"
        ? "exchange"
        : "connection";
  const selectedPropertyId = mode === "properties" ? searchParams.get("property") : null;
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [recordStatus, setRecordStatus] = useState(searchParams.get("status") ?? "all");
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page") ?? 1) || 1));
  const deferredSearch = useDeferredValue(search);
  const directory = useAdminCrmDirectory<DirectoryRecord, DirectoryContext>({
    recordType, dataScope: scope, search: selectedPropertyId ?? deferredSearch, status: recordStatus, page, pageSize: PAGE_SIZE,
  });
  const command = useAdminCommandCenter(scope);
  const data = directory.data;
  const records = data?.records ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  useEffect(() => { setPage(1); }, [scope, activeTab]);

  function updateUrl(next: { q?: string; status?: string; page?: number; property?: string | null }) {
    const params = new URLSearchParams(searchParams);
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q); else params.delete("q");
    }
    if (next.status !== undefined) {
      if (next.status !== "all") params.set("status", next.status); else params.delete("status");
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set("page", String(next.page)); else params.delete("page");
    }
    if (next.property !== undefined) {
      if (next.property) params.set("property", next.property); else params.delete("property");
    }
    setSearchParams(params, { replace: true });
  }

  function changeTab(tab: string) {
    const params = new URLSearchParams(searchParams);
    if (tab === "matches") params.delete("tab"); else params.set("tab", tab);
    params.delete("property"); params.delete("status"); params.delete("page");
    setRecordStatus("all"); setPage(1); setSearchParams(params, { replace: true });
  }

  function changePage(next: number) {
    const safe = Math.min(Math.max(1, next), totalPages);
    setPage(safe); updateUrl({ page: safe });
  }

  const summary = data?.summary ?? {};
  const kpis = command.data?.kpis;
  const statusOptions = data?.availableStatuses ?? [];
  const startRecord = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(page * PAGE_SIZE, totalCount);

  return <div className="space-y-6">
    <CrmPageHeader
      eyebrow={mode === "properties" ? "Property inventory" : "Deal workflow"}
      title={mode === "properties" ? "Properties" : "Opportunities"}
      description={mode === "properties" ? "See every current property and listing with its owner, exchange, financial position, photos, and matched opportunities in one directory." : `Follow each ${scope} exchange from the current property to its matches and the agent conversations that move it forward.`}
      actions={<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => void Promise.all([directory.refetch(), command.refetch()])} disabled={directory.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${directory.isFetching ? "animate-spin" : ""}`} />Refresh</Button>{mode === "opportunities" && isDemo && <ReseedStagingButton />}</div>}
    />

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {mode === "properties" ? <>
        <MetricTile label="All properties" value={summary.total ?? "—"} icon={Building2} detail={`${scope} property records`} tone="blue" />
        <MetricTile label="Listed or active" value={summary.active ?? "—"} icon={Home} detail="Visible inventory and active exchanges" tone="green" />
        <MetricTile label="Drafts" value={summary.draft ?? "—"} icon={CircleDollarSign} detail="Started but not yet published" tone={(summary.draft ?? 0) ? "amber" : "slate"} />
        <MetricTile label="Missing photos" value={summary.missing_photos ?? "—"} icon={ImageOff} detail="Listings that may need follow-up" tone={(summary.missing_photos ?? 0) ? "amber" : "slate"} />
      </> : <>
        <MetricTile label="Active exchanges" value={kpis?.activeExchanges ?? "—"} icon={Building2} detail="Active exchange workspaces" tone="blue" />
        <MetricTile label="Matched opportunities" value={kpis?.activeMatches ?? "—"} icon={Sparkles} detail="Active matches in this workspace" tone="green" />
        <MetricTile label="Agent conversations" value={kpis?.openConnections ?? "—"} icon={Handshake} detail="Open conversation records" tone="blue" />
        <MetricTile label="Ready to advance" value={kpis?.readyToAdvance ?? "—"} icon={MessageSquare} detail="Active matches without a conversation" tone={(kpis?.readyToAdvance ?? 0) ? "amber" : "slate"} />
      </>}
    </div>

    {directory.isError && <DirectoryError error={directory.error} onRetry={() => void directory.refetch()} />}

    {!directory.isError && <Tabs value={activeTab} onValueChange={changeTab}>
      {mode === "opportunities" && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><TabsList className="grid h-auto w-full grid-cols-1 rounded-none bg-slate-50 p-1.5 sm:grid-cols-3"><WorkflowTab value="matches" label="Matches" detail="Review property fit" icon={Sparkles} /><WorkflowTab value="exchanges" label="Exchanges" detail="Track active searches" icon={Building2} /><WorkflowTab value="connections" label="Conversations" detail="Follow agent activity" icon={MessageSquare} /></TabsList></div>}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { const value = event.target.value; setSearch(value); setPage(1); updateUrl({ q: value, page: 1, property: null }); }} placeholder={mode === "properties" ? "Search property, owner, client, market, or asset type" : "Search owner, client, property, agent, or status"} className="pl-9" /></div>
        <select value={recordStatus} onChange={(event) => { setRecordStatus(event.target.value); setPage(1); updateUrl({ status: event.target.value, page: 1 }); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700" aria-label="Filter by status"><option value="all">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select>
        {(search || recordStatus !== "all" || selectedPropertyId) && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRecordStatus("all"); setPage(1); updateUrl({ q: "", status: "all", page: 1, property: null }); }}>Clear filters</Button>}
      </div>

      <TabsContent value="properties" className="mt-4"><DirectoryCard loading={directory.isLoading} empty={!records.length} emptyLabel="No properties found."><div className="divide-y divide-slate-100">{records.map(({ record, context }) => <PropertyDirectoryCard key={record.id} property={record as Property} financial={context.financials ?? undefined} image={context.image ?? undefined} matchCount={Number(context.match_count ?? 0)} relationship={context.relationship ?? "Property"} ownerType={exchangeOwnerTypeLabel(context.exchange?.owner_type)} ownerName={context.owner_name ?? "Unknown"} managedFor={context.exchange ? exchangeManagedForLabel(context.exchange.owner_type, context.client_name) : "Standalone listing"} onOpen={() => navigate(`/admin/properties/${record.id}`)} />)}</div></DirectoryCard></TabsContent>

      <TabsContent value="exchanges" className="mt-4"><DirectoryCard loading={directory.isLoading} empty={!records.length} emptyLabel="No exchanges found."><Table><TableHeader><TableRow><TableHead>Exchange workspace</TableHead><TableHead>Current property</TableHead><TableHead>Owner and client</TableHead><TableHead className="w-[100px] text-center">Matches</TableHead><TableHead className="w-[150px]">Status</TableHead><TableHead className="w-[150px]">Exchange proceeds</TableHead><TableHead className="w-10"><span className="sr-only">Open</span></TableHead></TableRow></TableHeader><TableBody>{records.map(({ record, context }) => { const exchange = record as Exchange; const current = context.current_property; return <TableRow key={exchange.id} className="group cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/opportunities/exchanges/${exchange.id}`)}><TableCell><p className="text-sm font-semibold text-slate-950">{exchangeManagedForLabel(exchange.owner_type, context.client_name)}</p><p className="mt-1 text-xs text-slate-500">Created {fmtDate(exchange.created_at)} · {exchangeOwnerTypeLabel(exchange.owner_type)}</p></TableCell><TableCell><p className="max-w-[260px] truncate text-sm font-medium">{current ? resolveListingName(current, true) : "Property not added"}</p><p className="mt-1 text-xs text-slate-500">{current ? [current.city, current.state].filter(Boolean).join(", ") || "Location not provided" : "Exchange setup incomplete"}</p></TableCell><TableCell><p className="text-sm font-medium">{context.owner_name ?? "Unknown"}</p><p className="mt-1 text-xs text-slate-500">{exchangeManagedForLabel(exchange.owner_type, context.client_name)}</p></TableCell><TableCell className="text-center text-sm font-semibold">{context.match_count ?? 0}</TableCell><TableCell><StatusPill value={exchange.status} /></TableCell><TableCell className="text-sm font-medium">{money(exchange.exchange_proceeds)}</TableCell><TableCell><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></TableCell></TableRow>; })}</TableBody></Table></DirectoryCard></TabsContent>

      <TabsContent value="matches" className="mt-4"><DirectoryCard loading={directory.isLoading} empty={!records.length} emptyLabel="No matches found."><div className="divide-y divide-slate-100">{records.map(({ record, context }) => <MatchOpportunityCard key={record.id} match={record as Match} exchange={context.exchange ?? undefined} currentProperty={context.current_property ?? undefined} candidate={context.candidate_property ?? undefined} candidateFinancial={context.candidate_financials ?? undefined} candidateImage={context.candidate_image ?? undefined} accountOwner={context.owner_name ?? "Unknown"} managedFor={exchangeManagedForLabel(context.exchange?.owner_type, context.client_name)} conversationStatus={context.connection?.status ?? null} onOpen={() => navigate(`/admin/opportunities/matches/${record.id}`)} />)}</div></DirectoryCard></TabsContent>

      <TabsContent value="connections" className="mt-4"><DirectoryCard loading={directory.isLoading} empty={!records.length} emptyLabel="No conversations found."><Table><TableHeader><TableRow><TableHead className="w-[100px]">Started</TableHead><TableHead>Agents</TableHead><TableHead>Property opportunity</TableHead><TableHead>Latest message</TableHead><TableHead className="w-[140px]">Status</TableHead><TableHead className="w-[95px] text-right">Messages</TableHead></TableRow></TableHeader><TableBody>{records.map(({ record, context }) => { const connection = record as Connection; const latest = context.latest_message; return <TableRow key={connection.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/opportunities/connections/${connection.id}`)}><TableCell className="text-xs text-muted-foreground">{fmtDate(connection.created_at)}</TableCell><TableCell className="text-sm"><div className="font-medium">{context.buyer_name ?? "Unknown"}</div><div className="mt-0.5 text-xs text-muted-foreground">with {context.seller_name ?? "Unknown"}</div></TableCell><TableCell className="text-sm"><div className="font-medium">{context.current_property ? resolveListingName(context.current_property, true) : "Current property unavailable"}</div><div className="mt-0.5 text-xs text-muted-foreground">→ {context.candidate_property ? resolveListingName(context.candidate_property, true) : "Matched property unavailable"}</div></TableCell><TableCell className="max-w-[330px] text-sm"><div className="truncate">{latest?.content || "No messages yet"}</div>{latest && <div className="mt-0.5 text-xs text-muted-foreground">{fmtDate(latest.created_at)}</div>}</TableCell><TableCell><StatusPill value={connection.status} /></TableCell><TableCell className="text-right text-sm font-semibold">{context.message_count ?? 0}</TableCell></TableRow>; })}</TableBody></Table></DirectoryCard></TabsContent>
    </Tabs>}

    {!directory.isError && <PaginationFooter page={page} totalPages={totalPages} start={startRecord} end={endRecord} total={totalCount} onPage={changePage} />}
  </div>;
}

function WorkflowTab({ value, label, detail, icon: Icon }: { value: string; label: string; detail: string; icon: LucideIcon }) {
  return <TabsTrigger value={value} className="h-auto justify-start gap-3 rounded-lg px-3 py-3 text-left data-[state=active]:bg-white data-[state=active]:shadow-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="text-sm font-semibold">{label}</span><span className="mt-0.5 hidden text-[11px] font-normal text-slate-500 sm:block">{detail}</span></span></TabsTrigger>;
}

function DirectoryCard({ loading, empty, emptyLabel, children }: { loading: boolean; empty: boolean; emptyLabel: string; children: React.ReactNode }) {
  if (loading) return <Card><CardContent className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>;
  if (empty) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{emptyLabel}</CardContent></Card>;
  return <Card><div className="overflow-x-auto">{children}</div></Card>;
}

function DirectoryError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return <Card className="border-red-200 bg-red-50" role="alert"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" /><div><p className="font-semibold text-red-950">This directory is unavailable</p><p className="mt-1 text-sm text-red-700">{error?.message ?? "The server-backed directory could not be loaded."}</p></div></div><Button variant="outline" size="sm" onClick={onRetry} className="bg-white"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card>;
}

function PaginationFooter({ page, totalPages, start, end, total, onPage }: { page: number; totalPages: number; start: number; end: number; total: number; onPage: (page: number) => void }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">Showing <span className="font-medium text-slate-800">{start}–{end}</span> of <span className="font-medium text-slate-800">{total}</span> records</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="min-w-20 text-center text-xs font-medium text-slate-600">Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>;
}

function PropertyDirectoryCard({ property, financial, image, matchCount, relationship, ownerType, ownerName, managedFor, onOpen }: { property: Property; financial?: Financials; image?: PropertyImage; matchCount: number; relationship: string; ownerType: string; ownerName: string; managedFor: string; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="group flex w-full min-w-0 flex-col bg-white text-left transition hover:bg-slate-50 md:flex-row md:items-stretch"><div className="relative h-44 shrink-0 overflow-hidden bg-slate-100 md:h-auto md:min-h-36 md:w-44 xl:w-52">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <PropertyPhotoPlaceholder className="h-full min-h-40 w-full" compact />}<Badge variant="outline" className="absolute left-3 top-3 border-white/70 bg-white/90 text-[10px] text-slate-700 shadow-sm">{relationship}</Badge></div><div className="min-w-0 flex-1 p-4 lg:p-5"><div className="grid h-full min-w-0 gap-5 lg:grid-cols-[minmax(220px,1fr)_minmax(300px,.95fr)_minmax(210px,.75fr)_auto] lg:items-center xl:gap-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(property, true)}</p><StatusPill value={property.status} /></div><p className="mt-1.5 truncate text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(", ") || "Location not provided"}</p><p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">{property.asset_type ? pretty(property.asset_type) : "Asset type not provided"}</p></div><div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3.5"><CompactFact label="Value" value={money(financial?.asking_price ?? financial?.appraised_value)} /><CompactFact label="NOI" value={money(financial?.noi)} /><CompactFact label="Cap rate" value={formatPercent(financial?.cap_rate)} /></div><div className="min-w-0 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Owner and client</p><p className="mt-1.5 truncate text-xs font-semibold text-slate-800">{ownerName}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{ownerType} · {managedFor}</p></div><div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:min-w-24 lg:justify-end lg:border-t-0 lg:pt-0"><div className="lg:text-right"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Opportunities</p><p className="mt-1.5 text-xs font-semibold text-slate-700">{matchCount} {matchCount === 1 ? "match" : "matches"}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></div></div></div></button>;
}

function MatchOpportunityCard({ match, exchange, currentProperty, candidate, candidateFinancial, candidateImage, accountOwner, managedFor, conversationStatus, onOpen }: { match: Match; exchange?: Exchange; currentProperty?: Property; candidate?: Property; candidateFinancial?: Financials; candidateImage?: PropertyImage; accountOwner: string; managedFor: string; conversationStatus: string | null; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="group block w-full p-4 text-left transition hover:bg-slate-50 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-32">{candidateImage ? <img src={resolvePropertyImageUrl(candidateImage.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" compact />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{Math.round(match.total_score)} score</span><StatusPill value={match.status} />{conversationStatus && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] text-blue-700">Conversation {pretty(conversationStatus)}</Badge>}</div><p className="mt-2 truncate text-base font-semibold text-slate-950 group-hover:text-emerald-700">{candidate ? resolveListingName(candidate, true) : "Matched property unavailable"}</p><p className="mt-1 truncate text-xs text-slate-500">Matched against {currentProperty ? resolveListingName(currentProperty, true) : "current property unavailable"}</p></div></div><div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 xl:w-[560px]"><CompactFact label="Purchase price" value={money(candidateFinancial?.asking_price)} /><CompactFact label="Projected NOI" value={money(candidateFinancial?.noi)} /><CompactFact label="ROE improvement" value={match.roe_improvement_pp != null ? `${match.roe_improvement_pp.toFixed(1)} pts` : "—"} /><CompactFact label="Boot" value={pretty(match.boot_status)} /></div><div className="flex shrink-0 items-center justify-between gap-3 xl:w-44 xl:justify-end"><div className="min-w-0 xl:text-right"><p className="truncate text-xs font-semibold text-slate-800">{accountOwner}</p><p className="mt-1 truncate text-[10px] text-slate-500">{managedFor} · {fmtDate(match.created_at)}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></div></div>{exchange && <span className="sr-only">Exchange {exchange.id}</span>}</button>;
}

function CompactFact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold capitalize text-slate-800">{value || "—"}</p></div>;
}

function ReseedStagingButton() {
  const [busy, setBusy] = useState(false);
  return <Button variant="outline" size="sm" disabled={busy} onClick={async () => { if (!confirm("Re-seed the staging (is_demo) dataset? This wipes prior staging rows for the fixture agents.")) return; setBusy(true); const { data, error } = await supabase.functions.invoke("seed-staging-dataset", { body: {} }); setBusy(false); if (error) { toast({ title: "Re-seed failed", description: error.message, variant: "destructive" }); return; } const manifest = data as StagingDatasetManifest | null; toast({ title: "Staging dataset ready", description: `Buyer exchange ${manifest?.buyer?.exchange_id?.slice(0, 8)} · 4 candidate listings${manifest?.seller?.exchange_id ? " · seller-side exchange included" : ""}` }); }}>
    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}Re-seed staging data
  </Button>;
}

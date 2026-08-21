import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Headphones,
  Inbox,
  Mail,
  MessageCircleMore,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCommunicationItems,
  useAdminCommunications,
  type AdminCommunication,
  type CommunicationChannel,
} from "../data/useAdminCommunications";
import { formatDate, sentence } from "../lib/crmFormat";

type Props = {
  userId?: string;
  accountName?: string;
  embedded?: boolean;
  dataScope?: "all" | "live" | "demo";
};

const PAGE_SIZE = 30;

const channels: Array<{ value: CommunicationChannel; label: string; icon: typeof Inbox }> = [
  { value: "all", label: "All", icon: Inbox },
  { value: "agent_agent", label: "Agent to agent", icon: UsersRound },
  { value: "client_agent", label: "Client and agent", icon: MessageCircleMore },
  { value: "notification", label: "Notifications", icon: Bell },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Phone },
  { value: "invitation", label: "Invitations", icon: Send },
  { value: "support", label: "Support", icon: Headphones },
];

const statusOptions = [
  ["", "All statuses"],
  ["unread", "Unread"],
  ["open", "Open"],
  ["active", "Active"],
  ["pending", "Pending"],
  ["accepted", "Accepted"],
  ["in_progress", "In progress"],
  ["sent", "Sent"],
  ["failed", "Failed"],
  ["bounced", "Bounced"],
  ["suppressed", "Suppressed"],
  ["resolved", "Resolved"],
] as const;

export default function CommunicationsCenter({ userId, accountName, embedded = false, dataScope }: Props) {
  const [channel, setChannel] = useState<CommunicationChannel>("all");
  const [localDataScope, setLocalDataScope] = useState<"all" | "live" | "demo">("all");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const effectiveDataScope = dataScope ?? localDataScope;
  const query = useAdminCommunications({ userId, dataScope: effectiveDataScope, channel, status, search: deferredSearch, page, pageSize: PAGE_SIZE });
  const rows = useMemo(() => query.data?.rows ?? [], [query.data?.rows]);
  const selected = rows.find((row) => communicationKey(row) === selectedKey) ?? null;
  const items = useAdminCommunicationItems(selected);
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!selectedKey || rows.some((row) => communicationKey(row) === selectedKey)) return;
    setSelectedKey(null);
  }, [rows, selectedKey]);

  function updateChannel(next: CommunicationChannel) {
    setChannel(next);
    setPage(1);
    setSelectedKey(null);
  }

  function updateStatus(next: string) {
    setStatus(next);
    setPage(1);
    setSelectedKey(null);
  }

  const visibleMetrics = useMemo(() => ({
    conversations: rows.filter((row) => row.channel === "agent_agent" || row.channel === "client_agent").length,
    unread: rows.reduce((sum, row) => sum + row.unreadCount, 0),
    issues: rows.filter((row) => ["failed", "bounced", "complained", "suppressed", "dlq"].includes(row.status)).length,
  }), [rows]);

  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${embedded ? "min-h-[680px]" : "min-h-[720px]"}`} data-testid="admin-communications-center">
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-950">{userId ? `${accountName || "Account"} communications` : "Communication activity"}</h2>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Read only</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">Messages, notifications, delivery events, invitations, and support stay connected to the people involved.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span><strong className="text-slate-900">{total.toLocaleString()}</strong> matching records</span>
            <span><strong className="text-slate-900">{visibleMetrics.conversations}</strong> conversations on page</span>
            <span><strong className={visibleMetrics.unread ? "text-amber-700" : "text-slate-900"}>{visibleMetrics.unread}</strong> unread on page</span>
            <span><strong className={visibleMetrics.issues ? "text-red-700" : "text-slate-900"}>{visibleMetrics.issues}</strong> delivery issues on page</span>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Communication channels">
          {channels.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateChannel(item.value)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${channel === item.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}
            >
              <item.icon className="h-3.5 w-3.5" />{item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[590px] lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/60 lg:border-b-0 lg:border-r">
          <div className="space-y-2 border-b border-slate-200 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                className="h-9 bg-white pl-9 text-sm"
                placeholder="Search people, content, or context"
                aria-label="Search communications"
              />
            </div>
            <select
              value={status}
              onChange={(event) => updateStatus(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-slate-400"
              aria-label="Communication status"
            >
              {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {!dataScope && <select
              value={localDataScope}
              onChange={(event) => { setLocalDataScope(event.target.value as "all" | "live" | "demo"); setPage(1); setSelectedKey(null); }}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-slate-400"
              aria-label="Communication data scope"
            >
              <option value="all">Live and demo data</option>
              <option value="live">Live data only</option>
              <option value="demo">Demo data only</option>
            </select>}
          </div>

          {query.data?.warning && <Alert className="m-3 border-amber-200 bg-amber-50 p-3"><CircleAlert className="h-4 w-4 text-amber-700" /><AlertTitle className="text-xs text-amber-950">Deployment pending</AlertTitle><AlertDescription className="mt-1 text-[11px] leading-4 text-amber-800">{query.data.warning}</AlertDescription></Alert>}

          <div className="max-h-[550px] overflow-y-auto">
            {query.isLoading ? <CommunicationListSkeleton /> : query.error ? (
              <div className="p-6 text-center"><p className="text-sm font-semibold text-red-900">Communications unavailable</p><p className="mt-1 text-xs text-red-700">{query.error instanceof Error ? query.error.message : "Try again."}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => query.refetch()}>Try again</Button></div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center"><Inbox className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-800">No communication records</p><p className="mt-1 text-xs leading-5 text-slate-500">Try another channel, status, or search.</p></div>
            ) : rows.map((row) => (
              <CommunicationRow
                key={communicationKey(row)}
                row={row}
                active={selected ? communicationKey(selected) === communicationKey(row) : false}
                onClick={() => setSelectedKey(communicationKey(row))}
              />
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[11px] text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setSelectedKey(null); }} aria-label="Previous communication page"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => { setPage((value) => value + 1); setSelectedKey(null); }} aria-label="Next communication page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-white">
          {selected ? <CommunicationDetail record={selected} query={items} /> : <EmptyDetail />}
        </main>
      </div>
    </section>
  );
}

function CommunicationRow({ row, active, onClick }: { row: AdminCommunication; active: boolean; onClick: () => void }) {
  const Icon = channelIcon(row.channel);
  return (
    <button type="button" onClick={onClick} className={`w-full border-b border-slate-100 p-3.5 text-left transition ${active ? "bg-white shadow-[inset_3px_0_0_#10b981]" : "hover:bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${channelTone(row.channel)}`}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-xs font-semibold text-slate-950">{row.title}</span>
            {row.unreadCount > 0 && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" title={`${row.unreadCount} unread`} />}
          </span>
          <span className="mt-1 block truncate text-[11px] text-slate-500">{row.participantSummary}</span>
          <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-slate-600">{row.preview}</span>
          <span className="mt-2 flex items-center justify-between gap-2">
            <StatusPill value={row.status} />
            <span className="shrink-0 text-[9px] text-slate-400">{relativeTime(row.occurredAt)}</span>
          </span>
        </span>
      </div>
    </button>
  );
}

function CommunicationDetail({ record, query }: { record: AdminCommunication; query: ReturnType<typeof useAdminCommunicationItems> }) {
  const Icon = channelIcon(record.channel);
  const currentProperty = stringContext(record.context, "current_property");
  const matchedProperty = stringContext(record.context, "matched_property");
  return (
    <div className="flex min-h-[590px] flex-col">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${channelTone(record.channel)}`}><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold text-slate-950">{record.title}</h3><StatusPill value={record.status} />{record.isDemo && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">Demo</Badge>}</div>
              <p className="mt-1 text-xs text-slate-500">{record.participantSummary}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{channelLabel(record.channel)} · {record.messageCount} {record.messageCount === 1 ? "entry" : "entries"} · Last activity {formatDate(record.occurredAt, true)}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {record.primaryUserId && <Button asChild variant="outline" size="sm"><Link to={`/admin/users/${record.primaryUserId}`}><UserRound className="mr-1.5 h-3.5 w-3.5" />Open account</Link></Button>}
            {record.secondaryUserId && record.secondaryUserId !== record.primaryUserId && <Button asChild variant="outline" size="sm"><Link to={`/admin/users/${record.secondaryUserId}`}><UsersRound className="mr-1.5 h-3.5 w-3.5" />Other account</Link></Button>}
          </div>
        </div>
        {(currentProperty || matchedProperty) && <div className="mt-4 grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 sm:grid-cols-[1fr_auto_1fr]"><ContextProperty label="Current property" value={currentProperty} /><ChevronRight className="hidden h-4 w-4 self-center text-emerald-400 sm:block" /><ContextProperty label="Matched property" value={matchedProperty} /></div>}
      </header>

      <Alert className="m-4 mb-0 border-blue-200 bg-blue-50"><ShieldCheck className="h-4 w-4 text-blue-700" /><AlertTitle className="text-xs text-blue-950">Administrative read-only record</AlertTitle><AlertDescription className="mt-1 text-[11px] leading-4 text-blue-800">Opening full communication content is recorded in the administrator audit log. Messages cannot be changed or sent from this view.</AlertDescription></Alert>
      {query.data?.warning && <Alert className="mx-4 mt-3 border-amber-200 bg-amber-50"><CircleAlert className="h-4 w-4 text-amber-700" /><AlertTitle className="text-xs text-amber-950">Audit logging activates after deployment</AlertTitle><AlertDescription className="mt-1 text-[11px] text-amber-800">{query.data.warning}</AlertDescription></Alert>}

      <div className="flex-1 overflow-y-auto p-5">
        {query.isLoading ? <div className="space-y-4"><Skeleton className="h-24 w-4/5 rounded-xl" /><Skeleton className="ml-auto h-20 w-3/5 rounded-xl" /><Skeleton className="h-28 w-3/4 rounded-xl" /></div> : query.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-sm font-semibold text-red-950">Communication content unavailable</p><p className="mt-1 text-xs text-red-700">{query.error instanceof Error ? query.error.message : "Try again."}</p><Button variant="outline" size="sm" className="mt-3 bg-white" onClick={() => query.refetch()}>Try again</Button></div>
        ) : !query.data?.rows.length ? (
          <div className="py-16 text-center"><MessageSquare className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-800">No message content yet</p><p className="mt-1 text-xs text-slate-500">The relationship or delivery record exists, but no message has been sent.</p></div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {query.data.rows.map((item) => <CommunicationItem key={item.itemKey} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CommunicationItem({ item }: { item: NonNullable<ReturnType<typeof useAdminCommunicationItems>["data"]>["rows"][number] }) {
  const isSystem = ["system", "administrator", "invitation"].includes(item.senderRole);
  return (
    <article className={`rounded-xl border p-4 ${isSystem ? "border-slate-200 bg-slate-50" : "border-emerald-100 bg-emerald-50/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-950">{item.senderName}</p><p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{sentence(item.senderRole)}</p></div>
        <div className="text-right"><StatusPill value={item.status} /><p className="mt-1 text-[9px] text-slate-400">{formatDate(item.createdAt, true)}</p></div>
      </div>
      {item.subject && <p className="mt-3 border-t border-slate-200/70 pt-3 text-sm font-semibold text-slate-900">{item.subject}</p>}
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.body}</p>
      {item.readAt && <p className="mt-3 text-[10px] text-slate-400">Read or delivered {formatDate(item.readAt, true)}</p>}
    </article>
  );
}

function EmptyDetail() {
  return <div className="grid min-h-[590px] place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100"><MessageSquare className="h-5 w-5 text-slate-400" /></span><p className="mt-4 text-sm font-semibold text-slate-900">Select a communication record</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Choose a conversation, notification, delivery event, invitation, or support request to inspect its complete history.</p></div></div>;
}

function CommunicationListSkeleton() {
  return <div className="space-y-0">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="border-b border-slate-100 p-4"><div className="flex gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /><Skeleton className="h-7 w-full" /></div></div></div>)}</div>;
}

function ContextProperty({ label, value }: { label: string; value: string | null }) {
  return <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">{label}</p><p className="mt-0.5 truncate text-xs font-medium text-slate-900">{value || "Not connected"}</p></div>;
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const style = ["active", "accepted", "sent", "delivered", "read", "resolved", "completed"].includes(normalized)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : ["failed", "bounced", "complained", "suppressed", "dlq", "cancelled", "declined"].includes(normalized)
      ? "border-red-200 bg-red-50 text-red-700"
      : ["unread", "open", "pending", "in_progress", "queued"].includes(normalized)
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";
  return <Badge variant="outline" className={`h-5 px-1.5 text-[9px] font-medium capitalize ${style}`}>{value.replace(/_/g, " ")}</Badge>;
}

function communicationKey(row: AdminCommunication) { return `${row.recordType}:${row.recordId}`; }
function relativeTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : formatDistanceToNow(date, { addSuffix: true });
}
function stringContext(context: Record<string, unknown>, key: string) {
  const value = context[key];
  return typeof value === "string" && value.trim() ? value : null;
}
function channelLabel(channel: Exclude<CommunicationChannel, "all">) {
  return channels.find((item) => item.value === channel)?.label || sentence(channel);
}
function channelIcon(channel: Exclude<CommunicationChannel, "all">) {
  return channels.find((item) => item.value === channel)?.icon || Inbox;
}
function channelTone(channel: Exclude<CommunicationChannel, "all">) {
  if (channel === "agent_agent") return "bg-blue-50 text-blue-700";
  if (channel === "client_agent") return "bg-emerald-50 text-emerald-700";
  if (channel === "notification") return "bg-violet-50 text-violet-700";
  if (channel === "email") return "bg-cyan-50 text-cyan-700";
  if (channel === "sms") return "bg-fuchsia-50 text-fuchsia-700";
  if (channel === "invitation") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminHealthIssueCount,
  useAdminAuditLog,
  useAdminSystemHealth,
} from "@/features/admin/hooks/useAdminOperations";

function formatDateTime(value: string | null) {
  if (!value) return "None";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function pretty(value: string) {
  return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminSystem() {
  const health = useAdminSystemHealth();
  const audit = useAdminAuditLog();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const entityTypes = useMemo(
    () => [...new Set((audit.data ?? []).map((entry) => entry.entity_type))].sort(),
    [audit.data],
  );
  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (audit.data ?? []).filter((entry) => {
      const matchesEntity = entityFilter === "all" || entry.entity_type === entityFilter;
      const matchesSearch =
        !term ||
        entry.action.toLowerCase().includes(term) ||
        entry.entity_type.toLowerCase().includes(term) ||
        (entry.summary ?? "").toLowerCase().includes(term) ||
        entry.actorName.toLowerCase().includes(term) ||
        (entry.actorEmail ?? "").toLowerCase().includes(term) ||
        (entry.entity_id ?? "").toLowerCase().includes(term);
      return matchesEntity && matchesSearch;
    });
  }, [audit.data, entityFilter, search]);

  const refreshing = health.isFetching || audit.isFetching;
  const refresh = () => {
    void health.refetch();
    void audit.refetch();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-system">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System &amp; Audit</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor background operations and review consequential admin activity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <SystemHealthSection
        data={health.data}
        isLoading={health.isLoading}
        error={health.error}
        onRetry={() => health.refetch()}
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Admin audit log
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Immutable record of supported admin actions. Showing the latest 200 entries.
              </p>
            </div>
            <Badge variant="secondary">{audit.data?.length ?? 0} entries</Badge>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, admin, summary, or record ID…"
                className="pl-9"
                aria-label="Search audit log"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter by record type">
                <SelectValue placeholder="Record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All record types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>{pretty(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {audit.isLoading ? (
            <div className="space-y-2 px-6 pb-6">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}
            </div>
          ) : audit.error ? (
            <InlineError message={audit.error instanceof Error ? audit.error.message : "Could not load the audit log."} />
          ) : filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{audit.data?.length ? "No entries match your filters." : "No admin actions recorded yet."}</p>
              <p className="mt-1 text-xs text-muted-foreground">New supported admin changes will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">When</TableHead>
                    <TableHead className="w-[190px]">Admin</TableHead>
                    <TableHead className="w-[170px]">Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[180px] truncate text-sm font-medium">{entry.actorName}</p>
                        {entry.actorEmail && entry.actorEmail !== entry.actorName && (
                          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{entry.actorEmail}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">{pretty(entry.action)}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{entry.summary || pretty(entry.entity_type)}</p>
                        <p className="mt-0.5 max-w-[440px] truncate font-mono text-[10px] text-muted-foreground">
                          {pretty(entry.entity_type)}{entry.entity_id ? ` · ${entry.entity_id}` : ""}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SystemHealthSection({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: ReturnType<typeof useAdminSystemHealth>["data"];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => unknown;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-red-900">System health could not be checked.</p>
            <p className="truncate text-xs text-red-700">{error?.message ?? "Please try again."}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const issueCount = getAdminHealthIssueCount(data);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {issueCount === 0 ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
          <p className="text-sm font-semibold">{issueCount === 0 ? "Background systems healthy" : `${issueCount} background issue${issueCount === 1 ? "" : "s"} detected`}</p>
        </div>
        <p className="text-xs text-muted-foreground">Checked {formatDateTime(data.checkedAt)}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <HealthCard
          icon={ServerCog}
          title="Matching queue"
          metrics={[
            ["Pending", data.matching.pending],
            ["Processing", data.matching.processing],
            ["Failed", data.matching.failed],
          ]}
          issueCount={data.matching.failed}
          footnote={`Oldest pending: ${formatDateTime(data.matching.oldestPendingAt)}`}
        />
        <HealthCard
          icon={Activity}
          title="Event outbox"
          metrics={[
            ["Pending", data.outbox.pending],
            ["Failed", data.outbox.failed],
          ]}
          issueCount={data.outbox.failed}
          footnote={`Oldest pending: ${formatDateTime(data.outbox.oldestPendingAt)}`}
        />
        <HealthCard
          icon={Mail}
          title="Email delivery"
          metrics={[
            ["Sent (24h)", data.email.sentLast24h],
            ["Pending", data.email.pending],
            ["Issues", data.email.failed + data.email.bounced + data.email.complained + data.email.dlq],
          ]}
          issueCount={data.email.failed + data.email.bounced + data.email.complained + data.email.dlq}
          footnote={`Last issue: ${formatDateTime(data.email.lastIssueAt)}`}
        />
      </div>
    </div>
  );
}

function HealthCard({
  icon: Icon,
  title,
  metrics,
  issueCount,
  footnote,
}: {
  icon: typeof Clock3;
  title: string;
  metrics: Array<[string, number]>;
  issueCount: number;
  footnote: string;
}) {
  return (
    <Card className={issueCount ? "border-red-200" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="outline" className={issueCount ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}>
          {issueCount ? "Needs attention" : "Healthy"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-md bg-muted/50 p-2">
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock3 className="h-3 w-3" />
          {footnote}
        </p>
      </CardContent>
    </Card>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-10 text-sm text-red-700">
      <AlertTriangle className="h-4 w-4" />
      {message}
    </div>
  );
}

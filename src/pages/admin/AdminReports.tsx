import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Download,
  FileSpreadsheet,
  Inbox,
  LifeBuoy,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildAdminReportSnapshot,
  isWithinAdminReportRange,
  type AdminReportData,
  type AdminReportRange,
  useAdminReports,
} from "@/features/admin/hooks/useAdminReports";
import { recordAdminAction } from "@/features/admin/hooks/useAdminOperations";
import { downloadCsv, type CsvValue } from "@/features/admin/lib/csvExport";
import {
  exchangeManagedForLabel,
  exchangeOwnerTypeLabel,
} from "@/features/admin/lib/accountTypes";

type ExportDefinition = {
  key: string;
  title: string;
  description: string;
  filename: string;
  headers: string[];
  rows: CsvValue[][];
};

const RANGE_LABELS: Record<AdminReportRange, string> = {
  7: "Last 7 days",
  30: "Last 30 days",
  90: "Last 90 days",
  all: "All time",
};

function pretty(value: string) {
  return value.replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminReports() {
  const reports = useAdminReports();
  const [range, setRange] = useState<AdminReportRange>(30);
  const [exporting, setExporting] = useState<string | null>(null);

  const snapshot = useMemo(
    () => reports.data ? buildAdminReportSnapshot(reports.data, range) : null,
    [range, reports.data],
  );
  const exports = useMemo(
    () => reports.data ? buildExportDefinitions(reports.data, range) : [],
    [range, reports.data],
  );

  async function handleExport(definition: ExportDefinition) {
    setExporting(definition.key);
    downloadCsv(definition.filename, definition.headers, definition.rows);
    await recordAdminAction({
      action: "report.exported",
      entityType: "report",
      entityId: definition.key,
      summary: `Exported ${definition.title}`,
      metadata: {
        report: definition.key,
        range: range === "all" ? "all" : range,
        row_count: definition.rows.length,
      },
    });
    setExporting(null);
  }

  if (reports.isLoading) return <ReportsSkeleton />;

  if (reports.error || !reports.data || !snapshot) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader range={range} onRangeChange={setRange} onRefresh={() => reports.refetch()} isFetching={reports.isFetching} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-wrap items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-900">Reports could not load business data.</p>
              <p className="truncate text-xs text-red-700">
                {reports.error instanceof Error ? reports.error.message : "Please try again."}
              </p>
            </div>
            <Button variant="outline" onClick={() => reports.refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = [
    { label: "New users", value: snapshot.users, detail: `${snapshot.agents} agents · ${snapshot.investors} investors/owners`, icon: Users },
    { label: "Exchanges started", value: snapshot.exchanges, detail: `${snapshot.activeExchanges} active`, icon: ArrowLeftRight },
    { label: "Leads captured", value: snapshot.leads, detail: `${snapshot.leadSources.demos} demo requests`, icon: Inbox },
    { label: "Unresolved tickets", value: snapshot.unresolvedTickets, detail: `${Object.values(snapshot.supportStatuses).reduce((sum, value) => sum + value, 0)} opened`, icon: LifeBuoy },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-reports">
      <PageHeader range={range} onRangeChange={setRange} onRefresh={() => reports.refetch()} isFetching={reports.isFetching} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <metric.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatusBreakdown title="Account roles" values={snapshot.accountTypes} />
        <StatusBreakdown title="Exchange status" values={snapshot.exchangeStatuses} />
        <StatusBreakdown title="Lead source" values={snapshot.leadSources} />
        <StatusBreakdown title="Support status" values={snapshot.supportStatuses} />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Business data exports</h2>
            <p className="text-sm text-muted-foreground">
              Downloads respect the selected reporting period and exclude demo records.
            </p>
          </div>
          <Badge variant="outline">{RANGE_LABELS[range]}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {exports.map((definition) => (
            <Card key={definition.key}>
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-50 p-2 text-green-700">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{definition.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    {definition.rows.length} row{definition.rows.length === 1 ? "" : "s"}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(definition)}
                    disabled={exporting !== null}
                  >
                    {exporting === definition.key ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Download CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Exports contain private business information</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Store downloaded files securely, share them only with authorized people, and delete copies when they are no longer needed. Every export is recorded in System &amp; Audit.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader({
  range,
  onRangeChange,
  onRefresh,
  isFetching,
}: {
  range: AdminReportRange;
  onRangeChange: (range: AdminReportRange) => void;
  onRefresh: () => unknown;
  isFetching: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Exports</h1>
        <p className="mt-1 text-muted-foreground">Measure activity and take your business data with you.</p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(range)}
          onValueChange={(value) => onRangeChange(value === "all" ? "all" : Number(value) as AdminReportRange)}
        >
          <SelectTrigger className="w-40" aria-label="Reporting period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isFetching} aria-label="Refresh reports">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}

function StatusBreakdown({ title, values }: { title: string; values: Record<string, number> }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, count]) => count), 1);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{total}</Badge>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity in this period.</p>
        ) : (
          <div className="space-y-3">
            {rows.map(([label, count]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{pretty(label)}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((count / max) * 100, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function buildExportDefinitions(data: AdminReportData, range: AdminReportRange): ExportDefinition[] {
  const inRange = <T extends { created_at: string }>(rows: T[]) =>
    rows.filter((row) => isWithinAdminReportRange(row.created_at, range));
  const profileById = new Map(data.profiles.map((profile) => [profile.id, profile]));
  const clientById = new Map(data.clients.map((client) => [client.id, client]));
  const propertyById = new Map(data.properties.map((property) => [property.id, property]));
  const connectionCountByExchange = data.connections.reduce<Map<string, number>>((map, connection) => {
    map.set(connection.buyer_exchange_id, (map.get(connection.buyer_exchange_id) ?? 0) + 1);
    if (connection.seller_exchange_id) {
      map.set(connection.seller_exchange_id, (map.get(connection.seller_exchange_id) ?? 0) + 1);
    }
    return map;
  }, new Map());
  const rolesByUser = data.roles.reduce<Map<string, string[]>>((map, role) => {
    map.set(role.user_id, [...(map.get(role.user_id) ?? []), role.role]);
    return map;
  }, new Map());
  const stamp = dateStamp();

  const userRows = inRange(data.profiles).map((profile) => [
    profile.id,
    profile.full_name,
    profile.email,
    profile.phone,
    profile.company,
    profile.brokerage_name,
    (rolesByUser.get(profile.id) ?? []).join("; "),
    profile.created_at,
  ]);

  const dealRows = inRange(data.exchanges).map((exchange) => {
    const client = exchange.client_id ? clientById.get(exchange.client_id) : null;
    const agent = profileById.get(exchange.agent_id);
    const property = exchange.relinquished_property_id
      ? propertyById.get(exchange.relinquished_property_id)
      : null;
    return [
      exchange.id,
      exchangeOwnerTypeLabel(exchange.owner_type),
      agent?.full_name,
      agent?.email,
      exchangeManagedForLabel(exchange.owner_type, client?.client_name),
      exchange.status,
      property?.property_name,
      property?.city,
      property?.state,
      property?.asset_type,
      connectionCountByExchange.get(exchange.id) ?? 0,
      exchange.estimated_equity,
      exchange.exchange_proceeds,
      exchange.identification_deadline,
      exchange.closing_deadline,
      exchange.created_at,
    ];
  });

  const leadRows: CsvValue[][] = [
    ...inRange(data.contacts).map((row) => [
      "Contact", row.id, row.name, row.email, null, null, row.status, null, row.created_at,
    ]),
    ...inRange(data.referrals).map((row) => [
      "Referral", row.id, row.owner_name, row.owner_email, row.owner_phone, null, row.status,
      row.property_location, row.created_at,
    ]),
    ...inRange(data.demos).map((row) => [
      "Demo", row.id, row.full_name, row.work_email, row.phone, row.company, row.status,
      row.use_case, row.created_at,
    ]),
    ...inRange(data.events).map((row) => [
      "Event", row.id, row.full_name, row.email, null, null, row.role, row.event, row.created_at,
    ]),
  ].sort((a, b) => String(b[8]).localeCompare(String(a[8])));

  const supportRows = inRange(data.tickets).map((ticket) => {
    const profile = profileById.get(ticket.user_id);
    return [
      ticket.id,
      profile?.full_name,
      profile?.email,
      ticket.category,
      ticket.subject,
      ticket.status,
      ticket.created_at,
      ticket.updated_at,
    ];
  });

  return [
    {
      key: "users",
      title: "Users & roles",
      description: "Account identity, contact details, company, assigned roles, and signup date.",
      filename: `1031-exchange-up-users-${stamp}.csv`,
      headers: ["User ID", "Name", "Email", "Phone", "Company", "Brokerage", "Roles", "Joined At"],
      rows: userRows,
    },
    {
      key: "deals",
      title: "Exchanges & deals",
      description: "Exchange status, account-owner type, agent or self-managed ownership, property summary, economics, and deadlines.",
      filename: `1031-exchange-up-deals-${stamp}.csv`,
      headers: ["Exchange ID", "Account Type", "Account Owner", "Account Email", "Managed For", "Status", "Property", "City", "State", "Asset Type", "Connections", "Estimated Equity", "Exchange Proceeds", "Identification Deadline", "Closing Deadline", "Created At"],
      rows: dealRows,
    },
    {
      key: "leads",
      title: "Growth & leads",
      description: "Contact requests, referrals, demos, and event registrations in one normalized file.",
      filename: `1031-exchange-up-leads-${stamp}.csv`,
      headers: ["Source", "Record ID", "Name", "Email", "Phone", "Company", "Status or Role", "Context", "Created At"],
      rows: leadRows,
    },
    {
      key: "support",
      title: "Support summary",
      description: "Ticket ownership, category, subject, status, and timestamps without private message or note contents.",
      filename: `1031-exchange-up-support-${stamp}.csv`,
      headers: ["Ticket ID", "User", "User Email", "Category", "Subject", "Status", "Created At", "Updated At"],
      rows: supportRows,
    },
  ];
}

function ReportsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-64" />)}
      </div>
    </div>
  );
}

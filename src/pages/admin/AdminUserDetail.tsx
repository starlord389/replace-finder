import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Handshake,
  Home,
  ImageIcon,
  LifeBuoy,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import {
  AdminUserNotFoundError,
  type AdminUser360,
  type AdminUserExchange,
  type AdminUserMatch,
  type AdminUserProperty,
  type AdminUserRelationship,
  type AdminUserScope,
  type AdminUserScopedData,
  scopeAdminUser360,
  useAdminUser360,
} from "@/features/admin/hooks/useAdminUser360";
import { adminRoleLabel, exchangeOwnerTypeLabel } from "@/features/admin/lib/accountTypes";
import type { Tables } from "@/integrations/supabase/types";
import { resolveListingName } from "@/lib/listingDisplay";

const relationshipLabel: Record<AdminUserRelationship, string> = {
  account_owner: "Account owner",
  managing_agent: "Managing agent",
  assigned_agent: "Assigned agent",
  linked_client_account: "Linked client account",
  buyer_side: "Buyer side",
  listing_side: "Listing side",
  historical_participant: "Historical participant",
};

const roleClass: Record<string, string> = {
  admin: "border-red-200 bg-red-50 text-red-700",
  agent: "border-blue-200 bg-blue-50 text-blue-700",
  investor: "border-emerald-200 bg-emerald-50 text-emerald-700",
  client: "border-violet-200 bg-violet-50 text-violet-700",
  broker: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusClass: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  verified: "border-green-200 bg-green-50 text-green-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  connected: "border-green-200 bg-green-50 text-green-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  awaiting_representation: "border-amber-200 bg-amber-50 text-amber-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
  deleted: "border-slate-300 bg-slate-100 text-slate-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
  revoked: "border-slate-200 bg-slate-50 text-slate-600",
  archived: "border-slate-200 bg-slate-50 text-slate-600",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
};

const USER_DETAIL_TABS = [
  "overview", "clients", "portfolio", "matches", "relationships", "activity", "account",
] as const;

function pretty(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not provided";
}

function date(value: string | null | undefined, withTime = false) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  return withTime
    ? parsed.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : parsed.toLocaleDateString([], { dateStyle: "medium" });
}

function money(value: number | null | undefined) {
  return value == null ? "Not provided" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function percent(value: number | null | undefined, scale = 1) {
  return value == null ? "Not provided" : `${(value * scale).toFixed(2)}%`;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusClass[status] ?? "border-slate-200 bg-slate-50 text-slate-700"}>
      {pretty(status)}
    </Badge>
  );
}

function RelationshipBadges({ relationships }: { relationships: AdminUserRelationship[] }) {
  if (!relationships.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {relationships.map((relationship) => (
        <Badge key={relationship} variant="secondary" className="font-medium">
          {relationshipLabel[relationship]}
        </Badge>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof Users; title: string; detail: string }) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-3 rounded-full bg-muted p-3"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState<AdminUserScope>("all");
  const { data, isLoading, error, refetch, isFetching } = useAdminUser360(userId);
  const requestedTab = searchParams.get("tab");
  const activeTab = USER_DETAIL_TABS.includes(requestedTab as typeof USER_DETAIL_TABS[number])
    ? requestedTab!
    : "overview";
  const returnCandidate = (location.state as { adminReturnTo?: unknown } | null)?.adminReturnTo;
  const usersReturnTo = typeof returnCandidate === "string" && returnCandidate.startsWith("/admin/users")
    ? returnCandidate
    : "/admin/users";

  function changeTab(tab: string) {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  }

  if (isLoading) return <UserDetailSkeleton />;

  if (error || !data) {
    const missing = error instanceof AdminUserNotFoundError;
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to={usersReturnTo}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to users</Link></Button>
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <AlertTriangle className="mb-3 h-9 w-9 text-amber-500" />
            <h1 className="text-xl font-semibold">{missing ? "User not found" : "This account could not be loaded"}</h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {missing ? "The account may have been removed, or the link is no longer valid." : error instanceof Error ? error.message : "Try loading the account again."}
            </p>
            {!missing && <Button className="mt-5" onClick={() => refetch()}>Try again</Button>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const visible = scopeAdminUser360(data, scope);
  const name = data.profile.full_name || data.profile.email || "Unnamed account";
  const accountStatus = data.accountState?.account_status ?? (data.profile.verification_status === "suspended" ? "suspended" : "active");
  const activeRepresentations = visible.representations.filter((row) => row.status === "active").length;
  const openConnections = visible.connections.filter((row) =>
    ["pending", "accepted", "in_progress"].includes(row.status)
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-user-360">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={usersReturnTo}><ArrowLeft className="mr-1.5 h-4 w-4" />Back to users</Link>
        </Button>
        <div className="flex items-center gap-2">
          <ScopeControl scope={scope} onChange={setScope} />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-cyan-500" />
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <ProfileAvatar photoUrl={data.profile.profile_photo_url} name={name} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" fallbackClassName="text-lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                  <Badge variant="outline" className={statusClass[data.profile.verification_status] ?? ""}>Verification: {pretty(data.profile.verification_status)}</Badge>
                  <Badge variant="outline" className={statusClass[accountStatus] ?? ""}>Account: {pretty(accountStatus)}</Badge>
                  {!data.profileExists && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Profile not created</Badge>}
                </div>
                {data.profile.profile_headline && <p className="mt-1 text-sm text-muted-foreground">{data.profile.profile_headline}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.roles.length ? data.roles.map((role) => (
                    <Badge key={role} variant="outline" className={roleClass[role] ?? ""}>{adminRoleLabel(role)}</Badge>
                  )) : <Badge variant="outline">No assigned role</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {data.profile.email && <a className="inline-flex items-center gap-1.5 hover:text-foreground" href={`mailto:${data.profile.email}`}><Mail className="h-3.5 w-3.5" />{data.profile.email}</a>}
                  {data.profile.phone && <a className="inline-flex items-center gap-1.5 hover:text-foreground" href={`tel:${data.profile.phone}`}><Phone className="h-3.5 w-3.5" />{data.profile.phone}</a>}
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Joined {date(data.authAccount?.created_at ?? data.profile.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:min-w-[550px]">
              <HeaderMetric label="Clients" value={visible.clients.length} />
              <HeaderMetric label="Exchanges" value={visible.exchanges.length} />
              <HeaderMetric label="Properties" value={visible.properties.length} />
              <HeaderMetric label="Matches" value={visible.matches.length} />
              <HeaderMetric label="Relationships" value={activeRepresentations} />
              <HeaderMetric label="Open conversations" value={openConnections} />
            </div>
          </div>
        </CardContent>
      </Card>

      {data.warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle>Some account data could not be loaded</AlertTitle>
          <AlertDescription>
            The rest of the account is available. {data.warnings.join(" · ")}
          </AlertDescription>
        </Alert>
      )}

      {!data.profileExists && (
        <Alert className="border-blue-200 bg-blue-50">
          <UserRound className="h-4 w-4 text-blue-700" />
          <AlertTitle>Authentication account exists without an application profile</AlertTitle>
          <AlertDescription>
            This user can still be audited here. They have not completed the profile-creation step, so profile, license, brokerage, and onboarding fields are unavailable.
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={changeTab}
        className="space-y-5"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto min-w-max justify-start bg-muted/70 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients <TabCount value={visible.clients.length} /></TabsTrigger>
            <TabsTrigger value="portfolio">Properties &amp; Exchanges <TabCount value={visible.properties.length + visible.exchanges.length} /></TabsTrigger>
            <TabsTrigger value="matches">Matches <TabCount value={visible.matches.length} /></TabsTrigger>
            <TabsTrigger value="relationships">Relationships <TabCount value={visible.representations.length + visible.contactRequests.length + visible.connectionIntents.length} /></TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview"><OverviewTab data={data} visible={visible} /></TabsContent>
        <TabsContent value="clients"><ClientsTab data={data} clients={visible.clients} exchanges={visible.exchanges} matches={visible.matches} /></TabsContent>
        <TabsContent value="portfolio"><PortfolioTab data={data} exchanges={visible.exchanges} properties={visible.properties} /></TabsContent>
        <TabsContent value="matches"><MatchesTab data={data} matches={visible.matches} /></TabsContent>
        <TabsContent value="relationships"><RelationshipsTab data={data} visible={visible} /></TabsContent>
        <TabsContent value="activity"><ActivityTab data={data} visible={visible} /></TabsContent>
        <TabsContent value="account"><AccountTab data={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ScopeControl({ scope, onChange }: { scope: AdminUserScope; onChange: (scope: AdminUserScope) => void }) {
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5" aria-label="Workspace data scope" title="Filters workspace-linked records. Profile, support, and audit information remain account-wide.">
      {(["all", "live", "demo"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${scope === option ? "bg-slate-900 text-white" : "text-muted-foreground hover:text-foreground"}`}
          aria-pressed={scope === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2.5 text-center">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function TabCount({ value }: { value: number }) {
  return <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">{value}</span>;
}

function OverviewTab({ data, visible }: { data: AdminUser360; visible: AdminUserScopedData }) {
  const recent = useMemo(() => buildActivity(data, visible).slice(0, 8), [data, visible]);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile &amp; contact</CardTitle></CardHeader>
          <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Info label="Full name" value={data.profile.full_name} />
            <Info label="Email" value={data.profile.email} />
            <Info label="Phone" value={data.profile.phone} />
            <Info label="Company" value={data.profile.company} />
            <Info label="Brokerage" value={data.profile.brokerage_name} />
            <Info label="Brokerage address" value={data.profile.brokerage_address} />
            <Info label="License" value={data.profile.license_number ? `${data.profile.license_number}${data.profile.license_state ? ` · ${data.profile.license_state}` : ""}` : null} />
            <Info label="MLS number" value={data.profile.mls_number} />
            <Info label="Service areas" value={data.profile.service_areas?.join(", ")} />
            <Info label="Specializations" value={data.profile.specializations?.join(", ")} />
            <div className="sm:col-span-2"><Info label="Bio" value={data.profile.bio} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Business snapshot</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Snapshot icon={BriefcaseBusiness} label="Years in business" value={data.profile.years_experience == null ? "Not provided" : `${data.profile.years_experience}`} />
            <Snapshot icon={CheckCircle2} label="Completed 1031 exchanges" value={data.profile.completed_1031_exchanges == null ? "Not provided" : `${data.profile.completed_1031_exchanges}`} />
            <Snapshot icon={CircleDollarSign} label="Career transaction volume" value={money(data.profile.career_transaction_volume)} />
            <Snapshot icon={Sparkles} label="Current active matches" value={`${visible.matches.filter((row) => row.status === "active").length}`} />
          </CardContent>
        </Card>

        {data.investorPreferences && (
          <Card>
            <CardHeader><CardTitle className="text-base">Investor preferences</CardTitle></CardHeader>
            <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Info label="Experience" value={pretty(data.investorPreferences.experience_level)} />
              <Info label="Budget" value={`${money(data.investorPreferences.budget_min)} to ${money(data.investorPreferences.budget_max)}`} />
              <Info label="Preferred states" value={data.investorPreferences.preferred_states.join(", ")} />
              <Info label="Preferred assets" value={data.investorPreferences.preferred_asset_types.map(pretty).join(", ")} />
              <Info label="Strategies" value={data.investorPreferences.investment_strategies.map(pretty).join(", ")} />
              <Info label="Notes" value={data.investorPreferences.notes} />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Relationship summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Agent-managed clients" value={visible.clients.filter((row) => row.relationships.includes("managing_agent")).length} />
            <SummaryRow label="Linked client profiles" value={visible.clients.filter((row) => row.relationships.includes("linked_client_account")).length} />
            <SummaryRow label="Active representations" value={visible.representations.filter((row) => row.status === "active").length} />
            <SummaryRow label="Exchange assignments" value={visible.assignments.filter((row) => row.status === "active").length} />
            <SummaryRow label="Open contact requests" value={visible.contactRequests.filter((row) => !["contacted", "declined", "cancelled"].includes(row.status)).length} />
            <SummaryRow label="Awaiting-representation intents" value={visible.connectionIntents.filter((row) => row.status === "awaiting_representation").length} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recent.length ? <ActivityList items={recent} /> : <p className="py-4 text-center text-sm text-muted-foreground">No recent activity.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientsTab({ data, clients, exchanges: scopedExchanges, matches: scopedMatches }: {
  data: AdminUser360;
  clients: AdminUser360["clients"];
  exchanges: AdminUserExchange[];
  matches: AdminUserMatch[];
}) {
  if (!clients.length) return <EmptyState icon={Users} title="No client records in this scope" detail="This account is not connected to any agent CRM client records here." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {clients.map((client) => {
        const linked = client.client_user_id ? data.profilesById[client.client_user_id] : null;
        const manager = data.profilesById[client.agent_id];
        const exchanges = scopedExchanges.filter((exchange) => exchange.client_id === client.id);
        const propertyIds = new Set(exchanges.map((exchange) => exchange.relinquished_property_id).filter(Boolean));
        const matches = scopedMatches.filter((match) => exchanges.some((exchange) => exchange.id === match.buyer_exchange_id));
        return (
          <Card key={client.id} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{client.client_name}</h3>
                  <p className="text-sm text-muted-foreground">{client.client_company || "No company provided"}</p>
                </div>
                <StatusBadge status={client.status} />
              </div>
              <div className="mt-3"><RelationshipBadges relationships={client.relationships} /></div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <ContactLine icon={Mail} value={client.client_email} />
                <ContactLine icon={Phone} value={client.client_phone} />
                <ContactLine icon={ShieldCheck} value={manager ? `Managed by ${manager.full_name || manager.email}` : "Managing agent unavailable"} />
                <ContactLine icon={Link2} value={linked ? `Linked to ${linked.full_name || linked.email}` : "No linked platform account"} />
              </div>
              {client.notes && <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{client.notes}</p>}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                <MiniMetric label="Exchanges" value={exchanges.length} />
                <MiniMetric label="Properties" value={propertyIds.size} />
                <MiniMetric label="Matches" value={matches.length} />
              </div>
              {linked && linked.id !== data.profile.id && (
                <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={`/admin/users/${linked.id}`}>Open linked user account <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PortfolioTab({ data, exchanges, properties }: { data: AdminUser360; exchanges: AdminUserExchange[]; properties: AdminUserProperty[] }) {
  if (!exchanges.length && !properties.length) return <EmptyState icon={Building2} title="No properties or exchanges in this scope" detail="Owned, managed, linked-client, and assigned records will appear here." />;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Exchanges</h2><p className="text-sm text-muted-foreground">Every owned, managed, linked-client, or assigned exchange.</p></div>
        <Badge variant="secondary">{exchanges.length}</Badge>
      </div>
      {exchanges.length ? <div className="space-y-4">{exchanges.map((exchange) => <ExchangeCard key={exchange.id} data={data} exchange={exchange} />)}</div> : <EmptyState icon={Home} title="No exchanges" detail="No exchange is related to this account in the selected scope." />}

      <Separator />
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Properties</h2><p className="text-sm text-muted-foreground">Listing facts, financials, photos, documents, and relationship context.</p></div>
        <Badge variant="secondary">{properties.length}</Badge>
      </div>
      {properties.length ? <div className="grid gap-4 xl:grid-cols-2">{properties.map((property) => <PropertyCard key={property.id} data={data} property={property} />)}</div> : <EmptyState icon={Building2} title="No properties" detail="No property is related to this account in the selected scope." />}
    </div>
  );
}

function ExchangeCard({ data, exchange }: { data: AdminUser360; exchange: AdminUserExchange }) {
  const client = exchange.client_id ? data.clientsById[exchange.client_id] : null;
  const property = exchange.relinquished_property_id ? data.propertiesById[exchange.relinquished_property_id] : null;
  const financials = property ? data.financialsByProperty[property.id] : null;
  const criteria = data.criteriaByExchange[exchange.id];
  const matchCount = data.matches.filter((match) => match.buyer_exchange_id === exchange.id).length;
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{property ? resolveListingName(property, true) : client?.client_name || "Exchange without a linked property"}</h3>
              <StatusBadge status={exchange.status} />
              {exchange.is_demo && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Demo</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {exchangeOwnerTypeLabel(exchange.owner_type)} · {client?.client_name || (exchange.owner_type === "investor" ? "Self-managed" : "No client linked")}
            </p>
            <div className="mt-3"><RelationshipBadges relationships={exchange.relationships} /></div>
          </div>
          <Button asChild size="sm" variant="outline"><Link to={`/admin/deals/exchanges/${exchange.id}`}>Open exchange <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DataTile label="Estimated equity" value={money(exchange.estimated_equity)} />
          <DataTile label="Exchange proceeds" value={money(exchange.exchange_proceeds)} />
          <DataTile label="Loan balance" value={money(financials?.loan_balance)} />
          <DataTile label="Related matches" value={`${matchCount}`} />
          <DataTile label="Identification deadline" value={date(exchange.identification_deadline)} />
          <DataTile label="Closing deadline" value={date(exchange.closing_deadline)} />
          <DataTile label="Additional cash" value={money(criteria?.additional_cash_available)} />
          <DataTile label="Maximum LTV" value={criteria?.max_ltv == null ? "Platform default" : percent(criteria.max_ltv, 100)} />
        </div>
        {criteria && (
          <div className="mt-4 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Optional criteria:</span>{" "}
            {criteria.target_states.length ? `States ${criteria.target_states.join(", ")}. ` : ""}
            {criteria.target_asset_types.length ? `Assets ${criteria.target_asset_types.map(pretty).join(", ")}. ` : ""}
            {criteria.min_projected_roe != null ? `Minimum ROE ${percent(criteria.min_projected_roe)}. ` : ""}
            {!criteria.target_states.length && !criteria.target_asset_types.length && criteria.min_projected_roe == null ? "No optional criteria; platform defaults apply." : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropertyCard({ data, property }: { data: AdminUser360; property: AdminUserProperty }) {
  const financials = data.financialsByProperty[property.id];
  const images = data.imagesByProperty[property.id] ?? [];
  const documents = data.documentsByProperty[property.id] ?? [];
  const image = images[0]?.storage_path ? resolvePropertyImageUrl(images[0].storage_path) : null;
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="h-44 sm:h-full sm:min-h-[250px]">
          {image ? <img src={image} alt={resolveListingName(property, true)} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder />}
        </div>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{resolveListingName(property, true)}</h3>
            <StatusBadge status={property.status} />
            {property.is_demo && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Demo</Badge>}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{[property.city, property.state, property.zip].filter(Boolean).join(", ") || "Location not provided"}</p>
          <div className="mt-3"><RelationshipBadges relationships={property.relationships} /></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <DataTile label="Asset" value={pretty(property.asset_type)} compact />
            <DataTile label="Asking price" value={money(financials?.asking_price)} compact />
            <DataTile label="NOI" value={money(financials?.noi)} compact />
            <DataTile label="Cap rate" value={percent(financials?.cap_rate)} compact />
            <DataTile label="Revenue" value={money(financials?.annual_revenue ?? financials?.gross_rent_roll)} compact />
            <DataTile label="Expenses" value={money(financials?.total_operating_expenses ?? financials?.annual_expenses)} compact />
            <DataTile label="Loan balance" value={money(financials?.loan_balance)} compact />
            <DataTile label="Annual debt service" value={money(financials?.annual_debt_service)} compact />
            <DataTile label="Occupancy" value={percent(financials?.occupancy_rate)} compact />
            <DataTile label="Cash on cash" value={percent(financials?.cash_on_cash)} compact />
          </div>
          <div className="mt-4 rounded-lg border bg-muted/15 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Property facts</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <PropertyFact label="Subtype" value={pretty(property.asset_subtype)} />
              <PropertyFact label="Strategy" value={pretty(property.strategy_type)} />
              <PropertyFact label="Units" value={property.units == null ? null : `${property.units}`} />
              <PropertyFact label="Building area" value={property.building_square_footage == null ? null : `${property.building_square_footage.toLocaleString()} sq ft`} />
              <PropertyFact label="Year built" value={property.year_built == null ? null : `${property.year_built}`} />
              <PropertyFact label="Class / condition" value={[property.property_class, property.property_condition].filter(Boolean).map((value) => pretty(value)).join(" · ")} />
              <PropertyFact label="Zoning" value={property.zoning} />
              <PropertyFact label="Buildings / stories" value={property.num_buildings == null && property.num_stories == null ? null : `${property.num_buildings ?? "?"} / ${property.num_stories ?? "?"}`} />
            </dl>
          </div>
          {property.description && <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{property.description}</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />{images.length} photo{images.length === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{documents.length} document{documents.length === 1 ? "" : "s"}</span>
            <span>Address {property.address_is_public ? "public" : "private"}</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function MatchesTab({ data, matches }: { data: AdminUser360; matches: AdminUserMatch[] }) {
  if (!matches.length) return <EmptyState icon={Sparkles} title="No matches in this scope" detail="Buyer-side, listing-side, and historical participant matches all appear here." />;
  return <div className="space-y-4">{matches.map((match) => <MatchCard key={match.id} data={data} match={match} />)}</div>;
}

function MatchCard({ data, match }: { data: AdminUser360; match: AdminUserMatch }) {
  const seller = data.propertiesById[match.seller_property_id];
  const relinquished = data.propertiesById[match.relinquished_property_id];
  const sellerFinancials = seller ? data.financialsByProperty[seller.id] : null;
  const imagePath = seller ? data.imagesByProperty[seller.id]?.[0]?.storage_path : null;
  const workflow = data.workflowStatesByMatch[match.id];
  const request = data.contactRequests.find((row) => row.match_id === match.id);
  const recommendation = data.recommendations.find((row) => row.match_id === match.id);
  const connection = data.connections.find((row) => row.match_id === match.id);
  const eligibilityReasons = stringArray(match.eligibility_reasons);
  return (
    <Card className="overflow-hidden shadow-none">
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="h-48 lg:h-full lg:min-h-[330px]">
          {imagePath ? <img src={resolvePropertyImageUrl(imagePath)} alt={seller ? resolveListingName(seller, true) : "Matched property"} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder />}
        </div>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{seller ? resolveListingName(seller, true) : "Matched property unavailable"}</h3>
                <StatusBadge status={match.status} />
                {workflow && <Badge variant="outline">Workflow: {pretty(workflow.current_stage)}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                From {relinquished ? resolveListingName(relinquished, true) : "current property unavailable"}
              </p>
              <div className="mt-3"><RelationshipBadges relationships={match.relationships} /></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-slate-950 px-3 py-2 text-white">
              <span className="text-2xl font-bold">{Math.round(match.total_score)}</span>
              <span className="text-[10px] uppercase leading-tight text-slate-400">Match<br />score</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DataTile label="Replacement value" value={money(match.replacement_value ?? sellerFinancials?.asking_price)} />
            <DataTile label="Purchasing capacity" value={money(match.estimated_purchasing_capacity)} />
            <DataTile label="Estimated LTV" value={percent(match.estimated_ltv, 100)} />
            <DataTile label="Projected ROE" value={percent(match.candidate_roe, 100)} />
            <DataTile label="Current ROE" value={percent(match.buyer_current_roe, 100)} />
            <DataTile label="ROE improvement" value={match.roe_improvement_pp == null ? "Not provided" : `${match.roe_improvement_pp.toFixed(2)} pts`} />
            <DataTile label="Value increase" value={money(match.value_increase)} />
            <DataTile label="Classification" value={pretty(match.match_classification)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score breakdown</p>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                <Score label="Financial" value={match.financial_score} />
                <Score label="Price" value={match.price_score} />
                <Score label="Asset" value={match.asset_score} />
                <Score label="Location" value={match.geo_score} />
                <Score label="Debt fit" value={match.debt_fit_score} />
                <Score label="Scale fit" value={match.scale_fit_score} />
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it qualified</p>
              {eligibilityReasons.length ? (
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  {eligibilityReasons.slice(0, 5).map((reason) => <li key={reason} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />{reason}</li>)}
                </ul>
              ) : <p className="mt-2 text-xs text-muted-foreground">No eligibility explanation was recorded for this legacy match.</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            {request && <Badge variant="outline">Contact request: {pretty(request.status)}</Badge>}
            {recommendation && <Badge variant="outline">Recommendation: {pretty(recommendation.response)}</Badge>}
            {connection && <Button asChild variant="outline" size="sm"><Link to={`/admin/deals/connections/${connection.id}`}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Conversation: {pretty(connection.status)}</Link></Button>}
            <Button asChild variant="outline" size="sm"><Link to={`/admin/deals/exchanges/${match.buyer_exchange_id}`}>Open buyer exchange <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function RelationshipsTab({ data, visible }: { data: AdminUser360; visible: AdminUserScopedData }) {
  const repInviteByRep = new Map<string, AdminUser360["representationInvites"][number]>();
  // The query is newest-first. Keep the first invitation for a representation
  // instead of accidentally replacing it with an older resend/cancelled token.
  visible.representationInvites.forEach((invite) => {
    if (!repInviteByRep.has(invite.representation_id)) repInviteByRep.set(invite.representation_id, invite);
  });
  const connectionMessages = countBy(visible.connectionMessageMetadata, (row) => row.parentId);
  const collaborationMessages = countBy(visible.collaborationMessageMetadata, (row) => row.parentId);
  return (
    <div className="space-y-6">
      <SectionHeading title="Representation relationships" detail="The agents and property owners connected to this account, including invitation and assignment state." count={visible.representations.length} />
      {visible.representations.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.representations.map((representation) => {
            const counterpartId = representation.agent_id === data.profile.id ? representation.investor_id : representation.agent_id;
            const counterpart = counterpartId ? data.profilesById[counterpartId] : null;
            const invite = repInviteByRep.get(representation.id);
            const assignments = visible.assignments.filter((row) => row.representation_id === representation.id);
            return (
              <Card key={representation.id} className="shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar photoUrl={counterpart?.profile_photo_url} name={counterpart?.full_name || counterpart?.email || representation.agent_name || representation.investor_email} className="h-11 w-11" />
                      <div><p className="font-semibold">{counterpart?.full_name || counterpart?.email || representation.agent_name || representation.investor_email}</p><p className="text-xs text-muted-foreground">{representation.agent_id === data.profile.id ? "Represented property owner" : "Representing agent"}</p></div>
                    </div>
                    <StatusBadge status={representation.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Info label="Source" value={pretty(representation.source)} />
                    <Info label="Accepted" value={date(representation.accepted_at)} />
                    <Info label="Default agent" value={representation.is_default ? "Yes" : "No"} />
                    <Info label="Future exchanges" value={representation.assign_future_exchanges ? "Auto-assign" : "Manual"} />
                    <Info label="Assigned exchanges" value={`${assignments.length}`} />
                    <Info label="Invitation" value={invite ? `${pretty(invite.status)} · sent ${invite.send_count}x` : "No invitation record"} />
                  </div>
                  {counterpart && <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={`/admin/users/${counterpart.id}`}>Open counterpart account</Link></Button>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState icon={Handshake} title="No representation relationships" detail="No agent-property owner representation is recorded for this account." />}

      <SectionHeading title="Requests, recommendations &amp; agentless-listing interest" detail="Operational handoffs that determine who can act and who is waiting on representation." count={visible.contactRequests.length + visible.recommendations.length + visible.connectionIntents.length} />
      <div className="grid gap-4 lg:grid-cols-3">
        <RelationshipQueue title="Contact requests" rows={visible.contactRequests.map((row) => ({ id: row.id, title: data.propertiesById[row.property_id] ? resolveListingName(data.propertiesById[row.property_id], true) : "Property request", status: row.status, detail: `Requested ${date(row.requested_at)}` }))} />
        <RelationshipQueue title="Agent recommendations" rows={visible.recommendations.map((row) => ({ id: row.id, title: data.propertiesById[data.matches.find((match) => match.id === row.match_id)?.seller_property_id ?? ""] ? resolveListingName(data.propertiesById[data.matches.find((match) => match.id === row.match_id)!.seller_property_id], true) : "Match recommendation", status: row.response, detail: `Created ${date(row.created_at)}` }))} />
        <RelationshipQueue title="Connection intents" rows={visible.connectionIntents.map((row) => ({ id: row.id, title: data.propertiesById[row.property_id] ? resolveListingName(data.propertiesById[row.property_id], true) : "Agentless listing interest", status: row.status, detail: row.waiting_on_side === "seller" ? "Waiting on listing side" : "Waiting on buyer side" }))} />
      </div>

      <SectionHeading title="Conversation metadata" detail="Conversation counts and participants are visible here. Message contents are intentionally not loaded into the account overview." count={visible.connections.length + visible.collaborationThreads.length} />
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.connections.map((connection) => (
          <Card key={connection.id} className="shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Agent-to-agent conversation</p><p className="mt-1 text-xs text-muted-foreground">{profileName(data, connection.buyer_agent_id)} ↔ {profileName(data, connection.seller_agent_id)}</p></div><StatusBadge status={connection.status} /></div><div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>{connectionMessages[connection.id] ?? 0} messages</span><Button asChild variant="ghost" size="sm" className="h-7"><Link to={`/admin/deals/connections/${connection.id}`}>Open connection</Link></Button></div></CardContent></Card>
        ))}
        {visible.collaborationThreads.map((thread) => (
          <Card key={thread.id} className="shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Property owner-agent collaboration</p><p className="mt-1 text-xs text-muted-foreground">{profileName(data, thread.investor_id)} ↔ {profileName(data, thread.agent_id)}</p></div><Badge variant="outline">Private thread</Badge></div><p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{collaborationMessages[thread.id] ?? 0} messages · last activity {date(thread.updated_at, true)}</p></CardContent></Card>
        ))}
        {!visible.connections.length && !visible.collaborationThreads.length && <div className="lg:col-span-2"><EmptyState icon={MessageSquare} title="No conversations" detail="No agent-to-agent or client-agent conversation is related to this account." /></div>}
      </div>

      {(visible.clientInvites.length > 0 || visible.savedProperties.length > 0 || visible.listingInquiries.length > 0) && (
        <>
          <SectionHeading title="Invitations &amp; investor activity" detail="Client workspace invitations, saved properties, and historical listing inquiries tied to this account." count={visible.clientInvites.length + visible.savedProperties.length + visible.listingInquiries.length} />
          <div className="grid gap-4 lg:grid-cols-3">
            <RelationshipQueue title="Client workspace invitations" rows={visible.clientInvites.map((row) => ({ id: row.id, title: row.email, status: row.status, detail: `Created ${date(row.created_at)} · expires ${date(row.expires_at)}` }))} />
            <RelationshipQueue title="Saved properties" rows={visible.savedProperties.map((row) => ({ id: row.id, title: data.propertiesById[row.property_id] ? resolveListingName(data.propertiesById[row.property_id], true) : "Saved property", status: row.is_demo ? "demo" : "saved", detail: `Saved ${date(row.created_at)}` }))} />
            <RelationshipQueue title="Historical inquiries" rows={visible.listingInquiries.map((row) => ({ id: row.id, title: data.propertiesById[row.property_id] ? resolveListingName(data.propertiesById[row.property_id], true) : "Property inquiry", status: row.status, detail: `Created ${date(row.created_at)}` }))} />
          </div>
        </>
      )}
    </div>
  );
}

function ActivityTab({ data, visible }: { data: AdminUser360; visible: AdminUserScopedData }) {
  const activity = buildActivity(data, visible);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <Card>
        <CardHeader><CardTitle className="text-base">Account &amp; workspace activity</CardTitle></CardHeader>
        <CardContent>{activity.length ? <ActivityList items={activity} /> : <p className="py-10 text-center text-sm text-muted-foreground">No activity is available.</p>}</CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><LifeBuoy className="h-4 w-4" />Support history</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.supportTickets.length ? data.supportTickets.map((ticket) => <div key={ticket.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{ticket.subject}</p><StatusBadge status={ticket.status} /></div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ticket.message}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">{pretty(ticket.category)} · {date(ticket.updated_at, true)}</p><Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs"><Link to={`/admin/support?ticket=${ticket.id}`}>Open ticket</Link></Button></div></div>) : <p className="py-4 text-center text-sm text-muted-foreground">No support tickets.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Onboarding &amp; launchpad</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Launchpad completed" value={data.profile.launchpad_completed_at ? date(data.profile.launchpad_completed_at) : "No"} />
            <SummaryRow label="Matching explained" value={data.profile.launchpad_matching_ack_at ? date(data.profile.launchpad_matching_ack_at) : "No"} />
            <SummaryRow label="Matches explained" value={data.profile.launchpad_matches_ack_at ? date(data.profile.launchpad_matches_ack_at) : "No"} />
            <SummaryRow label="Pipeline explained" value={data.profile.launchpad_pipeline_ack_at ? date(data.profile.launchpad_pipeline_ack_at) : "No"} />
            <SummaryRow label="Client requests explained" value={data.profile.launchpad_client_requests_ack_at ? date(data.profile.launchpad_client_requests_ack_at) : "No"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccountTab({ data }: { data: AdminUser360 }) {
  const accountStatus = data.accountState?.account_status ?? (data.profile.verification_status === "suspended" ? "suspended" : "active");
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Authentication &amp; account state</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Info label="User ID" value={data.profile.id} mono />
          <Info label="Application profile" value={data.profileExists ? "Created" : "Not created"} />
          <Info label="Account status" value={pretty(accountStatus)} />
          <Info label="Verification status" value={pretty(data.profile.verification_status)} />
          <Info label="Verified at" value={date(data.profile.verified_at, true)} />
          <Info label="Verified by" value={data.profile.verified_by} mono />
          <Info label="Auth account created" value={date(data.authAccount?.created_at ?? data.profile.created_at, true)} />
          <Info label="Last sign-in" value={date(data.authAccount?.last_sign_in_at, true)} />
          <Info label="Email confirmed" value={date(data.authAccount?.email_confirmed_at, true)} />
          <Info label="Phone confirmed" value={date(data.authAccount?.phone_confirmed_at, true)} />
          <Info label="Banned until" value={date(data.authAccount?.banned_until, true)} />
          <Info label="Auth account deleted" value={date(data.authAccount?.deleted_at, true)} />
          {data.profileExists && <Info label="Last profile update" value={date(data.profile.updated_at, true)} />}
          {data.accountState?.suspended_at && <Info label="Suspended at" value={date(data.accountState.suspended_at, true)} />}
          {data.accountState?.suspension_reason && <Info label="Suspension reason" value={data.accountState.suspension_reason} />}
          {data.accountState?.reactivated_at && <Info label="Last reactivated" value={date(data.accountState.reactivated_at, true)} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Roles &amp; administrative safety</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">{data.roles.map((role) => <Badge key={role} variant="outline" className={roleClass[role] ?? ""}>{adminRoleLabel(role)}</Badge>)}</div>
          <Alert className="mt-5 border-blue-200 bg-blue-50">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <AlertTitle>Protected account controls</AlertTitle>
            <AlertDescription>
              Role and access changes use guarded server actions so the last administrator cannot be removed and every change is written to the audit log atomically. Account controls remain in the user directory while the current backend migration is applied.
            </AlertDescription>
          </Alert>
          <div className="mt-5 rounded-lg border p-4">
            <p className="text-sm font-medium">Admin audit records involving this account</p>
            <p className="mt-1 text-3xl font-bold">{data.auditLog.length}</p>
            <p className="text-xs text-muted-foreground">Includes actions performed by this user and admin actions performed on this user.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 break-words text-sm ${mono ? "font-mono text-xs" : ""}`}>{value?.trim() || "Not provided"}</p></div>;
}

function Snapshot({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="rounded-lg border p-4"><div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>;
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-semibold">{value}</span></div>;
}

function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string | null | undefined }) {
  return <div className="flex min-w-0 items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{value || "Not provided"}</span></div>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}

function PropertyFact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-foreground">{value?.trim() || "Not provided"}</dd>
    </div>
  );
}

function DataTile({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={`rounded-lg border bg-muted/15 ${compact ? "p-2.5" : "p-3"}`}><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`${compact ? "mt-1 text-xs" : "mt-1.5 text-sm"} font-semibold`}>{value}</p></div>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{Math.round(value)}</span></div>;
}

function SectionHeading({ title, detail, count }: { title: string; detail: string; count: number }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div><Badge variant="secondary">{count}</Badge></div>;
}

function RelationshipQueue({ title, rows }: { title: string; rows: Array<{ id: string; title: string; status: string; detail: string }> }) {
  return (
    <Card className="shadow-none"><CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{row.title}</p><StatusBadge status={row.status} /></div><p className="mt-1 text-xs text-muted-foreground">{row.detail}</p></div>) : <p className="py-4 text-center text-sm text-muted-foreground">None</p>}</CardContent></Card>
  );
}

type ActivityItem = { id: string; title: string; detail: string; timestamp: string; icon: typeof Activity };

function buildActivity(data: AdminUser360, visible: AdminUserScopedData): ActivityItem[] {
  const items: ActivityItem[] = [
    ...visible.timeline.map((row) => ({ id: `timeline-${row.id}`, title: row.description, detail: `Exchange · ${pretty(row.event_type)}`, timestamp: row.created_at, icon: ArrowRight })),
    ...data.notifications.map((row) => ({ id: `notification-${row.id}`, title: row.title, detail: `Notification · ${row.read ? "Read" : "Unread"}`, timestamp: row.created_at, icon: BadgeCheck })),
    ...data.supportTickets.map((row) => ({ id: `ticket-${row.id}`, title: row.subject, detail: `Support · ${pretty(row.status)}`, timestamp: row.updated_at, icon: LifeBuoy })),
    ...data.auditLog.map((row) => ({ id: `audit-${row.id}`, title: row.summary || pretty(row.action), detail: `Admin audit · ${pretty(row.action)}`, timestamp: row.created_at, icon: ShieldCheck })),
    ...visible.workflowEvents.map((row) => ({ id: `workflow-${row.id}`, title: `Match moved to ${pretty(row.to_stage)}`, detail: `Workflow · ${pretty(row.source)}`, timestamp: row.created_at, icon: Sparkles })),
  ];
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  return <div className="divide-y">{items.map((item) => <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><div className="mt-0.5 rounded-full bg-muted p-2"><item.icon className="h-3.5 w-3.5 text-muted-foreground" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p></div><span className="shrink-0 text-[11px] text-muted-foreground">{date(item.timestamp, true)}</span></div>)}</div>;
}

function profileName(data: AdminUser360, profileId: string) {
  const profile = data.profilesById[profileId];
  return profile?.full_name || profile?.email || "Unknown user";
}

function countBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const key = getKey(row);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function UserDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-full max-w-4xl" />
      <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-[420px]" /><Skeleton className="h-[420px]" /></div>
    </div>
  );
}

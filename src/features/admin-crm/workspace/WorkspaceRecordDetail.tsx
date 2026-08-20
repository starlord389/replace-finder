import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Home,
  ImageIcon,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { resolveListingName } from "@/lib/listingDisplay";
import type { Tables } from "@/integrations/supabase/types";
import CrmAccountControls from "../components/CrmAccountControls";
import { AccountStatusBadge, RoleBadge } from "../components/CrmPrimitives";
import type { CrmUserWorkspace, CrmUserWorkspaceView } from "../data/useCrmUserWorkspace";
import { formatCurrency, formatDate, sentence } from "../lib/crmFormat";
import type {
  AdminWorkspaceGraph,
  WorkspaceClientBranch,
  WorkspacePropertyBranch,
  WorkspaceSelection,
} from "./workspaceGraph";

type Props = {
  data: CrmUserWorkspace;
  view: CrmUserWorkspaceView;
  graph: AdminWorkspaceGraph;
  selection: WorkspaceSelection;
  onSelect: (selection: WorkspaceSelection) => void;
  onRefetch: () => Promise<unknown>;
};

export default function WorkspaceRecordDetail(props: Props) {
  const { graph, selection } = props;
  if (selection.type === "client" && selection.id && graph.clientById[selection.id]) {
    return <ClientRecord {...props} branch={graph.clientById[selection.id]} />;
  }
  if (selection.type === "property" && selection.id && graph.propertyById[selection.id]) {
    return <PropertyRecord {...props} branch={graph.propertyById[selection.id]} />;
  }
  if (selection.type === "match" && selection.id && graph.matchById[selection.id]) {
    return <MatchRecord {...props} match={graph.matchById[selection.id]} />;
  }
  if (selection.type === "exchange" && selection.id && graph.exchangeById[selection.id]) {
    return <ExchangeRecord {...props} exchange={graph.exchangeById[selection.id]} />;
  }
  if (selection.type === "activity") return <ActivityRecord {...props} />;
  if (selection.type === "access") return <AccessRecord {...props} />;
  return <AccountRecord {...props} />;
}

function AccountRecord({ data, view, graph, onSelect }: Props) {
  const name = data.profile.full_name || data.profile.email || "Unnamed user";
  const status = data.accountState?.account_status
    ?? (data.authAccount?.deleted_at ? "deleted" : data.profile.verification_status === "suspended" ? "suspended" : "active");
  const managedPropertyCount = graph.clients.reduce((sum, client) => sum + client.properties.length, 0);
  const isAgent = data.roles.includes("agent");
  const activeAgentRelationships = view.representations.filter((item) => item.status === "active").length;
  const recentActivity = buildEvents(data, view).slice(0, 7);
  return (
    <div>
      <RecordHeader
        eyebrow="Account workspace"
        title={name}
        description={data.profile.profile_headline || data.profile.brokerage_name || data.profile.company || "Complete relationship and deal record"}
        actions={<div className="flex flex-wrap gap-2">{data.roles.map((role) => <RoleBadge key={role} role={role} />)}<AccountStatusBadge status={status} /></div>}
      />

      <div className="grid gap-5 p-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {isAgent ? <>
              <Kpi label="Clients" value={graph.clients.length} detail="Managed or linked" icon={Users} />
              <Kpi label="Client properties" value={managedPropertyCount} detail="Nested under clients" icon={Home} />
              <Kpi label="Other inventory" value={graph.directProperties.length} detail="Owned or represented" icon={Building2} />
            </> : <>
              <Kpi label="Agent relationships" value={activeAgentRelationships} detail="Active representation" icon={Users} />
              <Kpi label="Owned properties" value={graph.directProperties.length} detail="Current property records" icon={Home} />
              <Kpi label="Exchanges" value={view.exchanges.length} detail="Owner workspaces" icon={Building2} />
            </>}
            <Kpi label="Matches" value={Object.keys(graph.matchById).length} detail="Across this workspace" icon={Sparkles} />
          </section>

          {(isAgent || graph.clients.length > 0) && <Panel title={isAgent ? "Client portfolio" : "Agent-managed workspaces"} detail={isAgent ? "Every client stays connected to their properties, exchanges, and matches." : "Property records managed through an agent relationship."}>
            {graph.clients.length ? (
              <div className="divide-y divide-slate-100">
                {graph.clients.map((branch) => (
                  <button key={branch.client.id} type="button" onClick={() => onSelect({ type: "client", id: branch.client.id })} className="group flex w-full items-center gap-4 py-4 text-left first:pt-0 last:pb-0">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">{initials(branch.client.client_name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{branch.client.client_name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{branch.client.client_email || branch.client.client_company || "No contact details"}</span>
                    </span>
                    <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{branch.properties.length}</span><span className="block text-[10px] uppercase tracking-wide text-slate-400">Properties</span></span>
                    <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{branch.properties.reduce((sum, item) => sum + item.matches.length, 0)}</span><span className="block text-[10px] uppercase tracking-wide text-slate-400">Matches</span></span>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>
            ) : <EmptyState icon={Users} title="No client records" detail="Client relationships will appear here when they are connected to this account." />}
          </Panel>}

          {graph.directProperties.length > 0 && (
            <Panel title={data.roles.includes("agent") ? "Separate listing inventory" : "Directly owned properties"} detail="Properties related to this account but not nested beneath a managed client.">
              <div className="grid gap-3 md:grid-cols-2">
                {graph.directProperties.map((branch) => <CompactPropertyCard key={branch.property.id} data={data} branch={branch} onClick={() => onSelect({ type: "property", id: branch.property.id })} />)}
              </div>
            </Panel>
          )}
          {!isAgent && view.representations.length > 0 && (
            <Panel title="Agent relationships" detail="Agents connected to this property owner and the current representation status.">
              <div className="divide-y divide-slate-100">
                {view.representations.map((representation) => {
                  const agent = data.profilesById[representation.agent_id];
                  return <div key={representation.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><ProfileAvatar photoUrl={agent?.profile_photo_url} name={agent?.full_name || agent?.email || representation.agent_name} className="h-10 w-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{agent?.full_name || agent?.email || representation.agent_name || "Representing agent"}</p><p className="text-xs text-slate-500">{representation.is_default ? "Preferred agent" : "Representation relationship"}</p></div><Status value={representation.status} />{agent && <Button asChild variant="ghost" size="sm"><Link to={`/admin/users/${agent.id}`}>Open</Link></Button>}</div>;
                })}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Account information" detail="Identity and operating context.">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <ProfileAvatar photoUrl={data.profile.profile_photo_url} name={name} className="h-12 w-12" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{name}</p><p className="truncate text-xs text-slate-500">{data.profile.email || data.authAccount?.email || "No email"}</p></div>
            </div>
            <div className="mt-4 space-y-3">
              <ContactLine icon={Mail} value={data.profile.email || data.authAccount?.email} />
              <ContactLine icon={Phone} value={data.profile.phone || data.authAccount?.phone} />
              <ContactLine icon={Building2} value={data.profile.brokerage_name || data.profile.company} />
              <ContactLine icon={MapPin} value={data.profile.service_areas?.join(", ")} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Fact label="Joined" value={formatDate(data.authAccount?.created_at ?? data.profile.created_at)} />
              <Fact label="Last sign-in" value={formatDate(data.authAccount?.last_sign_in_at, true)} />
              <Fact label="Experience" value={data.profile.years_experience == null ? null : `${data.profile.years_experience} years`} />
              <Fact label="1031 exchanges" value={data.profile.completed_1031_exchanges?.toLocaleString()} />
              <Fact label="License" value={data.profile.license_number} />
              <Fact label="MLS" value={data.profile.mls_number} />
            </div>
          </Panel>
          <Panel title="Recent activity" detail="Newest events across this account.">
            {recentActivity.length ? <EventList events={recentActivity} compact /> : <EmptyState icon={Activity} title="No activity" detail="No account events are available." />}
            {recentActivity.length > 0 && <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onSelect({ type: "activity" })}>View complete activity<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ClientRecord({ data, branch, onSelect }: Props & { branch: WorkspaceClientBranch }) {
  const client = branch.client;
  const matchCount = branch.properties.reduce((sum, property) => sum + property.matches.length, 0);
  return (
    <div>
      <RecordHeader
        eyebrow="Client record"
        title={client.client_name}
        description={client.client_company || "Client relationship, property portfolio, and exchange workspaces"}
        actions={<Status value={client.status} />}
      />
      <div className="grid gap-5 p-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Properties" value={branch.properties.length} detail="Current property records" icon={Home} />
            <Kpi label="Active exchanges" value={branch.exchanges.filter((exchange) => !["closed", "cancelled"].includes(exchange.status)).length} detail="In progress" icon={CircleDollarSign} />
            <Kpi label="Matches" value={matchCount} detail="Across client properties" icon={Sparkles} />
          </section>
          <Panel title="Properties and exchanges" detail="Each listing remains attached to this client, with its matches directly underneath.">
            {branch.properties.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {branch.properties.map((property) => (
                  <ClientPropertyCard key={property.property.id} data={data} branch={property} onSelect={onSelect} />
                ))}
              </div>
            ) : <EmptyState icon={Home} title="No properties for this client" detail="No exchange or listing record is connected to this client." />}
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Client information" detail="The contact record used by this agent.">
            <div className="space-y-3"><ContactLine icon={Mail} value={client.client_email} /><ContactLine icon={Phone} value={client.client_phone} /><ContactLine icon={Building2} value={client.client_company} /></div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4"><Fact label="Created" value={formatDate(client.created_at)} /><Fact label="Updated" value={formatDate(client.updated_at, true)} /><Fact label="Platform account" value={client.client_user_id ? "Connected" : "Not connected"} /><Fact label="Platform referral" value={client.referred_by_platform ? "Yes" : "No"} /></div>
          </Panel>
          <Panel title="Internal notes" detail="Agent-entered CRM context.">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{client.notes || "No internal client notes have been added."}</p>
          </Panel>
          {client.client_user_id && data.profilesById[client.client_user_id] && (
            <Button asChild variant="outline" className="w-full"><Link to={`/admin/users/${client.client_user_id}`}>Open connected property-owner account<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyRecord({ data, branch, onSelect }: Props & { branch: WorkspacePropertyBranch }) {
  const property = branch.property;
  const finance = data.financialsByProperty[property.id];
  const images = data.imagesByProperty[property.id] ?? [];
  const documents = data.documentsByProperty[property.id] ?? [];
  const exchange = branch.exchange;
  const criteria = exchange ? data.criteriaByExchange[exchange.id] : null;
  return (
    <div>
      <PropertyGallery property={property} images={images} />
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{resolveListingName(property, true)}</h1><Status value={property.status} />{property.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{[property.city, property.state, property.zip].filter(Boolean).join(", ") || "Location not provided"}</p>
          </div>
          <div className="flex flex-wrap gap-2">{exchange && <Button asChild variant="outline" size="sm"><Link to={`/admin/deals/exchanges/${exchange.id}`}>Open exchange workspace<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          <HeroFact label="Price / value" value={formatCurrency(finance?.asking_price ?? finance?.appraised_value)} />
          <HeroFact label="NOI" value={formatCurrency(finance?.noi)} />
          <HeroFact label="Cap rate" value={percent(finance?.cap_rate)} />
          <HeroFact label="Asset type" value={sentence(property.asset_type)} />
          <HeroFact label="Units" value={property.units?.toLocaleString()} />
          <HeroFact label="Matches" value={branch.matches.length.toLocaleString()} accent />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {branch.matches.length > 0 && (
          <Panel title="Matched replacement properties" detail={`Opportunities calculated for ${resolveListingName(property, true)}. Select a match to see the complete comparison.`}>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {branch.matches.map((match) => {
                const candidate = data.propertiesById[match.seller_property_id];
                if (!candidate) return null;
                const candidateFinance = data.financialsByProperty[candidate.id];
                const candidateImage = data.imagesByProperty[candidate.id]?.[0];
                return (
                  <button key={match.id} type="button" onClick={() => onSelect({ type: "match", id: match.id })} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                    <div className="relative h-36 bg-slate-100">{candidateImage ? <img src={resolvePropertyImageUrl(candidateImage.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}<span className="absolute right-3 top-3 rounded-lg bg-slate-950 px-2.5 py-1.5 text-sm font-semibold text-white shadow">{Math.round(match.total_score)} <span className="text-[9px] font-normal text-slate-300">score</span></span></div>
                    <div className="p-4"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(candidate, true)}</p><p className="mt-1 text-xs text-slate-500">{[candidate.city, candidate.state].filter(Boolean).join(", ")} · {sentence(candidate.asset_type)}</p><div className="mt-4 grid grid-cols-3 gap-3"><Fact label="Price" value={formatCurrency(candidateFinance?.asking_price)} /><Fact label="NOI" value={formatCurrency(candidateFinance?.noi)} /><Fact label="Projected ROE" value={percentRatio(match.candidate_roe)} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><Status value={match.status} /><span className="text-xs font-medium text-emerald-700">Open comparison →</span></div></div>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <div className="space-y-5">
            <Panel title="Property details" detail="Complete listing information entered into ExchangeUp.">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label="Address" value={[property.address, property.unit_suite].filter(Boolean).join(" ")} />
                <Fact label="County" value={property.county} /><Fact label="Subtype" value={property.asset_subtype} />
                <Fact label="Strategy" value={sentence(property.strategy_type)} /><Fact label="Class" value={property.property_class} />
                <Fact label="Condition" value={property.property_condition} /><Fact label="Year built" value={property.year_built?.toString()} />
                <Fact label="Building size" value={property.building_square_footage == null ? null : `${property.building_square_footage.toLocaleString()} sq ft`} />
                <Fact label="Land" value={property.land_area_acres == null ? null : `${property.land_area_acres.toLocaleString()} acres`} />
                <Fact label="Buildings" value={property.num_buildings?.toLocaleString()} /><Fact label="Stories" value={property.num_stories?.toLocaleString()} />
                <Fact label="Parking" value={[property.parking_spaces == null ? null : `${property.parking_spaces} spaces`, property.parking_type].filter(Boolean).join(", ")} />
                <Fact label="Construction" value={property.construction_type} /><Fact label="Roof" value={property.roof_type} />
                <Fact label="HVAC" value={property.hvac_type} /><Fact label="Zoning" value={property.zoning} />
              </dl>
              {property.amenities?.length ? <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Amenities</p><div className="mt-2 flex flex-wrap gap-2">{property.amenities.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></div> : null}
              {(property.description || property.recent_renovations) && <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2"><TextBlock title="Property overview" value={property.description} /><TextBlock title="Recent renovations" value={property.recent_renovations} /></div>}
            </Panel>
            <Panel title="Detailed financials" detail="Operating performance and existing debt attached to this property.">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label="Asking price" value={formatCurrency(finance?.asking_price)} /><Fact label="Appraised value" value={formatCurrency(finance?.appraised_value)} />
                <Fact label="Gross rent roll" value={formatCurrency(finance?.gross_rent_roll)} /><Fact label="Annual revenue" value={formatCurrency(finance?.annual_revenue)} />
                <Fact label="Effective gross income" value={formatCurrency(finance?.effective_gross_income)} /><Fact label="Operating expenses" value={formatCurrency(finance?.total_operating_expenses ?? finance?.annual_expenses)} />
                <Fact label="Net operating income" value={formatCurrency(finance?.noi)} /><Fact label="Occupancy" value={percent(finance?.occupancy_rate)} />
                <Fact label="Vacancy" value={percent(finance?.vacancy_rate)} /><Fact label="Cash on cash" value={percent(finance?.cash_on_cash)} />
                <Fact label="Loan balance" value={formatCurrency(finance?.loan_balance)} /><Fact label="Annual debt service" value={formatCurrency(finance?.annual_debt_service)} />
                <Fact label="Loan rate" value={percent(finance?.loan_rate)} /><Fact label="Loan type" value={finance?.loan_type} /><Fact label="Maturity" value={formatDate(finance?.loan_maturity_date)} />
              </dl>
            </Panel>
          </div>
          <div className="space-y-5">
            {exchange && <Panel title="Exchange context" detail="The workflow this property belongs to."><div className="grid grid-cols-2 gap-4"><Fact label="Status" value={sentence(exchange.status)} /><Fact label="Owner type" value={sentence(exchange.owner_type)} /><Fact label="Estimated equity" value={formatCurrency(exchange.estimated_equity)} /><Fact label="Exchange proceeds" value={formatCurrency(exchange.exchange_proceeds)} /><Fact label="Identification deadline" value={formatDate(exchange.identification_deadline)} /><Fact label="Closing deadline" value={formatDate(exchange.closing_deadline)} /></div><Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => onSelect({ type: "exchange", id: exchange.id })}>View exchange criteria and assignments</Button></Panel>}
            {criteria && <Panel title="Replacement criteria" detail="Optional preferences guiding this property’s search."><div className="grid grid-cols-2 gap-4"><Fact label="Target states" value={criteria.target_states?.join(", ")} /><Fact label="Asset types" value={criteria.target_asset_types?.map(sentence).join(", ")} /><Fact label="Additional cash" value={formatCurrency(criteria.additional_cash_available)} /><Fact label="Maximum LTV" value={percentRatio(criteria.max_ltv)} /><Fact label="Minimum ROE" value={percent(criteria.min_projected_roe)} /><Fact label="Monthly cash flow" value={formatCurrency(criteria.preferred_monthly_cash_flow)} /></div></Panel>}
            <Panel title="Listing assets" detail="Photos and documents attached to this listing."><div className="flex items-center justify-between py-2"><span className="flex items-center gap-2 text-sm text-slate-700"><ImageIcon className="h-4 w-4 text-slate-400" />Property photos</span><strong className="text-sm text-slate-950">{images.length}</strong></div><div className="flex items-center justify-between border-t border-slate-100 py-2"><span className="flex items-center gap-2 text-sm text-slate-700"><FileText className="h-4 w-4 text-slate-400" />Documents</span><strong className="text-sm text-slate-950">{documents.length}</strong></div>{documents.length > 0 && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{documents.map((doc) => <div key={doc.id} className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{doc.file_name || sentence(doc.document_type)}</div>)}</div>}</Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchRecord({ data, graph, match, onSelect }: Props & { match: CrmUserWorkspace["matches"][number] }) {
  const candidate = data.propertiesById[match.seller_property_id];
  const buyerPropertyBranch = Object.values(graph.propertyById).find((branch) => branch.exchange?.id === match.buyer_exchange_id) ?? null;
  const current = match.relinquished_property_id
    ? data.propertiesById[match.relinquished_property_id]
    : buyerPropertyBranch?.property ?? null;
  const candidateFinance = candidate ? data.financialsByProperty[candidate.id] : null;
  const currentFinance = current ? data.financialsByProperty[current.id] : null;
  const images = candidate ? data.imagesByProperty[candidate.id] ?? [] : [];
  const connection = data.connections.find((item) => item.match_id === match.id);
  const workflow = data.workflowStatesByMatch[match.id];
  const currentBranch = current ? graph.propertyById[current.id] ?? buyerPropertyBranch : buyerPropertyBranch;
  return (
    <div>
      {candidate ? <PropertyGallery property={candidate} images={images} compact /> : null}
      <RecordHeader eyebrow="Match record" title={candidate ? resolveListingName(candidate, true) : "Matched property"} description={`Compared with ${current ? resolveListingName(current, true) : "the current property"}`} actions={<div className="flex items-center gap-2"><Status value={match.status} />{workflow && <Badge variant="outline">{sentence(workflow.current_stage)}</Badge>}<div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-white"><strong className="text-xl">{Math.round(match.total_score)}</strong><span className="ml-1 text-[9px] uppercase text-slate-400">score</span></div></div>} />
      <div className="space-y-5 p-5">
        <Panel title="Financial comparison" detail="Current property and matched replacement property side by side.">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(130px,.7fr)_minmax(150px,1fr)_minmax(150px,1fr)] bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><span>Metric</span><span>Current property</span><span className="text-emerald-700">Matched property</span></div>
            <Comparison label="Property value" current={formatCurrency(currentFinance?.asking_price ?? match.relinquished_value)} candidate={formatCurrency(candidateFinance?.asking_price ?? match.replacement_value)} />
            <Comparison label="NOI" current={formatCurrency(currentFinance?.noi)} candidate={formatCurrency(candidateFinance?.noi)} />
            <Comparison label="Cap rate" current={percent(currentFinance?.cap_rate)} candidate={percent(candidateFinance?.cap_rate)} />
            <Comparison label="Return on equity" current={percentRatio(match.buyer_current_roe)} candidate={percentRatio(match.candidate_roe)} highlight />
            <Comparison label="Annual debt service" current={formatCurrency(currentFinance?.annual_debt_service)} candidate={formatCurrency(match.candidate_annual_debt_service)} />
            <Comparison label="Estimated LTV" current="—" candidate={percentRatio(match.estimated_ltv)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="ROE improvement" value={match.roe_improvement_pp == null ? "—" : `${match.roe_improvement_pp.toFixed(2)} pts`} detail="Return improvement" icon={Sparkles} /><Kpi label="Purchasing capacity" value={formatCurrency(match.estimated_purchasing_capacity)} detail="Calculated ceiling" icon={CircleDollarSign} /><Kpi label="Replacement loan" value={formatCurrency(match.estimated_replacement_loan)} detail="Estimated financing" icon={Building2} /><Kpi label="Boot" value={formatCurrency(match.estimated_total_boot)} detail={sentence(match.boot_status)} icon={CheckCircle2} /></div>
        </Panel>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
          <Panel title="Why this matched" detail="The score and eligibility fields saved by the matching engine.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Score label="Financial" value={match.financial_score} /><Score label="Price" value={match.price_score} /><Score label="Location" value={match.geo_score} /><Score label="Asset" value={match.asset_score} /><Score label="Strategy" value={match.strategy_score} /><Score label="Timing" value={match.timing_score} /></div>
            {Array.isArray(match.eligibility_reasons) && match.eligibility_reasons.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Eligibility reasons</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{match.eligibility_reasons.map((reason, index) => <li key={index} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{String(reason)}</li>)}</ul></div>}
          </Panel>
          <Panel title="Deal workflow" detail="Where this match stands and where to continue.">
            <div className="grid grid-cols-2 gap-4"><Fact label="Classification" value={sentence(match.match_classification)} /><Fact label="Workflow stage" value={sentence(workflow?.current_stage)} /><Fact label="Buyer viewed" value={match.buyer_agent_viewed ? "Yes" : "No"} /><Fact label="Listing side viewed" value={match.seller_agent_viewed ? "Yes" : "No"} /><Fact label="Created" value={formatDate(match.created_at, true)} /><Fact label="Updated" value={formatDate(match.updated_at, true)} /></div>
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">{currentBranch && <Button variant="outline" className="w-full" onClick={() => onSelect({ type: "property", id: currentBranch.property.id })}>Return to current property</Button>}<Button asChild variant="outline" className="w-full"><Link to={`/admin/deals/exchanges/${match.buyer_exchange_id}`}>Open buyer exchange<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>{connection && <Button asChild className="w-full"><Link to={`/admin/deals/connections/${connection.id}`}><MessageSquare className="mr-2 h-4 w-4" />Open agent conversation</Link></Button>}</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ExchangeRecord({ data, exchange, graph, onSelect }: Props & { exchange: CrmUserWorkspace["exchanges"][number] }) {
  const client = exchange.client_id ? graph.clientById[exchange.client_id]?.client : null;
  const propertyBranch = Object.values(graph.propertyById).find((branch) => branch.exchange?.id === exchange.id);
  const criteria = data.criteriaByExchange[exchange.id];
  const assignments = data.assignments.filter((item) => item.exchange_id === exchange.id);
  return <div><RecordHeader eyebrow="Exchange workspace" title={propertyBranch ? resolveListingName(propertyBranch.property, true) : client?.client_name || "Exchange record"} description={client ? `Managed for ${client.client_name}` : `${sentence(exchange.owner_type)}-owned exchange`} actions={<Status value={exchange.status} />} /><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"><Kpi label="Estimated equity" value={formatCurrency(exchange.estimated_equity)} detail="Current position" icon={CircleDollarSign} /><Kpi label="Exchange proceeds" value={formatCurrency(exchange.exchange_proceeds)} detail="Estimated proceeds" icon={Building2} /><Kpi label="Matches" value={propertyBranch?.matches.length ?? 0} detail="Current opportunities" icon={Sparkles} /><Kpi label="Assignments" value={assignments.length} detail="Agent relationships" icon={Users} /></section><div className="grid gap-5 2xl:grid-cols-2"><Panel title="Exchange details" detail="Deadlines, tax estimates, and property relationship."><div className="grid grid-cols-2 gap-5"><Fact label="Owner type" value={sentence(exchange.owner_type)} /><Fact label="Client" value={client?.client_name} /><Fact label="Sale close date" value={formatDate(exchange.sale_close_date)} /><Fact label="Identification deadline" value={formatDate(exchange.identification_deadline)} /><Fact label="Closing deadline" value={formatDate(exchange.closing_deadline)} /><Fact label="Actual close" value={formatDate(exchange.actual_close_date)} /><Fact label="Estimated basis" value={formatCurrency(exchange.estimated_basis)} /><Fact label="Estimated gain" value={formatCurrency(exchange.estimated_gain)} /><Fact label="Estimated tax" value={formatCurrency(exchange.estimated_tax_liability)} /></div>{propertyBranch && <Button className="mt-5 w-full" onClick={() => onSelect({ type: "property", id: propertyBranch.property.id })}>Open current property and matches</Button>}</Panel><Panel title="Replacement criteria" detail="Preferences used to focus the automated search."><div className="grid grid-cols-2 gap-5"><Fact label="Target states" value={criteria?.target_states?.join(", ")} /><Fact label="Asset types" value={criteria?.target_asset_types?.map(sentence).join(", ")} /><Fact label="Additional cash" value={formatCurrency(criteria?.additional_cash_available)} /><Fact label="Maximum LTV" value={percentRatio(criteria?.max_ltv)} /><Fact label="Minimum ROE" value={percent(criteria?.min_projected_roe)} /><Fact label="Monthly cash flow" value={formatCurrency(criteria?.preferred_monthly_cash_flow)} /><Fact label="Location required" value={criteria?.require_location_match ? "Yes" : "No"} /><Fact label="Asset type required" value={criteria?.require_asset_type_match ? "Yes" : "No"} /></div></Panel></div><Panel title="Agent assignments" detail="Current and historical representation attached to this exchange.">{assignments.length ? <div className="divide-y divide-slate-100">{assignments.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-900">{data.profilesById[assignment.agent_id]?.full_name || data.profilesById[assignment.agent_id]?.email || "Agent"}</p><p className="text-xs text-slate-500">{assignment.can_manage_exchange ? "Managing assignment" : "Limited assignment"} · assigned {formatDate(assignment.assigned_at, true)}</p></div><Status value={assignment.status} /></div>)}</div> : <EmptyState icon={Users} title="No agent assignments" detail="No assignment history is attached to this exchange." />}</Panel></div></div>;
}

function ActivityRecord({ data, view }: Props) {
  const events = buildEvents(data, view);
  return <div><RecordHeader eyebrow="Account history" title="Activity & support" description="A chronological view of deal, workflow, notification, and support activity." /><div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]"><Panel title="Activity timeline" detail="Newest activity appears first.">{events.length ? <EventList events={events} /> : <EmptyState icon={Activity} title="No activity" detail="No activity is available for this account." />}</Panel><Panel title="Support tickets" detail="Requests opened by this user.">{data.supportTickets.length ? <div className="space-y-3">{data.supportTickets.map((ticket) => <article key={ticket.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{ticket.subject}</p><Status value={ticket.status} /></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{ticket.message}</p><Button asChild variant="ghost" size="sm" className="mt-2 px-0"><Link to={`/admin/support?ticket=${ticket.id}`}>Open ticket<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button></article>)}</div> : <EmptyState icon={LifeBuoy} title="No support tickets" detail="This user has not submitted a ticket." />}</Panel></div></div>;
}

function AccessRecord({ data, onRefetch }: Props) {
  const state = data.accountState?.account_status ?? (data.profile.verification_status === "suspended" ? "suspended" : "active");
  return <div><RecordHeader eyebrow="Administration" title="Audit & access" description="Authentication lifecycle, administrative history, and guarded account controls." /><div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]"><div className="space-y-5"><Panel title="Authentication and account state" detail="Canonical identity and application access."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Fact label="User ID" value={data.profile.id} mono /><Fact label="Profile" value={data.profileExists ? "Created" : "Not created"} /><Fact label="Account status" value={sentence(state)} /><Fact label="Auth created" value={formatDate(data.authAccount?.created_at, true)} /><Fact label="Last sign-in" value={formatDate(data.authAccount?.last_sign_in_at, true)} /><Fact label="Email confirmed" value={formatDate(data.authAccount?.email_confirmed_at, true)} /><Fact label="Phone confirmed" value={formatDate(data.authAccount?.phone_confirmed_at, true)} /><Fact label="Banned until" value={formatDate(data.authAccount?.banned_until, true)} /><Fact label="Deleted" value={formatDate(data.authAccount?.deleted_at, true)} /><Fact label="Suspension reason" value={data.accountState?.suspension_reason} /><Fact label="Last reactivated" value={formatDate(data.accountState?.reactivated_at, true)} /></div></Panel><Panel title="Administrative audit log" detail="Actions performed by or on this account.">{data.auditLog.length ? <div className="divide-y divide-slate-100">{data.auditLog.map((row) => <div key={row.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-900">{row.summary || sentence(row.action)}</p><p className="mt-1 text-xs text-slate-500">{sentence(row.entity_type)} · {sentence(row.action)}</p></div><span className="shrink-0 text-[11px] text-slate-400">{formatDate(row.created_at, true)}</span></div>{row.metadata && Object.keys(row.metadata as object).length > 0 && <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-950 p-3 text-[10px] text-slate-200">{JSON.stringify(row.metadata, null, 2)}</pre>}</div>)}</div> : <EmptyState icon={ShieldCheck} title="No audit records" detail="No administrative activity is recorded." />}</Panel></div><div className="self-start rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-20"><div className="mb-5"><h2 className="font-semibold text-slate-950">Administrative controls</h2><p className="mt-1 text-xs leading-5 text-slate-500">Guarded server actions with atomic audit logging.</p></div><CrmAccountControls data={data} onChanged={onRefetch} /></div></div></div>;
}

function ClientPropertyCard({ data, branch, onSelect }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onSelect: (selection: WorkspaceSelection) => void }) {
  const property = branch.property;
  const finance = data.financialsByProperty[property.id];
  const image = data.imagesByProperty[property.id]?.[0];
  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white"><button type="button" onClick={() => onSelect({ type: "property", id: property.id })} className="group block w-full text-left"><div className="relative h-44 bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}<div className="absolute left-3 top-3 flex gap-2"><Status value={property.status} />{property.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(property, true)}</p><p className="mt-1 truncate text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(", ")} · {sentence(property.asset_type)}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-600" /></div><div className="mt-4 grid grid-cols-3 gap-3"><Fact label="Value" value={formatCurrency(finance?.asking_price ?? finance?.appraised_value)} /><Fact label="NOI" value={formatCurrency(finance?.noi)} /><Fact label="Cap rate" value={percent(finance?.cap_rate)} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{branch.matches.length} {branch.matches.length === 1 ? "match" : "matches"}</span><span className="text-xs font-medium text-emerald-700">View listing record</span></div></div></button></article>;
}

function CompactPropertyCard({ data, branch, onClick }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onClick: () => void }) {
  const finance = data.financialsByProperty[branch.property.id];
  const image = data.imagesByProperty[branch.property.id]?.[0];
  return <button type="button" onClick={onClick} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-300 hover:shadow-sm"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(branch.property, true)}</p><p className="mt-1 text-xs text-slate-500">{formatCurrency(finance?.asking_price ?? finance?.appraised_value)} · {branch.matches.length} matches</p><p className="mt-1 text-[10px] text-slate-400">{sentence(branch.property.asset_type)} · {sentence(branch.property.status)}</p></div><ArrowRight className="h-4 w-4 text-slate-300" /></button>;
}

function PropertyGallery({ property, images, compact = false }: { property: Tables<"pledged_properties">; images: Tables<"property_images">[]; compact?: boolean }) {
  const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return <div className={`relative grid overflow-hidden bg-slate-100 ${compact ? "h-48" : "h-56 sm:h-72"} ${sorted.length > 1 ? "grid-cols-[minmax(0,1.7fr)_minmax(160px,.7fr)] gap-1" : "grid-cols-1"}`}>{sorted[0] ? <img src={resolvePropertyImageUrl(sorted[0].storage_path)} alt={resolveListingName(property, true)} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}{sorted.length > 1 && <div className="hidden grid-rows-2 gap-1 sm:grid">{sorted.slice(1, 3).map((image) => <img key={image.id} src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full min-h-0 w-full object-cover" />)}</div>}<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />{sorted.length > 0 && <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow"><ImageIcon className="mr-1 inline h-3 w-3" />{sorted.length} photos</span>}</div>;
}

function RecordHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) { return <header className="border-b border-slate-200 bg-white px-5 py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p><h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p></div>{actions && <div className="shrink-0">{actions}</div>}</div></header>; }
function Panel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4"><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>{children}</section>; }
function Kpi({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Users }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold text-slate-950">{value}</p></div><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Icon className="h-4 w-4" /></span></div><p className="mt-2 text-[11px] text-slate-500">{detail}</p></div>; }
function HeroFact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className={`rounded-lg border px-3 py-2.5 ${accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 truncate text-sm font-semibold ${accent ? "text-emerald-800" : "text-slate-900"}`}>{value || "—"}</p></div>; }
function Fact({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) { return <div className="min-w-0"><dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className={`mt-1 break-words text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value === null || value === undefined || value === "" ? "—" : value}</dd></div>; }
function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string | null | undefined }) { return <div className="flex items-start gap-2.5 text-sm text-slate-600"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 break-words">{value || "Not provided"}</span></div>; }
function Status({ value }: { value: string }) { const normalized = value.toLowerCase(); const color = ["active", "accepted", "verified", "published", "connected", "completed"].includes(normalized) ? "bg-emerald-100 text-emerald-800" : ["pending", "requested", "draft", "awaiting_representation"].includes(normalized) ? "bg-amber-100 text-amber-800" : ["declined", "cancelled", "suspended", "failed"].includes(normalized) ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"; return <Badge className={`${color} border-0 text-[10px]`}>{sentence(value)}</Badge>; }
function TextBlock({ title, value }: { title: string; value: string | null }) { return <div><h3 className="text-xs font-semibold text-slate-900">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || "Not provided"}</p></div>; }
function Comparison({ label, current, candidate, highlight = false }: { label: string; current: string; candidate: string; highlight?: boolean }) { return <div className="grid grid-cols-[minmax(130px,.7fr)_minmax(150px,1fr)_minmax(150px,1fr)] border-t border-slate-100 px-4 py-3 text-sm"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{current || "—"}</span><span className={`font-semibold ${highlight ? "text-emerald-700" : "text-slate-950"}`}>{candidate || "—"}</span></div>; }
function Score({ label, value }: { label: string; value: number }) { return <div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">{label}</span><strong className="text-slate-900">{Math.round(value)}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>; }
function EmptyState({ icon: Icon, title, detail }: { icon: typeof Users; title: string; detail: string }) { return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center"><Icon className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-800">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{detail}</p></div>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }
function percent(value: number | null | undefined) { return value == null ? "" : `${value.toFixed(2)}%`; }
function percentRatio(value: number | null | undefined) { return value == null ? "" : `${(value * 100).toFixed(2)}%`; }

type EventItem = { id: string; title: string; detail: string; date: string; icon: typeof Activity };
function buildEvents(data: CrmUserWorkspace, view: CrmUserWorkspaceView): EventItem[] { return [...view.timeline.map((item) => ({ id: `timeline-${item.id}`, title: item.description, detail: `Exchange · ${sentence(item.event_type)}`, date: item.created_at, icon: ArrowRight })), ...view.workflowEvents.map((item) => ({ id: `workflow-${item.id}`, title: `Match moved to ${sentence(item.to_stage)}`, detail: `Workflow · ${sentence(item.source)}`, date: item.created_at, icon: Sparkles })), ...data.notifications.map((item) => ({ id: `notification-${item.id}`, title: item.title, detail: `Notification · ${item.read ? "Read" : "Unread"}`, date: item.created_at, icon: CheckCircle2 })), ...data.supportTickets.map((item) => ({ id: `ticket-${item.id}`, title: item.subject, detail: `Support · ${sentence(item.status)}`, date: item.updated_at, icon: LifeBuoy })), ...data.auditLog.map((item) => ({ id: `audit-${item.id}`, title: item.summary || sentence(item.action), detail: `Admin audit · ${sentence(item.action)}`, date: item.created_at, icon: ShieldCheck }))].sort((a, b) => b.date.localeCompare(a.date)); }
function EventList({ events, compact = false }: { events: EventItem[]; compact?: boolean }) { return <div className="divide-y divide-slate-100">{events.map((event) => <div key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><span className="mt-0.5 rounded-full bg-slate-100 p-2"><event.icon className="h-3.5 w-3.5 text-slate-500" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-900">{event.title}</span><span className="mt-0.5 block text-xs text-slate-500">{event.detail}</span></span>{!compact && <span className="shrink-0 text-[11px] text-slate-400">{formatDate(event.date, true)}</span>}</div>)}</div>; }

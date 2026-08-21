import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Handshake, Loader2, TestTube2, UserRoundCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { representationStatusLabel, type Representation } from "@/features/representation/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface E2eCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

type AdminProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "brokerage_name" | "license_state"
>;

interface E2eReport {
  ok: boolean;
  run_id: string;
  checks: E2eCheck[];
  cleanup: {
    passed: boolean;
    users_deleted: number;
    remaining_profiles: number;
    errors: string[];
  };
  error: string | null;
}

export default function AdminRepresentations() {
  const [searchParams] = useSearchParams();
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [agents, setAgents] = useState<AdminProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AdminProfile>>({});
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({});
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [e2eReport, setE2eReport] = useState<E2eReport | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: reps }, { data: roles }] = await Promise.all([
      supabase.from("agent_representations").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "agent"),
    ]);
    const representationRows = (reps ?? []) as unknown as Representation[];
    const userIds = [...new Set([...representationRows.flatMap((rep) => [rep.investor_id, rep.agent_id]), ...(roles ?? []).map((role) => role.user_id)].filter(Boolean))] as string[];
    const { data: profileRows } = userIds.length ? await supabase.from("profiles").select("id, full_name, email, brokerage_name, license_state").in("id", userIds) : { data: [] as AdminProfile[] };
    const profileMap = Object.fromEntries((profileRows ?? []).map((profile) => [profile.id, profile]));
    setProfiles(profileMap);
    setRepresentations(representationRows);
    setAgents((roles ?? []).map((role) => profileMap[role.user_id]).filter(Boolean));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setSearch(searchParams.get("q") ?? ""); }, [searchParams]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return representations;
    return representations.filter((rep) => [rep.investor_email, rep.agent_email, profiles[rep.investor_id ?? ""]?.full_name, profiles[rep.agent_id ?? ""]?.full_name, rep.status].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [representations, profiles, search]);

  async function assign(rep: Representation) {
    const agentId = selectedAgents[rep.id];
    if (!agentId) return toast.error("Choose an agent.");
    setBusy(rep.id);
    const { error } = await supabase.rpc("admin_assign_representation", {
      p_representation_id: rep.id,
      p_agent_id: agentId,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Referral sent to the selected agent.");
    await load();
  }

  async function runE2eDiagnostic() {
    if (!confirm("Run the isolated representation test? Five temporary test accounts will be created and automatically deleted when the test finishes.")) return;
    setBusy("representation-e2e");
    setE2eReport(null);
    const { data, error } = await supabase.functions.invoke<E2eReport>("run-representation-e2e", { body: {} });
    setBusy(null);
    if (error) {
      toast.error(error.message || "The representation diagnostic could not run.");
      return;
    }
    setE2eReport(data);
    if (data.ok) toast.success("Multi-account representation test passed and all fixtures were removed.");
    else toast.error(data.error || "One or more representation checks failed.");
  }

  const awaiting = representations.filter((rep) => rep.status === "awaiting_agent").length;
  const active = representations.filter((rep) => rep.status === "active").length;
  const attention = representations.filter((rep) => ["pending_verification", "awaiting_investor_confirmation"].includes(rep.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">Representation Requests</h1><p className="mt-1 text-sm text-muted-foreground">Work the queue of property owners who need an agent, monitor invitations, and resolve assignment issues.</p></div><Button variant="outline" onClick={runE2eDiagnostic} disabled={busy === "representation-e2e"}>{busy === "representation-e2e" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}{busy === "representation-e2e" ? "Running isolated test…" : "Run multi-account test"}</Button></div>
      {e2eReport && <Card className={e2eReport.ok ? "border-emerald-500/40" : "border-destructive/40"}><CardHeader><CardTitle className="flex items-center gap-2 text-base">{e2eReport.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-destructive" />}{e2eReport.ok ? "Multi-account test passed" : "Multi-account test needs attention"}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 sm:grid-cols-2">{e2eReport.checks.map((check) => <div key={check.name} className="flex items-start gap-2 rounded-md border p-3 text-sm">{check.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}<div><p className="font-medium">{check.name}</p>{check.detail && <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>}</div></div>)}</div><p className="text-xs text-muted-foreground">Cleanup: {e2eReport.cleanup.passed ? `passed · ${e2eReport.cleanup.users_deleted} temporary accounts deleted` : `needs attention · ${e2eReport.cleanup.errors.join("; ")}`}</p><p className="text-[11px] text-muted-foreground">Run ID: {e2eReport.run_id}</p></CardContent></Card>}
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Needs assignment</p><p className="mt-1 text-2xl font-bold">{awaiting}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-bold">{attention}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Active</p><p className="mt-1 text-2xl font-bold">{active}</p></CardContent></Card></div>
      <Input className="max-w-sm" placeholder="Search investor, agent, or status…" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="space-y-3">
        {!loading && filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-14 text-center"><Handshake className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-semibold">No representation records</p></CardContent></Card>}
        {filtered.map((rep) => {
          const investor = profiles[rep.investor_id ?? ""];
          const agent = profiles[rep.agent_id ?? ""];
          const context = rep.request_context ?? {};
          const contextSummary = [context.location, context.property_type, context.timing].filter(Boolean).join(" · ");
          return <Card key={rep.id}><CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2">{rep.investor_id ? <Link to={`/admin/users/${rep.investor_id}`} className="font-semibold hover:text-primary hover:underline">{investor?.full_name || rep.investor_email}</Link> : <p className="font-semibold">{investor?.full_name || rep.investor_email}</p>}<Badge variant={rep.status === "active" ? "default" : rep.status === "awaiting_agent" ? "destructive" : "secondary"}>{representationStatusLabel[rep.status]}</Badge>{rep.is_demo && <Badge variant="outline">Demo</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{agent ? <>Agent: <Link to={`/admin/users/${agent.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{agent.full_name || agent.email}</Link></> : "No agent assigned"} · {rep.source.replace(/_/g, " ")}</p>{contextSummary && <p className="mt-2 text-sm">{contextSummary}</p>}{context.notes && <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{context.notes}</p>}<p className="mt-1 text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(rep.created_at), { addSuffix: true })}</p></div>{rep.status === "awaiting_agent" && <div className="flex min-w-[320px] gap-2"><select className="h-9 flex-1 rounded-md border bg-background px-3 text-sm" value={selectedAgents[rep.id] ?? ""} onChange={(event) => setSelectedAgents((current) => ({ ...current, [rep.id]: event.target.value }))}><option value="">Select agent…</option>{agents.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name || candidate.email}{candidate.license_state ? ` · ${candidate.license_state}` : ""}</option>)}</select><Button size="sm" onClick={() => assign(rep)} disabled={busy === rep.id}><UserRoundCheck className="mr-1.5 h-4 w-4" />Assign</Button></div>}</CardContent></Card>;
        })}
      </div>
    </div>
  );
}

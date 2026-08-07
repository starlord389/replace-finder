import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Handshake, ShieldAlert, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { representationStatusLabel, type Representation } from "@/features/representation/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function AdminRepresentations() {
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: reps }, { data: roles }] = await Promise.all([
      (supabase.from("agent_representations" as any).select("*").order("created_at", { ascending: false }) as any),
      supabase.from("user_roles").select("user_id").eq("role", "agent"),
    ]);
    const userIds = [...new Set([...(reps ?? []).flatMap((rep: any) => [rep.investor_id, rep.agent_id]), ...(roles ?? []).map((role) => role.user_id)].filter(Boolean))] as string[];
    const { data: profileRows } = userIds.length ? await supabase.from("profiles").select("id, full_name, email, brokerage_name, license_state, verification_status").in("id", userIds) : { data: [] as any[] };
    const profileMap = Object.fromEntries((profileRows ?? []).map((profile) => [profile.id, profile]));
    setProfiles(profileMap);
    setRepresentations((reps ?? []) as Representation[]);
    setAgents((roles ?? []).map((role) => profileMap[role.user_id]).filter((profile) => profile?.verification_status === "verified"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return representations;
    return representations.filter((rep) => [rep.investor_email, rep.agent_email, profiles[rep.investor_id ?? ""]?.full_name, profiles[rep.agent_id ?? ""]?.full_name, rep.status].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [representations, profiles, search]);

  async function assign(rep: Representation) {
    const agentId = selectedAgents[rep.id];
    if (!agentId) return toast.error("Choose a verified agent.");
    setBusy(rep.id);
    const { error } = await supabase.rpc("admin_assign_representation" as any, {
      p_representation_id: rep.id,
      p_agent_id: agentId,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Referral sent to the selected agent.");
    await load();
  }

  const awaiting = representations.filter((rep) => rep.status === "awaiting_agent").length;
  const active = representations.filter((rep) => rep.status === "active").length;
  const attention = representations.filter((rep) => ["pending_verification", "awaiting_investor_confirmation"].includes(rep.status)).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Representation Operations</h1><p className="mt-1 text-sm text-muted-foreground">Assign referrals, monitor invitations, and resolve investor-agent access issues.</p></div>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Needs assignment</p><p className="mt-1 text-2xl font-bold">{awaiting}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-bold">{attention}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Active</p><p className="mt-1 text-2xl font-bold">{active}</p></CardContent></Card></div>
      <Input className="max-w-sm" placeholder="Search investor, agent, or status…" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="space-y-3">
        {!loading && filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-14 text-center"><Handshake className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-semibold">No representation records</p></CardContent></Card>}
        {filtered.map((rep) => {
          const investor = profiles[rep.investor_id ?? ""];
          const agent = profiles[rep.agent_id ?? ""];
          const context = rep.request_context ?? {};
          const contextSummary = [context.location, context.property_type, context.timing].filter(Boolean).join(" · ");
          return <Card key={rep.id}><CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{investor?.full_name || rep.investor_email}</p><Badge variant={rep.status === "active" ? "default" : rep.status === "awaiting_agent" ? "destructive" : "secondary"}>{representationStatusLabel[rep.status]}</Badge>{rep.is_demo && <Badge variant="outline">Demo</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{agent ? `Agent: ${agent.full_name || agent.email}` : "No agent assigned"} · {rep.source.replaceAll("_", " ")}</p>{contextSummary && <p className="mt-2 text-sm">{contextSummary}</p>}{context.notes && <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{context.notes}</p>}<p className="mt-1 text-xs text-muted-foreground">Created {formatDistanceToNow(new Date(rep.created_at), { addSuffix: true })}</p></div>{rep.status === "awaiting_agent" && <div className="flex min-w-[320px] gap-2"><select className="h-9 flex-1 rounded-md border bg-background px-3 text-sm" value={selectedAgents[rep.id] ?? ""} onChange={(event) => setSelectedAgents((current) => ({ ...current, [rep.id]: event.target.value }))}><option value="">Select verified agent…</option>{agents.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name || candidate.email}{candidate.license_state ? ` · ${candidate.license_state}` : ""}</option>)}</select><Button size="sm" onClick={() => assign(rep)} disabled={busy === rep.id}><UserRoundCheck className="mr-1.5 h-4 w-4" />Assign</Button></div>}{rep.status === "pending_verification" && <div className="flex items-center gap-2 text-sm text-amber-700"><ShieldAlert className="h-4 w-4" />Agent verification required</div>}</CardContent></Card>;
        })}
      </div>
    </div>
  );
}

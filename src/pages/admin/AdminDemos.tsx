import { useEffect, useMemo, useState, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, ChevronDown, ChevronUp, Search, CalendarClock, Save, ExternalLink } from "lucide-react";

type Demo = Tables<"demo_requests">;

const STATUS_OPTIONS = ["new", "contacted", "qualified", "unqualified", "closed"];
const statusColor: Record<string, string> = {
  new: "bg-[#e8eef0] text-[#2d3d42] border-[#c9d4d9]",
  contacted: "bg-amber-100 text-amber-800 border-amber-200",
  qualified: "bg-green-100 text-green-800 border-green-200",
  unqualified: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function fromLocalInput(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

type Draft = { scheduled_at: string; meeting_link: string; internal_notes: string };

export default function AdminDemos() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDemos();
  }, []);

  async function loadDemos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load demos.", description: error.message, variant: "destructive" });
      setDemos([]);
    } else {
      setDemos(data ?? []);
    }
    setLoading(false);
  }

  function openRow(d: Demo) {
    const isOpen = expandedId === d.id;
    setExpandedId(isOpen ? null : d.id);
    if (!isOpen) {
      setDrafts((p) => ({
        ...p,
        [d.id]: {
          scheduled_at: toLocalInput(d.scheduled_at),
          meeting_link: d.meeting_link ?? "",
          internal_notes: d.internal_notes ?? "",
        },
      }));
    }
  }

  async function updateStatus(id: string, status: string) {
    setBusy((b) => ({ ...b, [`s-${id}`]: true }));
    const { error } = await supabase.from("demo_requests").update({ status }).eq("id", id);
    setBusy((b) => ({ ...b, [`s-${id}`]: false }));
    if (error) return toast({ title: "Failed to update status.", description: error.message, variant: "destructive" });
    setDemos((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    toast({ title: "Status updated." });
  }

  async function saveDetails(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setBusy((b) => ({ ...b, [`d-${id}`]: true }));
    const patch = {
      scheduled_at: fromLocalInput(draft.scheduled_at),
      meeting_link: draft.meeting_link.trim() || null,
      internal_notes: draft.internal_notes.trim() || null,
    };
    const { error } = await supabase.from("demo_requests").update(patch).eq("id", id);
    setBusy((b) => ({ ...b, [`d-${id}`]: false }));
    if (error) return toast({ title: "Failed to save.", description: error.message, variant: "destructive" });
    setDemos((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    toast({ title: "Demo updated." });
  }

  const upcoming = useMemo(() => {
    const now = Date.now();
    return demos
      .filter((d) => d.scheduled_at && new Date(d.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  }, [demos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return demos.filter((d) => {
      const matchesSearch =
        !term ||
        d.full_name.toLowerCase().includes(term) ||
        d.work_email.toLowerCase().includes(term) ||
        d.company.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [demos, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Demos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {demos.length} total request{demos.length !== 1 ? "s" : ""} · {upcoming.length} upcoming on the schedule
        </p>
      </div>

      {/* Upcoming schedule */}
      <Card>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Upcoming schedule</h2>
        </div>
        <CardContent className="p-0">
          {upcoming.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No demos scheduled yet. Set a date on a request below to add it here.
            </p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-44 shrink-0 text-sm font-medium text-foreground">
                      {fmtDateTime(d.scheduled_at!)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.full_name} · {d.company}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.work_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {d.meeting_link && (
                      <a href={d.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Join <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[d.status] || ""}`}>
                      {d.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* All requests */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or company…" className="pl-9" aria-label="Search demos" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No demo requests found.</CardContent></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Requested</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="w-[160px]">Scheduled</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const isExpanded = expandedId === d.id;
                    const draft = drafts[d.id];
                    return (
                      <Fragment key={d.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => openRow(d)}>
                          <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{d.full_name}</div>
                            <div className="text-xs text-muted-foreground">{d.work_email}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{d.company}</div>
                            <div className="text-xs text-muted-foreground capitalize">{d.role}{d.timeline ? ` · ${d.timeline}` : ""}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.scheduled_at
                              ? <span className="font-medium">{fmtDateTime(d.scheduled_at)}</span>
                              : <span className="text-xs text-muted-foreground">Not scheduled</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[d.status] || ""}`}>
                              {d.status}
                            </span>
                          </TableCell>
                          <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                        </TableRow>
                        {isExpanded && draft && (
                          <TableRow key={`${d.id}-detail`}>
                            <TableCell colSpan={6} className="bg-muted/30 p-4">
                              <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What they want</h4>
                                    <p className="whitespace-pre-wrap text-sm text-foreground">{d.use_case}</p>
                                  </div>
                                  {d.phone && (
                                    <div className="text-sm"><span className="text-muted-foreground">Phone: </span>{d.phone}</div>
                                  )}
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
                                    <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v)}>
                                      <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {busy[`s-${d.id}`] && <Loader2 className="h-3 w-3 animate-spin" />}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</h4>
                                  <div className="space-y-1.5">
                                    <Label htmlFor={`sched-${d.id}`} className="text-xs">Date &amp; time</Label>
                                    <Input id={`sched-${d.id}`} type="datetime-local" value={draft.scheduled_at}
                                      onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...draft, scheduled_at: e.target.value } }))} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor={`link-${d.id}`} className="text-xs">Meeting link</Label>
                                    <Input id={`link-${d.id}`} type="url" placeholder="https://meet.google.com/…" value={draft.meeting_link}
                                      onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...draft, meeting_link: e.target.value } }))} />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor={`notes-${d.id}`} className="text-xs">Internal notes</Label>
                                    <Textarea id={`notes-${d.id}`} rows={2} placeholder="Notes for the sales team…" value={draft.internal_notes}
                                      onChange={(e) => setDrafts((p) => ({ ...p, [d.id]: { ...draft, internal_notes: e.target.value } }))} />
                                  </div>
                                  <Button size="sm" onClick={() => saveDetails(d.id)} disabled={busy[`d-${d.id}`]}>
                                    {busy[`d-${d.id}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Save schedule
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

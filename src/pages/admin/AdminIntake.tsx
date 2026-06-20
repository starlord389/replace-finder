import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type StatusTable = "contact_submissions" | "referrals";

const STATUS_OPTIONS: Record<StatusTable, string[]> = {
  contact_submissions: ["new", "reviewed", "resolved", "spam"],
  referrals: ["pending", "assigned", "converted", "declined"],
};

// "Open" = items still needing attention, used for the tab count badges.
const OPEN_STATUSES = new Set(["new", "pending"]);

const statusColor: Record<string, string> = {
  new: "bg-[#e8eef0] text-[#2d3d42] border-[#c9d4d9]",
  pending: "bg-[#e8eef0] text-[#2d3d42] border-[#c9d4d9]",
  contacted: "bg-amber-100 text-amber-800 border-amber-200",
  reviewed: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  qualified: "bg-green-100 text-green-800 border-green-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-muted text-muted-foreground",
  unqualified: "bg-muted text-muted-foreground",
  declined: "bg-red-100 text-red-800 border-red-200",
  spam: "bg-red-100 text-red-800 border-red-200",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function StatusSelect({
  table, value, onChange, busy,
}: {
  table: StatusTable;
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS[table].map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[value] || "bg-muted text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export default function AdminIntake() {
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<Tables<"contact_submissions">[]>([]);
  const [referrals, setReferrals] = useState<Tables<"referrals">[]>([]);
  const [brokerage, setBrokerage] = useState<Tables<"brokerage_waitlist_signups">[]>([]);
  const [team, setTeam] = useState<Tables<"team_waitlist_signups">[]>([]);
  const [newsletter, setNewsletter] = useState<Tables<"newsletter_subscribers">[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, r, b, t, n] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }),
        supabase.from("brokerage_waitlist_signups").select("*").order("created_at", { ascending: false }),
        supabase.from("team_waitlist_signups").select("*").order("created_at", { ascending: false }),
        supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
      ]);
      setContact(c.data ?? []);
      setReferrals(r.data ?? []);
      setBrokerage(b.data ?? []);
      setTeam(t.data ?? []);
      setNewsletter(n.data ?? []);
      setLoading(false);
    })();
  }, []);

  async function setStatus(table: StatusTable, id: string, status: string) {
    setBusyId(id);
    const res =
      table === "contact_submissions"
        ? await supabase.from("contact_submissions").update({ status }).eq("id", id)
        : await supabase.from("referrals").update({ status }).eq("id", id);
    setBusyId(null);

    if (res.error) {
      toast({ title: "Failed to update status.", description: res.error.message, variant: "destructive" });
      return;
    }
    const apply = <T extends { id: string }>(rows: T[]) =>
      rows.map((row) => (row.id === id ? { ...row, status } : row));
    if (table === "contact_submissions") setContact(apply);
    else setReferrals(apply);
    toast({ title: "Status updated." });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const contactOpen = contact.filter((x) => OPEN_STATUSES.has(x.status)).length;
  const referralsOpen = referrals.filter((x) => OPEN_STATUSES.has(x.status)).length;
  const waitlistCount = brokerage.length + team.length;

  const tabBadge = (n: number) =>
    n > 0 ? <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{n}</Badge> : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Growth &amp; Intake</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leads, referrals, and signups captured across the platform.
        </p>
      </div>

      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="contact">Contact{tabBadge(contactOpen)}</TabsTrigger>
          <TabsTrigger value="referrals">Referrals{tabBadge(referralsOpen)}</TabsTrigger>
          <TabsTrigger value="waitlists">Waitlists{tabBadge(waitlistCount)}</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>

        {/* Contact */}
        <TabsContent value="contact" className="mt-4">
          <ListCard count={contact.length} noun="submission">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-[170px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    <TableCell className="max-w-[360px] text-sm">
                      <p className="line-clamp-2 whitespace-pre-wrap" title={row.message}>{row.message}</p>
                    </TableCell>
                    <TableCell>
                      <StatusSelect table="contact_submissions" value={row.status} busy={busyId === row.id}
                        onChange={(v) => setStatus("contact_submissions", row.id, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListCard>
        </TabsContent>

        {/* Referrals */}
        <TabsContent value="referrals" className="mt-4">
          <ListCard count={referrals.length} noun="referral">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="w-[120px]">Est. value</TableHead>
                  <TableHead className="w-[90px]">Assigned</TableHead>
                  <TableHead className="w-[170px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{row.owner_name}</div>
                      <div className="text-xs text-muted-foreground">{row.owner_email}</div>
                      {row.owner_phone && <div className="text-xs text-muted-foreground">{row.owner_phone}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="capitalize">{row.property_type || "—"}</div>
                      {row.property_location && <div className="text-xs text-muted-foreground">{row.property_location}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.estimated_value != null ? `$${row.estimated_value.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      {row.assigned_agent_id
                        ? <Badge variant="outline" className="text-[10px]">Yes</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusSelect table="referrals" value={row.status} busy={busyId === row.id}
                        onChange={(v) => setStatus("referrals", row.id, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListCard>
        </TabsContent>

        {/* Waitlists */}
        <TabsContent value="waitlists" className="mt-4 space-y-6">
          <WaitlistTable title="Brokerage waitlist" rows={brokerage} />
          <WaitlistTable title="Team waitlist" rows={team} />
        </TabsContent>

        {/* Newsletter */}
        <TabsContent value="newsletter" className="mt-4">
          <ListCard count={newsletter.length} noun="subscriber">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[160px]">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsletter.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</TableCell>
                    <TableCell className="text-sm">{row.email}</TableCell>
                    <TableCell><StatusBadge value={row.source} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ListCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListCard({ count, noun, children }: { count: number; noun: string; children: React.ReactNode }) {
  if (count === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No {noun}s yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <div className="border-b px-4 py-2 text-xs text-muted-foreground">
        {count} {noun}{count !== 1 ? "s" : ""}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

function WaitlistTable({
  title, rows,
}: {
  title: string;
  rows: Array<Tables<"brokerage_waitlist_signups"> | Tables<"team_waitlist_signups">>;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">· {rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">No signups yet.</CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(row.created_at)}</TableCell>
                    <TableCell className="text-sm font-medium">{row.name}</TableCell>
                    <TableCell className="text-sm">{row.email}</TableCell>
                    <TableCell className="text-sm">{row.company || "—"}</TableCell>
                    <TableCell className="text-sm">{row.phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

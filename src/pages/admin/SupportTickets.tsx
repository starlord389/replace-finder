import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-muted text-muted-foreground",
};

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    const { data: ticketData, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !ticketData) {
      setTickets([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for user emails
    const userIds = [...new Set(ticketData.map((t: any) => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enriched = ticketData.map((t: any) => {
      const profile = profileMap.get(t.user_id);
      return {
        ...t,
        user_email: profile?.email || "Unknown",
        user_name: profile?.full_name || "",
      };
    });

    setTickets(enriched);
    setLoading(false);
  }

  async function updateStatus(ticketId: string, newStatus: string) {
    setSaving((p) => ({ ...p, [ticketId]: true }));
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: newStatus as any })
      .eq("id", ticketId);
    setSaving((p) => ({ ...p, [ticketId]: false }));
    if (error) {
      toast({ title: "Failed to update status.", variant: "destructive" });
    } else {
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
      toast({ title: "Status updated." });
    }
  }

  async function saveNotes(ticketId: string) {
    const notes = editNotes[ticketId] ?? "";
    setSaving((p) => ({ ...p, [`notes-${ticketId}`]: true }));
    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_notes: notes })
      .eq("id", ticketId);
    setSaving((p) => ({ ...p, [`notes-${ticketId}`]: false }));
    if (error) {
      toast({ title: "Failed to save notes.", variant: "destructive" });
    } else {
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, admin_notes: notes } : t)));
      toast({ title: "Notes saved." });
    }
  }

  const filtered = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tickets.length} total ticket{tickets.length !== 1 ? "s" : ""} ·{" "}
            {tickets.filter((t) => t.status === "open").length} open
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No tickets found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[100px]">Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => {
                  const isExpanded = expandedId === ticket.id;
                  return (
                    <>
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : ticket.id);
                          if (!isExpanded && !(ticket.id in editNotes)) {
                            setEditNotes((p) => ({ ...p, [ticket.id]: ticket.admin_notes || "" }));
                          }
                        }}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{ticket.user_email}</div>
                          {ticket.user_name && (
                            <div className="text-xs text-muted-foreground">{ticket.user_name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{ticket.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[250px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[ticket.status] || ""}`}>
                            {statusOptions.find((s) => s.value === ticket.status)?.label || ticket.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${ticket.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-4 max-w-2xl">
                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Message</h4>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</h4>
                                <Select
                                  value={ticket.status}
                                  onValueChange={(val) => updateStatus(ticket.id, val)}
                                >
                                  <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((s) => (
                                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {saving[ticket.id] && <Loader2 className="h-3 w-3 animate-spin" />}
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Admin Notes</h4>
                                <Textarea
                                  value={editNotes[ticket.id] ?? ticket.admin_notes ?? ""}
                                  onChange={(e) => setEditNotes((p) => ({ ...p, [ticket.id]: e.target.value }))}
                                  placeholder="Internal notes about this ticket..."
                                  rows={3}
                                  className="text-sm"
                                />
                                <Button
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => saveNotes(ticket.id)}
                                  disabled={saving[`notes-${ticket.id}`]}
                                >
                                  {saving[`notes-${ticket.id}`] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

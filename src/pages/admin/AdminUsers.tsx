import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronDown, ChevronUp, Search, ShieldCheck, ShieldOff, UserCog } from "lucide-react";

type AppRole = Enums<"app_role">;

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  brokerage_name: string | null;
  license_number: string | null;
  license_state: string | null;
  mls_number: string | null;
  years_experience: number | null;
  verification_status: string;
  created_at: string;
  roles: AppRole[];
};

const roleBadgeClass: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  agent: "bg-[#e8eef0] text-[#2d3d42] border-[#c9d4d9]",
  client: "bg-blue-100 text-blue-800 border-blue-200",
  broker: "bg-purple-100 text-purple-800 border-purple-200",
};

const verificationBadgeClass: Record<string, string> = {
  verified: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  unverified: "bg-muted text-muted-foreground",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const [{ data: profiles, error }, { data: roleRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, company, brokerage_name, license_number, license_state, mls_number, years_experience, verification_status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (error || !profiles) {
      toast({ title: "Failed to load users.", variant: "destructive" });
      setUsers([]);
      setLoading(false);
      return;
    }

    const rolesByUser = new Map<string, AppRole[]>();
    for (const r of roleRows ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    setUsers(
      profiles.map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  }

  async function setRole(userId: string, role: AppRole, grant: boolean) {
    const key = `${userId}-${role}`;
    setBusy((b) => ({ ...b, [key]: true }));
    const { error } = grant
      ? await supabase.from("user_roles").insert({ user_id: userId, role })
      : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    setBusy((b) => ({ ...b, [key]: false }));

    if (error) {
      toast({ title: `Failed to ${grant ? "grant" : "revoke"} ${role}.`, description: error.message, variant: "destructive" });
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, roles: grant ? [...new Set([...u.roles, role])] : u.roles.filter((r) => r !== role) }
          : u,
      ),
    );
    toast({ title: `${role.charAt(0).toUpperCase() + role.slice(1)} role ${grant ? "granted" : "revoked"}.` });
  }

  const verificationValues = useMemo(
    () => [...new Set(users.map((u) => u.verification_status).filter(Boolean))],
    [users],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        (u.full_name ?? "").toLowerCase().includes(term) ||
        (u.email ?? "").toLowerCase().includes(term) ||
        (u.brokerage_name ?? "").toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter as AppRole);
      const matchesVerification = verificationFilter === "all" || u.verification_status === verificationFilter;
      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, search, roleFilter, verificationFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const adminCount = users.filter((u) => u.roles.includes("admin")).length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Users &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? "s" : ""} · {adminCount} admin{adminCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or brokerage…"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Verification" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            {verificationValues.map((v) => (
              <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No users match your filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[180px]">Roles</TableHead>
                  <TableHead className="w-[120px]">Verification</TableHead>
                  <TableHead className="w-[120px]">Joined</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isExpanded = expandedId === u.id;
                  const isSelf = u.id === currentUser?.id;
                  const isAdmin = u.roles.includes("admin");
                  const isAgent = u.roles.includes("agent");
                  return (
                    <>
                      <TableRow
                        key={u.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : u.id)}
                      >
                        <TableCell>
                          <div className="text-sm font-medium">{u.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u.email || "no email"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">none</span>
                            ) : (
                              u.roles.map((r) => (
                                <span key={r} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeClass[r] || ""}`}>
                                  {r}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${verificationBadgeClass[u.verification_status] || "bg-muted text-muted-foreground"}`}>
                            {u.verification_status || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${u.id}-detail`}>
                          <TableCell colSpan={5} className="bg-muted/30 p-4">
                            <div className="grid gap-6 md:grid-cols-2">
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</h4>
                                <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
                                  <dt className="text-muted-foreground">Phone</dt><dd>{u.phone || "—"}</dd>
                                  <dt className="text-muted-foreground">Company</dt><dd>{u.company || "—"}</dd>
                                  <dt className="text-muted-foreground">Brokerage</dt><dd>{u.brokerage_name || "—"}</dd>
                                  <dt className="text-muted-foreground">License</dt><dd>{u.license_number ? `${u.license_number}${u.license_state ? ` (${u.license_state})` : ""}` : "—"}</dd>
                                  <dt className="text-muted-foreground">MLS #</dt><dd>{u.mls_number || "—"}</dd>
                                  <dt className="text-muted-foreground">Experience</dt><dd>{u.years_experience != null ? `${u.years_experience} yrs` : "—"}</dd>
                                </dl>
                              </div>

                              <div className="space-y-3">
                                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  <UserCog className="h-3.5 w-3.5" /> Role Management
                                </h4>

                                {/* Admin role — confirmation required */}
                                <AdminRoleAction
                                  isAdmin={isAdmin}
                                  isSelf={isSelf}
                                  busy={!!busy[`${u.id}-admin`]}
                                  userLabel={u.full_name || u.email || "this user"}
                                  onConfirm={() => setRole(u.id, "admin", !isAdmin)}
                                />

                                {/* Agent role — direct toggle */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  disabled={!!busy[`${u.id}-agent`]}
                                  onClick={() => setRole(u.id, "agent", !isAgent)}
                                >
                                  {busy[`${u.id}-agent`] ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <UserCog className="h-3.5 w-3.5" />
                                  )}
                                  {isAgent ? "Revoke Agent role" : "Grant Agent role"}
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

function AdminRoleAction({
  isAdmin, isSelf, busy, userLabel, onConfirm,
}: {
  isAdmin: boolean;
  isSelf: boolean;
  busy: boolean;
  userLabel: string;
  onConfirm: () => void;
}) {
  // Guard: an admin can't strip their own admin access (prevents lockout).
  if (isAdmin && isSelf) {
    return (
      <Button variant="outline" size="sm" className="w-full justify-start" disabled>
        <ShieldCheck className="h-3.5 w-3.5" /> Admin (you)
      </Button>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={isAdmin ? "outline" : "default"}
          size="sm"
          className="w-full justify-start"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isAdmin ? (
            <ShieldOff className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {isAdmin ? "Revoke Admin access" : "Grant Admin access"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAdmin ? "Revoke admin access?" : "Grant admin access?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? `${userLabel} will lose access to the admin center and all administrative actions.`
              : `${userLabel} will gain full access to the admin center, including user management and platform settings.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isAdmin ? "Revoke access" : "Grant access"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

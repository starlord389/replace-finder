import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, Ban, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import type { CrmUserWorkspace } from "../data/useCrmUserWorkspace";

type AppRole = Enums<"app_role">;

export default function CrmAccountControls({ data, onChanged }: { data: CrmUserWorkspace; onChanged: () => Promise<unknown> | void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState("");
  const [reason, setReason] = useState("");
  const id = data.profile.id;
  const self = user?.id === id;
  const accountStatus = data.accountState?.account_status ?? (data.profile.verification_status === "suspended" ? "suspended" : "active");

  async function finish(title: string) {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-user-360", id] }), queryClient.invalidateQueries({ queryKey: ["admin-user-directory"] })]);
    await onChanged();
    toast({ title });
  }
  async function changeRole(role: AppRole, enabled: boolean) {
    setBusy(`role-${role}`);
    const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: id, p_role: role, p_enabled: enabled, p_reason: "Changed from the CRM user workspace" });
    setBusy("");
    if (error) return toast({ title: "Role change failed", description: error.message, variant: "destructive" });
    await finish(`${role === "investor" ? "Property owner" : role} role ${enabled ? "granted" : "revoked"}.`);
  }
  async function verify(status: "pending" | "verified") {
    setBusy("verification");
    const { error } = await supabase.rpc("admin_set_agent_verification_status", { p_user_id: id, p_status: status, p_reason: "Changed from the CRM user workspace" });
    setBusy("");
    if (error) return toast({ title: "Verification update failed", description: error.message, variant: "destructive" });
    await finish(status === "verified" ? "Agent verified." : "Agent returned to pending review.");
  }
  async function access(status: "active" | "suspended") {
    setBusy("access");
    const { error } = await supabase.rpc("admin_set_user_account_status", { p_user_id: id, p_status: status, p_reason: status === "suspended" ? reason.trim() : "Reactivated from the CRM user workspace" });
    setBusy("");
    if (error) return toast({ title: "Account access update failed", description: error.message, variant: "destructive" });
    setReason("");
    await finish(status === "active" ? "Account reactivated." : "Account suspended.");
  }

  const roles: AppRole[] = ["agent", "investor", "admin"];
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-950">Roles</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Role changes are guarded and written to the audit log.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{roles.map((role) => {
          const enabled = data.roles.includes(role);
          return <Button key={role} variant="outline" className="justify-start" disabled={Boolean(busy) || (self && role === "admin" && enabled)} onClick={() => { void changeRole(role, !enabled); }}>
            {busy === `role-${role}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : enabled ? <ShieldOff className="mr-2 h-4 w-4 text-red-600" /> : <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />}
            {enabled ? "Remove" : "Grant"} {role === "investor" ? "owner" : role}
          </Button>;
        })}</div>
      </div>

      {data.roles.includes("agent") && data.profileExists && accountStatus === "active" && (
        <div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-950">Agent verification</h3><p className="mt-1 text-xs text-slate-500">Current state: {data.profile.verification_status.replace(/_/g, " ")}</p><Button className="mt-3" variant="outline" disabled={Boolean(busy)} onClick={() => { void verify(data.profile.verification_status === "verified" ? "pending" : "verified"); }}>{busy === "verification" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}{data.profile.verification_status === "verified" ? "Return to pending" : "Verify agent"}</Button></div>
      )}

      <div className="border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold text-slate-950">Account access</h3><p className="mt-1 text-xs leading-5 text-slate-500">Suspension blocks application and database access. Authentication-provider bans are managed separately.</p>
        {accountStatus === "suspended" ? <Button className="mt-3" variant="outline" disabled={Boolean(busy) || Boolean(data.authAccount?.banned_until)} onClick={() => { void access("active"); }}>{busy === "access" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />}Reactivate account</Button>
          : <AlertDialog><AlertDialogTrigger asChild><Button className="mt-3" variant="destructive" disabled={self || Boolean(busy)}><Ban className="mr-2 h-4 w-4" />Suspend account</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Suspend this account?</AlertDialogTitle><AlertDialogDescription>The user will immediately lose access. Enter a reason for the permanent admin audit trail.</AlertDialogDescription></AlertDialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required suspension reason" /><div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />This action affects live access but does not delete any user data.</div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!reason.trim()} className="bg-red-600 hover:bg-red-700" onClick={(event) => { event.preventDefault(); void access("suspended"); }}>Suspend account</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, UserMinus, UserCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  clientId: string;
  clientName: string;
  status: string;
  onStatusChange?: (status: string) => void;
}

export function ClientDangerZoneTab({ clientId, clientName, status, onStatusChange }: Props) {
  const navigate = useNavigate();
  const [exchangeCount, setExchangeCount] = useState<number | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("exchanges")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId);
      if (!cancelled) setExchangeCount(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  const setStatus = async (next: "active" | "inactive") => {
    setWorking(true);
    const { error } = await supabase
      .from("agent_clients")
      .update({ status: next })
      .eq("id", clientId);
    setWorking(false);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(next === "active" ? "Client reactivated" : "Client deactivated");
    onStatusChange?.(next);
  };

  const deleteClient = async () => {
    if (confirmName.trim() !== clientName.trim()) {
      toast.error("Type the client's name exactly to confirm.");
      return;
    }
    setWorking(true);
    // Re-check on the server right before the (cascading) delete: the on-mount
    // exchangeCount can be stale if a listing was created in another tab/session,
    // and deleting would silently CASCADE away those exchanges. Abort if any exist.
    const { count, error: countError } = await supabase
      .from("exchanges")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId);
    if (countError) {
      setWorking(false);
      toast.error("Couldn't verify the client's listings: " + countError.message);
      return;
    }
    if ((count ?? 0) > 0) {
      setWorking(false);
      setExchangeCount(count ?? 0);
      toast.error(`This client now has ${count} listing${count === 1 ? "" : "s"}. Remove them first, or deactivate instead.`);
      return;
    }
    const { error } = await supabase.from("agent_clients").delete().eq("id", clientId);
    setWorking(false);
    if (error) { toast.error("Failed to delete: " + error.message); return; }
    toast.success("Client deleted");
    navigate("/agent/clients");
  };

  const canDelete = exchangeCount === 0;

  return (
    <div className="space-y-4">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
          <CardDescription>These actions affect access and history. Proceed carefully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activation toggle */}
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {status === "active" ? "Deactivate client" : "Reactivate client"}
              </p>
              <p className="text-xs text-muted-foreground">
                {status === "active"
                  ? "Hide this client from your active list. History is preserved and they can be reactivated anytime."
                  : "Move this client back to your active list."}
              </p>
            </div>
            {status === "active" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={working}>
                    <UserMinus className="mr-2 h-4 w-4" /> Deactivate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate {clientName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You can reactivate them later from this same screen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setStatus("inactive")}>Deactivate</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" onClick={() => setStatus("active")} disabled={working}>
                <UserCheck className="mr-2 h-4 w-4" /> Reactivate
              </Button>
            )}
          </div>

          {/* Delete */}
          <div className="rounded-lg border border-destructive/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Delete client</p>
                <p className="text-xs text-muted-foreground">
                  {exchangeCount == null
                    ? "Checking…"
                    : canDelete
                      ? "Permanently remove this client from your roster. This cannot be undone."
                      : `This client has ${exchangeCount} listing${exchangeCount === 1 ? "" : "s"}. Deactivate instead, or remove listings first.`}
                </p>
              </div>
            </div>

            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-3" disabled={working}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete permanently
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {clientName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the client record. Type{" "}
                      <span className="font-semibold text-foreground">{clientName}</span> below to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label>Confirm client name</Label>
                    <Input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={clientName}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmName("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteClient}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

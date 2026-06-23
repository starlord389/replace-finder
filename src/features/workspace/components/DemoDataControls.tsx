import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, RefreshCw, Trash2 } from "lucide-react";

/** Owner-only controls to fill or clear the Demo workspace. Shown only in Demo
 *  mode for admins. Calls the `demo-data` edge function. */
export function DemoDataControls() {
  const { hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<null | "reset" | "clear">(null);

  if (!isDemo || !hasRole("admin")) return null;

  const run = async (action: "reset" | "clear") => {
    setBusy(action);
    try {
      const { error } = await supabase.functions.invoke("demo-data", { body: { action } });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(action === "reset" ? "Demo workspace rebuilt." : "Demo data cleared.");
    } catch (e: any) {
      toast.error("Demo data action failed: " + (e?.message || "Unknown error"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/60 p-4">
      <div className="flex items-center gap-2 text-sm">
        <Database className="h-4 w-4 shrink-0 text-amber-700" />
        <span className="font-medium text-foreground">Demo workspace tools</span>
        <span className="hidden text-muted-foreground sm:inline">— sample data for demos &amp; testing.</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => run("reset")} disabled={busy !== null}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${busy === "reset" ? "animate-spin" : ""}`} />
          {busy === "reset" ? "Building…" : "Load / Reset demo data"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("clear")} disabled={busy !== null}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {busy === "clear" ? "Clearing…" : "Clear"}
        </Button>
      </div>
    </div>
  );
}

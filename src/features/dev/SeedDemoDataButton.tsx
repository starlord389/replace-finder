import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, RotateCcw, Loader2 } from "lucide-react";

type Action = "seed" | "reset";

export default function SeedDemoDataButton() {
  const enabled = import.meta.env.VITE_ENABLE_DEMO_SEED === "true";
  const { toast } = useToast();
  const [busy, setBusy] = useState<Action | null>(null);

  if (!enabled) return null;

  const run = async (action: Action) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data", {
        body: { action },
      });
      if (error) throw error;

      if (action === "seed") {
        toast({
          title: "Demo data seeded",
          description: `${data?.myExchanges ?? 0} exchanges, ${data?.matches ?? 0} matches, ${data?.clients ?? 0} clients. Refresh to see them.`,
        });
      } else {
        toast({
          title: "Demo data reset",
          description: `Removed ${data?.deletedExchanges ?? 0} exchanges and ${data?.deletedAgents ?? 0} counterparty agents.`,
        });
      }

      setTimeout(() => window.location.reload(), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: `Failed to ${action} demo data`,
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Developer: Demo data
        </CardTitle>
        <CardDescription>
          Populate your account with clients, exchanges, properties, matches, connections, messages, and notifications so you can walk through every agent feature. Clicking seed will first clear any previous demo rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button onClick={() => run("seed")} disabled={busy !== null}>
          {busy === "seed" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Seeding…</>
          ) : (
            <><Database className="mr-2 h-4 w-4" />Seed demo data</>
          )}
        </Button>
        <Button variant="outline" onClick={() => run("reset")} disabled={busy !== null}>
          {busy === "reset" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting…</>
          ) : (
            <><RotateCcw className="mr-2 h-4 w-4" />Reset demo data</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Database, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { seedAgentMockData, validateAgentMockData, type SeedValidationReport } from "./seedMockData";
import { clearAgentMockData } from "./clearMockData";

export default function SeedMockDataPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<SeedValidationReport | null>(null);

  // Seed/clear tooling is hard-gated to the platform owner's account.
  const OWNER_EMAIL = "starlord389@gmail.com";
  if (!user?.id) return null;
  if ((user.email ?? "").toLowerCase() !== OWNER_EMAIL) return null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["agent-attention"] });
    queryClient.invalidateQueries({ queryKey: ["agent-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["agent-matches"] });
    queryClient.invalidateQueries({ queryKey: ["agent-exchanges"] });
    queryClient.invalidateQueries({ queryKey: ["agent-launchpad-progress"] });
  };

  const onSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedAgentMockData(user.id);
      setReport(result.validation);
      const c = result.counts;
      toast({
        title: "Mock data seeded",
        description: `${c.clients} clients · ${c.exchanges} exchanges · ${c.matches} matches`,
      });
      if (result.validation && !result.validation.ok) {
        toast({
          title: "Validation flagged issues",
          description: `${result.validation.total_issues} missing/defaulted fields across seeded records.`,
          variant: "destructive",
        });
      }
      refresh();
    } catch (err) {
      toast({
        title: "Seed failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const onValidate = async () => {
    setValidating(true);
    try {
      const v = await validateAgentMockData();
      setReport(v);
      toast({
        title: v.ok ? "Seed data looks complete" : "Validation flagged issues",
        description: v.ok
          ? "Every required field is populated."
          : `${v.total_issues} missing/defaulted fields across seeded records.`,
        variant: v.ok ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        title: "Validation failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const onClear = async () => {
    setClearing(true);
    try {
      await clearAgentMockData(user.id);
      setReport(null);
      toast({ title: "Mock data cleared" });
      refresh();
    } catch (err) {
      toast({
        title: "Clear failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" /> Dev tools — Mock data
        </CardTitle>
        <CardDescription>
          Seed your dashboard with realistic sample data, or clear it. Only visible in dev builds.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={seeding || clearing}>
              {seeding && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Seed mock data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Seed mock data?</AlertDialogTitle>
              <AlertDialogDescription>
                This inserts 5 clients, 4 listings, 6 exchanges, matches, connections, messages, and notifications scoped to your account. All rows are tagged so you can clear them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onSeed}>Seed</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={seeding || clearing}>
              {clearing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-4 w-4" />
              )}
              Clear mock data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all mock data?</AlertDialogTitle>
              <AlertDialogDescription>
                Removes only rows tagged as mock data. Your real data is untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClear}>Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { seedAgentMockData } from "./seedMockData";
import { clearAgentMockData } from "./clearMockData";

export default function SeedMockDataPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!import.meta.env.DEV || !user?.id) return null;

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
      toast({
        title: "Mock data seeded",
        description: `${result.clients} clients · ${result.exchanges} exchanges · ${result.matches} matches`,
      });
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

  const onClear = async () => {
    setClearing(true);
    try {
      await clearAgentMockData(user.id);
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

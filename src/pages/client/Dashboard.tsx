import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Track your exchange request and review approved matches.
          </p>
        </div>
        <Link to="/dashboard/new-request">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      {/* Placeholder for request status + matches — will be built in Round 2 & 5 */}
      <div className="mt-8 rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          You haven't submitted an exchange request yet.
        </p>
        <Link to="/dashboard/new-request" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Submit Your First Request
          </Button>
        </Link>
      </div>
    </div>
  );
}

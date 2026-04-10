import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Unavailable() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">Workspace unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This area is currently being rebuilt and is temporarily unavailable.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/agent">Go to Agent Workspace</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}

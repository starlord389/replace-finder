import { Link2 } from "lucide-react";

export default function AgentConnections() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Link2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-bold text-foreground">Connections</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Active exchange connections will appear here.
      </p>
    </div>
  );
}

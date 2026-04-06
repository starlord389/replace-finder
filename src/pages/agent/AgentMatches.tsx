import { Handshake } from "lucide-react";

export default function AgentMatches() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Handshake className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-bold text-foreground">Matches</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Property matches will appear here once you have active exchanges.
      </p>
    </div>
  );
}

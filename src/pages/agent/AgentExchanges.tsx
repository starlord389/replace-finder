import { ArrowLeftRight } from "lucide-react";

export default function AgentExchanges() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-bold text-foreground">My Exchanges</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your exchange requests will appear here. Create an exchange for a client to get started.
      </p>
    </div>
  );
}

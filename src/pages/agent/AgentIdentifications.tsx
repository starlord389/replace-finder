import { ListChecks } from "lucide-react";

export default function AgentIdentifications() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ListChecks className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-bold text-foreground">Identification Lists</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your 45-day identification lists will appear here.
      </p>
    </div>
  );
}

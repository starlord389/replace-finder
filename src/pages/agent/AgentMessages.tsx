import { MessageSquare } from "lucide-react";

export default function AgentMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Messages with connected agents will appear here.
      </p>
    </div>
  );
}

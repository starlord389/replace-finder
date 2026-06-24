import { FileText, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  rel: Relationship;
  conversationAvailable?: boolean;
  onOpenConversation?: () => void;
}

export function DocsTab({ rel, conversationAvailable = false, onOpenConversation }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Property Documents</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Offering materials for {rel.propertyName} are shared privately by the listing agent.
        </p>
      </div>

      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">No documents shared yet</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          Offering memorandums, rent rolls, and operating statements are exchanged directly with the
          listing agent once you're connected — kept private until your client expresses interest.
        </p>
        {conversationAvailable ? (
          <Button className="mt-5 gap-2" onClick={onOpenConversation}>
            <MessageSquare className="h-4 w-4" />
            Request documents in the conversation
          </Button>
        ) : (
          <p className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
            Connect with the listing agent to request documents.
          </p>
        )}
      </div>
    </div>
  );
}

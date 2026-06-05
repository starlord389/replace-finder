import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { DealRoomPanel } from "@/features/matches/components/inbox/DealRoomPanel";
import { propertyImage } from "@/features/matches/components/inbox/propertyImage";
import { currency } from "@/features/matches/components/helpers";
import {
  deriveUiStatus,
  UI_STATUS_CLASS,
  UI_STATUS_LABEL,
} from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";

interface Props {
  clientId: string;
}

export function ClientDealTab({ clientId }: Props) {
  const { data: allRels = [], isLoading } = useUnifiedRelationships();
  const [activeRel, setActiveRel] = useState<Relationship | null>(null);

  // Connected/in-progress matches for this client
  const dealRels = useMemo(
    () =>
      allRels
        .filter((r) => r.clientId === clientId)
        .filter((r) => r.connectionId != null && r.stage !== "closed_lost"),
    [allRels, clientId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (dealRels.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Handshake className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No active deals</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When this client connects with a counterparty on a match, the deal room appears here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        {dealRels.map((rel) => {
          const status = deriveUiStatus(rel, readMatchLocalState(rel.matchId));
          return (
            <Card key={rel.id} className="overflow-hidden">
              <CardContent className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={propertyImage(rel.propertyImageUrl, rel.id)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${UI_STATUS_CLASS[status]}`}
                    >
                      {UI_STATUS_LABEL[status]}
                    </span>
                    {rel.unreadCount > 0 && (
                      <Badge className="bg-primary text-[10px] text-primary-foreground">
                        {rel.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
                    {rel.propertyName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    <span className="font-medium text-foreground">{currency(rel.askingPrice)}</span>
                    {rel.counterpartyName && (
                      <span className="text-muted-foreground">
                        with {rel.counterpartyName}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => setActiveRel(rel)}>
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Open deal room
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/agent/exchanges/${rel.buyerExchangeId}`}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View exchange
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!activeRel} onOpenChange={(o) => !o && setActiveRel(null)}>
        <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
          {activeRel && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Deal room</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {activeRel.propertyName}
                </p>
              </div>
              <div className="min-h-0 flex-1 p-3">
                <DealRoomPanel rel={activeRel} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

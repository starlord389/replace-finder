import { CheckCircle2, XCircle, Mail, TrendingUp, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ActivateResultState =
  | { kind: "success"; newMatches: number }
  | { kind: "error"; code: string; message: string };

interface Props {
  open: boolean;
  state: ActivateResultState | null;
  onClose: () => void;
  onViewListing: () => void;
  onGoToMatches: () => void;
  onRetry: () => void;
  onSaveAsDraft: () => void;
}

export default function ActivateResultDialog({
  open, state, onClose, onViewListing, onGoToMatches, onRetry, onSaveAsDraft,
}: Props) {
  if (!state) return null;
  const isSuccess = state.kind === "success";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
            isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
          }`}>
            {isSuccess ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
          </div>
          <DialogTitle className="text-center text-xl">
            {isSuccess ? "Your opportunity monitoring is active." : "Activation failed"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSuccess
              ? "ExchangeUp will continue evaluating the network as new properties, investors and opportunities are added."
              : "We couldn't activate this exchange. Details below — you can try again or save your progress as a draft."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Monitoring status</div>
                <div className="font-semibold text-emerald-600">Active</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Last check</div>
                <div className="font-semibold">Just now</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Monitoring criteria</div>
                <div className="font-semibold">Active</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Opportunities detected</div>
                <div className="font-semibold">{state.newMatches}</div>
              </div>
            </div>

            {state.newMatches === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-foreground">
                <div className="font-medium">No opportunities right now — that's normal.</div>
                <p className="mt-1 text-muted-foreground">
                  Nothing else in the network currently clears both the equity-based 75% LTV ceiling and the
                  return-on-equity improvement requirement. We keep watching and re-check every time something new
                  enters the network.
                </p>
              </div>
            )}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">You'll get an email whenever a new opportunity is detected.</div>
                  <p className="mt-1 text-muted-foreground">
                    Each email links straight to the opportunity inside your Matches tab — no digging required.
                  </p>
                </div>
              </div>
            </div>


            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
              <div className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">Only upgrades, never downgrades.</div>
                  <p className="mt-1 text-muted-foreground">
                    We only surface replacement properties with a higher projected return on equity — never lateral moves or downgrades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            <div className="font-medium text-red-900">{state.message}</div>
            <div className="mt-1 font-mono text-xs text-red-700">Error {state.code}</div>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isSuccess ? (
            <>
              <Button variant="outline" onClick={onViewListing}>View listing</Button>
              <Button onClick={onGoToMatches}>
                Go to matches <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onSaveAsDraft}>Save as draft</Button>
              <Button onClick={onRetry}>Try again</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

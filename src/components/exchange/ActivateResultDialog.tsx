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
            {isSuccess ? "Exchange activated" : "Activation failed"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSuccess
              ? state.newMatches > 0
                ? `Your listing is now in the matching network — we already surfaced ${state.newMatches} match${state.newMatches === 1 ? "" : "es"} to review.`
                : "Your listing is now in the matching network. No matches yet — we'll notify you as soon as one shows up."
              : "We couldn't activate this exchange. Details below — you can try again or save your progress as a draft."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-medium">You'll get an email for every new match.</div>
                <p className="mt-1 text-muted-foreground">
                  Each email includes a direct link that opens the match inside your Matches tab — no digging required.
                </p>
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

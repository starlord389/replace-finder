import { useCallback, useEffect, useState } from "react";

/**
 * localStorage-backed per-match lifecycle flags + notes. Used to demo the
 * Match Inbox + Deal Room lifecycle (Sent to Client, Client Interested,
 * Reviewing Docs, LOI/Offer, Archived) until the backend exposes these fields.
 */
export interface MatchLocalState {
  sentToClientAt: string | null;
  clientInterestedAt: string | null;
  conversationStartedAt: string | null;
  loiSentAt: string | null;
  underContractAt: string | null;
  closedAt: string | null;
  archivedAt: string | null;
  notFitAt: string | null;
  clientPassedAt: string | null;
  sellerUnavailableAt: string | null;
  agentNote: string;
}

const DEFAULT: MatchLocalState = {
  sentToClientAt: null,
  clientInterestedAt: null,
  conversationStartedAt: null,
  loiSentAt: null,
  underContractAt: null,
  closedAt: null,
  archivedAt: null,
  notFitAt: null,
  clientPassedAt: null,
  sellerUnavailableAt: null,
  agentNote: "",
};

const KEY = (id: string) => `match-local-state:${id}`;

function read(id: string): MatchLocalState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY(id));
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function useMatchLocalState(matchId: string | null) {
  const [state, setState] = useState<MatchLocalState>(DEFAULT);

  useEffect(() => {
    if (!matchId) {
      setState(DEFAULT);
      return;
    }
    setState(read(matchId));
  }, [matchId]);

  const update = useCallback(
    (patch: Partial<MatchLocalState>) => {
      if (!matchId) return;
      setState((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.localStorage.setItem(KEY(matchId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      // Notify other subscribed components AFTER this render commits —
      // dispatching synchronously inside the state updater makes React
      // warn about setState-during-render in the listeners.
      setTimeout(() => window.dispatchEvent(new CustomEvent("match-local-state-change")), 0);
    },
    [matchId],
  );

  // Cross-component sync (when InboxList and DealRoom both read state)
  useEffect(() => {
    if (!matchId) return;
    const handler = () => setState(read(matchId));
    window.addEventListener("match-local-state-change", handler);
    return () => window.removeEventListener("match-local-state-change", handler);
  }, [matchId]);

  return { state, update };
}

/** Read-only accessor (no subscription) — used by InboxList per-card */
export function readMatchLocalState(matchId: string): MatchLocalState {
  return read(matchId);
}

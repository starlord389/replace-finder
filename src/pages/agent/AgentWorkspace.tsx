import { Navigate, useParams, useSearchParams } from "react-router-dom";

// The standalone per-listing workspace page was retired. Everything it did —
// reviewing a listing's matches, the deal panel, and the conversation — now
// lives in the unified Matches inbox (/agent/matches), which supports the
// ?listing, ?match and ?view params. Any remaining /agent/workspace/:exchangeId
// link (including the in-App ExchangeToWorkspaceRedirect) lands here and is
// forwarded to the Matches tab with its deep-link params preserved, so the page
// is never shown. The leftover route in App.tsx can be dropped once the legal
// pages it also imports are committed.
export default function AgentWorkspace() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const [params] = useSearchParams();

  const next = new URLSearchParams();
  if (exchangeId) next.set("listing", exchangeId);
  const match = params.get("match");
  if (match) next.set("match", match);
  const view = params.get("view");
  if (view) next.set("view", view);

  const qs = next.toString();
  return <Navigate to={`/agent/matches${qs ? `?${qs}` : ""}`} replace />;
}


## Goal

Two connected improvements to the "Activate Exchange" flow:

1. Give agents a clear success (or error) result after clicking **Activate Exchange**, and tell them what happens next (email on every new match).
2. Send an actual email whenever they get a new match, with a button that opens that specific match inside the Matches tab.

---

## 1. Success / error UI after Activate

Today `NewExchange.tsx` only shows a `toast.success("Exchange activated and matching queued.")` and immediately navigates to `/agent/listings`, so if the toast is missed there is no feedback at all, and errors only show the raw exception message.

Change:

- Replace the immediate navigate with a **result dialog** that shows one of three states:
  - **Success — Exchange is live.** Green check, headline "Exchange activated", subcopy: "Your listing is now in the matching network. We'll email you the moment a match comes in — the email opens the match directly inside your Matches tab." Primary button "View listing", secondary "Go to matches".
  - **Success but no matches queued yet** (activate succeeded, `run-auto-matching` returned 0) — same layout, subcopy adjusted to "No matches yet — we'll notify you by email as soon as one shows up."
  - **Error.** Red icon, headline "Activation failed", body shows the human message plus a monospace error code line: `Error <STATUS or CODE>: <message>`. Primary button "Try again" (closes dialog, leaves wizard on Review so they can retry), secondary "Save as draft".
- Keep the toast for quick confirmation but the dialog is the source of truth.
- Surface the status code/name from the edge-function error (Supabase FunctionsHttpError exposes `context.response.status`; fall back to `err.name` / `err.code` / generic `UNKNOWN`).

Files touched:
- `src/pages/agent/NewExchange.tsx` — add dialog state, capture `activate` result + error, render new component.
- New `src/components/exchange/ActivateResultDialog.tsx` — presentational only.

## 2. "New match" email that deep-links into the Matches tab

`persistMatchesAndNotifications` in `supabase/functions/_shared/matching-core.ts` already inserts an in-app notification for each new match with `link_to: "/agent/matches"`. We extend that path to also fire a transactional email per new match to the agent who owns the receiving side.

Backend:
- New template `supabase/functions/_shared/transactional-email-templates/new-match-notification.tsx` registered in `registry.ts`. Props: agent first name, own listing label (client name + city/state), matched property label, match score, and the deep-link URL. Big CTA button "Open this match" pointing at `{APP_URL}/agent/matches?listing={buyer_exchange_id}&match={match_id}` (the exact deep-link `AgentMatches.tsx` already reads via `useSearchParams`, so it lands directly on the selected match). Small secondary link to `/agent/matches`.
- In `persistMatchesAndNotifications`, after inserting notifications, look up each recipient's `profiles.email` + `first_name`, resolve the counterpart listing/property labels (already available in the `match` object or via a lightweight query), and for every new match invoke `send-transactional-email` with `templateName: "new-match-notification"`, `idempotencyKey: \`new-match-${match.id}\``, and the template data. Skip demo matches (`isDemo === true`) so demo runs don't blast real inboxes. Wrap the send loop in `Promise.allSettled` so a single failure doesn't roll back the match write.
- Respect existing suppression — `send-transactional-email` already checks `suppressed_emails`, so nothing extra needed.

Frontend/routing:
- No route changes required — `/agent/matches?listing=…&match=…` already selects the correct listing + match. Verify by loading the URL after wiring.

Deploy afterwards: `run-auto-matching`, `create-exchange`, `update-exchange` (they all call the shared matching-core), plus `send-transactional-email` (template registry change).

## 3. Prerequisites we already have

- Email domain `notify.1031exchangeup.com` is provisioned; app-email infra + `send-transactional-email` already scaffolded and in use by the referral acknowledgement. If DNS is still pending verification, sends will queue and start delivering once verified — no code change needed later.

## Out of scope

- Digesting/batching match emails (one email per new match for now — matches an agent workflow where each match matters).
- Per-user email preferences / unsubscribe UI beyond the standard footer already appended by the send function.
- Changing the in-app notification schema.

## Verification

- Activate an exchange with a valid client → dialog shows the success state, closing routes to listings or matches.
- Force an error (e.g. missing required financial) → dialog shows red state with `Error <code>: <message>`.
- Trigger a new match against a non-demo exchange → row appears in `email_send_log` with `template_name = new-match-notification`, and the emailed link opens `/agent/matches` with the correct match pre-selected.

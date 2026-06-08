# Plan: Polish the workspace match review

Two focused changes to `PropertyReviewPanel.tsx`:

## 1. Remove the "Full details" link
The "Full details →" button in the header action row is redundant — this panel **is** the full details view. Drop the link and its `ExternalLink` usage there. The client strip still has its own "Open workspace" link for navigation context, which stays.

## 2. Redesign the actions area into a dedicated "Action Center"
Right now the primary + secondary action buttons sit as a loose flex row mixed in with the header. I'll lift them into their own clearly demarcated card directly under the header, styled as a deal command bar:

- A subtle gradient/tinted panel (`bg-gradient-to-br from-primary/5 to-card`) with a left accent border in the client's accent color to feel premium and tie back to the client identity.
- Two-column layout on desktop, stacked on mobile:
  - **Left**: status pill + a one-line "What's next" hint derived from the current lifecycle status (e.g. "Share this with your client to gauge interest").
  - **Right**: the primary action as a prominent solid button, plus secondary actions rendered as compact pill buttons in a wrap row. Destructive actions (Archive / Not a Fit / Client Passed) get pushed to the end and shown as ghost pills with a destructive tint, visually separated by a thin divider.
- Add small lucide icons to each action (Send, MessageSquare, FileCheck, Archive, etc.) mapped by action id for scannability.
- Keep all existing `useMatchActions` wiring — no behavior changes, purely presentational.

This replaces the current `<div className="mt-3 flex flex-wrap items-center gap-2">…</div>` action row. Everything else in the panel (lifecycle tracker, key metrics, why matched, breakdown, financials, share, conversation, activity, documents) stays as-is.

## Out of scope
No route, data, or DB changes. Only `PropertyReviewPanel.tsx` is edited.

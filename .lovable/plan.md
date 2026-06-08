# Plan: Redesign Workspace Match Review

The current workspace shows a matched property as a "quick overview" with tabs (Overview / Financials / Why / Breakdown / Documents / Activity / Conversation), and hides most actions behind an "All actions" drawer (the Deal Room sheet). You want the inverse: the page itself **is** the full detail view, and all actions are visible inline — no drawer.

## Goals
1. Kill the "All actions" button and the right-side Deal Room sheet.
2. Surface the full property detail on the page — no tabs hiding content; everything flows in one scrollable layout.
3. Put the secondary status actions (Mark Interested, Request Seller Details, Archive, etc.) inline beside the primary action, not in a drawer.
4. Tighten the visual hierarchy and fix small bugs (the "New Ma…" badge clipping in the hero, redundant "Score 100" beside the score chip, the centered floating popover artifact visible in your screenshot).

## Changes

### `PropertyReviewPanel.tsx` — full rewrite of structure
Replace the tabbed layout with a single vertical scroll containing, in order:

1. **Client strip** (unchanged — client name, "trading out", Open workspace link). Fix the badge in the top-right being clipped by giving it room and a non-truncated label ("New Match" not "New Ma…").
2. **Hero image** with the status badge overlaid (kept).
3. **Header block**: title, location, rank/score, price, score chip.
   - Remove the duplicate "Score 100" text since the score chip already shows it.
   - Replace the action row: keep the primary action button + render all `secondary` actions from `useMatchActions` as outline buttons right beside it. **Delete the "All actions" button and the `Settings2` import.**
4. **Key metrics strip** (kept) — horizontal scroll on narrow widths, fix overflow clipping.
5. **Why this matched** section — rendered inline, always visible (no tab).
6. **Match breakdown chart** — inline section below.
7. **Financials grid** — full grid inline (the `FinancialGrid` helper already exists).
8. **Share with client** section — inline, using the same controls currently in `ClientSharingCard` (Send, Copy link, Download one-pager, Agent note). Brought up from the drawer.
9. **Lifecycle tracker** — inline progress strip showing the deal's current stage (`LifecycleTracker` already exists).
10. **Conversation** with the counterparty agent — inline `AgentCommsCard` at the bottom, no longer hidden behind a tab.
11. **Activity timeline** — inline at the very bottom.
12. **Documents** — inline empty-state card.

Remove the `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` imports and the `onOpenActions` prop entirely.

### `AgentWorkspace.tsx`
- Remove the `Sheet`/`SheetContent` import and the `actionsOpen` state.
- Remove the `<Sheet>...<DealRoomPanel/>...</Sheet>` block at the bottom.
- Remove the mobile "All actions" floating bottom bar.
- Remove the `onOpenActions` prop passed to `PropertyReviewPanel`.
- Mobile "Back to matches" affordance stays.

### Bug fixes seen in screenshot
- Hero top-right badge ("New Ma…") gets clipped — change to `right-3` + max-width tweak + `whitespace-nowrap` so it never truncates.
- The floating circular toolbar visible in the lower-middle of your screenshot is a Lovable inspector overlay, not from the app — no code change needed.
- The "#1 of 4 matches · Score 100" line duplicates the score chip — drop the "Score N" portion; keep "#1 of 4 matches".

## Out of scope
- `DealRoomPanel.tsx`, `NextActionCard.tsx`, `ClientSharingCard.tsx` files stay on disk for now (other surfaces may import them). They're simply not rendered from the workspace anymore. If you want them deleted, say so and I'll remove them in a follow-up.
- No DB / RLS / matching-engine changes.
- Inbox list (left column) is untouched.

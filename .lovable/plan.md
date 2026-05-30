# Matches layout hierarchy pass

Goal: make the center Property Review the visual primary, shrink the inbox and Deal Room, and eliminate horizontal scroll inside panels. No new features, no schema/auth/routing changes.

## 1. Desktop grid (`AgentMatchesHub.tsx`)

Replace the current grid with width tiers driven by available space, so the center column always has ~640px+ before the right column appears:

```text
< 768px        : stacked (inbox OR detail, mobile flow unchanged)
768–1279px     : [340px  | minmax(640px,1fr)]   right panel = drawer
>= 1280px      : [340px  | minmax(640px,1fr) | 320px]
>= 1536px      : [380px  | minmax(640px,1fr) | 340px]
```

- Gap: `gap-5` (20px).
- Right column is rendered only at `xl` (1280px+). Below that, expose an "Actions" button in the detail header that opens the existing `Sheet` drawer containing `DealRoomPanel`. This means the current 1202px viewport will show 2 columns + drawer (no more squeeze).
- All column wrappers keep `min-w-0 min-h-0`.

## 2. Property Review (`PropertyReviewPanel.tsx`)

Restructure into fixed "above-the-fold" zones so financials are visible without scrolling:

1. Hero image: `h-56` (224px), `shrink-0`, `object-cover`, status badge top-right.
2. Header block (`shrink-0`, border-b): title + location on the left; **price + match score + primary action button** on the right. Primary action mirrors `NextActionCard`'s current CTA (computed from status) so it's always visible in the header.
3. Key metrics strip (`shrink-0`, border-b): 6 metric cards in a single row on `lg` (NOI, Cap Rate, Cash-on-Cash, DSCR, Occupancy, Required Equity). Grid: `grid-cols-3 lg:grid-cols-6`. Compact padding (`p-3`), small uppercase label, semibold value.
4. Tabs zone (`min-h-0 flex-1`): TabsList in a wrapping flex container (no `overflow-x-auto`). On narrow widths tabs wrap to a second row instead of scrolling horizontally. Only the TabsContent area scrolls (`overflow-y-auto`). The "Overview" tab no longer duplicates the metrics — it shows `WhyThisMatched` + activity preview.

A shared `derivePrimaryAction(rel, status)` helper in `inboxHelpers.ts` returns `{ label, onClick }` so both the header button and `NextActionCard` render the same CTA.

## 3. Inbox (`InboxList.tsx`)

- Filter chips: replace `overflow-x-auto` with `flex flex-wrap gap-1`. Show only the 5 most relevant statuses as chips (All, New, Interested, Connected, Closed); move the rest behind a "More" popover (uses existing `Popover` UI). Counts unchanged.
- Search and filter rows stay `shrink-0`; only the list scrolls.

## 4. Deal Room (`DealRoomPanel.tsx`)

- Reduce outer padding from `p-4` to `p-3` and inter-card spacing from `space-y-4` to `space-y-3`.
- Drop the in-panel `LifecycleTracker` to a compact horizontal variant (single-row pill steps) so it doesn't dominate vertically.
- Same component is reused inside the Sheet drawer for tablet/medium-desktop.

## 5. AgentMatchesHub drawer wiring

- Always render a "Actions" button in the detail header for `< xl`. Remove the now-redundant tablet-only button block.
- Sheet width: `sm:max-w-sm` (was `sm:max-w-md`) since right panel is now narrower.

## 6. Acceptance checks

- At 1202px (current viewport): 2-column layout, center detail ≥ 640px wide, right panel hidden behind "Actions" drawer.
- At 1440px+: 3 columns, center remains the widest.
- No `overflow-x-auto` inside inbox filters or detail tabs; both wrap.
- NOI / Cap Rate / CoC / DSCR / Occupancy / Equity visible without scrolling on a 720px tall viewport.
- Primary CTA visible in detail header at all widths.

## Files to change

- `src/pages/agent/AgentMatchesHub.tsx` — grid widths, drawer trigger, breakpoints.
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx` — header with CTA, metrics strip above tabs, wrapping tabs, no horizontal scroll.
- `src/features/matches/components/inbox/InboxList.tsx` — wrapping filter chips + "More" popover.
- `src/features/matches/components/inbox/DealRoomPanel.tsx` — tighter spacing.
- `src/features/matches/components/inbox/LifecycleTracker.tsx` — compact horizontal variant.
- `src/features/matches/components/inbox/inboxHelpers.ts` — add `derivePrimaryAction` helper.
- `src/features/matches/components/inbox/NextActionCard.tsx` — consume shared helper (no behavior change).

No DB, auth, sidebar, or routing changes.

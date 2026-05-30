## Goal

Stabilize the existing Matches page layout. No new features, no redesign — fix containment, overflow, scrolling, and image bugs so the 3-panel layout looks professional.

## Files to change

1. `src/pages/agent/AgentMatchesHub.tsx` — outer grid containment
2. `src/features/matches/components/inbox/InboxList.tsx` — leave mostly as-is, verify overflow
3. `src/features/matches/components/inbox/PropertyMatchCard.tsx` — keep compact; ensure no overflow
4. `src/features/matches/components/inbox/PropertyReviewPanel.tsx` — fix internal scroll structure (only content area scrolls, not whole panel; hero + header sticky-ish at top)
5. `src/features/matches/components/inbox/DealRoomPanel.tsx` — wrap in a single card container with internal scroll
6. New helper `src/features/matches/components/inbox/propertyImage.ts` — neutral real-estate placeholder fallback used by both card + hero

## Layout fixes

### Outer page (`AgentMatchesHub.tsx`)
- Wrap in `flex h-[calc(100vh-7rem)] min-h-0 flex-col gap-4 overflow-hidden` so the page itself never scrolls horizontally and the grid takes remaining height.
- Grid: `grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[360px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)_360px]`.
  - Fixed left + right widths (no percentages → no bleed at 1202px).
  - Center uses `minmax(0,1fr)` so it can shrink without pushing siblings.
- Each column wrapper: `min-w-0 min-h-0 flex` (prevents grid blowout from long content).
- Remove the dangling `lg:hidden` "Take action" button — Deal Room is visible at lg+, so this only shows md range. Keep it.
- Remove header from inside the grid height calc by keeping it outside `flex-1`.

### Left — `InboxList.tsx`
- Container already `rounded-xl border bg-card overflow-hidden` (add `overflow-hidden`).
- Search + filter tabs stay at top, only list scrolls (already correct).
- Verify filter tab row uses `overflow-x-auto` and doesn't push the panel width — wrap in `min-w-0`.

### Inbox card — `PropertyMatchCard.tsx`
- Already compact 80px thumb. Add `min-w-0` to body, keep `overflow-hidden` on root, ensure thumbnail uses placeholder fallback (see image fix).
- No giant hero image inside card — already the case.

### Center — `PropertyReviewPanel.tsx`
- Restructure into 3 zones inside `flex h-full min-h-0 flex-col rounded-xl border bg-card overflow-hidden`:
  1. Hero image: `h-48 shrink-0 overflow-hidden` with `img object-cover w-full h-full`.
  2. Header (title/price/score): `shrink-0 border-b px-5 py-4`.
  3. Tabs: `flex min-h-0 flex-1 flex-col`. Tabs list `shrink-0`. Tab content panes use `min-h-0 flex-1 overflow-y-auto p-5`.
- This removes the current `overflow-y-auto` on the outer container, so we get exactly ONE internal scroll (content area), not the whole panel scrolling.

### Right — `DealRoomPanel.tsx`
- Wrap in `flex h-full min-h-0 flex-col rounded-xl border bg-card overflow-hidden`.
- Inside: `min-h-0 flex-1 overflow-y-auto p-4 space-y-4` containing the four cards.
- Removes the cramped feel by giving consistent padding and one scroll container.

## Image fix

Create `propertyImage.ts`:

```ts
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=70&auto=format&fit=crop", // neutral commercial building
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=70&auto=format&fit=crop", // multifamily
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=70&auto=format&fit=crop", // office
];
export function propertyImage(url: string | null, key: string) {
  if (url) return url;
  const h = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PLACEHOLDERS[h % PLACEHOLDERS.length];
}
```

Use in `PropertyMatchCard` and `PropertyReviewPanel` instead of the `Building2` icon fallback (icon kept as ultimate `onError` fallback). Always render an `<img>` and let it be cropped via `object-cover` inside a fixed-aspect container.

## Responsive

- `lg` (≥1024px): 3 columns with fixed left/right widths.
- `md` (768–1023px): 2 columns (inbox + detail); Deal Room becomes the existing Sheet drawer triggered by "Take action" button.
- `< md`: stacked, inbox first, selection toggles `mobileDetailOpen` to show detail; sticky bottom "Take action" already wired.
- No horizontal overflow: every column has `min-w-0` and `overflow-hidden`; long strings already use `truncate`.

## Acceptance check

After changes, smoke test at 1202px:
- 380 + 16 + flexible + 16 + 360 fits within 1202 minus sidebar — leaves ~430px for center, acceptable.
- Verify no horizontal scrollbar.
- Inbox cards stay in left column; selected detail only in center; Deal Room only in right.
- Hero image cropped to `h-48`; tabs scroll inside center; right panel has one scroll.

## Out of scope

No new features, no schema/auth/routing/sidebar changes, no business-logic edits.

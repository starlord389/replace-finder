Plan: focused Matches scroll/overflow fix

Scope constraints:
- Do not redesign the Matches page.
- Do not add features.
- Do not change database schema, auth, routing, sidebar navigation, or unrelated pages.

What I found:
- The Matches page currently uses a fixed `h-[calc(100vh-7rem)]` inside a parent `<main>` that does not establish a full-height flex boundary. This makes the page height compete with the app shell header and main padding.
- `PropertyReviewPanel` keeps the hero, header, and metric strip outside the scrollable area, while only the tabs content scrolls. If the fixed sections consume too much vertical space, deeper listing content becomes unreachable or feels cut off.
- The two-column grid and inbox already use many correct `min-h-0` / `min-w-0` patterns, but the page/app-shell height chain needs to be made explicit and stable.

Implementation steps:
1. Stabilize the app shell height chain in `AgentLayout.tsx`
   - Change the app shell from minimum-height behavior to viewport-height behavior.
   - Make the content column `min-h-0` and `overflow-hidden`.
   - Make `<main>` a flex column with `min-h-0`, `overflow-hidden`, and `min-w-0`, so route pages can own their internal scrolling instead of relying on page/body scroll.

2. Stabilize the Matches page wrapper in `AgentMatchesHub.tsx`
   - Replace the brittle `h-[calc(100vh-7rem)]` with `h-full min-h-0 min-w-0` so it inherits the app shell’s available height.
   - Keep the Matches header and `ExchangeContextBar` as `shrink-0`.
   - Ensure the two-column grid is `min-h-0 min-w-0 flex-1 overflow-hidden`.
   - Ensure both inbox and detail column wrappers are `h-full min-h-0 min-w-0 overflow-hidden`.
   - Keep the mobile back row outside the scroll area, but ensure the actual detail panel receives a bounded `flex-1 min-h-0` container.

3. Make the selected property detail panel the intended scroll container in `PropertyReviewPanel.tsx`
   - Keep the outer card as `h-full min-h-0 min-w-0 overflow-hidden`.
   - Move the vertical scrolling responsibility to one clear internal detail scroll area.
   - Include the full listing review content in that scroll area so hero image, header, financial metrics, tabs, overview, financials, why matched, documents, activity, and conversation are all reachable.
   - Avoid additional nested scrollbars inside the tab content; tabs can remain part of the same property-detail scroll flow.
   - Preserve existing visual hierarchy and existing content; only adjust height/overflow structure.

4. Verify inbox scroll remains independent in `InboxList.tsx`
   - Keep search/filter controls fixed within the inbox card.
   - Keep only the match list area as `flex-1 min-h-0 overflow-y-auto`.
   - Add/confirm `overscroll-contain` where useful to avoid scroll chaining without introducing nested page scrollbars.

Expected files changed:
- `src/components/layout/AgentLayout.tsx`
- `src/pages/agent/AgentMatchesHub.tsx`
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx`
- Possibly `src/features/matches/components/inbox/InboxList.tsx` only if a small scroll-containment class is needed.

Acceptance checks after implementation:
- The app shell/sidebar remains fixed.
- Matches header and exchange context remain visible.
- Inbox list scrolls independently.
- Selected property detail column scrolls independently through the full listing content.
- No horizontal page overflow.
- No property detail content is cut off or unreachable on desktop.
# Plan: Remove "Open workspace" link + clarify bug sweep scope

## Part 1 — Remove "Open workspace" (concrete fix)

**Why it does nothing:** The link in `PropertyReviewPanel.tsx` (line 116-120) routes to `/agent/workspace/${rel.buyerExchangeId}`. When you're already on `/agent/workspace/:id`, clicking it navigates to the same URL you're already on, so visually nothing happens. It was originally added so users on the global `/agent/matches` page could pivot into the per-listing workspace, but it now renders in both places and is confusing in the workspace view.

**Change:**
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx`
  - Delete the `<Button asChild>` block on lines 116-120 (the "Open workspace" link).
  - Remove now-unused imports: `Link` from `react-router-dom` and `ExternalLink` from `lucide-react` (only if not used elsewhere in the file — will verify before removing).

That's it for this fix — single component, no routing or data changes.

## Part 2 — Sitewide bug sweep (needs scoping)

"Identify bugs and issues throughout the site and fix them" is too broad to action safely in one pass. The app has many surfaces (Launchpad, Dashboard, My Clients, Pipeline, Listings, Matches, Workspace, client intake, matching engine, auth, etc.) and "bug" can mean console errors, broken buttons, layout glitches, dead links, slow loads, copy issues, or logic bugs in matching/scoring. Fixing everything blindly risks regressions in flows you haven't asked me to touch.

**Proposed approach** — after you approve Part 1, I'll do a focused triage pass and come back with a prioritized list before changing anything:

1. Crawl the main authenticated routes in the preview and capture console errors + network failures.
2. Click through the primary flows (open a client → open a listing → open a match → send to client / not a fit / request seller details).
3. Check obvious dead/no-op buttons and broken links (like the one you just reported).
4. Note layout/responsiveness issues at the current viewport.

I'll return with a numbered list of issues grouped by severity (broken > confusing > polish), and you pick which ones to fix. No code changes during triage.

## Questions before I start Part 2

1. **Scope** — should the sweep cover only the agent-side surfaces (Launchpad, Dashboard, My Clients, Pipeline, Listings, Matches, Workspace), or also client-side and admin pages?
2. **Severity bar** — do you want only broken/no-op things fixed, or also UX polish (spacing, copy, hover states)?
3. **Auto-fix vs. review** — for clearly broken things found during triage (dead buttons, console errors), do you want me to fix them immediately, or list everything first and have you approve?

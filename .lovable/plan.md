## Goal

Rebuild the Agent Launchpad so it reflects today's product (Clients, Listings, Matches, Pipeline) with grouped sections, per-step status chips, richer inline guidance, and a high-level matching explainer (no exact weights).

## New structure

Two grouped sections rendered as cards:

**1. Setup — Get your workspace ready**
- Complete your profile — `/agent/settings` — brokerage details, specializations, bio.
- Add your first client — `/agent/clients/new` — represent a real 1031 exchanger.
- Create your first listing — `/agent/exchanges/new` — pledge property, financials, replacement criteria.

**2. Daily workflow — Run your pipeline**
- Understand how matching works — inline expand — high-level explainer (no exact weights).
- Review your matches — `/agent/matches` — evaluate matched properties for your clients.
- Move deals forward in Pipeline — `/agent/pipeline` — track stages from match to close.

## Status chips per step

Each step shows one chip on the right based on `useAgentLaunchpadProgress` data:
- "Done" — green, when complete
- "Needs attention" — amber, when step is current/next actionable
- "Not started" — muted, otherwise (later steps that are gated)
- Inline matching step: "Read" once expanded; otherwise "Not started"

The first incomplete step gets "Needs attention"; remaining incomplete steps get "Not started".

## Matching explainer (high-level)

Three small cards inside the expandable matching step:
- "Your client's criteria" — price range, geography, asset type, strategy, financial fit, timing.
- "Rules-based scoring" — every potential match is ranked across those dimensions. No AI, no public browse.
- "Private review" — only matches you approve are surfaced to your client; clients never browse a public marketplace.

Plus a muted footnote: "45-day identification and 180-day close windows shape urgency on every exchange."

## Inline tips per step

Below each step's description, one short muted "Tip:" line (e.g. "Tip: Specializations help us route the right matches your way."). Tips are static strings in the content file.

## Files

`src/content/agentLaunchpad.ts`
- Replace `AGENT_LAUNCHPAD_STEPS` and `AGENT_LAUNCHPAD_GROUPS` with the new 6 steps grouped into "setup" and "workflow", each step gaining a `tip: string`, accurate `href`, and accurate copy.
- Step IDs stay: `profile`, `client`, `exchange`, `matching`, `matches`, `connection` → rename `connection` to `pipeline`. Update the `AgentLaunchpadStepId` union accordingly.
- Update `matches` href to `/agent/matches` (was `/agent/pipeline`).
- Update `pipeline` step (replacing `connection`) href to `/agent/pipeline`.

`src/features/agent/hooks/useAgentLaunchpadProgress.ts`
- Rename `connectionCount` semantics: replace with `pipelineActivity` derived from any non-`new` match for the agent's exchanges (reuse the matches we already fetch — count rows where `status != 'new'` or there are messages). Simpler: keep the connections count query as a proxy for "pipeline activity"; just rename the returned field to `pipelineActivity`. No schema changes.

`src/pages/agent/AgentLaunchpad.tsx`
- Render the two grouped sections instead of one flat list.
- Compute `firstIncompleteIndex` to drive the "Needs attention" chip.
- Pass a new `status: "done" | "attention" | "todo"` prop into `LaunchpadChecklistCard`.
- Replace the inline matching content with the new 3-card high-level explainer (no percentages).
- Keep the overall progress bar, completion banner, and "Go to dashboard" action.
- Keep `launchpad_completed_at` write + `LAUNCHPAD_VERSION` bumped to `"v2"`.

`src/components/agent/LaunchpadChecklistCard.tsx`
- Add optional `status` prop. If provided, render a small right-side chip: green "Done", amber "Needs attention", muted "Not started". Falls back to current check-icon behavior when status is omitted.
- Render an optional `tip` below the description in muted small text.

`src/test/agent-launchpad-progress.test.ts`
- Update assertions for the renamed field (`pipelineActivity` instead of `connectionCount`).

## Out of scope

- No DB migrations.
- No nav changes.
- No new pages or routes.
- No exposure of exact scoring weights.
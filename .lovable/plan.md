The Launchpad link is currently only shown while the agent hasn't completed it (`launchpadIncomplete`). Once completed, it disappears from the nav dropdown and mobile menu.

To make it reachable again, add the Launchpad link unconditionally in both the desktop profile dropdown and the mobile Sheet menu, keeping it grouped near Settings/Help.

Files to edit:
- `src/components/layout/AgentTopNav.tsx` — remove the `launchpadIncomplete &&` guard so the Launchpad link always renders in both desktop dropdown and mobile menu.

No other changes needed. The `/agent/launchpad` route and page remain unchanged.
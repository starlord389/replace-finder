## Remove Self-Certified badge

The green "Self-Certified" badge shows next to the brokerage name in the agent dashboard header (`src/pages/agent/AgentDashboard.tsx`, lines 130–138). I'll remove just the verified branch so non-suspended agents see no badge, while keeping the red "Suspended" indicator for suspended accounts (still important for status visibility).

### Changes
- **`src/pages/agent/AgentDashboard.tsx`**: Remove the `isVerifiedAgent` branch (ShieldCheck + `verificationUi.badgeLabel`). Render only the Suspended indicator when applicable. Clean up the now-unused `ShieldCheck` import if no longer referenced.

### Not touched
- `src/lib/agentVerification.ts` and its tests stay as-is — the helper is still used for `description` text in the suspended banner and may be reused elsewhere.
- No other pages reference the "Self-Certified" label.
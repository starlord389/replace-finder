## Merge Profile into Settings

`AgentProfile` and `AgentSettings` overlap heavily (name, phone, brokerage, bio, specializations are in both). Consolidate to a single `/agent/settings` page.

### Changes

**1. AgentSettings.tsx — add missing profile fields**
Merge the Profile-only fields into the Profile tab of Settings:
- Avatar/photo upload (Supabase `agent-avatars` bucket)
- License state + license number
- Years experience
- Reuse existing brokerage/bio/specializations inputs (no duplication)

**2. Route + sidebar cleanup**
- Remove the "My Profile" sidebar item in `AgentSidebar.tsx`.
- In `App.tsx`, redirect `/agent/profile` → `/agent/settings` so any old links (e.g. counterpart profile cards, notification deep links) still land somewhere valid.
- Delete `src/pages/agent/AgentProfile.tsx` and its import.

**3. Keep `AgentProfileCard` untouched**
The read-only counterpart view component stays — it's used to show another agent's public profile inside connection pages, not for self-editing.

### Result

One settings page with tabs: **Profile · Notifications · Security · Account**. Profile tab owns everything an agent edits about themselves; sidebar shows a single "Settings" entry.

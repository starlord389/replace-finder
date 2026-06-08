# Client Detail Page Redesign

Rebuild `/agent/clients/:clientId` as a tabbed page modeled after the Settings UI — clean header + Tabs with focused sections — replacing the current overview + separate edit route with a single unified destination.

## Page structure

```
[Back to clients]
Client Name                                     [Status badge]
client@email.com · 555-1234 · Acme Co

[Profile] [Listings] [Matches] [Activity] [Danger Zone]
```

Header is compact (no big colored card). Tabs match the Settings page pattern (icon + label, `grid w-full grid-cols-5`).

## Tabs

### 1. Profile (default)
Editable form, same fields as today plus Settings-style polish:
- Card "Contact Information": Full Name, Email, Phone, Company
- Card "Notes": multiline notes about exchange goals / timeline
- Card "Platform Access" (only if not yet `client_user_id`): invite link generator, copy button, expiration, regenerate — moved from current edit page
- Save Changes button at bottom of each card form

### 2. Listings
Reuses the existing `ClientPropertyCards` grid (current overview body). Adds a small toolbar with "New listing" CTA and a count summary. Empty state already handled by the component.

### 3. Matches
New tab. For this client, lists all property matches across their exchanges:
- Queries `matched_property_access` (or existing match relationships) joined to exchanges where `client_id = :clientId`
- Cards grouped by listing, showing matched replacement property name, fit score, status (new/interested/connected), and a link to the workspace match view
- Empty state: "No matches yet for this client's listings."

### 4. Activity
Timeline of key events for this client:
- Client added
- Each exchange created
- Status changes on exchanges
- Invite sent / accepted
Pulled from `exchanges` rows + `client_invites` rows, sorted desc. Simple list with timestamp + icon + description. Lightweight — no new tables.

### 5. Danger Zone
Settings-style destructive actions card:
- Deactivate client (existing flow, with confirm dialog) — only if `status === 'active'`
- Reactivate client — only if inactive
- Delete client (new): confirm dialog requiring typing client name; only enabled when client has zero exchanges. If exchanges exist, button is disabled with explanatory copy ("Archive/deactivate instead — this client has N exchanges").

## Routing changes
- `/agent/clients/:clientId` continues to render the new unified page (renamed component or replacement of `AgentClientOverview`)
- `/agent/clients/:id/edit` redirects to `/agent/clients/:id` (Profile tab is the editor now), keeping old links working
- `/agent/clients/new` continues to use `AgentClientDetail` for the add-client flow only (simpler create form)

## Files

New / edited:
- `src/pages/agent/AgentClientOverview.tsx` — rebuilt as the tabbed page (rename internal usage, keep route)
- `src/features/clients/components/ClientProfileTab.tsx` — editable profile + invite card
- `src/features/clients/components/ClientMatchesTab.tsx` — new
- `src/features/clients/components/ClientActivityTab.tsx` — new
- `src/features/clients/components/ClientDangerZoneTab.tsx` — deactivate/reactivate/delete
- `src/App.tsx` — redirect `/agent/clients/:id/edit` → `/agent/clients/:id`
- `src/pages/agent/AgentClientDetail.tsx` — trimmed to add-client only (or kept as-is and only used on `/new`)

No database/schema changes. No business-logic changes beyond surfacing existing data (matches, invites, exchanges).

## Visual style
Matches Settings: `max-w-3xl` container, small page title, Tabs with `grid w-full grid-cols-5`, each tab content composed of one or more `Card`s with `CardHeader` (title + description) and `CardContent` housing the form/list. Save buttons inline, toasts on success.

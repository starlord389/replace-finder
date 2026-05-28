## Audit results

I checked every file in `src/pages` against `App.tsx` routes **and** against every `<Link>`/`to=`/`href=` in the codebase (nav, footer, sidebars, in-page CTAs). All agent and admin pages are reachable from the sidebars. The marketing/public area is where the dead weight is.

### Orphan pages (routed but nothing links to them)

The public header/footer (`src/content/publicNavLinks.ts`) points to **homepage anchors** (`/#process`, `/#feature`, `/#contact`) — the standalone pages below were superseded but never deleted.

| Page | Lines | Inbound links | Status |
|---|---|---|---|
| `pages/HowItWorks.tsx` | 231 | none — nav goes to `/#process` | orphan |
| `pages/Features.tsx` | 71 | none — nav goes to `/#feature` | orphan |
| `pages/Contact.tsx` | 47 | only from BookDemo (also orphan) | orphan |
| `pages/Pricing.tsx` | 59 | none anywhere | orphan |
| `pages/BookDemo.tsx` | 425 | only from Pricing (also orphan) | orphan |
| `pages/Unavailable.tsx` | 21 | none anywhere | orphan |

Total: **~854 lines** of unreachable page code + their routes.

### Pages that stay (verified reachable)

- `Index`, `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `AuthCallback`, `NotFound`
- All `pages/agent/*` — reachable via `AgentSidebar`
- All `pages/admin/*` — reachable via `AdminSidebar`

## Proposed cleanup

### 1. Delete orphan page files
- `src/pages/HowItWorks.tsx`
- `src/pages/Features.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/BookDemo.tsx`
- `src/pages/Unavailable.tsx`

### 2. Remove their routes from `src/App.tsx`
Drop the 5 `<Route>` lines for `bookDemo`, `howItWorks`, `contact`, `features`, `pricing`, plus the `unavailable` route. Remove the matching imports.

### 3. Clean `src/app/routes/routeManifest.ts`
Remove `bookDemo`, `contact`, `features`, `pricing`, `howItWorks`, `unavailable` keys from `ROUTES`.

### 4. Clean `src/components/layout/PublicLayout.tsx`
Remove the `ROUTES.bookDemo` references used to toggle layout chrome.

### 5. Sweep for any newly-unused imports
After deletion, scan for components/assets only used by the deleted pages (e.g. any `BookDemo`-specific form components, hero images) and remove them too. I'll only delete things with zero remaining references.

### What I will NOT touch
- The homepage anchor sections (`#process`, `#feature`, `#contact`) — those are the live replacements.
- Any agent/admin code.
- Auth pages.

## Open question

The homepage `#contact` section — do you want me to keep a dedicated `/contact` URL as a redirect to `/#contact` for any old inbound links/SEO, or just delete it cleanly? Default: delete cleanly unless you say otherwise.

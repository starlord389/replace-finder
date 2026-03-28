

# 1031ExchangeUp.com — Implementation Plan

## Overview

Build a private 1031 replacement-property matching platform with a premium, minimalist UI. The build follows 6 rounds, each delivering a testable increment.

---

## Round 1: Foundation — Design System, Auth, Roles, Public Shell

**What we build:**
- Design system: color tokens, typography scale (Inter body, SF Pro-inspired headings), spacing, card/panel components, button variants — all premium/minimal
- Tailwind theme configuration with brand palette (neutral base, single restrained accent)
- Supabase project setup via Lovable Cloud: Auth (email/password), `profiles` table with trigger on signup, `user_roles` table with `app_role` enum (`client`, `broker`, `admin`)
- RLS policies + `has_role()` security-definer function
- Route structure: public routes (`/`, `/how-it-works`), auth routes (`/login`, `/signup`), client routes (`/dashboard/*`), admin routes (`/admin/*`)
- Auth-guarded layout wrappers for client and admin sections
- Homepage: hero with headline + CTA, 3-step "How It Works", trust/credibility section, product preview mockup, final CTA
- Simple responsive nav (logo, Login, "Start Your Search" CTA)

**Files created/modified (~15 files):**
- `tailwind.config.ts` — theme tokens
- `src/index.css` — typography, base styles
- `src/components/layout/PublicLayout.tsx`
- `src/components/layout/ClientLayout.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/pages/Index.tsx` — homepage
- `src/pages/HowItWorks.tsx`
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Signup.tsx`
- `src/App.tsx` — all routes
- Supabase migrations for `profiles`, `user_roles`, RLS

---

## Round 2: Request Intake + Admin Request Queue

**What we build:**
- Multi-step intake form for exchange clients:
  - Step 1: Relinquished property (address, type, estimated value)
  - Step 2: Economics (equity, debt, exchange proceeds, basis)
  - Step 3: Replacement goals (target price range, asset types, strategies)
  - Step 4: Geography preferences (states, metros, radius)
  - Step 5: Timing (45-day ID deadline, 180-day close, urgency)
  - Step 6: Review & submit
- Database tables: `exchange_requests`, `exchange_request_preferences`, `exchange_request_status_history`
- RLS: clients see only their own requests
- Admin request queue page (`/admin/requests`): list all requests, filter by status, click into detail
- Admin request detail: view full submission, add `admin_notes`, change status (submitted → under_review → active → closed)
- Status history tracking on every transition

**Files created/modified (~12 files):**
- `src/pages/client/NewRequest.tsx` — multi-step form
- `src/components/request/*` — step components
- `src/pages/client/MyRequest.tsx` — request status view
- `src/pages/admin/RequestQueue.tsx`
- `src/pages/admin/RequestDetail.tsx`
- Supabase migrations for request tables, status enum, RLS policies

---

## Round 3: Internal Inventory Management (Admin Only)

**What we build:**
- Admin inventory CRUD (`/admin/inventory`):
  - Add/edit property: address, city, state, zip, asset type, strategy type, status, description
  - Financials tab: price, cap rate, NOI, cash-on-cash, debt terms, occupancy
  - Media tab: upload images + documents to Supabase Storage
  - Source tab: source type, source contact, date added, notes
- Database tables: `inventory_properties`, `inventory_financials`, `inventory_images`, `inventory_documents`, `inventory_source_metadata`
- RLS: only admins can read/write inventory tables (no client access to raw inventory)
- Admin inventory list with filters (state, asset type, strategy, price range, status)

**Files created/modified (~10 files):**
- `src/pages/admin/InventoryList.tsx`
- `src/pages/admin/InventoryDetail.tsx`
- `src/components/inventory/*` — form sections
- Supabase migrations for inventory tables, storage bucket, RLS

---

## Round 4: Matching Engine + Admin Match Workflow

**What we build:**
- Supabase Edge Function: `run-matching`
  - Input: `exchange_request_id`
  - Loads request + preferences, loads all active inventory
  - Scores each property across 6 dimensions:
    - Price/Scale fit (25%) — proceeds vs. property price
    - Geography fit (20%) — state/metro match, distance
    - Asset type fit (20%) — type alignment
    - Strategy fit (15%) — strategy alignment
    - Financial fit (10%) — cap rate, cash flow vs. goals
    - Timing fit (10%) — availability vs. deadline
  - Produces `match_runs` record + `exchange_matches` rows with component scores, overall score, admin explanation, user explanation
- Admin match review page (`/admin/matches`):
  - View match run results per request
  - See scoring breakdown per match
  - Approve or dismiss each match
  - On approval: create `matched_property_access` record → user can now see this property
- Database tables: `match_runs`, `exchange_matches`, `matched_property_access`
- RLS: matches visible to admin; `matched_property_access` gates client visibility

**Files created/modified (~8 files):**
- `supabase/functions/run-matching/index.ts` — Edge Function
- `src/pages/admin/MatchReview.tsx`
- `src/components/admin/MatchScoreCard.tsx`
- Supabase migrations for match tables, access table, RLS

---

## Round 5: Client Dashboard + Private Match Experience

**What we build:**
- Client dashboard (`/dashboard`):
  - Request status card with timeline/progress indicator
  - Approved matches section with polished match cards (property summary, match score label like "Strong Match", thumbnail)
  - Notifications list
- Private matched-property detail page (`/dashboard/match/:id`):
  - Property header with images
  - Key financials panel
  - "Why This Matched" explanation section (user-facing)
  - Documents section (downloadable)
  - Location info
  - Clear "Express Interest" CTA button
- Notification system:
  - `notifications` table with type enum (request_submitted, under_review, request_active, no_matches, new_match)
  - In-app notification badge + list
  - Admin can trigger notifications on status changes and match approvals
- RLS: clients only see notifications and matches tied to their user ID via `matched_property_access`

**Files created/modified (~10 files):**
- `src/pages/client/Dashboard.tsx`
- `src/components/client/RequestStatusCard.tsx`
- `src/components/client/MatchCard.tsx`
- `src/pages/client/MatchDetail.tsx`
- `src/components/client/NotificationList.tsx`
- Supabase migrations for notifications table, RLS

---

## Round 6: Polish, Security Audit, SEO

**What we build:**
- Full RLS audit: verify no client can access raw inventory, only approved matches
- Loading states, error boundaries, empty states for all views
- SEO meta tags on public pages
- Responsive polish across all breakpoints
- 404 page styling
- Form validation refinement
- Accessibility pass (focus states, aria labels, contrast)
- Favicon and OG image

---

## Technical Decisions (using defaults unless you override)

| Decision | Default |
|---|---|
| Accent color | `#2563EB` (blue-600) — trust, premium |
| Auth method | Email/password only (Phase 1) |
| Match score display | Qualitative labels ("Strong Match", "Good Fit") |
| Express Interest action | Simple flag saved to DB + admin notified |
| Request form length | Full 6-step (comprehensive upfront) |
| Broker role | Deferred to Phase 2 |
| Email notifications | Deferred (in-app only Phase 1) |

---

## Founder Decisions Needed Before Starting

Before I begin Round 1, please confirm or override:

1. **Accent color** — go with blue-600 or provide brand colors?
2. **Match score display** — qualitative labels or numeric (82/100)?
3. **Request form** — 6 steps comprehensive, or shorter 3-step initial version?
4. **"Express Interest" action** — simple flag, or something more?
5. **Auth** — email/password only, or add Google OAuth now?


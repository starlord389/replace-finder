

# Add Draft & Edit Capability to Exchange Requests

## Overview
Allow users to save exchange requests as drafts, edit drafts/submitted/active requests, and re-submit edited active requests (which resets status to "submitted").

## Database Changes

### 1. Add "draft" to `request_status` enum
Migration to add the new enum value:
```sql
ALTER TYPE public.request_status ADD VALUE 'draft';
```

## Code Changes

### 2. `src/lib/constants.ts` — Add draft status label/color
- Add `draft: "Draft"` to `REQUEST_STATUS_LABELS`
- Add `draft: "bg-muted text-muted-foreground"` to `REQUEST_STATUS_COLORS`

### 3. `src/pages/client/NewRequest.tsx` — Support draft saving + editing existing requests
- Accept an optional `requestId` prop (or read from URL param like `/dashboard/exchanges/:id/edit`)
- On mount, if editing: fetch the existing `exchange_requests` + `exchange_request_preferences` data and populate the form
- Add a "Save as Draft" button alongside the existing "Submit" button on every step
- Save as Draft: upserts the request with `status: 'draft'`
- Submit: upserts with `status: 'submitted'`
- When editing an `active` request and re-submitting, set status back to `submitted`
- For existing requests, use `update` instead of `insert`; for preferences use `upsert` (on `request_id`)

### 4. `src/App.tsx` — Add edit route
- Add route: `/dashboard/exchanges/:id/edit` → `NewRequest` component

### 5. `src/pages/client/ExchangeDetail.tsx` — Add Edit button
- Show an "Edit" button when status is `draft`, `submitted`, or `active`
- Links to `/dashboard/exchanges/:id/edit`

### 6. `src/pages/client/ExchangeList.tsx` — Show draft badge, edit action
- Draft requests show a "Draft" badge (already handled by constants)
- Clicking a draft row goes to the detail page (same as now); edit is available from there

## Flow
1. User starts new request → can "Save as Draft" at any step or "Submit" at step 6
2. User opens a draft → clicks Edit → resumes the wizard with all fields pre-filled → submits
3. User opens a submitted/active request → clicks Edit → modifies fields → re-submits → status resets to "submitted"

## What stays the same
- Admin pages untouched
- RLS policies already allow users to update their own requests
- No new tables needed




# Admin Request Detail: Complete Data View + Pipeline Status Management

## Overview
Rewrite `src/pages/admin/RequestDetail.tsx` to display all 60+ client-submitted fields and replace the free-form status buttons with pipeline-restricted transitions that require confirmation dialogs with mandatory notes.

## Part 1: Expanded Data Sections (Main Content Area)

### Relinquished Property (expanded)
Add: Property Name, Asset Subtype, Property Class, Investment Strategy (using STRATEGY_TYPE_LABELS). Keep existing address, type, value, description.

### New: Physical Description
Show Units, Building SF, Land Area, Year Built, Num Buildings, Num Stories, Parking (spaces + type), Construction/Roof/HVAC Type, Property Condition, Zoning, Recent Renovations (text block), Amenities (pill badges). Only render fields with data.

### Exchange Economics (expanded)
Add: Current NOI, Current Cap Rate (calculate from NOI/Value if missing), Current Occupancy Rate, Average Rent Per Unit.

### New: Income & Expenses
Financial table format (label left, currency right-aligned) for: Gross Scheduled Income, Effective Gross Income, Real Estate Taxes, Insurance, Utilities, Management Fee, Maintenance/Repairs, CapEx Reserves, Other Expenses. Hide entire section if no data.

### New: Debt Details
Current Loan Balance, Interest Rate, Loan Type, Maturity Date, Annual Debt Service, Prepayment Penalty (Yes/No + details). Hide section if no debt data.

### Replacement Goals (expanded)
Add: Target Occupancy Min, Target Year Built Min, Target Property Classes (badges), Open to DSTs/TICs (Yes/No badges), Urgency (using URGENCY_OPTIONS label lookup).

### Timing (unchanged)

### New: Client Photos
Fetch `request_images` for the request. Display in responsive 3-column grid with rounded corners, hover scale effect. Section header shows count: "Client Photos (X)". Click opens image in a Dialog modal. Hide if no photos.

## Part 2: Pipeline-Restricted Status Management

### Remove
The current row of 4 status buttons below the header.

### Add: Status Actions Card (top of sidebar)
New card showing only valid next-status buttons based on current status:
- `draft` → "Mark as Submitted" (→ submitted)
- `submitted` → "Begin Review" (→ under_review)
- `under_review` → "Activate" (→ active) + "Close Request" (→ closed)
- `active` → "Close Request" (→ closed)
- `closed` → "Reopen" (→ active)

Button styling: forward progression = primary/blue, close = outline/destructive-ish, reopen = outline/secondary.

### Confirmation Dialog (AlertDialog)
Each button opens an AlertDialog with:
- Title: "Change status to [label]?"
- Required Textarea with contextual placeholder per action type
- Confirm button disabled until note is entered
- On confirm: update status, insert history row WITH note, refresh UI, toast

### Status History Enhancement
Show the `note` field for each history entry (if present) as italic text below the status change line.

## Data Loading
Add one fetch to `loadData()`:
```
supabase.from("request_images").select("*").eq("request_id", id).order("sort_order")
```

## New State
- `photos: Tables<"request_images">[]`
- `statusDialogOpen: boolean`
- `pendingStatus: Enums<"request_status"> | null`
- `statusNote: string`
- `lightboxPhoto: string | null`

## New Imports
- `AlertDialog` components from shadcn
- `Dialog` components for photo lightbox
- `Badge` for amenities/property classes
- Additional lucide icons as needed

## Files Changed
1. `src/pages/admin/RequestDetail.tsx` — full rewrite (~500-600 lines)

No database changes. No new dependencies. No other files changed.


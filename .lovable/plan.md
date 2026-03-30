

# Expanded Help & Support Page + Support Ticket System

## Overview
Two changes: (1) expand the Help page with comprehensive FAQs, how-tos, and platform explainers using an accordion layout, plus a support contact form that creates tickets in the database, and (2) add an admin Support Tickets page to view and manage submitted tickets.

## Database Changes

### Migration: Create `support_tickets` table
```sql
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status ticket_status NOT NULL DEFAULT 'open',
  admin_notes text,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tickets
CREATE POLICY "Users can insert own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## File Changes

### 1. `src/pages/client/Help.tsx` — Full rewrite

Restructure into sections:

**Section A: FAQ Accordion** — Organized by category using shadcn Accordion:
- **Getting Started** (4-5 items): What is 1031ExchangeUp, how to create account, how to submit first request, what info do I need, how long does review take
- **Exchange Requests** (4-5 items): Can I have multiple requests, can I edit after submitting, what statuses mean, what happens when request expires, how are deadlines tracked
- **Matching & Properties** (4-5 items): How matching works, what the scores mean, why some matches score higher, how often is matching run, what if no matches found
- **Reviewing Matches** (3-4 items): What happens after expressing interest, can I pass and change mind later, who do I contact about a property, how to read the financial analysis
- **Account & Privacy** (3-4 items): Is my data confidential, how to update profile, can I delete account, who sees my information

**Section B: How-To Guides** — Card grid with brief guides:
- How to submit your first exchange request
- How to review and respond to matches
- Understanding your match scores
- Reading the financial analysis page

Each card links to the relevant page or shows inline content.

**Section C: Contact & Support Form**
- Category dropdown (General Question, Technical Issue, Match Question, Account Issue, Other)
- Subject text input
- Message textarea
- Submit button → inserts into `support_tickets` with user_id
- Success toast on submit
- Below the form: show list of user's past tickets with status badges

### 2. `src/pages/admin/SupportTickets.tsx` — New page

Admin view of all support tickets:
- Table with columns: Date, User Email (fetch from profiles), Category, Subject, Status, Actions
- Filter by status (open/in_progress/resolved/closed)
- Click row to expand inline or open detail:
  - View full message
  - Update status dropdown
  - Admin notes textarea (save on blur/button)
- Badge colors: open=blue, in_progress=amber, resolved=green, closed=gray

### 3. `src/components/layout/AdminLayout.tsx` — Add nav link
Add `{ to: "/admin/support", label: "Support" }` to `adminLinks` array.

### 4. `src/App.tsx` — Add routes
- Import `SupportTickets` from `@/pages/admin/SupportTickets`
- Add route: `<Route path="/admin/support" element={<SupportTickets />} />`

## Technical Details
- FAQ content is hardcoded (no DB needed for static content)
- Support form uses react-hook-form + zod validation
- Tickets query uses `supabase.from('support_tickets')` with appropriate filters
- Admin page joins with `profiles` table to show user email
- All existing UI patterns maintained (shadcn Card, Badge, Table, Accordion)


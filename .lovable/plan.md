

# Bug Fixes — Navbar Routing + 2 DB Constraint Fixes

## 1. Fix Navbar agent routing
**File:** `src/components/layout/Navbar.tsx`

Update two lines to add agent-specific routing:
- `dashboardLink`: add `profileRole === "agent" ? "/agent"` branch
- `dashboardLabel`: add `profileRole === "agent" ? "Dashboard"` branch

## 2. Migration: notification types CHECK constraint
Add missing types (`connection_request`, `connection_accepted`, `connection_declined`, `connection_milestone`, `connection_failed`, `deadline_warning`, `deadline_critical`, `exchange_status_change`, `new_referral`, `property_status_change`, `system`) to `notifications.type`.

SQL: Drop existing constraint if any, add new CHECK with all 13 values.

## 3. Migration: timeline event types CHECK constraint
Add missing event types (`connection_initiated`, `connection_accepted`, `connection_milestone`, `under_contract`, `closed`, `failed`, `cancelled`, etc.) to `exchange_timeline.event_type`.

SQL: Drop existing constraint if any, add new CHECK with all 14 values.

## No other files or schema changes needed.


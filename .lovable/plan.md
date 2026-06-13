## Goal

Inside the editor (`/agent/exchanges/:id/edit`), let the user freely jump between the four step tabs — **Client**, **Property & Financials**, **Criteria**, **Review** — instead of being gated to "completed/current/next" only. Required-field enforcement happens at **publish/save time**, not when switching tabs.

## Behavior

- Clicking any step tab always switches to that step. The current step shows the primary fill; other steps show the standard muted style (no green checks gating navigation).
- Navigating away from a step does **not** validate. Inline error messages set by a step's own `validate()` stay if already triggered, but tab clicks bypass them.
- Required-field enforcement runs only when the primary submit fires (`handleSubmit(true)` in `EditExchange.tsx`) — i.e. **Publish** (draft → active) and **Save** on an active listing. Secondary action (`Save as draft` / `Move to draft`) skips validation, as today.
- On submit, run a single validator over the full `WizardState`. If any required field is missing, show a toast, set `step` to the first invalid step, and abort the save.

## Required fields at publish

Mirror the existing `StepPropertyAndFinancials.validate()`:

- Property: `address`, `city`, `state`, `zip`, `asset_type`
- Financials: `asking_price > 0`, `noi >= 0`, `0 ≤ occupancy_rate ≤ 100`, `loan_balance >= 0`
- Client: `selectedClientId` set (always true for edit, but guard anyway)
- Criteria: no required fields (matches current StepCriteria — nothing required there)

## Changes

### `src/pages/agent/EditExchange.tsx`

1. **Free-navigation step tabs.** Replace the gated button logic:

   ```tsx
   onClick={() => setStep(stepNum)}
   className={... isCurrent ? "bg-primary text-primary-foreground"
     : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"}
   ```

   Drop the `isCompleted` branch and the check icon (no completion tracking when free-nav). Keep the step number + label.

2. **Publish-time validation.** Add a `validatePublish(data)` helper returning `{ valid, firstInvalidStep, message }`. In `handleSubmit`, when `intent === "publish"` or `intent === "save_active"`, run it before `updateExchange.mutateAsync`. On failure: `toast.error(message)`, `setStep(firstInvalidStep)`, `setSaving(false)`, return.

3. Keep `StepPropertyAndFinancials`'s own inline `validate()` for the in-step "Continue" button — useful when the user actually clicks Continue. No code change there.

### Step components (no required behavior change)

- `StepSelectClient`, `StepPropertyAndFinancials`, `StepCriteria`, `StepReview` keep their current `onNext/onBack/onSubmit` props. The wizard nav buttons inside the steps continue to work for users who prefer linear flow.

## Files

- `src/pages/agent/EditExchange.tsx`

No schema changes. No new components.
# Fix password reset emails

## What's happening now
- Your verified sender domain `notify.multifamilyproperties.com` is set up, but the project has **no auth email templates and no email queue infrastructure** wired in.
- The auth logs show your reset request went through and the default Lovable email hook responded "200 OK," but there are no custom templates routing the email through your verified domain. The default sender often lands in Gmail's spam/promotions folder — which is almost certainly why you didn't see it in your inbox.
- The `/reset-password` page in the app is already correctly implemented (calls `supabase.auth.updateUser({ password })`), so once the email lands the rest of the flow will work.

## Plan

1. **Set up the email queue infrastructure** so emails enqueue + send reliably via your verified domain.
2. **Scaffold the 6 auth email templates** (signup, magic-link, **recovery**, invite, email-change, reauthentication) into `supabase/functions/_shared/email-templates/` and create the `auth-email-hook` edge function.
3. **Brand the templates** to match the app's look — Inter font, blue-600 accent, clean light theme — and update copy to match the app's voice ("1031 Exchange Up" branding, professional but warm).
4. **Deploy `auth-email-hook`** so Supabase routes recovery emails through it into the queue → out via `notify.multifamilyproperties.com`.
5. Tell you to **try "Forgot password" again** from a fresh tab. The email will come from your domain, which dramatically improves Gmail deliverability.

## Notes
- No code changes to `ForgotPassword.tsx` or `ResetPassword.tsx` — they're already correct.
- DNS is already verified, so emails will start flowing as soon as the hook is deployed.
- If after this it still doesn't arrive, I'll inspect the `email_send_log` table to see whether it was queued, sent, suppressed, or bounced — and check your Gmail spam folder as a first step.

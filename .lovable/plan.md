# Full-sweep results: nothing left to wire

I did a complete pass over every public-facing surface, every form, every CTA, and every "preventDefault" stub in `src/`. Here's the inventory and verdict:

## Public forms / data-capture inputs (all wired)

| Surface | Persists to | Status |
|---|---|---|
| `BookDemo` page form | `demo_requests` | ✅ wired |
| `ForLandlords` referral form | `referrals` | ✅ wired |
| Home pricing **Team** waitlist modal | `team_waitlist_signups` | ✅ wired (this session) |
| Home pricing **Brokerage** waitlist modal | `brokerage_waitlist_signups` | ✅ wired (this session) |
| Landing footer newsletter | `newsletter_subscribers` | ✅ wired (this session) |
| Footer "Contact Us" + giant `support@…` link | `mailto:` | ✅ intentional, no DB needed |
| Auth pages (Login / Signup / ForgotPassword / ResetPassword / AcceptInvite) | Lovable Cloud auth | ✅ wired |
| Agent Help / support ticket form | `support_tickets` | ✅ wired |

## Authenticated app surfaces (all wired)

| Surface | Persists to |
|---|---|
| Agent NewExchange / EditExchange wizard | `exchanges`, `replacement_criteria`, `property_financials`, `property_images`, `pledged_properties` (via edge functions) |
| Agent client profile editing | `agent_clients`, `profiles` |
| Agent settings | `profiles`, `user_notification_preferences` |
| Messaging / inbox | `messages`, `notifications` |
| Pipeline + listings | `pledged_properties`, `exchange_connections`, `matches` |
| Admin settings | `app_settings` |
| Admin support inbox | `support_tickets` |

## `preventDefault` stubs I checked

- `PropertyPhotoUploader` / `StepPhotos` — `onDragOver` drop-target behavior, not a data stub. ✅
- `PipelineListingCard` — prevents click bubbling from the drag handle. ✅
- Footer newsletter `preventDefault` — **was** a stub, now wired. ✅

## CTAs that look interactive but don't need a DB

- "Get Started" → routes to `/signup` (auth handles it)
- "Book a Demo" / "Contact us" → routes to `/book-demo` (already wired)
- "Get started free" pricing button (Solo plan) → routes to `/signup`
- "Invite" badge in the marketing pipeline mockup → decorative, part of the product-screenshot illustration

## Conclusion

**Every UI element that should persist data is connected.** No further migrations or wiring needed unless you add new features. If you'd like, the next high-value follow-up would be to surface the new `team_waitlist_signups`, `brokerage_waitlist_signups`, and `newsletter_subscribers` tables inside the admin dashboard so you can review and export the leads — let me know if you want that.

# Twilio A2P 10DLC verification copy

Use this document when completing or updating the Twilio campaign registration for 1031 Exchange Up.

## Business and brand

- Legal business name: MFPX LLC
- Customer-facing brand: 1031 Exchange Up
- Website: https://1031exchangeup.com
- Support email: support@1031exchangeup.com
- Business address: 15 North St, Manchester, MA 01944

The legal business details entered in Twilio must exactly match the business's EIN/IRS records. Confirm the business type, EIN, formation jurisdiction, and authorized representative directly from company records before submission.

## Campaign description

1031 Exchange Up sends recurring automated SMS messages to real estate agents and investors/property owners who explicitly opt in on our website. Messages relate to an account or submitted request, including demo scheduling, property-owner agent introductions, active 1031 exchange activity, property matches, listing inquiries, connection requests, deadline reminders, and related service notices. SMS consent is optional, is collected with a separate unchecked checkbox, and is not a condition of purchasing or using the platform.

## Message flow / how users opt in

Users visit one of the public forms below, enter their own mobile number, and may separately select an unchecked SMS consent checkbox. Next to the checkbox, the page identifies 1031 Exchange Up as the sender, describes the expected message categories, states that message frequency varies, states that message and data rates may apply, explains STOP and HELP, states that consent is optional and not a condition of purchase or platform use, and links the Terms & Conditions and Privacy Policy. The checkbox is never preselected. The system stores the mobile number, consent timestamp, form source, and disclosure version.

- Account signup: https://1031exchangeup.com/signup
- Demo request: https://1031exchangeup.com/book-demo
- Property-owner request: https://1031exchangeup.com/landlords#referral-form
- Privacy Policy: https://1031exchangeup.com/privacy
- Terms & Conditions: https://1031exchangeup.com/terms

## Opt-in disclosure

I agree to receive recurring automated SMS messages from 1031 Exchange Up about my account or request, exchange activity, property matches, inquiries, connection requests, deadlines, and related service notices. Message frequency varies based on my account or request activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is optional and is not a condition of purchase or use of the platform. See Terms & Conditions and Privacy Policy.

## Sample messages

1. 1031 Exchange Up: A new replacement-property match is ready for your active exchange. Sign in to review it: https://1031exchangeup.com/login Reply STOP to opt out.

2. 1031 Exchange Up: We received your property-owner request. A member of our team will follow up about your agent introduction. Reply STOP to opt out or HELP for help.

3. 1031 Exchange Up: Your requested platform demo is ready to schedule. Reply with a convenient time or visit https://1031exchangeup.com/book-demo. Reply STOP to opt out.

## Opt-out, help, and confirmation messages

- Opt-out keywords: STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- Opt-out confirmation: 1031 Exchange Up: You have been unsubscribed and will receive no further text messages. Reply START to resubscribe.
- Help keywords: HELP, INFO
- Help response: 1031 Exchange Up: For help, email support@1031exchangeup.com. Message frequency varies. Message and data rates may apply. Reply STOP to opt out.

Keep Twilio Advanced Opt-Out enabled and ensure no application code sends additional SMS after Twilio records an opt-out. Do not upload purchased lists, transfer consent between brands, or treat a phone number entered without the SMS checkbox as permission to text.

## Deployment checklist

- Apply `supabase/migrations/20260804120000_a2p_sms_consent.sql` before publishing the updated frontend.
- Verify all five public URLs above are live, use HTTPS, and can be opened without signing in.
- Take screenshots showing the empty checkbox and the full disclosure beside it; attach them to Twilio if requested.
- Ensure the Twilio campaign's use case and samples match the actual messages sent.
- Include the brand name in every non-conversational message and STOP instructions in the initial message.
- Retain consent and opt-out events; never delete opt-out evidence merely because a user deletes an account without first considering applicable retention requirements.
- Have counsel review the final policies and actual messaging program before launch.

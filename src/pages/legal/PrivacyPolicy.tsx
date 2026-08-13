import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { LegalDoc } from "./LegalDoc";
import { useHead } from "@/hooks/useHead";

export default function PrivacyPolicy() {
  useHead({
    title: "Privacy Policy — 1031ExchangeUp™",
    description:
      "How 1031ExchangeUp™ collects, uses, shares, and protects your information when you use our website and platform.",
    canonical: "/privacy",
  });

  return (
    <LegalDoc title="Privacy Policy" lastUpdated="August 4, 2026">
      <p className="legal-intro">
        This Privacy Policy explains how MFPX LLC, d/b/a 1031 Exchange Up ("1031 Exchange Up," "we,"
        "us," or "our") collects, uses, discloses, and protects information when you visit our website
        or use our platform and related services (together, the "Service").
      </p>

      <div className="legal-toc">
        <div className="legal-toc-title">Contents</div>
        <ol>
          <li>Who we are</li>
          <li>Information we collect</li>
          <li>How we use information</li>
          <li>How we share information</li>
          <li>SMS and mobile information</li>
          <li>Cookies and analytics</li>
          <li>Email and other communications</li>
          <li>Your choices and rights</li>
          <li>Data retention</li>
          <li>Security</li>
          <li>Children</li>
          <li>International users</li>
          <li>Third-party links</li>
          <li>Changes to this policy</li>
          <li>Contact us</li>
        </ol>
      </div>

      <h2>1. Who we are</h2>
      <p>
        1031 Exchange Up operates a private technology platform that helps licensed real estate agents
        and investors/property owners organize 1031 exchanges, discover potential replacement-property
        matches, publish authorized property information, and connect with relevant counterparties. The
        data controller is MFPX LLC, d/b/a 1031 Exchange Up, located at 15 North St, Manchester, MA
        01944. You can reach us at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account and profile information:</strong> name, email address, phone number, company or brokerage, real estate license details, and profile photo.</li>
        <li><strong>Exchange and property information:</strong> property location and type, value, income, expenses, debt, timeline, and other details needed to operate the matching and connection features.</li>
        <li><strong>Client information entered by an agent:</strong> contact, property, and exchange details the agent is authorized to provide.</li>
        <li><strong>Property-owner referral information:</strong> name, email, phone, property location, property type, estimated value, and other information submitted through a referral form.</li>
        <li><strong>Demo, newsletter, waitlist, and contact information:</strong> name, email, phone, company, role, and the message or details you submit.</li>
        <li><strong>Communications:</strong> messages sent through the Service or to our support team, and your communication preferences and consent records.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <p>
        We may collect IP address, browser and device type, pages and features used, referring URLs,
        and similar log data needed to operate, secure, and understand use of the Service.
      </p>
      <h3>Information from others</h3>
      <p>
        We may receive information about you from another user, such as when an authorized agent enters
        client information or when a counterparty initiates a connection. A user who provides another
        person&apos;s information is responsible for having the authority and any consent required to do so.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide, operate, secure, and improve the Service, including matching properties to active exchanges and enabling user connections.</li>
        <li>Create and manage accounts, authenticate users, and verify agents and authorized listings.</li>
        <li>Respond to demo requests, referrals, inquiries, and support requests.</li>
        <li>Send service communications and, only where you choose to receive them, promotional communications.</li>
        <li>Prevent fraud, investigate misuse, enforce our Terms, and comply with legal obligations.</li>
      </ul>

      <h2>4. How we share information</h2>
      <ul>
        <li><strong>With other users:</strong> information you choose or authorize us to make available as part of a listing, match, inquiry, or active connection.</li>
        <li><strong>Service providers:</strong> vendors that process information only on our behalf to provide hosting, database, authentication, email, SMS delivery, support, security, and similar operational services.</li>
        <li><strong>Legal and safety:</strong> when reasonably necessary to comply with law, protect rights and safety, or enforce our agreements.</li>
        <li><strong>Business transfers:</strong> as part of a merger, acquisition, financing, reorganization, or sale of all or part of the business, subject to applicable law.</li>
      </ul>
      <p>
        <strong>We do not sell personal information for money</strong> and do not share it for
        cross-context behavioral advertising as those terms are defined under applicable law.
      </p>

      <h2>5. SMS and mobile information</h2>
      <p>
        We send SMS messages only after you provide a mobile number and separately give explicit SMS
        consent through an unchecked opt-in box or another legally valid method. Entering a phone number
        by itself, creating an account, or submitting a form does not constitute SMS consent.
      </p>
      <p>
        If you opt in, messages from 1031 Exchange Up may concern your account, demo or referral request,
        exchange activity, property matches, inquiries, connection requests, deadline reminders, and
        related service notices. Message frequency varies based on your account or request activity.
        Message and data rates may apply. Reply <strong>STOP</strong> to opt out at any time or{" "}
        <strong>HELP</strong> for help. You may also contact{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>. SMS consent is
        optional and is not a condition of purchase or use of the Service.
      </p>
      <p>
        <strong>
          We do not share mobile phone numbers, SMS opt-in data, or SMS consent with third parties or
          affiliates for their own marketing or promotional purposes.
        </strong>{" "}
        We may give mobile information to service providers solely to deliver and support our messaging
        program; they may not use it for their own marketing. SMS consent is specific to 1031 Exchange
        Up and is not sold, rented, or transferred.
      </p>
      <p>
        We retain records of SMS consent and withdrawal, including the date, source, mobile number, and
        disclosure version, for compliance and dispute-resolution purposes. A STOP request applies to
        SMS from the number or program that received it; after an opt-out confirmation, we will not send
        further SMS unless you provide new consent.
      </p>

      <h2>6. Cookies and analytics</h2>
      <p>
        We use cookies and similar technologies to keep you signed in, remember preferences, and
        understand how the Service is used. Disabling some cookies may affect functionality.
      </p>

      <h2>7. Email and other communications</h2>
      <p>
        We may send service-related emails needed to operate your account. We send marketing emails only
        where permitted and provide an unsubscribe link or comparable method. Opting out of marketing
        does not prevent essential account or security messages.
      </p>

      <h2>8. Your choices and rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or receive a copy
        of personal information, and to object to or restrict certain processing. California residents
        may have rights under the CCPA/CPRA; where the GDPR or UK GDPR applies, you may also have rights
        to erasure, portability, restriction, objection, and to lodge a complaint with a supervisory
        authority. We will not discriminate against you for exercising applicable privacy rights.
      </p>
      <p>
        To exercise a right, email <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>.
        We may verify your identity before acting on a request. You may withdraw marketing consent at any
        time using the method included in the message.
      </p>

      <h2>9. Data retention</h2>
      <p>
        We retain information for as long as needed to provide the Service and for legitimate business,
        security, compliance, and legal purposes. This includes retaining proof of communication consent
        and opt-out requests for as long as reasonably needed to demonstrate compliance. When information
        is no longer needed, we delete or de-identify it, subject to legal obligations.
      </p>

      <h2>10. Security</h2>
      <p>
        We use reasonable administrative, technical, and physical safeguards designed to protect
        personal information. No method of transmission or storage is completely secure, so we cannot
        guarantee absolute security.
      </p>

      <h2>11. Children</h2>
      <p>
        The Service is intended for adults age 18 or older and is not directed to children under 16. If
        you believe a child provided us personal information, contact us so we can address it.
      </p>

      <h2>12. International users</h2>
      <p>
        We operate in the United States. Information may be processed and stored in the United States or
        other countries with different data-protection laws, subject to applicable safeguards.
      </p>

      <h2>13. Third-party links</h2>
      <p>
        The Service may link to services we do not control. This Privacy Policy does not govern those
        third parties, and we encourage you to review their privacy notices.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will revise the "Last updated" date and,
        where required, provide additional notice. Material changes to an SMS program will not be used
        to expand the scope of your consent without any new consent required by law.
      </p>

      <h2>15. Contact us</h2>
      <p>
        Contact MFPX LLC, d/b/a 1031 Exchange Up, at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a> or 15 North St,
        Manchester, MA 01944. See also our <Link to={ROUTES.terms}>Terms &amp; Conditions</Link>.
      </p>
    </LegalDoc>
  );
}

import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { LegalDoc } from "./LegalDoc";
import { useHead } from "@/hooks/useHead";

export default function Terms() {
  useHead({
    title: "Terms & Conditions — 1031ExchangeUp™",
    description:
      "The terms and conditions governing use of the 1031ExchangeUp™ platform, accounts, listings, and matching services.",
    canonical: "/terms",
  });

  return (
    <LegalDoc title="Terms & Conditions" lastUpdated="August 4, 2026">
      <p className="legal-intro">
        These Terms &amp; Conditions (the "Terms") are a binding agreement between you and MFPX LLC,
        d/b/a 1031 Exchange Up ("1031 Exchange Up," "we," "us," or "our") and govern your use of our
        website, platform, and related services (together, the "Service"). By using the Service, you
        agree to these Terms and acknowledge our <Link to={ROUTES.privacy}>Privacy Policy</Link>.
      </p>

      <div className="legal-toc">
        <div className="legal-toc-title">Contents</div>
        <ol>
          <li>Eligibility and acceptance</li>
          <li>What the Service is - and is not</li>
          <li>Accounts</li>
          <li>Your content and conduct</li>
          <li>Referral fees and compensation</li>
          <li>License to use the Service</li>
          <li>Our intellectual property</li>
          <li>Fees</li>
          <li>Third-party services</li>
          <li>Text messaging terms</li>
          <li>Disclaimers</li>
          <li>Limitation of liability</li>
          <li>Indemnification</li>
          <li>Termination</li>
          <li>Governing law and disputes</li>
          <li>Changes to these Terms</li>
          <li>General</li>
          <li>Contact us</li>
        </ol>
      </div>

      <h2>1. Eligibility and acceptance</h2>
      <p>
        You must be at least 18 years old and able to enter into a binding contract. Agent features are
        intended for licensed real estate professionals; an agent represents that each license used on
        the Service is valid and in good standing and that use complies with applicable law and brokerage
        policy. Investor/property-owner features are intended for people authorized to act for the
        relevant property or ownership entity.
      </p>

      <h2>2. What the Service is - and is not</h2>
      <p>
        1031 Exchange Up is a technology platform for licensed agents and investors/property owners to
        organize potential exchanges, publish authorized property information, receive potential
        replacement-property matches, and connect with relevant counterparties.
      </p>
      <ul>
        <li><strong>We are not a real estate brokerage.</strong> We do not broker, buy, sell, lease, appraise, or represent a party in a transaction and are not a party to agreements between users.</li>
        <li><strong>We are not an MLS.</strong> The Service does not replace an MLS or change obligations under MLS, association, advertising, or clear-cooperation rules.</li>
        <li><strong>We do not provide legal, tax, accounting, financial, brokerage, or investment advice.</strong> Users are responsible for qualified professional advice, including a qualified intermediary, attorney, lender, and tax advisor.</li>
        <li><strong>No result is guaranteed.</strong> Matches, scores, estimates, projected returns, financing assumptions, and deadlines are informational and may be incomplete or inaccurate.</li>
      </ul>

      <h2>3. Accounts</h2>
      <p>
        You will provide accurate information, keep it current, protect your credentials, and accept
        responsibility for account activity. Notify us promptly of unauthorized use. We may verify an
        identity, license, ownership authorization, or listing and may restrict accounts that violate
        these Terms or pose a risk.
      </p>

      <h2>4. Your content and conduct</h2>
      <p>
        You are responsible for information you submit, including property, client, and exchange data
        ("Your Content"). You represent that Your Content is accurate and that you have all rights,
        authorizations, notices, and consents required to collect, submit, use, and disclose it. You will
        comply with fair-housing, advertising, privacy, consumer-protection, anti-spam, telemarketing,
        real estate licensing, RESPA, and MLS rules that apply to you.
      </p>
      <ul>
        <li>Do not post a false, misleading, duplicate, or unauthorized listing.</li>
        <li>Do not scrape, harvest, sell, or improperly disclose another person&apos;s information.</li>
        <li>Do not enter a phone number or trigger a call or text unless you have the authority and any consent required for that communication.</li>
        <li>Do not use client information or a connection made through the Service for unsolicited marketing outside the purpose for which it was provided.</li>
        <li>Do not upload malicious code, interfere with security, or use the Service for unlawful, deceptive, or harmful activity.</li>
      </ul>
      <p>
        We may moderate or remove content. You grant us a non-exclusive, worldwide, royalty-free license
        to host, store, display, and use Your Content only as reasonably needed to operate, secure, and
        improve the Service.
      </p>

      <h2>5. Referral fees and compensation</h2>
      <p>
        Referral fees, commissions, or other compensation are solely between the properly licensed
        parties involved. You are responsible for compliance with state law and RESPA. We do not collect,
        hold, guarantee, broker, or enforce a referral fee or commission unless separately stated in a
        written agreement.
      </p>

      <h2>6. License to use the Service</h2>
      <p>
        We grant you a limited, revocable, non-exclusive, non-transferable license to use the Service for
        its intended business purpose. You may not copy, distribute, sell, lease, reverse engineer, scrape,
        or create derivative works from the Service or its data except as law expressly permits.
      </p>

      <h2>7. Our intellectual property</h2>
      <p>
        The Service and its software, design, text, graphics, logos, and other content, excluding Your
        Content, belong to us or our licensors and are protected by intellectual-property law.
      </p>

      <h2>8. Fees</h2>
      <p>
        The Service is offered free of charge to all users - investors, property owners, and agents alike. If we
        ever introduce fees, we will provide notice first, and any paid features would be governed by the pricing
        and additional terms presented at that time.
      </p>


      <h2>9. Third-party services</h2>
      <p>
        The Service may integrate with third-party products, carriers, or websites that we do not control.
        We are not responsible for those services, which may have their own terms and privacy notices.
      </p>

      <h2>10. Text messaging terms</h2>
      <p>
        If you separately opt in, you authorize MFPX LLC, d/b/a 1031 Exchange Up, to send recurring
        automated SMS messages to the mobile number you provided. Messages may concern your account,
        demo or referral request, exchange activity, property matches, inquiries, connection requests,
        deadline reminders, and related service notices. Message frequency varies based on your account
        or request activity. Message and data rates may apply. Consent is optional and is not a condition
        of purchase or use of the Service.
      </p>
      <p>
        Reply <strong>STOP</strong> to opt out at any time. After a final opt-out confirmation, no further
        messages will be sent unless you provide new consent. Reply <strong>HELP</strong> for help or email{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>. You represent that you
        are the subscriber or customary user of the number provided and will notify us before the number
        is reassigned. Carriers are not liable for delayed or undelivered messages. Opting out of SMS does
        not stop communications through email, in-app notifications, or other channels where permitted.
      </p>
      <p>
        We will not sell, rent, or transfer your SMS consent. See our{" "}
        <Link to={ROUTES.privacy}>Privacy Policy</Link> for how mobile information and consent records are
        handled.
      </p>

      <h2>11. Disclaimers</h2>
      <p className="legal-caps">
        THE SERVICE AND CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
        WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
        ERROR-FREE, OR SECURE, OR THAT ANY PROPERTY, MATCH, LISTING, AGENT, BUYER, TRANSACTION, FINANCING,
        COMMUNICATION, DEADLINE, OR FINANCIAL OUTCOME WILL BE AVAILABLE, ACCURATE, SUITABLE, OR ACHIEVED.
      </p>

      <h2>12. Limitation of liability</h2>
      <p className="legal-caps">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, 1031 EXCHANGE UP AND ITS OFFICERS, EMPLOYEES, AND AGENTS
        WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
        DAMAGES OR LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL ARISING FROM THE SERVICE. OUR TOTAL
        LIABILITY FOR A CLAIM RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF AMOUNTS YOU PAID US
        FOR THE SERVICE IN THE 12 MONTHS BEFORE THE CLAIM OR ONE HUNDRED U.S. DOLLARS ($100). SOME
        JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You will indemnify, defend, and hold harmless 1031 Exchange Up and its officers, employees, and
        agents from claims, liabilities, damages, losses, and reasonable legal expenses arising from your
        use of the Service, Your Content, your communications or transactions, or your violation of these
        Terms, applicable law, or a third party&apos;s rights.
      </p>

      <h2>14. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access for violation,
        risk, or discontinuation of the Service. Provisions that by their nature should survive will do so.
      </p>

      <h2>15. Governing law and disputes</h2>
      <p>
        Massachusetts law governs these Terms, without regard to conflict-of-law rules. Disputes arising
        from the Service will be resolved exclusively in state or federal courts in Massachusetts, and
        you consent to their personal jurisdiction and venue.
      </p>

      <h2>16. Changes to these Terms</h2>
      <p>
        We may update these Terms and will revise the "Last updated" date. Where appropriate or required,
        we will provide additional notice. A material change to an SMS program does not expand the scope
        of existing SMS consent where new consent is required by law.
      </p>

      <h2>17. General</h2>
      <p>
        These Terms and our <Link to={ROUTES.privacy}>Privacy Policy</Link> are the entire agreement about
        the Service unless additional written terms apply. If a provision is unenforceable, the remainder
        continues. Failure to enforce a provision is not a waiver. You may not assign these Terms without
        consent; we may assign them in a merger, financing, reorganization, or asset sale.
      </p>

      <h2>18. Contact us</h2>
      <p>
        Contact MFPX LLC, d/b/a 1031 Exchange Up, at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a> or 15 North St,
        Manchester, MA 01944.
      </p>
    </LegalDoc>
  );
}

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { LegalDoc } from "./LegalDoc";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms & Conditions — 1031 Exchange Up";
  }, []);

  return (
    <LegalDoc title="Terms & Conditions" lastUpdated="July 22, 2026">
      <p className="legal-intro">
        These Terms &amp; Conditions (the “Terms”) are a binding agreement between you and{" "}
        MFPX LLC, d/b/a 1031 Exchange Up (“1031 Exchange Up,” “we,” “us,” or “our”) and govern your
        access to and use of our website, platform, and related services (together, the “Service”). By
        accessing or using the Service, you agree to these Terms and to our{" "}
        <Link to={ROUTES.privacy}>Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <div className="legal-toc">
        <div className="legal-toc-title">Contents</div>
        <ol>
          <li>Eligibility and acceptance</li>
          <li>What the Service is — and is not</li>
          <li>Accounts</li>
          <li>Your content and conduct</li>
          <li>Referral fees and compensation</li>
          <li>License to use the Service</li>
          <li>Our intellectual property</li>
          <li>Fees</li>
          <li>Third-party services</li>
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
        You must be at least 18 years old and able to enter into a binding contract to use the Service.
        Agent features are intended for licensed real estate professionals; by using them, you
        represent and warrant that you hold a valid real estate license in good standing in each
        jurisdiction where you operate, and that your use complies with your brokerage’s policies and
        applicable law.
      </p>

      <h2>2. What the Service is — and is not</h2>
      <p>
        1031 Exchange Up is a technology platform and agent-to-agent network that helps licensed agents
        source and discover 1031 exchange replacement properties and connect with one another. Please
        read the following carefully:
      </p>
      <ul>
        <li>
          <strong>We are not a real estate brokerage.</strong> We do not list, market, broker, sell,
          buy, lease, appraise, or represent any party in any transaction, and we are not a party to
          any agreement reached between users or their clients.
        </li>
        <li>
          <strong>We are not a Multiple Listing Service (MLS).</strong> The Service does not replace any
          MLS, and using it does not satisfy, waive, or change any obligation you may have under any
          MLS rules — including the National Association of REALTORS® Clear Cooperation Policy or your
          local MLS’s rules. <strong>You are solely responsible for complying with all MLS and
          association rules, including timely submission of any publicly marketed listing.</strong>
        </li>
        <li>
          <strong>We do not provide legal, tax, accounting, financial, brokerage, or investment
          advice.</strong> Section 1031 exchanges are governed by strict IRS rules and deadlines,
          including the 45-day identification period and the 180-day closing period. You and your
          clients are responsible for engaging a qualified intermediary, attorney, and tax advisor.
          Nothing on the Service is a recommendation to buy, sell, or hold any property.
        </li>
        <li>
          <strong>No guarantee of results.</strong> Any match scores, estimates, benchmarks, projected
          returns, or “targets” shown on the Service are illustrative and informational only. We do not
          guarantee that any property, match, listing, agent, buyer, transaction, financing, or
          financial outcome will be available, accurate, suitable, or achieved.
        </li>
      </ul>

      <h2>3. Accounts</h2>
      <p>
        You agree to provide accurate, current, and complete information, to keep it up to date, and to
        keep your login credentials confidential. You are responsible for all activity under your
        account. Notify us promptly of any unauthorized use. We may verify your identity and license,
        and may suspend or terminate accounts that violate these Terms or that we reasonably believe
        pose a risk.
      </p>

      <h2>4. Your content and conduct</h2>
      <p>
        You are solely responsible for the information and content you submit, including property and
        client information (“Your Content”). You represent and warrant that you have all rights and
        authorizations necessary to submit Your Content and to share it with other users, that it is
        accurate and not misleading, and that it does not violate any law or third-party right. You
        agree to comply with all applicable laws and rules, including fair housing, advertising and
        consumer-protection laws, privacy and anti-spam laws, real estate licensing laws, the Real
        Estate Settlement Procedures Act (RESPA) where applicable, and MLS rules. You will not:
      </p>
      <ul>
        <li>post false, fraudulent, duplicate, or unauthorized listings, or information about a property you are not authorized to represent or share;</li>
        <li>misuse, scrape, harvest, or improperly disclose other users’ information;</li>
        <li>infringe any intellectual property, privacy, or other right;</li>
        <li>upload malicious code or attempt to disrupt or gain unauthorized access to the Service; or</li>
        <li>use the Service for any unlawful, deceptive, or harmful purpose.</li>
      </ul>
      <p>
        We may, but are not obligated to, review, moderate, or remove content, and may suspend users at
        our discretion. You grant us a non-exclusive, worldwide, royalty-free license to host, store,
        display, and use Your Content as needed to operate and improve the Service.
      </p>

      <h2>5. Referral fees and compensation</h2>
      <p>
        Any referral fees, commissions, or other compensation arranged through or in connection with the
        Service are solely between the agents and parties involved. Only properly licensed individuals
        may pay or receive real estate referral fees, and you are solely responsible for ensuring any
        such arrangement complies with applicable law (including state real estate law and, for
        residential transactions, RESPA). We are not a party to, and do not collect, broker, hold,
        guarantee, or enforce, any referral fee or commission.
      </p>

      <h2>6. License to use the Service</h2>
      <p>
        Subject to these Terms, we grant you a limited, revocable, non-exclusive, non-transferable
        license to access and use the Service for its intended business purpose. You will not copy,
        modify, distribute, sell, lease, reverse engineer, scrape, or create derivative works from the
        Service or its data, except as permitted by law.
      </p>

      <h2>7. Our intellectual property</h2>
      <p>
        The Service and all related software, design, text, graphics, logos, and other content
        (excluding Your Content) are owned by us or our licensors and are protected by intellectual
        property laws. Except for the limited license above, no rights are granted to you.
      </p>

      <h2>8. Fees</h2>
      <p>
        The Service is currently offered free of charge during early access. We may introduce or change
        fees in the future; if we do, we will provide notice, and any paid features will be subject to
        the pricing and terms presented at that time.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The Service may integrate with or link to third-party products and services that we do not
        control. We are not responsible for those services, and your use of them is subject to their
        own terms.
      </p>

      <h2>10. Disclaimers</h2>
      <p className="legal-caps">
        THE SERVICE AND ALL CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY
        KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
        WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY PROPERTY, MATCH, LISTING, AGENT, BUYER,
        TRANSACTION, OR FINANCIAL OUTCOME WILL BE AVAILABLE, ACCURATE, SUITABLE, OR ACHIEVED. ANY
        RELIANCE ON THE SERVICE OR ITS CONTENT IS AT YOUR OWN RISK.
      </p>

      <h2>11. Limitation of liability</h2>
      <p className="legal-caps">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL 1031 EXCHANGE UP OR ITS OFFICERS,
        EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
        OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR
        RELATING TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE
        WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE 12 MONTHS
        BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100). SOME JURISDICTIONS DO NOT ALLOW CERTAIN
        LIMITATIONS, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless 1031 Exchange Up and its officers, employees,
        and agents from and against any claims, liabilities, damages, losses, and expenses (including
        reasonable attorneys’ fees) arising out of or related to: your use of the Service; Your Content;
        your transactions, dealings, or communications with other users or any party; your violation of
        these Terms; or your violation of any law or third-party right.
      </p>

      <h2>13. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate your access to the
        Service at any time, with or without notice or cause. Provisions that by their nature should
        survive termination — including ownership, disclaimers, limitation of liability,
        indemnification, and dispute terms — will survive.
      </p>

      <h2>14. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to its
        conflict-of-laws rules. Any dispute arising out of or relating to these Terms or the Service will
        be resolved exclusively in the state and federal courts located in Massachusetts, and you consent
        to the personal jurisdiction and venue of those courts.
      </p>

      <h2>15. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. We will revise the “Last updated” date above and,
        where appropriate, provide additional notice. Changes are effective when posted (or as otherwise
        stated). Your continued use of the Service after changes take effect means you accept the
        revised Terms.
      </p>

      <h2>16. General</h2>
      <p>
        These Terms, together with our <Link to={ROUTES.privacy}>Privacy Policy</Link>, are the entire
        agreement between you and us regarding the Service and supersede any prior agreements. If any
        provision is found unenforceable, the remaining provisions stay in effect. Our failure to
        enforce a provision is not a waiver. You may not assign these Terms without our consent; we may
        assign them in connection with a merger, acquisition, or sale of assets.
      </p>

      <h2>17. Contact us</h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a> or 15 North St,
        Manchester, MA 01944.
      </p>
    </LegalDoc>
  );
}

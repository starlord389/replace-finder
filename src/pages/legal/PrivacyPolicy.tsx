import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { LegalDoc } from "./LegalDoc";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy — 1031 Exchange Up";
  }, []);

  return (
    <LegalDoc title="Privacy Policy" lastUpdated="July 22, 2026">
      <p className="legal-intro">
        This Privacy Policy explains how MFPX LLC, d/b/a 1031 Exchange Up (“1031 Exchange Up,” “we,”
        “us,” or “our”) collects, uses, discloses, and protects information when you visit our website or
        use our platform and related services (together, the “Service”). By using the Service, you agree
        to this Privacy Policy. If you do not agree, please do not use the Service.
      </p>

      <div className="legal-toc">
        <div className="legal-toc-title">Contents</div>
        <ol>
          <li>Who we are</li>
          <li>Information we collect</li>
          <li>How we use information</li>
          <li>How we share information</li>
          <li>Cookies and analytics</li>
          <li>Email and communications</li>
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
        1031 Exchange Up operates an agent-to-agent network that helps licensed real estate agents
        source and discover 1031 exchange replacement properties and connect with one another. The
        Service is intended for business use by real estate professionals and, where applicable,
        property owners who ask to be referred to an agent. The data controller is MFPX LLC, d/b/a 1031
        Exchange Up, located at 15 North St, Manchester, MA 01944. You can reach us at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Information you provide to us</h3>
      <ul>
        <li>
          <strong>Account and profile information:</strong> name, email address, phone number,
          brokerage or company, real estate license details, and profile photo.
        </li>
        <li>
          <strong>Client and exchange information you enter as an agent:</strong> details about the
          properties your clients hold or are seeking — such as city and state, property type, and
          financial figures (for example estimated value, gross rent roll, operating expenses, and
          loan balance) — and your replacement criteria. You are responsible for ensuring you are
          authorized to provide this information.
        </li>
        <li>
          <strong>Property-owner referral information:</strong> if you submit our property-owner
          (“For Landlords”) form, the name, email, phone, property location, property type, and
          estimated value provided.
        </li>
        <li>
          <strong>Newsletter, waitlist, demo, and contact submissions:</strong> name, email, phone,
          company, and any message or details you include.
        </li>
        <li>
          <strong>Communications:</strong> messages you send to other users through the Service or to
          our support team.
        </li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Usage and device data:</strong> IP address, browser and device type, pages and
          features used, referring URLs, and similar log and analytics data, collected through cookies
          and similar technologies.
        </li>
      </ul>
      <h3>Information from others</h3>
      <ul>
        <li>
          We may receive information about you from another user — for example, when an agent refers a
          property owner to us, or when a counterparty agent opens a connection with you.
        </li>
      </ul>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide, operate, and maintain the Service, including matching properties to active exchanges and enabling agent-to-agent connections and messaging.</li>
        <li>Create and manage accounts and verify agents and the properties posted.</li>
        <li>Communicate with you, including service and transactional messages and — where you have not opted out — newsletters and product updates.</li>
        <li>Respond to your inquiries, demo requests, and support tickets.</li>
        <li>Monitor, secure, debug, and improve the Service, and develop new features.</li>
        <li>Comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>4. How we share information</h2>
      <ul>
        <li>
          <strong>With other users (agents):</strong> The Service is a network. When you post a
          property, open a connection, or message another user, the information you choose to share
          (such as property details and your name and contact information) is made available to that
          user. Do not post or share information you are not authorized to disclose.
        </li>
        <li>
          <strong>Service providers:</strong> vendors who host and operate the Service on our behalf —
          for example cloud hosting and database (such as Supabase), email delivery, and analytics
          providers — under obligations to protect the information.
        </li>
        <li>
          <strong>Legal and safety:</strong> when we believe disclosure is necessary to comply with
          law or legal process, enforce our agreements, or protect the rights, property, or safety of
          our users, the public, or us.
        </li>
        <li>
          <strong>Business transfers:</strong> in connection with a merger, acquisition, financing, or
          sale of all or part of our business.
        </li>
      </ul>
      <p>
        <strong>We do not sell your personal information for money,</strong> and we do not share it for
        cross-context behavioral advertising as those terms are defined under applicable law.
      </p>

      <h2>5. Cookies and analytics</h2>
      <p>
        We use cookies and similar technologies to keep you signed in, remember preferences, and
        understand how the Service is used. You can control cookies through your browser settings;
        disabling some cookies may affect functionality. We do not currently use third-party analytics
        tools.
      </p>

      <h2>6. Email and communications</h2>
      <p>
        We may send you service-related messages, which are part of using the Service. We may also send
        marketing emails such as our newsletter and product updates; you can opt out at any time using
        the unsubscribe link in those emails or by contacting us. We comply with applicable anti-spam
        laws, including the CAN-SPAM Act.
      </p>

      <h2>7. Your choices and rights</h2>
      <p>
        Depending on where you live, you may have some or all of the following rights regarding your
        personal information: to access it, correct it, delete it, receive a portable copy, and object
        to or restrict certain processing.
      </p>
      <ul>
        <li>
          <strong>California (CCPA/CPRA):</strong> California residents may request to know, access,
          correct, and delete personal information, and to opt out of the “sale” or “sharing” of
          personal information. As noted above, we do not sell or share personal information as those
          terms are defined by the CPRA. We will not discriminate against you for exercising your
          rights.
        </li>
        <li>
          <strong>EU/UK (GDPR), where applicable:</strong> you have rights to access, rectification,
          erasure, restriction, portability, and objection, and may lodge a complaint with a
          supervisory authority. Our legal bases for processing include performance of a contract, our
          legitimate interests in operating and improving the Service, your consent, and compliance
          with legal obligations.
        </li>
        <li>
          <strong>Marketing:</strong> you can unsubscribe from marketing emails at any time.
        </li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a>. We may need to
        verify your identity before acting on a request.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We retain personal information for as long as needed to provide the Service and for legitimate
        business or legal purposes, such as complying with our legal obligations, resolving disputes,
        and enforcing our agreements. When information is no longer needed, we delete or de-identify it.
      </p>

      <h2>9. Security</h2>
      <p>
        We use reasonable administrative, technical, and physical safeguards designed to protect
        personal information. However, no method of transmission or storage is completely secure, and we
        cannot guarantee absolute security.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is intended for adults (18+) using it for business purposes and is not directed to
        children under 16. We do not knowingly collect personal information from children. If you
        believe a child has provided us information, please contact us so we can delete it.
      </p>

      <h2>11. International users</h2>
      <p>
        We operate in the United States, and information we collect may be processed and stored in the
        United States or other countries that may have different data-protection laws than your own. By
        using the Service, you understand your information may be transferred to and processed in the
        United States.
      </p>

      <h2>12. Third-party links</h2>
      <p>
        The Service may link to websites and services we do not operate or control. This Privacy Policy
        does not apply to those third parties, and we are not responsible for their practices. Please
        review their privacy policies.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the “Last
        updated” date above and, where required by law, provide additional notice. Your continued use
        of the Service after an update means you accept the revised policy.
      </p>

      <h2>14. Contact us</h2>
      <p>
        If you have questions about this Privacy Policy or our data practices, contact us at{" "}
        <a href="mailto:support@1031exchangeup.com">support@1031exchangeup.com</a> or 15 North St,
        Manchester, MA 01944. See also our <Link to={ROUTES.terms}>Terms &amp; Conditions</Link>.
      </p>
    </LegalDoc>
  );
}

import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* Navy site footer — mirrors the homepage footer (logo + tagline, Platform /
   Get Started / Support columns, Stay Up to Date subscribe, copyright) so all
   public pages share one consistent footer. */

const NBF_CSS = `
  .nbf { background: #0e2a4d; margin-top: 64px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .nbf-inner { max-width: 1240px; margin: 0 auto; padding: 72px 20px 0; }
  .nbf-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 1.4fr; gap: 40px; }
  @media (max-width: 960px) { .nbf-grid { grid-template-columns: 1fr 1fr; gap: 36px; } }
  @media (max-width: 520px) { .nbf-grid { grid-template-columns: 1fr; text-align: center; } .nbf-tag { margin-left: auto; margin-right: auto; } }
  .nbf-logo { color: #fff; font-weight: 800; font-size: 22px; letter-spacing: -.02em; }
  .nbf-logo b { color: #5cc15f; }
  .nbf-tag { color: #9fb2cc; font-size: 14.5px; line-height: 1.6; margin-top: 14px; max-width: 300px; }
  .nbf-col h4 { color: #fff; font-size: 14px; font-weight: 800; letter-spacing: .02em; margin: 0 0 16px; }
  .nbf-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 11px; }
  .nbf-col a { color: #9fb2cc; font-size: 14.5px; text-decoration: none; transition: color .2s ease; }
  .nbf-col a:hover { color: #fff; }
  .nbf-form { display: flex; gap: 8px; margin-top: 4px; }
  .nbf-form input { flex: 1 1 auto; min-width: 0; height: 44px; border-radius: 9px; border: 1px solid #2a456e; background: #16284a; color: #fff; padding: 0 14px; font-size: 14px; outline: none; font-family: inherit; }
  .nbf-form input::placeholder { color: #7e93b3; }
  .nbf-form input:focus { border-color: #43a047; }
  .nbf-form button { height: 44px; padding: 0 18px; border-radius: 9px; border: none; background: #43a047; color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; transition: background .2s ease; white-space: nowrap; font-family: inherit; }
  .nbf-form button:hover { background: #3a8c3e; }
  .nbf-form button:disabled { opacity: .7; cursor: default; }
  .nbf-bottom { max-width: 1240px; margin: 48px auto 0; padding: 24px 20px 28px; border-top: 1px solid #1d3a60; display: flex; flex-direction: column; gap: 10px; }
  .nbf-disclaimer { color: #7e93b3; font-size: 12px; line-height: 1.5; max-width: 640px; margin: 0; }
  .nbf-copy { color: #7e93b3; font-size: 13.5px; }
  @media (max-width: 520px) { .nbf-bottom { text-align: center; } .nbf-disclaimer { margin: 0 auto; } }
`;

const FOOTER_COLS = [
  {
    title: "Platform",
    links: [
      { label: "How It Works", to: "/#how" },
      { label: "Who It's For", to: "/#who" },
      { label: "Why Join", to: "/#why" },
      { label: "Resources", to: "/#resources" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { label: "Join Free", to: "/signup" },
      { label: "Book a Demo", to: "/book-demo" },
      { label: "For Landlords", to: "/landlords" },
      { label: "Log In", to: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", to: "/#faq" },
      { label: "Contact Us", to: "mailto:support@1031exchangeup.com" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
];

export default function LandingFooter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 255) {
      toast({ title: "That email is too long.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: trimmed, source: "landing_footer" },
        { onConflict: "email", ignoreDuplicates: true },
      );
    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't subscribe you.",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setEmail("");
    setJustSubscribed(true);
    toast({ title: "You're subscribed!", description: "Thanks for joining our newsletter." });
    setTimeout(() => setJustSubscribed(false), 2500);
  }

  return (
    <footer className="nbf">
      <style>{NBF_CSS}</style>
      <div className="nbf-inner">
        <div className="nbf-grid">
          <div>
            <div className="nbf-logo">1031Exchange<b>UP</b></div>
            <p className="nbf-tag">The AI-powered matchmaking platform for 1031 exchange success.</p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div className="nbf-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) =>
                  l.to.startsWith("mailto:") || l.to.startsWith("/#") ? (
                    <li key={l.label}><a href={l.to}>{l.label}</a></li>
                  ) : (
                    <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                  ),
                )}
              </ul>
            </div>
          ))}

          <div className="nbf-col">
            <h4>Stay Up to Date</h4>
            <form className="nbf-form" onSubmit={handleSubscribe} noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                disabled={submitting}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? "Subscribing…" : justSubscribed ? "Subscribed ✓" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="nbf-bottom">
        <p className="nbf-disclaimer">
          1031 Exchange Up is an agent-to-agent sourcing and referral network — not a
          brokerage or an MLS, and not a substitute for either. Licensed agents remain
          responsible for their own marketing and Clear Cooperation obligations.
        </p>
        <span className="nbf-copy">© {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.</span>
      </div>
    </footer>
  );
}

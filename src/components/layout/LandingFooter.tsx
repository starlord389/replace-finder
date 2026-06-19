import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { PUBLIC_FOOTER_LINKS } from "@/content/publicNavLinks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
    <footer className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-[1240px] rounded-[32px] bg-[#f0ece6] px-8 py-10 text-[#1d1d1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_110px] md:items-start md:gap-8 lg:gap-10">
          <div className="min-w-0">
            <section className="max-w-[470px]">
              <p className="text-[18px] font-normal tracking-[-0.04em] text-[#5f5a53] sm:text-[22px] lg:text-[28px]">
              Sign up for our newsletter
              </p>
              <form
                className="relative mt-5 max-w-[470px]"
                onSubmit={handleSubscribe}
                noValidate
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="h-11 w-full rounded-full border-0 bg-white px-4 pr-32 text-[15px] text-[#1d1d1d] outline-none placeholder:text-[#b2aea8] sm:h-12 sm:px-5 sm:pr-36"
                  aria-label="Email address"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="absolute right-1 top-1 flex h-9 items-center rounded-full bg-[#efefef] px-5 text-[14px] font-medium tracking-[-0.02em] text-[#1d1d1d] transition-colors hover:bg-[#e8e8e8] disabled:opacity-70 sm:h-10 sm:px-6"
                >
                  {submitting ? "Subscribing…" : justSubscribed ? "Subscribed ✓" : "Subscribe"}
                </button>
              </form>
            </section>

            <div className="mt-14 sm:mt-20 lg:mt-28">
              <a
                href="mailto:support@1031exchangeup.com"
                className="break-words text-[2.15rem] font-medium leading-[0.95] tracking-[-0.06em] text-[#111111] transition-colors hover:text-[#44403b] sm:text-[3rem] lg:text-[3.45rem] xl:text-[4.05rem]"
              >
                support@1031exchangeup.com
              </a>
              <p className="mt-3 text-[13px] tracking-[-0.02em] text-[#7d766e] sm:text-[14px]">
                © {new Date().getFullYear()} 1031 Exchange Up. All rights reserved.
              </p>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="md:justify-self-end">
            <p className="text-[16px] font-normal tracking-[-0.03em] text-[#605f5f]">
              Pages
            </p>
            <div className="mt-4 flex flex-col items-start gap-3">
              {PUBLIC_FOOTER_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-[15px] font-medium tracking-[-0.03em] text-[#1d1d1d] transition-colors hover:text-[#605f5f]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}

import type { ReactNode } from "react";

/* Shared layout + prose styling for the legal pages (Privacy Policy, Terms).
   Clean, readable document style on the cream landing background. */

const LEGAL_STYLE = `
  .legal-doc { color: #56657a; font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .legal-doc h1 { margin: 0; font-family: "Albert Sans", -apple-system, sans-serif; font-size: clamp(30px, 4.5vw, 42px); font-weight: 500; letter-spacing: -0.04em; line-height: 1.05; color: #16284a; }
  .legal-doc .legal-updated { margin-top: 10px; font-size: 14px; color: #8794a6; }
  .legal-doc .legal-intro { margin-top: 22px; font-size: 16px; line-height: 1.7; color: #56657a; }
  .legal-doc h2 { font-family: "Albert Sans", -apple-system, sans-serif; font-size: 22px; font-weight: 500; letter-spacing: -0.02em; color: #16284a; margin-top: 42px; }
  .legal-doc h3 { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; color: #16284a; margin-top: 24px; }
  .legal-doc p { margin-top: 12px; font-size: 15px; line-height: 1.72; color: #56657a; }
  .legal-doc ul { margin-top: 10px; padding-left: 22px; list-style: disc; }
  .legal-doc li { margin-top: 7px; font-size: 15px; line-height: 1.7; color: #56657a; }
  .legal-doc li strong { color: #16284a; }
  .legal-doc a { color: #16284a; text-decoration: underline; }
  .legal-doc strong { font-weight: 600; color: #16284a; }
  .legal-doc .legal-caps { font-size: 13.5px; line-height: 1.7; color: #56657a; }
  .legal-doc .legal-fill { background: #e3f1e4; box-shadow: 0 0 0 1px rgba(67,160,71,0.45); border-radius: 3px; padding: 0 5px; font-style: normal; color: #2f7a33; font-weight: 500; }
  .legal-doc .legal-toc { margin-top: 24px; padding: 16px 18px; border-radius: 14px; background: #eef3fb; border: 1px solid rgba(14,42,77,0.05); }
  .legal-doc .legal-toc-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #8794a6; }
  .legal-doc .legal-toc ol { margin: 10px 0 0; padding-left: 20px; }
  .legal-doc .legal-toc li { margin-top: 4px; font-size: 14px; }
`;

/** Highlights a value the owner still needs to fill in before publishing. */
export function Fill({ children }: { children: ReactNode }) {
  return <span className="legal-fill">{children}</span>;
}

export function LegalDoc({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f4f7fb]">
      <style>{LEGAL_STYLE}</style>
      <article className="legal-doc mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {lastUpdated}</p>
        {children}
      </article>
    </div>
  );
}

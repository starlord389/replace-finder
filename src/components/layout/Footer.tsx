import { Link } from "react-router-dom";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";

const links = {
  Platform: [
    { label: "How It Works", to: "/#process" },
    { label: "For Landlords", to: "/landlords" },
  ],
  Legal: [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
  ],
  Support: [
    { label: "Contact Us", to: "mailto:support@1031exchangeup.com" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[#13294e] bg-[#0e2a4d]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center">
              <ExchangeLogoLockup
                markClassName="h-8"
                textClassName="text-[15px] font-semibold tracking-[-0.03em] text-white"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#9fb2cc]">
              The exchange network for 1031 agents. Automatic matching, boot
              calculations, and exchange tracking — all in one platform.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9fb2cc]">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) =>
                  item.to.startsWith("mailto:") ? (
                    <li key={item.label}>
                      <a
                        href={item.to}
                        className="text-sm text-[#9fb2cc] transition-colors hover:text-white"
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm text-[#9fb2cc] transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[#13294e] pt-6">
          <p className="text-xs text-[#9fb2cc]">
            © {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

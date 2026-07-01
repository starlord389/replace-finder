import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";

interface NavbarProps {
  /** Retained for compatibility; the nav is now always a solid sticky bar,
   *  matching the homepage nav. */
  overlay?: boolean;
}

/** Marketing links, mirroring the homepage nav. They point at the home page
 *  sections so they work from any sub-page. */
const NAV_LINKS = [
  { label: "How It Works", href: "/#how" },
  { label: "Who It's For", href: "/#who" },
  { label: "Resources", href: "/#resources" },
  { label: "About", href: "/#meet" },
  { label: "FAQ", href: "/#faq" },
];

export default function Navbar(_props: NavbarProps) {
  const { user, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const dashboardLink = getDefaultRouteForRole(profileRole);
  const dashboardLabel = profileRole === "admin" ? "Admin" : "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass =
    "text-[15px] font-semibold text-[#33405a] transition-colors hover:text-[#43a047]";
  const btnBase =
    "inline-flex h-[42px] items-center justify-center rounded-lg text-[15px] font-bold leading-none transition-colors whitespace-nowrap";
  const outlineBtn = `${btnBase} border-[1.5px] border-[#16284a] bg-white px-[18px] text-[#16284a] hover:bg-[#16284a] hover:text-white`;
  const greenBtn = `${btnBase} border-[1.5px] border-[#43a047] bg-[#43a047] px-[22px] text-white hover:border-[#3a8c3e] hover:bg-[#3a8c3e]`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8edf3] bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link
          to={ROUTES.home}
          className="flex shrink-0 items-center text-[#16284a]"
          aria-label="1031ExchangeUP home"
        >
          <ExchangeLogoLockup textClassName="text-[22px]" />
        </Link>

        {/* Center links */}
        <nav className="hidden items-center gap-[34px] lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className={linkClass}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={dashboardLink} className={outlineBtn}>
                {dashboardLabel}
              </Link>
              <button onClick={signOut} className={greenBtn}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.login} className={`hidden sm:inline-flex ${outlineBtn}`}>
                Log In
              </Link>
              <Link to={ROUTES.signup} className={greenBtn}>
                Join Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8edf3] text-[#16284a] lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#e8edf3] bg-white px-5 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-[#33405a] hover:bg-[#eef3fb]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to={dashboardLink} className={`w-full ${outlineBtn}`}>
                    {dashboardLabel}
                  </Link>
                  <button onClick={signOut} className={`w-full ${greenBtn}`}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to={ROUTES.login} className={`w-full ${outlineBtn}`}>
                    Log In
                  </Link>
                  <Link to={ROUTES.signup} className={`w-full ${greenBtn}`}>
                    Join Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

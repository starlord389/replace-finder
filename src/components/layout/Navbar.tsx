import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import {
  PUBLIC_NAV_LINKS,
  type PublicNavSectionHash,
} from "@/content/publicNavLinks";

function isSectionNavActive(
  pathname: string,
  hash: string,
  sectionHash: PublicNavSectionHash,
): boolean {
  if (pathname !== ROUTES.home) return false;
  return hash.replace(/^#/, "") === sectionHash;
}

export default function Navbar() {
  const { user, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const desktopLinkClass =
    "whitespace-nowrap px-1.5 py-1 text-[14px] font-medium tracking-[-0.02em] transition-colors";
  const secondaryDesktopText = "text-[#5d5d5d] hover:text-[#1d1d1d]";
  const primaryDesktopButton =
    "flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1d1d1d] py-2 pl-4 pr-2 text-[14px] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-black";
  const mobileNavLinkClass = (active: boolean) =>
    `flex min-h-[42px] items-center justify-center rounded-[18px] px-4 text-sm font-semibold tracking-[-0.02em] ${
      active
        ? "bg-[#1d1d1d] text-white"
        : "bg-[#f7f5f0] text-[#4f4a43] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
    }`;

  const dashboardLink = getDefaultRouteForRole(profileRole);
  const dashboardLabel =
    profileRole === "admin"
      ? "Admin"
      : profileRole === "agent"
        ? "Dashboard"
        : "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <>
      <div className="h-20" />

      <nav
        className={`fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-[752px] -translate-x-1/2 border border-[#e0ddd6] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:w-[calc(100%-2rem)] ${
          mobileOpen ? "rounded-[28px]" : "rounded-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-[58px] items-center justify-between pl-4 pr-2 sm:pl-5 sm:pr-2.5">
          {/* Logo */}
          <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2">
            <ExchangeLogoLockup markClassName="h-8" textClassName="text-[14px] tracking-[-0.02em]" />
          </Link>

          {/* Center group — page-section links that scroll (with chevron) */}
          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {PUBLIC_NAV_LINKS.map((link) => {
              const active = link.hash
                ? isSectionNavActive(location.pathname, location.hash, link.hash)
                : location.pathname === link.to;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`flex items-center gap-1 ${desktopLinkClass} ${
                    active ? "text-[#1d1d1d]" : secondaryDesktopText
                  }`}
                >
                  {link.label}
                  {link.hash && <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>

          {/* Right group — destinations + action (divider separates from section links) */}
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  className={`${desktopLinkClass} ${secondaryDesktopText}`}
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={signOut}
                  className={primaryDesktopButton}
                >
                  Sign Out
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                    <X className="h-3 w-3 text-[#1d1d1d]" />
                  </span>
                </button>
              </>
            ) : (
              <>
                <span className="mr-1 h-5 w-px bg-[#e0ddd6]" aria-hidden="true" />
                <Link
                  to={ROUTES.forLandlords}
                  className={`${desktopLinkClass} ${
                    location.pathname === ROUTES.forLandlords
                      ? "text-[#1d1d1d]"
                      : secondaryDesktopText
                  }`}
                >
                  For Landlords
                </Link>
                <Link
                  to={ROUTES.login}
                  className={`${desktopLinkClass} ${secondaryDesktopText}`}
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.signup}
                  className={primaryDesktopButton}
                >
                  Get Started
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-[#1d1d1d]"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#1d1d1d] px-3 text-[13px] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-black md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <span>{mobileOpen ? "Close" : "Menu"}</span>
            {mobileOpen ? (
              <X className="h-[15px] w-[15px]" />
            ) : (
              <Menu className="h-[15px] w-[15px]" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="px-2 pb-2 pt-1 md:hidden">
            <div className="flex flex-col gap-2 border-t border-[#e8e5de] pt-3">
              {PUBLIC_NAV_LINKS.map((link) => {
                const active = link.hash
                  ? isSectionNavActive(location.pathname, location.hash, link.hash)
                  : location.pathname === link.to;
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={mobileNavLinkClass(active)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {user ? (
                <>
                  <Link
                    to={dashboardLink}
                    className="flex min-h-[42px] items-center justify-center rounded-[18px] bg-[#f7f5f0] px-4 text-sm font-semibold tracking-[-0.02em] text-[#4f4a43] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
                  >
                    {dashboardLabel}
                  </Link>
                  <div className="pt-1">
                    <button
                      onClick={signOut}
                      className="min-h-[42px] w-full rounded-full bg-[#1d1d1d] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to={ROUTES.forLandlords}
                    className={mobileNavLinkClass(location.pathname === ROUTES.forLandlords)}
                  >
                    For Landlords
                  </Link>
                  <Link
                    to={ROUTES.login}
                    className="flex min-h-[42px] w-full items-center justify-center rounded-[18px] bg-[#f7f5f0] px-4 text-center text-sm font-semibold tracking-[-0.02em] text-[#4f4a43] transition-colors hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.signup}
                    className="flex min-h-[42px] w-full items-center justify-center rounded-full bg-[#1d1d1d] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

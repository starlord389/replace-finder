import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";
import {
  PUBLIC_NAV_LINKS,
  type PublicNavSectionHash,
} from "@/content/publicNavLinks";

function ExchangeLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 486 354"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="#000000"
        strokeWidth="17"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M 191 186 L 243 134 L 295 186"
      />
      <rect x="278" y="142" width="15" height="34" rx="6" fill="#000000" />
      <rect x="207" y="206" width="72" height="142" rx="11" fill="#000000" />
      <path
        fill="#000000"
        stroke="#000000"
        strokeWidth="18"
        strokeLinejoin="round"
        d="M 243 166 L 295 214 L 191 214 Z"
      />
      <rect x="146" y="294" width="44" height="54" rx="9" fill="#FECD1A" />
      <path
        fill="#FECD1A"
        stroke="#FECD1A"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 168 254 L 204 290 L 132 290 Z"
      />
      <rect x="296" y="294" width="44" height="54" rx="9" fill="#FECD1A" />
      <path
        fill="#FECD1A"
        stroke="#FECD1A"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M 318 254 L 354 290 L 282 290 Z"
      />
    </svg>
  );
}

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
        <div className="flex h-[58px] items-center justify-between px-3 sm:px-3.5">
          {/* Logo */}
          <Link to={ROUTES.home} className="flex shrink-0 items-center gap-1.5">
            <ExchangeLogoIcon className="h-14 w-auto shrink-0" />
            <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.03em] text-[#1d1d1d]">
              1031 Exchange Up
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden flex-1 items-center justify-center gap-0 md:flex">
            {PUBLIC_NAV_LINKS.map((link) => {
              const active = link.hash
                ? isSectionNavActive(location.pathname, location.hash, link.hash)
                : location.pathname === link.to;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`${desktopLinkClass} ${
                    active ? "text-[#1d1d1d]" : secondaryDesktopText
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
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

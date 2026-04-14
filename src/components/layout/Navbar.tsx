import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";

function LightningBoltIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2L4.09 12.63a1 1 0 00.78 1.62H11v5.5a.5.5 0 00.89.31L20.91 9.37a1 1 0 00-.78-1.62H13V2.25a.5.5 0 00-.89-.31L13 2z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const dashboardLink = getDefaultRouteForRole(profileRole);
  const dashboardLabel =
    profileRole === "admin"
      ? "Admin"
      : profileRole === "agent"
        ? "Dashboard"
        : profileRole === "client"
          ? "My Exchange"
          : "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "How It Works", to: ROUTES.howItWorks },
    { label: "Features", to: ROUTES.features },
    { label: "Pricing", to: ROUTES.pricing },
  ];

  return (
    <>
      <div className="h-16" />

      <nav
        className="fixed left-1/2 top-3 z-50 w-[calc(100%-2rem)] max-w-[750px] -translate-x-1/2 rounded-full border border-[#e0ddd6] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        aria-label="Main navigation"
      >
        <div className="flex h-12 items-center justify-between px-3 sm:px-4 lg:px-4">
          {/* Logo */}
          <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1d]">
              <LightningBoltIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[16px] font-semibold tracking-tight text-[#1d1d1d]">
              Grovia
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden flex-1 items-center justify-center gap-0 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap px-1.5 py-1 text-[14px] transition-colors lg:text-[15px] ${
                  location.pathname === link.to
                    ? "font-medium text-[#1d1d1d]"
                    : "text-[#6b6b6b] hover:text-[#1d1d1d]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  className="whitespace-nowrap px-1.5 py-1 text-[14px] text-[#6b6b6b] transition-colors hover:text-[#1d1d1d] lg:text-[15px]"
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[#1d1d1d] py-1.5 pl-3.5 pr-1.5 text-[14px] font-medium text-white transition-colors hover:bg-black lg:text-[15px]"
                >
                  Sign Out
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                    <X className="h-3 w-3 text-[#1d1d1d]" />
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.login}
                  className="whitespace-nowrap px-1.5 py-1 text-[14px] text-[#6b6b6b] transition-colors hover:text-[#1d1d1d] lg:text-[15px]"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.signup}
                  className="flex items-center gap-1 whitespace-nowrap rounded-full bg-[#1d1d1d] py-1.5 pl-3.5 pr-1.5 text-[14px] font-medium text-white transition-colors hover:bg-black lg:text-[15px]"
                >
                  Get Started
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
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
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f0ede7] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-[18px] w-[18px] text-[#1d1d1d]" />
            ) : (
              <Menu className="h-[18px] w-[18px] text-[#1d1d1d]" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-[#e8e5de] px-5 pb-5 pt-3 md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                to={ROUTES.home}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  location.pathname === ROUTES.home
                    ? "bg-[#1d1d1d] text-white"
                    : "text-[#4a4a4a] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
                }`}
              >
                Home
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                    location.pathname === link.to
                      ? "bg-[#1d1d1d] text-white"
                      : "text-[#4a4a4a] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to={dashboardLink}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#4a4a4a] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
                  >
                    {dashboardLabel}
                  </Link>
                  <div className="mt-2 border-t border-[#e8e5de] pt-3">
                    <button
                      onClick={signOut}
                      className="w-full rounded-full bg-[#1d1d1d] py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2 border-t border-[#e8e5de] pt-3">
                  <Link
                    to={ROUTES.login}
                    className="w-full rounded-full border border-[#d8d5ce] bg-white py-2.5 text-center text-sm font-medium text-[#1d1d1d] transition-colors hover:bg-[#f6f4ef]"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.signup}
                    className="w-full rounded-full bg-[#1d1d1d] py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-black"
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

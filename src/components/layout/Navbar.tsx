import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import { PUBLIC_NAV_GROUPS, type PublicNavGroup } from "@/content/publicNavLinks";

interface NavbarProps {
  /** Homepage floats the nav over the hero — omit the layout spacer. */
  overlay?: boolean;
}

/** Desktop hover/focus dropdown for one nav group. */
function NavDropdown({ group }: { group: PublicNavGroup }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number>();

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => window.clearTimeout(closeTimer.current);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap px-2 py-1 text-[14px] font-medium tracking-[-0.02em] text-[#5d5d5d] transition-colors hover:text-[#1d1d1d]"
      >
        {group.label}
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-[#e0ddd6] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
        >
          {group.items.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              className="block rounded-xl px-3 py-2 text-[13.5px] font-medium tracking-[-0.02em] text-[#4f4a43] transition-colors hover:bg-[#f7f5f0] hover:text-[#1d1d1d]"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ overlay = false }: NavbarProps) {
  const { user, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const location = useLocation();

  const desktopLinkClass =
    "whitespace-nowrap px-1.5 py-1 text-[14px] font-medium tracking-[-0.02em] transition-colors";
  const secondaryDesktopText = "text-[#5d5d5d] hover:text-[#1d1d1d]";
  const primaryDesktopButton =
    "flex items-center gap-2 whitespace-nowrap rounded-full bg-[#1d1d1d] py-2 pl-5 pr-2 text-[14px] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-black";
  const mobileNavLinkClass = (active: boolean) =>
    `flex min-h-[42px] items-center justify-center rounded-[18px] px-4 text-sm font-semibold tracking-[-0.02em] ${
      active
        ? "bg-[#1d1d1d] text-white"
        : "bg-[#f7f5f0] text-[#4f4a43] hover:bg-[#f0ede7] hover:text-[#1d1d1d]"
    }`;

  const dashboardLink = getDefaultRouteForRole(profileRole);
  const dashboardLabel = profileRole === "admin" ? "Admin" : "Dashboard";

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
  }, [location.pathname, location.hash]);

  return (
    <>
      {!overlay && <div className="h-20" />}

      <nav
        className={`fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-[752px] -translate-x-1/2 border border-[#e7e3db] bg-white shadow-[0_8px_30px_rgba(40,35,28,0.10)] sm:w-[calc(100%-2rem)] ${
          mobileOpen ? "rounded-[28px]" : "rounded-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-[64px] items-center justify-between pl-5 pr-2.5 sm:pl-6 sm:pr-3">
          {/* Logo */}
          <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2">
            <ExchangeLogoLockup markClassName="h-8" textClassName="text-[14px] tracking-[-0.02em]" />
          </Link>

          {/* Center group — category dropdowns */}
          <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {PUBLIC_NAV_GROUPS.map((group) => (
              <NavDropdown key={group.label} group={group} />
            ))}
          </div>

          {/* Right group — destinations + action */}
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            {user ? (
              <>
                <Link to={dashboardLink} className={`${desktopLinkClass} ${secondaryDesktopText}`}>
                  {dashboardLabel}
                </Link>
                <button onClick={signOut} className={primaryDesktopButton}>
                  Sign Out
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <X className="h-3.5 w-3.5 text-[#1d1d1d]" />
                  </span>
                </button>
              </>
            ) : (
              <>
                <span className="mr-1 h-5 w-px bg-[#e0ddd6]" aria-hidden="true" />
                <Link
                  to={ROUTES.forLandlords}
                  className={`${desktopLinkClass} ${
                    location.pathname === ROUTES.forLandlords ? "text-[#1d1d1d]" : secondaryDesktopText
                  }`}
                >
                  For Landlords
                </Link>
                <Link to={ROUTES.login} className={`${desktopLinkClass} ${secondaryDesktopText}`}>
                  Login
                </Link>
                <Link to={ROUTES.signup} className={primaryDesktopButton}>
                  Get Started
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 text-[#1d1d1d]"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7M9 7h8v8" />
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
            {mobileOpen ? <X className="h-[15px] w-[15px]" /> : <Menu className="h-[15px] w-[15px]" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="px-2 pb-2 pt-1 md:hidden">
            <div className="flex flex-col gap-2 border-t border-[#e8e5de] pt-3">
              {/* Category groups as accordions */}
              {PUBLIC_NAV_GROUPS.map((group) => {
                const expanded = openGroup === group.label;
                return (
                  <div key={group.label} className="rounded-[18px] bg-[#f7f5f0]">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenGroup(expanded ? null : group.label)}
                      className="flex min-h-[42px] w-full items-center justify-between px-4 text-sm font-semibold tracking-[-0.02em] text-[#4f4a43]"
                    >
                      {group.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded && (
                      <div className="flex flex-col gap-0.5 px-2 pb-2">
                        {group.items.map((it) => (
                          <Link
                            key={it.label}
                            to={it.to}
                            className="flex min-h-[38px] items-center rounded-[14px] px-3 text-[13.5px] font-medium tracking-[-0.02em] text-[#5f5a53] hover:bg-white hover:text-[#1d1d1d]"
                          >
                            {it.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Divider between sections and destinations */}
              <div className="my-1 h-px bg-[#e8e5de]" />

              {user ? (
                <>
                  <Link to={dashboardLink} className={mobileNavLinkClass(false)}>
                    {dashboardLabel}
                  </Link>
                  <button
                    onClick={signOut}
                    className="min-h-[42px] w-full rounded-full bg-[#1d1d1d] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.forLandlords}
                    className={mobileNavLinkClass(location.pathname === ROUTES.forLandlords)}
                  >
                    For Landlords
                  </Link>
                  <Link to={ROUTES.login} className={mobileNavLinkClass(false)}>
                    Login
                  </Link>
                  <Link
                    to={ROUTES.signup}
                    className="flex min-h-[42px] w-full items-center justify-center rounded-full bg-[#1d1d1d] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

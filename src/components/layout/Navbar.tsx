import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const dashboardLink = profileRole === "admin" ? "/admin" : profileRole === "agent" ? "/agent" : "/dashboard";
  const dashboardLabel = profileRole === "admin" ? "Admin" : profileRole === "agent" ? "Dashboard" : profileRole === "client" ? "My Exchange" : "Dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: "How It Works", to: "/how-it-works" },
  ];

  return (
    <>
      {/* Spacer so content doesn't hide behind floating nav */}
      <div className="h-5" />

      <nav
        className={`fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 transition-all duration-300 ${
          scrolled
            ? "rounded-2xl border border-gray-200/60 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl"
            : "rounded-2xl border border-transparent bg-white/60 backdrop-blur-md"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-14 items-center justify-between px-5 sm:h-[3.75rem] sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <span className="text-gray-400">1031</span>
            <span className="text-gray-900">ExchangeUp</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-500 transition-colors hover:bg-gray-100/60 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2.5 md:flex">
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-500 transition-colors hover:bg-gray-100/60 hover:text-gray-900"
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={signOut}
                  className="rounded-full border border-gray-200 bg-white px-4 py-[7px] text-[13px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-500 transition-colors hover:bg-gray-100/60 hover:text-gray-900"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-gray-900 px-5 py-[7px] text-[13px] font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/10"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-[18px] w-[18px] text-gray-700" /> : <Menu className="h-[18px] w-[18px] text-gray-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 px-5 pb-5 pt-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to={dashboardLink}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    {dashboardLabel}
                  </Link>
                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={signOut}
                      className="w-full rounded-full border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
                  <Link to="/login" className="w-full rounded-full border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50">
                    Log In
                  </Link>
                  <Link to="/signup" className="w-full rounded-full bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-gray-800">
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

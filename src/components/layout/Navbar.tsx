import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, hasRole, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardLink = profileRole === "admin" ? "/admin" : profileRole === "agent" ? "/agent" : "/dashboard";
  const dashboardLabel = profileRole === "admin" ? "Admin" : profileRole === "agent" ? "Dashboard" : profileRole === "client" ? "My Exchange" : "Dashboard";

  return (
    <nav className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2" aria-label="Main navigation">
      <div className="flex h-14 items-center justify-between rounded-full border border-black/[0.06] bg-white/70 px-2 pl-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        {/* Logo */}
        <Link to="/" className="text-base font-bold tracking-tight text-gray-900" aria-label="1031ExchangeUp home">
          1031<span className="text-primary">ExchangeUp</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/how-it-works" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            How It Works
          </Link>
          {user && hasRole("admin") && (
            <Link to="/admin/requests" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
              Admin
            </Link>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={dashboardLink} className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                {dashboardLabel}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="mt-2 rounded-2xl border border-black/[0.06] bg-white/90 px-4 pb-5 pt-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden" role="navigation" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            <Link to="/how-it-works" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={() => setMobileOpen(false)}>
              How It Works
            </Link>
            {user ? (
              <>
                {hasRole("admin") && (
                  <Link to="/admin/requests" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link to={dashboardLink} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={() => setMobileOpen(false)}>
                  {dashboardLabel}
                </Link>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    Log In
                  </button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <button className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

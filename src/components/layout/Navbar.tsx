import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, hasRole, signOut, profileRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardLink = profileRole === "admin" ? "/admin" : profileRole === "agent" ? "/agent" : "/dashboard";
  const dashboardLabel = profileRole === "admin" ? "Admin" : profileRole === "agent" ? "Dashboard" : profileRole === "client" ? "My Exchange" : "Dashboard";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-foreground" aria-label="1031ExchangeUp home">
          1031<span className="text-primary">ExchangeUp</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/how-it-works"
            className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
          >
            How It Works
          </Link>
          {user ? (
            <>
              {hasRole("admin") && (
                <Link
                  to="/admin/requests"
                  className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
                >
                  Admin
                </Link>
              )}
              <Link to={dashboardLink}>
                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {dashboardLabel}
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="rounded-lg px-5">Start Your Search</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t bg-background px-4 pb-5 pt-4 md:hidden" role="navigation" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            <Link
              to="/how-it-works"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              How It Works
            </Link>
            {user ? (
              <>
                {hasRole("admin") && (
                  <Link
                    to="/admin/requests"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to={dashboardLink}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {dashboardLabel}
                </Link>
                <div className="mt-3 border-t pt-3">
                  <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={() => { signOut(); setMobileOpen(false); }}>
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full rounded-lg">Log In</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full rounded-lg">Start Your Search</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";
const adminLinks = [
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/matches", label: "Matches" },
];

export default function AdminLayout() {
  const { user, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isUnauthorized = !user || !hasRole("admin");

  useEffect(() => {
    if (!loading && isUnauthorized) {
      toast({ title: "You don't have admin access.", variant: "destructive" });
    }
  }, [loading, isUnauthorized]);

  if (isUnauthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg">
        Skip to content
      </a>
      <Navbar />
      <div className="border-b bg-background">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Admin navigation">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                location.pathname.startsWith(link.to)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-current={location.pathname.startsWith(link.to) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

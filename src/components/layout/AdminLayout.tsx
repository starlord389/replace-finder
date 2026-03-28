import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

  if (!user || !hasRole("admin")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar />
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
          {adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                location.pathname.startsWith(link.to)
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

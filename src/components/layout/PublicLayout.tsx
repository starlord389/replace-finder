import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ROUTES } from "@/app/routes/routeManifest";
import { cn } from "@/lib/utils";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isTemplateHome = pathname === "/";
  const isSignupPage = pathname === ROUTES.signup;

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        isSignupPage && "bg-[#F4F2EE]",
      )}
    >
      {!isTemplateHome && (
        <>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg">
            Skip to content
          </a>
          <Navbar />
        </>
      )}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      {!isTemplateHome && <Footer />}
    </div>
  );
}

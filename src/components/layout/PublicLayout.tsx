import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LandingFooter from "./LandingFooter";
import { ROUTES } from "@/app/routes/routeManifest";
import { cn } from "@/lib/utils";

export default function PublicLayout() {
  const { pathname } = useLocation();
  // The native homepage now lives at "/" — it floats the nav over its hero
  // and uses the landing footer.
  const isHome = pathname === ROUTES.home;
  // The landlord page is built in the same landing system — float the nav over
  // its textured hero too.
  const floatingNav = isHome || pathname === ROUTES.forLandlords;
  const isAuthBeigeShell =
    isHome ||
    pathname === ROUTES.signup ||
    pathname === ROUTES.login ||
    pathname === ROUTES.forgotPassword ||
    pathname === ROUTES.resetPassword ||
    pathname === ROUTES.bookDemo ||
    pathname === ROUTES.forLandlords;
  const usesLandingFooter =
    isHome ||
    pathname === ROUTES.signup ||
    pathname === ROUTES.login ||
    pathname === ROUTES.bookDemo ||
    pathname === ROUTES.forLandlords;

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        isAuthBeigeShell && "bg-[#F4F2EE]",
      )}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg">
        Skip to content
      </a>
      {/* Homepage floats the nav over its hero (overlay); other pages reserve space. */}
      <Navbar overlay={floatingNav} />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      {usesLandingFooter ? <LandingFooter /> : <Footer />}
    </div>
  );
}

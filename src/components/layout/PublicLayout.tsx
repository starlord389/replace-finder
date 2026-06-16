import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LandingFooter from "./LandingFooter";
import { ROUTES } from "@/app/routes/routeManifest";
import { cn } from "@/lib/utils";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isTemplateHome = pathname === "/";
  // The native homepage rebuild previews here with the same floating nav.
  const isNativeHomePreview = pathname === "/preview-home";
  const floatingNav = isTemplateHome || isNativeHomePreview;
  const isAuthBeigeShell =
    pathname === ROUTES.signup ||
    pathname === ROUTES.login ||
    pathname === ROUTES.forgotPassword ||
    pathname === ROUTES.resetPassword ||
    pathname === ROUTES.bookDemo ||
    pathname === ROUTES.forLandlords ||
    isNativeHomePreview;
  const usesLandingFooter =
    pathname === ROUTES.signup ||
    pathname === ROUTES.login ||
    pathname === ROUTES.bookDemo ||
    pathname === ROUTES.forLandlords ||
    isNativeHomePreview;

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
      {!isTemplateHome && (usesLandingFooter ? <LandingFooter /> : <Footer />)}
    </div>
  );
}

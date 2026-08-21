import { useState } from "react";
import { AlertTriangle, Bell, Menu, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminGlobalSearch from "@/features/admin/components/AdminGlobalSearch";
import { useAdminCommandCenter } from "@/features/admin/hooks/useAdminCommandCenter";
import AdminCrmSidebar from "./AdminCrmSidebar";
import { useAdminCrmScope } from "./AdminCrmScope";

export default function AdminCrmHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scope, setScope, isDemo } = useAdminCrmScope();
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminCommandCenter(scope);
  const attentionCount = data?.attentionItems.length ?? 0;
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /><span className="sr-only">Open navigation</span></Button></SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-0 p-0"><AdminCrmSidebar onNavigate={() => setMobileOpen(false)} /></SheetContent>
        </Sheet>
        <AdminGlobalSearch
          items={data?.searchItems ?? []}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          isRetrying={isFetching}
          onRetry={() => { void refetch(); }}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className={`inline-flex rounded-lg border p-0.5 ${isDemo ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`} aria-label="Admin workspace mode">
          <button type="button" onClick={() => setScope("live")} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${scope === "live" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Live</button>
          <button type="button" onClick={() => setScope("demo")} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${scope === "demo" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>Demo</button>
        </div>
        <Button asChild variant="ghost" size="sm" className="hidden gap-2 text-xs sm:flex"><Link to="/admin/users"><Users className="h-4 w-4" />Users</Link></Button>
        <Button asChild variant="ghost" size="icon" className="relative">
          <Link to="/admin" aria-label={isError ? "Admin data unavailable" : `${attentionCount} items need attention`}>
            {isError ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Bell className="h-4 w-4" />}
            {!isError && attentionCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{attentionCount > 99 ? "99+" : attentionCount}</span>}
          </Link>
        </Button>
      </div>
    </header>
  );
}

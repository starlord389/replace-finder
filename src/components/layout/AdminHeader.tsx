import { Link } from "react-router-dom";
import { Bell, ArrowLeftRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AdminGlobalSearch from "@/features/admin/components/AdminGlobalSearch";
import {
  formatAdminRelativeTime,
  useAdminCommandCenter,
} from "@/features/admin/hooks/useAdminCommandCenter";

export default function AdminHeader() {
  const { user, hasRole } = useAuth();
  const canSwitchToAgent = hasRole("agent");
  const { data, isLoading } = useAdminCommandCenter();
  const attention = data?.attentionItems ?? [];
  const attentionCount = attention.length;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e8edf3] bg-white/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="h-8 w-8" />
        <AdminGlobalSearch items={data?.searchItems ?? []} isLoading={isLoading} />
      </div>

      <div className="flex items-center gap-3">
        {canSwitchToAgent && (
          <Button asChild variant="outline" size="sm" className="hidden h-8 gap-1.5 text-xs lg:flex">
            <Link to="/agent/dashboard">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch to Agent view
            </Link>
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              aria-label={`${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention`}
              data-testid="admin-attention-trigger"
            >
              <Bell className="h-4 w-4" />
              {attentionCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                  {attentionCount > 99 ? "99+" : attentionCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[360px] p-0">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Needs attention</h4>
                  <p className="text-xs text-muted-foreground">Live operational items across the business</p>
                </div>
                {attentionCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {attentionCount}
                  </span>
                )}
              </div>
            </div>
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : attention.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center">
                <CheckCircle2 className="mb-2 h-7 w-7 text-green-600" />
                <p className="text-sm font-medium">You’re all caught up</p>
                <p className="text-xs text-muted-foreground">No active items need attention.</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {attention.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/60"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.priority === "critical"
                          ? "bg-red-600"
                          : item.priority === "high"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatAdminRelativeTime(item.timestamp)}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
            <div className="border-t bg-muted/30 p-2">
              <Button asChild variant="ghost" size="sm" className="w-full justify-center text-xs">
                <Link to="/admin">Open Command Center</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
          {user?.email?.charAt(0).toUpperCase() ?? "A"}
        </div>
      </div>
    </header>
  );
}

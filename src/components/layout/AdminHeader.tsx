import { Link } from "react-router-dom";
import { Bell, ArrowLeftRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader() {
  const { user, hasRole } = useAuth();
  const canSwitchToAgent = hasRole("agent");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e8edf3] bg-white/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8" />

      <div className="flex items-center gap-3">
        {canSwitchToAgent && (
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Link to="/agent/dashboard">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch to Agent view
            </Link>
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <p className="text-xs text-muted-foreground">
                No notifications yet.
              </p>
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

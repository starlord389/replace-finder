import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function AgentHeader() {
  const { user } = useAuth();
  const { data: notifications = [], unreadCount, markAllRead, markOneRead } = useNotifications();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e4dcd0] bg-white/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8" />

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet. You'll be notified about new matches and connection requests.
                </p>
              ) : (
                <ul className="divide-y">
                  {notifications.map((n) => {
                    const Inner = (
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm",
                              n.read ? "text-muted-foreground" : "font-semibold text-foreground",
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.message}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.link_to ? (
                          <Link
                            to={n.link_to}
                            onClick={() => !n.read && markOneRead.mutate(n.id)}
                            className="block px-3 py-2.5 transition-colors hover:bg-muted/60"
                          >
                            {Inner}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => !n.read && markOneRead.mutate(n.id)}
                            className="w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                          >
                            {Inner}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {user?.email?.charAt(0).toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}

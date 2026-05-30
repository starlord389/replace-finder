import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function AgentNotifications() {
  const { data: notifications = [], isLoading, unreadCount, markAllRead, markOneRead } = useNotifications();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connection requests, new matches, milestones, and messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">You're all caught up</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              When something happens on your matches, connections, or exchanges, you'll see it here.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p
                        className={cn(
                          "truncate text-sm",
                          n.read ? "text-muted-foreground" : "font-semibold text-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    {n.type && (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {n.type.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link_to ? (
                    <Link
                      to={n.link_to}
                      onClick={() => !n.read && markOneRead.mutate(n.id)}
                      className="block transition-colors hover:bg-muted/40"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !n.read && markOneRead.mutate(n.id)}
                      className="block w-full text-left transition-colors hover:bg-muted/40"
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

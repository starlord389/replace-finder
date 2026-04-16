import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AgentHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e4dcd0] bg-white/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="h-8 w-8" />

      <div className="flex items-center gap-3">
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
                No notifications yet. You'll be notified about new matches and connection requests.
              </p>
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

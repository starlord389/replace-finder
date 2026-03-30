import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ClientList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Client management coming soon.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">
            This page will show all registered clients, their exchange requests, and activity history.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

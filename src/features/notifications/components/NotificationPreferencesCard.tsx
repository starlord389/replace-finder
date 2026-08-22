import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPrefs,
  type NotificationPrefs,
  type PrefKey,
} from "@/features/notifications/hooks/useNotificationPrefs";

type Group = {
  title: string;
  description: string;
  items: Array<{ key: PrefKey; label: string; description: string }>;
};

const GROUPS: Group[] = [
  {
    title: "Opportunities",
    description: "Alerts about new matches and inquiries on your properties.",
    items: [
      {
        key: "notify_new_match",
        label: "New opportunities",
        description: "When Exchange IQ™ detects a new match for one of your properties or criteria.",
      },
      {
        key: "notify_listing_inquiry",
        label: "Listing inquiries",
        description: "When someone inquires about a listing you're involved with.",
      },
    ],
  },
  {
    title: "Conversations",
    description: "Alerts about people trying to reach you.",
    items: [
      {
        key: "notify_connection_request",
        label: "Connection requests",
        description: "When an agent or investor asks to connect or represent.",
      },
      {
        key: "notify_connection_accepted",
        label: "Connection updates",
        description: "When a connection is accepted or its status changes.",
      },
      {
        key: "notify_new_message",
        label: "New messages",
        description: "When someone sends you a message in an active conversation.",
      },
    ],
  },
  {
    title: "Account & summaries",
    description: "Weekly recaps and account notices.",
    items: [
      {
        key: "notify_weekly_digest",
        label: "Weekly summary",
        description: "One email a week recapping matches, messages, and connection activity.",
      },
      {
        key: "notify_account_updates",
        label: "Account updates",
        description: "Exchange activation confirmations and important account notices.",
      },
      {
        key: "notify_product_updates",
        label: "Product updates",
        description: "Occasional notes about new features on the platform.",
      },
    ],
  },
];

export function NotificationPreferencesCard() {
  const { data: prefs, isLoading, update } = useNotificationPrefs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification preferences</CardTitle>
        <CardDescription>
          Choose which events reach you by email and in the bell menu. Changes save immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-foreground">{group.title}</p>
            <p className="text-xs text-muted-foreground">{group.description}</p>
            <ul className="mt-2 divide-y">
              {group.items.map((item) => {
                const checked = (prefs as Record<string, unknown> | null)?.[item.key];
                return (
                  <li key={item.key} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Label
                        htmlFor={`notif-${item.key}`}
                        className="text-sm font-medium text-foreground"
                      >
                        {item.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      id={`notif-${item.key}`}
                      disabled={isLoading || update.isPending}
                      checked={checked === undefined || checked === null ? true : Boolean(checked)}
                      onCheckedChange={(v) =>
                        update.mutate({ [item.key]: v } as Partial<NotificationPrefs>)
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Security and legal notices are always sent regardless of these settings.
        </p>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferencesCard;

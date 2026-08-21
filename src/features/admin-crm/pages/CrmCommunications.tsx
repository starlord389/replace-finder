import { MessageSquareText } from "lucide-react";
import CommunicationsCenter from "../components/CommunicationsCenter";
import { CrmPageHeader } from "../components/CrmPrimitives";
import { useAdminCrmScope } from "../layout/AdminCrmScope";

export default function CrmCommunications() {
  const { scope } = useAdminCrmScope();
  return (
    <div className="space-y-5" data-testid="admin-crm-communications-page">
      <CrmPageHeader
        eyebrow="Communications"
        title="Every conversation, connected to the account"
        description="Review agent conversations, client collaboration, notifications, email and SMS delivery, invitations, and support without losing the people or deal context behind them."
        actions={<div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"><MessageSquareText className="h-4 w-4" />Administrator read-only</div>}
      />
      <CommunicationsCenter dataScope={scope} />
    </div>
  );
}

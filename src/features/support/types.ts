export type TicketCategory = "bug" | "feature" | "account" | "billing" | "general";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "account", label: "Account Issue" },
  { value: "billing", label: "Billing" },
  { value: "general", label: "General Question" },
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-muted text-muted-foreground border-border",
};

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: TicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

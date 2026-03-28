import { Enums } from "@/integrations/supabase/types";

export const ASSET_TYPE_LABELS: Record<Enums<"asset_type">, string> = {
  multifamily: "Multifamily",
  office: "Office",
  retail: "Retail",
  industrial: "Industrial",
  medical_office: "Medical Office",
  self_storage: "Self Storage",
  hospitality: "Hospitality",
  mixed_use: "Mixed Use",
  land: "Land",
  net_lease: "Net Lease",
  other: "Other",
};

export const STRATEGY_TYPE_LABELS: Record<Enums<"strategy_type">, string> = {
  core: "Core",
  core_plus: "Core Plus",
  value_add: "Value Add",
  opportunistic: "Opportunistic",
  development: "Development",
  nnn: "NNN",
  other: "Other",
};

export const REQUEST_STATUS_LABELS: Record<Enums<"request_status">, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  active: "Active",
  closed: "Closed",
};

export const REQUEST_STATUS_COLORS: Record<Enums<"request_status">, string> = {
  submitted: "bg-muted text-muted-foreground",
  under_review: "bg-yellow-100 text-yellow-800",
  active: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  under_contract: "Under Contract",
  closed: "Closed",
  archived: "Archived",
};

export const INVENTORY_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  under_contract: "bg-yellow-100 text-yellow-800",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

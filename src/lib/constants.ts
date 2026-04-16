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

export const ASSET_SUBTYPE_MAP: Record<string, string[]> = {
  multifamily: ["Garden", "Mid-Rise", "High-Rise", "Townhome", "Student Housing", "Senior Living", "Affordable/Section 8"],
  office: ["Class A", "Class B", "Class C", "Medical", "Co-Working", "Flex"],
  retail: ["Strip Mall", "Anchored Center", "Unanchored", "Single Tenant NNN", "Restaurant", "Auto Service"],
  industrial: ["Warehouse", "Distribution", "Manufacturing", "Flex", "Cold Storage", "Data Center"],
  self_storage: ["Climate Controlled", "Drive-Up", "Boat/RV"],
  hospitality: ["Full Service", "Limited Service", "Extended Stay", "Boutique"],
  medical_office: ["Other"],
  mixed_use: ["Other"],
  land: ["Other"],
  net_lease: ["Other"],
  other: ["Other"],
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
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  active: "Active",
  closed: "Closed",
};

export const REQUEST_STATUS_COLORS: Record<Enums<"request_status">, string> = {
  draft: "bg-muted text-muted-foreground",
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
];

export const PROPERTY_CLASS_OPTIONS = ["Class A", "Class B", "Class C", "Class D"];

export const PARKING_TYPE_OPTIONS = ["Surface", "Garage", "Underground", "Street", "None"];

export const CONSTRUCTION_TYPE_OPTIONS = ["Wood Frame", "Steel Frame", "Concrete", "Masonry", "Mixed"];

export const ROOF_TYPE_OPTIONS = ["Flat", "Pitched", "Metal", "Membrane", "Tile"];

export const HVAC_TYPE_OPTIONS = ["Central", "Individual", "Window", "PTAC", "VRF"];

export const PROPERTY_CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];

export const AMENITY_OPTIONS = [
  "Pool", "Fitness Center", "Clubhouse", "Business Center", "Laundry",
  "Dog Park", "EV Charging", "Elevator", "Security", "Gated",
  "On-Site Management", "Covered Parking", "Balconies/Patios",
  "In-Unit Washer/Dryer", "Playground", "Outdoor Space", "Storage Units",
];

export const LOAN_TYPE_OPTIONS = [
  "Fixed", "Variable", "Interest Only", "Bridge", "CMBS",
  "Agency", "FHA/HUD", "Life Company", "Bank",
];

export const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate — need to close ASAP" },
  { value: "standard", label: "Standard — within 180 days" },
  { value: "flexible", label: "Flexible — exploring options" },
];

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

export const MATCH_RESULT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const MATCH_RESULT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const EXCHANGE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  in_identification: "In Identification",
  in_closing: "In Closing",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const EXCHANGE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  in_identification: "bg-amber-100 text-amber-800",
  in_closing: "bg-[#e8eef0] text-[#2d3d42]",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-red-100 text-red-800",
};

export const SCORE_DIMENSIONS = [
  { key: "price_score", label: "Price", weight: "20%" },
  { key: "geo_score", label: "Geography", weight: "15%" },
  { key: "asset_score", label: "Asset Type", weight: "15%" },
  { key: "strategy_score", label: "Strategy", weight: "10%" },
  { key: "financial_score", label: "Financial", weight: "10%" },
  { key: "timing_score", label: "Timing", weight: "10%" },
  { key: "debt_fit_score", label: "Debt Fit", weight: "10%" },
  { key: "scale_fit_score", label: "Scale Fit", weight: "10%" },
] as const;

export const BOOT_STATUS_LABELS: Record<string, string> = {
  no_boot: "No Boot",
  minor_boot: "Minor Boot",
  significant_boot: "Significant Boot",
  insufficient_data: "Insufficient Data",
};

export const BOOT_STATUS_COLORS: Record<string, string> = {
  no_boot: "bg-green-100 text-green-800",
  minor_boot: "bg-amber-100 text-amber-800",
  significant_boot: "bg-red-100 text-red-800",
  insufficient_data: "bg-muted text-muted-foreground",
};

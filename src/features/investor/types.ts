export interface InvestorProperty {
  id: string;
  agentId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  assetType: string | null;
  strategyType: string | null;
  units: number | null;
  yearBuilt: number | null;
  buildingSquareFeet: number | null;
  description: string | null;
  recentRenovations: string | null;
  askingPrice: number | null;
  capRate: number | null;
  occupancyRate: number | null;
  noi: number | null;
  grossRentRoll: number | null;
  totalOperatingExpenses: number | null;
  imageUrls: string[];
  isDemo: boolean;
  listedAt: string | null;
}

export interface InvestorInquiry {
  id: string;
  investorId: string;
  propertyId: string;
  listingAgentId: string;
  initialMessage: string;
  agentResponse: string | null;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  propertyName: string;
  propertyLocation: string | null;
  investorName?: string | null;
  investorEmail?: string | null;
  investorPhone?: string | null;
}

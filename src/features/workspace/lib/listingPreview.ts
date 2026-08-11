import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import { resolveListingName } from "@/lib/listingDisplay";

export interface ListingPreviewDetails {
  property: {
    id: string;
    property_name: string | null;
    address: string | null;
    address_is_public: boolean | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    asset_type: string | null;
    asset_subtype: string | null;
    strategy_type: string | null;
    property_class: string | null;
    property_condition: string | null;
    year_built: number | null;
    units: number | null;
    building_square_footage: number | null;
    land_area_acres: number | null;
    num_buildings: number | null;
    num_stories: number | null;
    parking_spaces: number | null;
    parking_type: string | null;
    construction_type: string | null;
    roof_type: string | null;
    hvac_type: string | null;
    zoning: string | null;
    amenities: string[] | null;
    description: string | null;
    recent_renovations: string | null;
  } | null;
  financials: {
    asking_price: number | null;
    cap_rate: number | null;
    occupancy_rate: number | null;
    gross_rent_roll: number | null;
    total_operating_expenses: number | null;
    noi: number | null;
  } | null;
  imageUrls: string[];
}

const numberOrNull = (value: number | null | undefined): number | null =>
  value != null ? Number(value) : null;

export function buildListingPreviewRelationship(
  listing: AgentListing,
  details: ListingPreviewDetails | null,
  basePath: string,
): Relationship {
  const property = details?.property ?? null;
  const financials = details?.financials ?? null;
  const imageUrls = details?.imageUrls?.length
    ? details.imageUrls
    : listing.coverUrl
      ? [listing.coverUrl]
      : [];

  return {
    id: `preview-${listing.id}`,
    matchId: `preview-${listing.id}`,
    connectionId: null,
    mySide: "seller",
    stage: "new",
    score: 0,
    bootStatus: "",
    estimatedBoot: null,
    buyerCurrentRoe: null,
    candidateRoe: null,
    roeImprovementPp: null,
    roeImprovementRel: null,
    roeScore: null,
    geoScore: null,
    assetScore: null,
    strategyScore: null,
    qualityScore: null,
    candidateAnnualDebtService: null,
    estimatedPurchasingCapacity: null,
    estimatedReplacementLoan: null,
    estimatedLtv: null,
    occupancy: numberOrNull(financials?.occupancy_rate),
    currentCapRate: null,
    currentNoi: null,
    currentAnnualDebtService: null,
    counterpartyName: null,
    counterpartyBrokerage: null,
    counterpartyAvatar: null,
    propertyId: listing.propertyId ?? property?.id ?? "",
    propertyName: property
      ? resolveListingName(property, false)
      : listing.propertyName || listing.address || "Untitled listing",
    propertyCity: property?.city ?? listing.city,
    propertyState: property?.state ?? listing.state,
    propertyAddress: property
      ? property.address_is_public
        ? property.address
        : null
      : listing.address ?? null,
    propertyZip: property?.zip ?? listing.zip,
    propertyAssetType: property?.asset_type ?? listing.assetType,
    propertyAssetSubtype: property?.asset_subtype ?? null,
    propertyStrategyType: property?.strategy_type ?? listing.strategyType,
    propertyClass: property?.property_class ?? null,
    propertyCondition: property?.property_condition ?? null,
    propertyYearBuilt: numberOrNull(property?.year_built),
    propertyUnits: numberOrNull(property?.units),
    propertyBuildingSquareFeet: numberOrNull(property?.building_square_footage),
    propertyLotAcres: numberOrNull(property?.land_area_acres),
    propertyNumBuildings: numberOrNull(property?.num_buildings),
    propertyNumStories: numberOrNull(property?.num_stories),
    propertyParkingSpaces: numberOrNull(property?.parking_spaces),
    propertyParkingType: property?.parking_type ?? null,
    propertyConstructionType: property?.construction_type ?? null,
    propertyRoofType: property?.roof_type ?? null,
    propertyHvacType: property?.hvac_type ?? null,
    propertyZoning: property?.zoning ?? null,
    propertyAmenities: Array.isArray(property?.amenities) ? property.amenities : [],
    propertyDescription: property?.description ?? null,
    propertyRenovations: property?.recent_renovations ?? null,
    propertyImageUrl: imageUrls[0] ?? null,
    propertyImageUrls: imageUrls,
    askingPrice: numberOrNull(financials?.asking_price ?? listing.askingPrice),
    capRate: numberOrNull(financials?.cap_rate),
    grossRentRoll: numberOrNull(financials?.gross_rent_roll),
    totalOperatingExpenses: numberOrNull(financials?.total_operating_expenses),
    noi: numberOrNull(financials?.noi),
    clientId: listing.clientId,
    clientName: listing.clientName,
    buyerExchangeId: "",
    myExchangeId: listing.id,
    relinquishedLabel: null,
    openHref: `${basePath}/exchanges/${listing.id}/edit`,
    lastActivityAt: listing.createdAt,
    lastMessagePreview: null,
    lastMessageSenderId: null,
    unreadCount: 0,
    isNewMatch: false,
    workflowStage: null,
    workflowSentToClientAt: null,
    workflowClientInterestedAt: null,
    workflowConversationStartedAt: null,
    workflowOfferSentAt: null,
    workflowUnderContractAt: null,
    workflowClosedAt: null,
    workflowArchivedAt: null,
    workflowUpdatedAt: null,
    connectionStatus: null,
    connectionInitiatedBy: null,
    acceptedAt: null,
    declinedAt: null,
    closedAt: null,
    underContractAt: null,
    inspectionCompleteAt: null,
    financingApprovedAt: null,
    declineReason: null,
    buyerAgentId: "",
    sellerAgentId: null,
    isSameAgent: false,
    agentContactRequestId: null,
    agentContactRequestStatus: null,
    clientRecommendationResponse: null,
    clientRecommendationNote: null,
  };
}

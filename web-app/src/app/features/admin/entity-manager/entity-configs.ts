/** Schema-driven config for the generic admin entity manager. */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'datetime'
  | 'partner';

export interface FieldDef {
  key: string;
  /** i18n key for the field label. */
  labelKey: string;
  type: FieldType;
  required?: boolean;
  /** Options for `select` fields. */
  options?: string[];
  /** Grid span: 1 (half) or 2 (full width). Defaults to 1. */
  full?: boolean;
}

export type ColumnKind = 'text' | 'bool' | 'badge';

export interface ColumnDef {
  key: string;
  labelKey: string;
  kind?: ColumnKind;
}

export interface EntityConfig {
  /** Path under `/admin`, e.g. `catalog/hotels`. */
  resource: string;
  /** i18n key for the singular entity label (used in buttons/dialogs). */
  labelKey: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  /** Hide the delete action (e.g. partners — use suspend instead). */
  noDelete?: boolean;
  /** Show activate/suspend buttons (PATCH .../activate|suspend). */
  statusActions?: boolean;
}

const ACTIVE: FieldDef = { key: 'active', labelKey: 'admin.fActive', type: 'checkbox' };

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  hotels: {
    resource: 'catalog/hotels',
    labelKey: 'admin.entHotel',
    columns: [
      { key: 'name', labelKey: 'admin.cName' },
      { key: 'city', labelKey: 'admin.cCity' },
      { key: 'stars', labelKey: 'admin.cStars' },
      { key: 'basePriceNight', labelKey: 'admin.cPrice' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'partnerId', labelKey: 'admin.fPartner', type: 'partner', required: true },
      { key: 'name', labelKey: 'admin.fName', type: 'text', required: true },
      { key: 'stars', labelKey: 'admin.fStars', type: 'number' },
      { key: 'basePriceNight', labelKey: 'admin.fBasePrice', type: 'number' },
      { key: 'city', labelKey: 'admin.fCity', type: 'text' },
      { key: 'imageUrl', labelKey: 'admin.fImageUrl', type: 'text', full: true },
      { key: 'description', labelKey: 'admin.fDescription', type: 'textarea', full: true },
      { key: 'latitude', labelKey: 'admin.fLatitude', type: 'number' },
      { key: 'longitude', labelKey: 'admin.fLongitude', type: 'number' },
      { key: 'petFriendly', labelKey: 'admin.fPetFriendly', type: 'checkbox' },
      { key: 'accessible', labelKey: 'admin.fAccessible', type: 'checkbox' },
      { key: 'familyFriendly', labelKey: 'admin.fFamilyFriendly', type: 'checkbox' },
      { key: 'seaProximity', labelKey: 'admin.fSeaProximity', type: 'checkbox' },
      ACTIVE,
    ],
  },

  flights: {
    resource: 'catalog/flights',
    labelKey: 'admin.entFlight',
    columns: [
      { key: 'airline', labelKey: 'admin.cAirline' },
      { key: 'flightNumber', labelKey: 'admin.cFlightNo' },
      { key: 'originIata', labelKey: 'admin.cFrom' },
      { key: 'destIata', labelKey: 'admin.cTo' },
      { key: 'price', labelKey: 'admin.cPrice' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'airline', labelKey: 'admin.fAirline', type: 'text' },
      { key: 'flightNumber', labelKey: 'admin.fFlightNo', type: 'text' },
      { key: 'originIata', labelKey: 'admin.fFrom', type: 'text', required: true },
      { key: 'destIata', labelKey: 'admin.fTo', type: 'text', required: true },
      { key: 'departureAt', labelKey: 'admin.fDeparture', type: 'datetime' },
      { key: 'arrivalAt', labelKey: 'admin.fArrival', type: 'datetime' },
      { key: 'price', labelKey: 'admin.fPrice', type: 'number' },
      { key: 'seatsAvailable', labelKey: 'admin.fSeats', type: 'number' },
      { key: 'baggageIncluded', labelKey: 'admin.fBaggage', type: 'checkbox' },
      ACTIVE,
    ],
  },

  cruises: {
    resource: 'catalog/cruises',
    labelKey: 'admin.entCruise',
    columns: [
      { key: 'name', labelKey: 'admin.cName' },
      { key: 'operator', labelKey: 'admin.cOperator' },
      { key: 'departurePort', labelKey: 'admin.cPort' },
      { key: 'pricePerPerson', labelKey: 'admin.cPrice' },
      { key: 'cabinsAvailable', labelKey: 'admin.cCabins' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'operator', labelKey: 'admin.fOperator', type: 'text', required: true },
      { key: 'name', labelKey: 'admin.fName', type: 'text', required: true },
      { key: 'shipName', labelKey: 'admin.fShipName', type: 'text' },
      { key: 'departurePort', labelKey: 'admin.fDeparturePort', type: 'text', required: true },
      { key: 'arrivalPort', labelKey: 'admin.fArrivalPort', type: 'text' },
      { key: 'departureDate', labelKey: 'admin.fDepartureDate', type: 'date' },
      { key: 'returnDate', labelKey: 'admin.fReturnDate', type: 'date' },
      { key: 'durationNights', labelKey: 'admin.fNights', type: 'number' },
      { key: 'pricePerPerson', labelKey: 'admin.fPricePerPerson', type: 'number' },
      { key: 'cabinsAvailable', labelKey: 'admin.fCabins', type: 'number' },
      { key: 'cruiseType', labelKey: 'admin.fCruiseType', type: 'text' },
      { key: 'imageUrl', labelKey: 'admin.fImageUrl', type: 'text', full: true },
      { key: 'description', labelKey: 'admin.fDescription', type: 'textarea', full: true },
      { key: 'itinerary', labelKey: 'admin.fItinerary', type: 'textarea', full: true },
      { key: 'allInclusive', labelKey: 'admin.fAllInclusive', type: 'checkbox' },
      ACTIVE,
    ],
  },

  restaurants: {
    resource: 'catalog/restaurants',
    labelKey: 'admin.entRestaurant',
    columns: [
      { key: 'name', labelKey: 'admin.cName' },
      { key: 'cuisineType', labelKey: 'admin.cCuisine' },
      { key: 'city', labelKey: 'admin.cCity' },
      { key: 'priceTier', labelKey: 'admin.cTier' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'partnerId', labelKey: 'admin.fPartner', type: 'partner', required: true },
      { key: 'name', labelKey: 'admin.fName', type: 'text', required: true },
      { key: 'cuisineType', labelKey: 'admin.fCuisine', type: 'text' },
      { key: 'priceTier', labelKey: 'admin.fPriceTier', type: 'number' },
      { key: 'city', labelKey: 'admin.fCity', type: 'text' },
      { key: 'imageUrl', labelKey: 'admin.fImageUrl', type: 'text', full: true },
      { key: 'description', labelKey: 'admin.fDescription', type: 'textarea', full: true },
      { key: 'latitude', labelKey: 'admin.fLatitude', type: 'number' },
      { key: 'longitude', labelKey: 'admin.fLongitude', type: 'number' },
      { key: 'petFriendly', labelKey: 'admin.fPetFriendly', type: 'checkbox' },
      { key: 'accessible', labelKey: 'admin.fAccessible', type: 'checkbox' },
      ACTIVE,
    ],
  },

  destinations: {
    resource: 'catalog/destinations',
    labelKey: 'admin.entDestination',
    columns: [
      { key: 'name', labelKey: 'admin.cName' },
      { key: 'country', labelKey: 'admin.cCountry' },
      { key: 'continent', labelKey: 'admin.cContinent' },
      { key: 'popularityScore', labelKey: 'admin.cPopularity' },
      { key: 'featured', labelKey: 'admin.cFeatured', kind: 'bool' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'name', labelKey: 'admin.fName', type: 'text', required: true },
      { key: 'country', labelKey: 'admin.fCountry', type: 'text', required: true },
      { key: 'continent', labelKey: 'admin.fContinent', type: 'text' },
      { key: 'imageUrl', labelKey: 'admin.fImageUrl', type: 'text', full: true },
      { key: 'description', labelKey: 'admin.fDescription', type: 'textarea', full: true },
      { key: 'galleryUrls', labelKey: 'admin.fGallery', type: 'textarea', full: true },
      { key: 'guideText', labelKey: 'admin.fGuideText', type: 'textarea', full: true },
      { key: 'topAttractions', labelKey: 'admin.fTopAttractions', type: 'textarea', full: true },
      { key: 'foodRecommendations', labelKey: 'admin.fFoodReco', type: 'textarea', full: true },
      { key: 'travelTips', labelKey: 'admin.fTravelTips', type: 'textarea', full: true },
      { key: 'tags', labelKey: 'admin.fTags', type: 'text', full: true },
      { key: 'climate', labelKey: 'admin.fClimate', type: 'text' },
      { key: 'bestMonths', labelKey: 'admin.fBestMonths', type: 'text' },
      { key: 'avgDailyCost', labelKey: 'admin.fAvgCost', type: 'number' },
      { key: 'currency', labelKey: 'admin.fCurrency', type: 'text' },
      { key: 'language', labelKey: 'admin.fLanguage', type: 'text' },
      { key: 'timezone', labelKey: 'admin.fTimezone', type: 'text' },
      { key: 'latitude', labelKey: 'admin.fLatitude', type: 'number' },
      { key: 'longitude', labelKey: 'admin.fLongitude', type: 'number' },
      { key: 'popularityScore', labelKey: 'admin.fPopularity', type: 'number' },
      { key: 'featured', labelKey: 'admin.fFeatured', type: 'checkbox' },
      ACTIVE,
    ],
  },

  stories: {
    resource: 'catalog/stories',
    labelKey: 'admin.entStory',
    columns: [
      { key: 'place', labelKey: 'admin.cPlace' },
      { key: 'country', labelKey: 'admin.cCountry' },
      { key: 'tag', labelKey: 'admin.cTag' },
      { key: 'minutes', labelKey: 'admin.cMinutes' },
      { key: 'featured', labelKey: 'admin.cFeatured', kind: 'bool' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'place', labelKey: 'admin.fPlace', type: 'text', required: true },
      { key: 'country', labelKey: 'admin.fCountry', type: 'text', required: true },
      { key: 'tag', labelKey: 'admin.fTag', type: 'text' },
      { key: 'minutes', labelKey: 'admin.fMinutes', type: 'number' },
      { key: 'posterUrl', labelKey: 'admin.fPosterUrl', type: 'text', required: true, full: true },
      { key: 'videoUrl', labelKey: 'admin.fVideoUrl', type: 'text', full: true },
      { key: 'sortOrder', labelKey: 'admin.fSortOrder', type: 'number' },
      { key: 'featured', labelKey: 'admin.fFeatured', type: 'checkbox' },
      ACTIVE,
    ],
  },

  partners: {
    resource: 'partners',
    labelKey: 'admin.entPartner',
    noDelete: true,
    statusActions: true,
    columns: [
      { key: 'name', labelKey: 'admin.cName' },
      { key: 'type', labelKey: 'admin.cType', kind: 'badge' },
      { key: 'city', labelKey: 'admin.cCity' },
      { key: 'contactEmail', labelKey: 'admin.cEmail' },
      { key: 'active', labelKey: 'admin.cActive', kind: 'bool' },
    ],
    fields: [
      { key: 'type', labelKey: 'admin.fType', type: 'select', required: true, options: ['HOTEL', 'RESTAURANT', 'CAR_RENTAL', 'BEACH', 'OTHER'] },
      { key: 'name', labelKey: 'admin.fName', type: 'text', required: true },
      { key: 'contactEmail', labelKey: 'admin.fEmail', type: 'text', required: true },
      { key: 'contactPhone', labelKey: 'admin.fPhone', type: 'text' },
      { key: 'vatNumber', labelKey: 'admin.fVat', type: 'text' },
      { key: 'address', labelKey: 'admin.fAddress', type: 'text', full: true },
      { key: 'city', labelKey: 'admin.fCity', type: 'text', required: true },
      { key: 'country', labelKey: 'admin.fCountry', type: 'text' },
      ACTIVE,
    ],
  },
};

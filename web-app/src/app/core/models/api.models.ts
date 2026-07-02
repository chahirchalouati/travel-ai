export interface ApiWrapper<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta?: { total: number; page: number; limit: number } | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  location: string | null;
  handle: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export type DateMode = 'FIXED' | 'FLEXIBLE';
export type SpendingPriority = 'FOOD' | 'STAY' | 'BALANCED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type ProposalStatus = 'DRAFT' | 'READY' | 'EXPIRED' | 'BOOKED';
export type PaymentGateway = 'STRIPE' | 'KLARNA' | 'PAYPAL';
export type PaymentType = 'CARD' | 'BANK_TRANSFER' | 'WALLET';

export interface CreateTravelRequestRequest {
  destination?: string;
  departureDate: string;
  returnDate: string;
  dateMode: DateMode;
  adultsCount: number;
  childrenCount?: number;
  budget: number;
  spendingPriority: SpendingPriority;
  constraints?: string[];
}

export interface TravelRequestResponse {
  id: string;
  destination: string | null;
  departureDate: string;
  returnDate: string;
  dateMode: DateMode;
  adultsCount: number;
  childrenCount: number;
  budget: number;
  spendingPriority: SpendingPriority;
  constraints: string[];
  createdAt: string;
}

export interface TravelProposalResponse {
  id: string;
  requestId: string;
  destination: string;
  status: ProposalStatus;
  hotelId: string;
  restaurantId: string;
  flightId: string;
  totalCost: number;
  hotelCost: number;
  restaurantCost: number;
  flightCost: number;
  aiMotivation: string;
  rankScore: number;
  expiresAt: string;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  stars: number;
  city: string;
  description: string;
  imageUrl: string;
  pricePerNight: number;
  totalPrice: number;
  petFriendly: boolean;
  accessible: boolean;
  familyFriendly: boolean;
  seaProximity: boolean;
  available: boolean;
  partnerId: string;
}

export interface FlightSearchResult {
  id: string;
  airline: string;
  flightNumber: string;
  originIata: string;
  destIata: string;
  departureAt: string;
  arrivalAt: string;
  price: number;
  seatsAvailable: number;
  baggageIncluded: boolean;
  // Resolved server-side from the airports reference; null when an IATA is unmapped.
  originCity: string | null;
  originCountry: string | null;
  destCity: string | null;
  destCountry: string | null;
  destCountryCode: string | null;
}

export interface RestaurantSearchResult {
  id: string;
  name: string;
  cuisineType: string;
  priceTier: number;
  city: string;
  description: string;
  imageUrl: string;
  petFriendly: boolean;
  accessible: boolean;
  available: boolean;
  partnerId: string;
}

/** Request to watch a flight or cruise for price drops (exactly one id). */
export interface CreatePriceWatchRequest {
  flightId?: string;
  cruiseId?: string;
  targetPrice?: number;
}

export interface PriceWatchResponse {
  id: string;
  flightId: string | null;
  cruiseId: string | null;
  label: string;
  lastPrice: number;
  targetPrice: number | null;
  active: boolean;
  createdAt: string;
}

/** Cheapest fare on a departure day for a route (fare-calendar strip). */
export interface FareCalendarDay {
  date: string;        // YYYY-MM-DD
  minPrice: number;
  flightCount: number;
}

/** A bookable reservation slot for a restaurant on a given date. */
export interface RestaurantSlot {
  timeSlot: string;       // "HH:mm[:ss]"
  coversAvailable: number;
}

export interface AttractionResponse {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string | null;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  priceLevel: string;
  basePrice: number | null;
  durationMinutes: number | null;
  bookable: boolean;
  tags: string[];
  popularityScore: number;
  featured: boolean;
}

export interface CruiseSearchResult {
  id: string;
  operator: string;
  name: string;
  shipName: string;
  departurePort: string;
  arrivalPort: string;
  departureDate: string;
  returnDate: string;
  durationNights: number;
  pricePerPerson: number;
  cabinsAvailable: number;
  cruiseType: string;
  description: string;
  imageUrl: string;
  itinerary: string;
  allInclusive: boolean;
}

/** A bookable cabin tier for a cruise. */
export interface CruiseCabin {
  name: string;
  description: string;
  priceMultiplier: number;
  price: number;
  cabinsAvailable: number;
}

/** One day of a cruise's day-by-day itinerary. */
export interface CruiseDay {
  dayNumber: number;
  port: string;
  description: string;
}

export interface TravelerRequest {
  firstName: string;
  lastName: string;
  documentNumber?: string;
  primary: boolean;
}

export interface TravelerResponse {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  primary: boolean;
}

export interface CreateBookingRequest {
  proposalId?: string;
  hotelId?: string;
  restaurantId?: string;
  flightId?: string;
  cruiseId?: string;
  destination: string;
  checkIn?: string;
  checkOut?: string;
  totalAmount: number;
  hotelAmount?: number;
  restaurantAmount?: number;
  flightAmount?: number;
  cruiseAmount?: number;
  fareClass?: string;
  timeSlot?: string;
  cabinCategory?: string;
  partySize?: number;
  tripGroupId?: string;
  travelers: TravelerRequest[];
}

export interface ValidatePromoRequest {
  code: string;
  amount: number;
}

export interface PromoValidationResponse {
  valid: boolean;
  code: string;
  discountAmount: number;
  finalAmount: number;
  message: string;
}

export interface BookingResponse {
  id: string;
  proposalId: string;
  hotelId: string;
  restaurantId: string;
  flightId: string;
  cruiseId: string | null;
  destination: string;
  status: BookingStatus;
  totalAmount: number;
  hotelAmount: number;
  restaurantAmount: number;
  flightAmount: number;
  cruiseAmount: number | null;
  fareClass: string | null;
  timeSlot: string | null;
  cabinCategory: string | null;
  partySize: number | null;
  tripGroupId: string | null;
  bookingReference: string;
  checkIn: string;
  checkOut: string;
  travelers: TravelerResponse[];
  createdAt: string;
}

export interface InitiatePaymentRequest {
  bookingId: string;
  amount: number;
  gateway: PaymentGateway;
  type: PaymentType;
  currency?: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  status: string;
  type: PaymentType;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  gatewayReference: string;
  gatewayCheckoutUrl: string;
  paidAt: string;
  createdAt: string;
}

// Destination models
export interface DestinationResponse {
  id: string;
  name: string;
  country: string;
  continent: string;
  description: string;
  imageUrl: string;
  galleryUrls: string;
  tags: string;
  climate: string;
  bestMonths: string;
  avgDailyCost: number;
  currency: string;
  language: string;
  popularityScore: number;
  featured: boolean;
}

export interface DestinationGuide {
  destinationId: string;
  name: string;
  guide: string;
  topAttractions: string;
  foodRecommendations: string;
  travelTips: string;
}

// Review models
export interface ReviewResponse {
  id: string;
  userId: string;
  userFirstName: string;
  targetType: string;
  targetId: string;
  rating: number;
  ratingService: number | null;
  ratingValue: number | null;
  ratingCleanliness: number | null;
  ratingLocation: number | null;
  title: string;
  content: string;
  photoUrls: string;
  helpfulCount: number;
  helpfulByMe: boolean;
  verified: boolean;
  createdAt: string;
}

export interface ReviewRanking {
  rank: number;
  rankTotal: number;
  score: number;
}

export interface ReviewSummary {
  targetType: string;
  targetId: string;
  averageRating: number;
  totalReviews: number;
  averageService: number | null;
  averageValue: number | null;
  averageCleanliness: number | null;
  averageLocation: number | null;
  ranking: ReviewRanking | null;
  aiSummary: string;
}

export interface CreateReviewRequest {
  targetType: string;
  targetId: string;
  rating: number;
  ratingService?: number | null;
  ratingValue?: number | null;
  ratingCleanliness?: number | null;
  ratingLocation?: number | null;
  title: string;
  content: string;
  photoUrls?: string;
}

// Chat models
export interface ChatRequest {
  conversationId: string | null;
  message: string;
}

export interface ChatEntityAttachment {
  id: string;
  type: 'destination' | 'hotel' | 'restaurant';
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  price: number | null;
  priceLabel: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
}

export interface ChatResponse {
  conversationId: string;
  title: string;
  reply: string;
  attachments: ChatEntityAttachment[];
  timestamp: string;
}

export interface ConversationResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface ConversationDetailResponse {
  id: string;
  title: string;
  messages: MessageResponse[];
  createdAt: string;
}

// Page wrapper for paginated responses
export interface PageWrapper<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ── In-app Notifications ───────────────────────────────────────────
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationView {
  id: string;
  subject: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  createdAt: string;
}

// ── Reactive Living Itinerary ──────────────────────────────────────
export type SegmentStatus = 'ON_SCHEDULE' | 'DELAYED' | 'CANCELLED' | 'CLOSED' | 'REBOOKED';
export type ItineraryProposalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type ProposedChangeType =
  | 'REPLACE_FLIGHT'
  | 'REPLACE_HOTEL'
  | 'REPLACE_RESTAURANT'
  | 'ADJUST_TIME'
  | 'CANCEL_SEGMENT';

export interface ItinerarySegmentResponse {
  id: string;
  segmentType: string;
  entityId: string;
  label: string | null;
  currentStatus: SegmentStatus;
  scheduledAt: string | null;
}

export interface ProposedChangeResponse {
  id: string;
  segmentId: string;
  changeType: ProposedChangeType;
  replacementEntityId: string | null;
  replacementLabel: string | null;
  costDelta: number | null;
  aiRationale: string | null;
}

export interface ItineraryProposalResponse {
  id: string;
  status: ItineraryProposalStatus;
  aiSummary: string | null;
  expiresAt: string;
  createdAt: string;
  changes: ProposedChangeResponse[];
}

export interface LiveItineraryResponse {
  id: string;
  bookingId: string;
  watchEnabled: boolean;
  segments: ItinerarySegmentResponse[];
  pendingProposals: ItineraryProposalResponse[];
}

export interface ReportEventRequest {
  segmentId: string;
  description: string;
  disruptionData?: string | null;
}

// ── Community Q&A / Forum ──────────────────────────────────────────
export interface ForumQuestionResponse {
  id: string;
  authorName: string;
  title: string;
  body: string;
  targetType: string | null;
  targetId: string | null;
  location: string | null;
  answerCount: number;
  createdAt: string;
}

export interface ForumAnswerResponse {
  id: string;
  authorName: string;
  body: string;
  helpfulCount: number;
  accepted: boolean;
  createdAt: string;
}

export interface ForumQuestionDetail {
  question: ForumQuestionResponse;
  answers: ForumAnswerResponse[];
}

export interface AskQuestionRequest {
  title: string;
  body: string;
  targetType?: string | null;
  targetId?: string | null;
  location?: string | null;
}

export interface ForumAnswerRequest {
  body: string;
}

// ── Auth recovery (password reset + email verification) ─────────────────────
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

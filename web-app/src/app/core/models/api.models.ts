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
  proposalId: string;
  hotelId: string;
  restaurantId?: string;
  flightId?: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  hotelAmount?: number;
  restaurantAmount?: number;
  flightAmount?: number;
  travelers: TravelerRequest[];
}

export interface BookingResponse {
  id: string;
  proposalId: string;
  hotelId: string;
  restaurantId: string;
  flightId: string;
  destination: string;
  status: BookingStatus;
  totalAmount: number;
  hotelAmount: number;
  restaurantAmount: number;
  flightAmount: number;
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

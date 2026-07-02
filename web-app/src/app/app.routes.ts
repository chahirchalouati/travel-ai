import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/explore/explore.component').then(m => m.ExploreComponent),
  },
  {
    path: 'destination/:id',
    loadComponent: () =>
      import('./features/destination-detail/destination-detail.component').then(
        m => m.DestinationDetailComponent
      ),
  },
  {
    path: 'hotels',
    loadComponent: () =>
      import('./features/hotels/hotels.component').then(m => m.HotelsComponent),
  },
  {
    path: 'hotels/:id',
    loadComponent: () =>
      import('./features/hotel-detail/hotel-detail.component').then(
        m => m.HotelDetailComponent
      ),
  },
  {
    path: 'flights',
    loadComponent: () =>
      import('./features/flights/flights.component').then(m => m.FlightsComponent),
  },
  {
    path: 'flights/:id',
    loadComponent: () =>
      import('./features/flight-detail/flight-detail.component').then(
        m => m.FlightDetailComponent
      ),
  },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/restaurants/restaurants.component').then(
        m => m.RestaurantsComponent
      ),
  },
  {
    path: 'restaurants/:id',
    loadComponent: () =>
      import('./features/restaurant-detail/restaurant-detail.component').then(
        m => m.RestaurantDetailComponent
      ),
  },
  {
    path: 'attractions',
    loadComponent: () =>
      import('./features/attractions/attractions.component').then(m => m.AttractionsComponent),
  },
  {
    path: 'attractions/:id',
    loadComponent: () =>
      import('./features/attraction-detail/attraction-detail.component').then(
        m => m.AttractionDetailComponent
      ),
  },
  {
    path: 'cruises',
    loadComponent: () =>
      import('./features/cruises/cruises.component').then(m => m.CruisesComponent),
  },
  {
    path: 'cruises/:id',
    loadComponent: () =>
      import('./features/cruise-detail/cruise-detail.component').then(
        m => m.CruiseDetailComponent
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./features/chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'forum',
    loadComponent: () =>
      import('./features/forum/forum.component').then(m => m.ForumComponent),
  },
  {
    path: 'forum/:id',
    loadComponent: () =>
      import('./features/forum-detail/forum-detail.component').then(
        m => m.ForumDetailComponent
      ),
  },
  {
    path: 'planner',
    loadComponent: () =>
      import('./features/planner/planner.component').then(m => m.PlannerComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'trips',
    loadComponent: () =>
      import('./features/trips/trips.component').then(m => m.TripsComponent),
  },
  {
    path: 'trips/invite',
    loadComponent: () =>
      import('./features/trip-collab/trip-invite.component').then(
        m => m.TripInviteComponent
      ),
  },
  {
    path: 'trips/:id/live',
    loadComponent: () =>
      import('./features/itinerary-live/itinerary-live.component').then(
        m => m.ItineraryLiveComponent
      ),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings/bookings.component').then(m => m.BookingsComponent),
  },
  {
    path: 'book',
    loadComponent: () =>
      import('./features/booking-flow/booking-flow.component').then(
        m => m.BookingFlowComponent
      ),
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(
        m => m.FavoritesComponent
      ),
  },
  {
    path: 'trip-cart',
    loadComponent: () =>
      import('./features/booking-flow/trip-cart.component').then(
        m => m.TripCartComponent
      ),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        m => m.NotificationsComponent
      ),
  },
  {
    path: 'ticket/:id',
    loadComponent: () =>
      import('./features/ticket/ticket.component').then(m => m.TicketComponent),
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('./features/messages/messages.component').then(m => m.MessagesComponent),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./features/account/account.component').then(m => m.AccountComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth-recovery/forgot-password.component').then(
        m => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth-recovery/reset-password.component').then(
        m => m.ResetPasswordComponent
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth-recovery/verify-email.component').then(
        m => m.VerifyEmailComponent
      ),
  },
  { path: '**', redirectTo: '' },
];

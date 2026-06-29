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
    path: 'bookings',
    loadComponent: () =>
      import('./features/bookings/bookings.component').then(m => m.BookingsComponent),
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
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';

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
    path: 'flights/:id',
    loadComponent: () =>
      import('./features/flight-detail/flight-detail.component').then(
        m => m.FlightDetailComponent
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
    path: 'cruises/:id',
    loadComponent: () =>
      import('./features/cruise-detail/cruise-detail.component').then(
        m => m.CruiseDetailComponent
      ),
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
  { path: '**', redirectTo: '' },
];

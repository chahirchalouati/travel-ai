import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    data: {
      seo: {
        title: 'Discover, Plan & Book Smarter',
        description:
          'Plan your next trip with AI. Discover destinations, hotels, flights, restaurants and things to do, then book it all in one place.',
      },
    },
    loadComponent: () =>
      import('./features/explore/explore.component').then(m => m.ExploreComponent),
  },
  {
    path: 'destination/:id',
    data: { seo: { type: 'article' } },
    loadComponent: () =>
      import('./features/destination-detail/destination-detail.component').then(
        m => m.DestinationDetailComponent
      ),
  },
  {
    path: 'hotels',
    data: {
      seo: {
        title: 'Hotels',
        description:
          'Browse and book hotels for your trip — compare prices, amenities and reviews across every destination.',
      },
    },
    loadComponent: () =>
      import('./features/hotels/hotels.component').then(m => m.HotelsComponent),
  },
  {
    path: 'hotels/:id',
    data: { seo: { type: 'product' } },
    loadComponent: () =>
      import('./features/hotel-detail/hotel-detail.component').then(
        m => m.HotelDetailComponent
      ),
  },
  {
    path: 'flights',
    data: {
      seo: {
        title: 'Flights',
        description:
          'Search flights and fare calendars — round-trip, multi-city and flexible dates to find the best value.',
      },
    },
    loadComponent: () =>
      import('./features/flights/flights.component').then(m => m.FlightsComponent),
  },
  {
    path: 'flights/:id',
    data: { seo: { type: 'product' } },
    loadComponent: () =>
      import('./features/flight-detail/flight-detail.component').then(
        m => m.FlightDetailComponent
      ),
  },
  {
    path: 'restaurants',
    data: {
      seo: {
        title: 'Restaurants',
        description:
          'Find and reserve restaurants at your destination — cuisines, availability and real diner reviews.',
      },
    },
    loadComponent: () =>
      import('./features/restaurants/restaurants.component').then(
        m => m.RestaurantsComponent
      ),
  },
  {
    path: 'restaurants/:id',
    data: { seo: { type: 'product' } },
    loadComponent: () =>
      import('./features/restaurant-detail/restaurant-detail.component').then(
        m => m.RestaurantDetailComponent
      ),
  },
  {
    path: 'attractions',
    data: {
      seo: {
        title: 'Things to Do',
        description:
          'Discover attractions, tours and experiences — book the best things to do wherever you travel.',
      },
    },
    loadComponent: () =>
      import('./features/attractions/attractions.component').then(m => m.AttractionsComponent),
  },
  {
    path: 'attractions/:id',
    data: { seo: { type: 'product' } },
    loadComponent: () =>
      import('./features/attraction-detail/attraction-detail.component').then(
        m => m.AttractionDetailComponent
      ),
  },
  {
    path: 'cruises',
    data: {
      seo: {
        title: 'Cruises',
        description:
          'Explore cruise itineraries and cabin categories — day-by-day routes and onboard details to plan your voyage.',
      },
    },
    loadComponent: () =>
      import('./features/cruises/cruises.component').then(m => m.CruisesComponent),
  },
  {
    path: 'cruises/:id',
    data: { seo: { type: 'product' } },
    loadComponent: () =>
      import('./features/cruise-detail/cruise-detail.component').then(
        m => m.CruiseDetailComponent
      ),
  },
  {
    path: 'search',
    data: {
      seo: {
        title: 'Search',
        description: 'Search destinations, hotels, flights, restaurants and experiences across TravelAI.',
      },
    },
    loadComponent: () =>
      import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'chat',
    data: {
      seo: {
        title: 'AI Travel Assistant',
        description: 'Chat with the TravelAI assistant for personalised recommendations and trip planning help.',
      },
    },
    loadComponent: () =>
      import('./features/chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'forum',
    data: {
      seo: {
        title: 'Community',
        description: 'Join the TravelAI community — ask questions, share tips and get advice from fellow travellers.',
      },
    },
    loadComponent: () =>
      import('./features/forum/forum.component').then(m => m.ForumComponent),
  },
  {
    path: 'forum/:id',
    data: { seo: { type: 'article' } },
    loadComponent: () =>
      import('./features/forum-detail/forum-detail.component').then(
        m => m.ForumDetailComponent
      ),
  },
  {
    path: 'planner',
    data: {
      seo: {
        title: 'AI Trip Planner',
        description: 'Build a personalised day-by-day itinerary with the TravelAI planner in minutes.',
      },
    },
    loadComponent: () =>
      import('./features/planner/planner.component').then(m => m.PlannerComponent),
  },
  {
    path: 'profile',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'trips',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/trips/trips.component').then(m => m.TripsComponent),
  },
  {
    path: 'trips/invite',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/trip-collab/trip-invite.component').then(
        m => m.TripInviteComponent
      ),
  },
  {
    path: 'trips/:id/live',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/itinerary-live/itinerary-live.component').then(
        m => m.ItineraryLiveComponent
      ),
  },
  {
    path: 'bookings',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/bookings/bookings.component').then(m => m.BookingsComponent),
  },
  {
    path: 'book',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/booking-flow/booking-flow.component').then(
        m => m.BookingFlowComponent
      ),
  },
  {
    path: 'favorites',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(
        m => m.FavoritesComponent
      ),
  },
  {
    path: 'membership',
    data: {
      seo: {
        title: 'Travel AI Prime',
        description:
          'Travel AI Prime — zero service fees on every booking plus a members-only discount.',
      },
    },
    loadComponent: () =>
      import('./features/membership/membership.component').then(
        m => m.MembershipComponent
      ),
  },
  {
    path: 'trip-cart',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/booking-flow/trip-cart.component').then(
        m => m.TripCartComponent
      ),
  },
  {
    path: 'notifications',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        m => m.NotificationsComponent
      ),
  },
  {
    path: 'ticket/:id',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/ticket/ticket.component').then(m => m.TicketComponent),
  },
  {
    path: 'messages',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/messages/messages.component').then(m => m.MessagesComponent),
  },
  {
    path: 'account',
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/account/account.component').then(m => m.AccountComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent),
  },
  {
    path: 'admin/revenue',
    canActivate: [adminGuard],
    data: { seo: { noindex: true } },
    loadComponent: () =>
      import('./features/admin-revenue/admin-revenue.component').then(
        m => m.AdminRevenueComponent
      ),
  },
  {
    path: 'forgot-password',
    data: { seo: { title: 'Reset your password', noindex: true } },
    loadComponent: () =>
      import('./features/auth-recovery/forgot-password.component').then(
        m => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    data: { seo: { title: 'Reset your password', noindex: true } },
    loadComponent: () =>
      import('./features/auth-recovery/reset-password.component').then(
        m => m.ResetPasswordComponent
      ),
  },
  {
    path: 'verify-email',
    data: { seo: { title: 'Verify your email', noindex: true } },
    loadComponent: () =>
      import('./features/auth-recovery/verify-email.component').then(
        m => m.VerifyEmailComponent
      ),
  },
  {
    path: 'about',
    data: { seo: { title: 'About TravelAI' } },
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'ui-kit',
    data: { seo: { title: 'Swiss Grid UI kit', description: 'The Travel AI design system component library.' } },
    loadComponent: () => import('./features/ui-kit/ui-kit.component').then(m => m.UiKitComponent),
  },
  {
    path: 'compare',
    data: { seo: { title: 'Compare hotels', description: 'Compare hotels side by side on price, rating and amenities.' } },
    loadComponent: () => import('./features/compare/compare.component').then(m => m.CompareComponent),
  },
  {
    path: 'blog',
    data: { seo: { title: 'TravelAI Journal', description: 'Travel inspiration, tips, and stories from the TravelAI team.' } },
    loadComponent: () => import('./features/blog/blog.component').then(m => m.BlogComponent),
  },
  {
    path: 'careers',
    data: { seo: { title: 'Careers at TravelAI' } },
    loadComponent: () => import('./features/careers/careers.component').then(m => m.CareersComponent),
  },
  {
    path: 'press',
    data: { seo: { title: 'Press & Media — TravelAI' } },
    loadComponent: () => import('./features/press/press.component').then(m => m.PressComponent),
  },
  {
    path: 'contact',
    data: { seo: { title: 'Contact TravelAI', noindex: true } },
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'help',
    data: { seo: { title: 'Help Centre — TravelAI' } },
    loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent),
  },
  {
    path: 'safety',
    data: { seo: { title: 'Safety — TravelAI' } },
    loadComponent: () => import('./features/safety/safety.component').then(m => m.SafetyComponent),
  },
  {
    path: 'partners',
    data: { seo: { title: 'Partner with TravelAI' } },
    loadComponent: () => import('./features/partners/partners.component').then(m => m.PartnersComponent),
  },
  {
    path: 'developers',
    data: { seo: { title: 'TravelAI Developer API' } },
    loadComponent: () => import('./features/developers/developers.component').then(m => m.DevelopersComponent),
  },
  {
    path: 'privacy',
    data: { seo: { title: 'Privacy Policy — TravelAI' }, legalPage: 'privacy' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent),
  },
  {
    path: 'terms',
    data: { seo: { title: 'Terms of Service — TravelAI' }, legalPage: 'terms' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent),
  },
  {
    path: 'cookies',
    data: { seo: { title: 'Cookie Policy — TravelAI' }, legalPage: 'cookies' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent),
  },
  {
    path: 'accessibility',
    data: { seo: { title: 'Accessibility — TravelAI' }, legalPage: 'accessibility' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent),
  },
  { path: '**', redirectTo: '' },
];

import { Routes } from '@angular/router';
import { AdminShellComponent } from './admin-shell.component';

/** A schema-driven catalog/partner/promo section, keyed by its route data. */
function catalogRoute(resource: string): Routes {
  return [{
    path: resource,
    data: { resource },
    loadComponent: () => import('./sections/catalog.component').then(m => m.AdminCatalogComponent),
  }];
}

/**
 * Admin child routes. Each section is a lazy standalone component rendered inside
 * the shell's <router-outlet>. Sections are added here as they are built; the
 * wildcard keeps unknown paths pointing at the overview.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: 'overview', loadComponent: () => import('./sections/overview.component').then(m => m.AdminOverviewComponent) },
      { path: 'revenue', loadComponent: () => import('./sections/revenue.component').then(m => m.AdminRevenueComponent) },
      { path: 'users', loadComponent: () => import('./sections/users.component').then(m => m.AdminUsersComponent) },
      ...catalogRoute('partners'), ...catalogRoute('promos'),
      ...catalogRoute('hotels'), ...catalogRoute('flights'), ...catalogRoute('cruises'),
      ...catalogRoute('restaurants'), ...catalogRoute('destinations'), ...catalogRoute('attractions'),
      ...catalogRoute('stories'),
      { path: 'bookings', loadComponent: () => import('./sections/bookings.component').then(m => m.AdminBookingsComponent) },
      { path: 'payments', loadComponent: () => import('./sections/payments.component').then(m => m.AdminPaymentsComponent) },
      { path: 'subscriptions', loadComponent: () => import('./sections/subscriptions.component').then(m => m.AdminSubscriptionsComponent) },
      { path: 'reviews', loadComponent: () => import('./sections/reviews.component').then(m => m.AdminReviewsComponent) },
      { path: 'ai-logs', loadComponent: () => import('./sections/ai-logs.component').then(m => m.AdminAiLogsComponent) },
      { path: 'audit', loadComponent: () => import('./sections/audit.component').then(m => m.AdminAuditComponent) },
      { path: 'broadcast', loadComponent: () => import('./sections/broadcast.component').then(m => m.AdminBroadcastComponent) },
      { path: 'flags', loadComponent: () => import('./sections/flags.component').then(m => m.AdminFlagsComponent) },
      { path: 'rag', loadComponent: () => import('./sections/rag.component').then(m => m.AdminRagComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: '**', redirectTo: 'overview' },
    ],
  },
];

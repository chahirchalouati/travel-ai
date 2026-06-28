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
    path: 'chat',
    loadComponent: () =>
      import('./features/chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'planner',
    loadComponent: () =>
      import('./features/planner/planner.component').then(m => m.PlannerComponent),
  },
  { path: '**', redirectTo: '' },
];

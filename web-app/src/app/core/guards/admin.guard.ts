import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Allows navigation only for signed-in ADMIN users. Unauthenticated users go to
 * home; non-admins are redirected to their profile. Resolves the profile first
 * when it hasn't loaded yet (e.g. on a hard page load to /admin).
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  const decide = (isAdmin: boolean) => (isAdmin ? true : router.createUrlTree(['/profile']));

  if (auth.currentUser()) {
    return decide(auth.isAdmin());
  }

  // Profile not loaded yet — fetch it, then decide.
  return auth.fetchProfile().pipe(
    map(profile => decide(profile.role === 'ADMIN')),
    catchError(() => of(router.createUrlTree(['/profile'])))
  );
};

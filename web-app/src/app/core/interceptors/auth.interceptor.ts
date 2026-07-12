import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return handle401(req, next, authService);
      }
      return throwError(() => err);
    })
  );
};

function handle401(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);

    return authService.refreshTokens().pipe(
      switchMap(auth => {
        isRefreshing = false;
        refreshSubject.next(auth.accessToken);
        const retried = req.clone({ setHeaders: { Authorization: `Bearer ${auth.accessToken}` } });
        return next(retried);
      }),
      catchError(err => {
        isRefreshing = false;
        authService.clearAuth();
        return throwError(() => err);
      })
    );
  }

  return refreshSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap(token => {
      const retried = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      return next(retried);
    })
  );
}

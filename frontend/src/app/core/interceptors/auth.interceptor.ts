import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const isAuthEndpoint = (url: string): boolean =>
  url.includes('/auth/login') || url.includes('/auth/refresh');

const withBearer = (req: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Attaches the access token to API requests and transparently refreshes it on a
 * 401, retrying the original request once. A failed refresh ends the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApi = req.url.startsWith(environment.apiUrl);
  const skipAuth = !isApi || isAuthEndpoint(req.url);
  const token = auth.getAccessToken();

  const outgoing = skipAuth || !token ? req : withBearer(req, token);

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      const canRefresh = error.status === 401 && !skipAuth && auth.getAccessToken();
      if (!canRefresh) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        switchMap((res) => next(withBearer(req, res.accessToken))),
        catchError((refreshError) => {
          auth.clearSession();
          void router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

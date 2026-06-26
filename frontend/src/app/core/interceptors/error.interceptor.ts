import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/** Reads the backend's error envelope ({ message: string | string[] }). */
const extractMessage = (error: HttpErrorResponse): string => {
  const body = error.error as { message?: string | string[] } | string | null;
  if (typeof body === 'string') {
    return body;
  }
  const message = body?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message ?? error.message ?? 'Unexpected error';
};

/**
 * Surfaces server/network errors as toasts. 401s are left to the auth
 * interceptor (refresh flow), so they are not shown here.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        notifications.error(extractMessage(error));
      }
      return throwError(() => error);
    }),
  );
};

import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => req.url.startsWith(`${environment.apiUrl}${path}`));
        if (!isAuthEndpoint && authService.getToken()) {
          authService.logout();
          toastService.error('Your session has expired. Please log in again.');
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};

import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '../models/api-error.model';

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiError | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' ') : body.message;
    }
    if (error.status === 0) {
      return 'Could not reach the server. Check your connection and try again.';
    }
  }
  return fallback;
}

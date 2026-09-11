import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly nextId = signal(1);
  readonly toasts = signal<Toast[]>([]);

  show(message: string, variant: ToastVariant = 'info', durationMs = 4000): void {
    const id = this.nextId();
    this.nextId.set(id + 1);
    this.toasts.update((list) => [...list, { id, message, variant }]);

    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}

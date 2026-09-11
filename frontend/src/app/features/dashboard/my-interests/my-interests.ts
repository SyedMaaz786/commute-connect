import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterestsService } from '../../../core/services/interests.service';
import { ToastService } from '../../../core/services/toast.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import type { Interest } from '../../../core/models/interest.model';
import { Card } from '../../../shared/ui/card/card';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';

@Component({
  selector: 'app-my-interests',
  imports: [RouterLink, Card, Badge, Button, Spinner, EmptyState, ErrorState],
  templateUrl: './my-interests.html',
  styleUrl: './my-interests.scss',
})
export class MyInterests {
  private readonly interestsService = inject(InterestsService);
  private readonly toastService = inject(ToastService);

  readonly interests = signal<Interest[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly withdrawingId = signal<string | null>(null);

  constructor() {
    this.fetch();
  }

  retry(): void {
    this.fetch();
  }

  withdraw(interest: Interest): void {
    this.withdrawingId.set(interest.id);
    this.interestsService.withdraw(interest.postId).subscribe({
      next: () => {
        this.interests.update((list) => list.filter((item) => item.id !== interest.id));
        this.withdrawingId.set(null);
        this.toastService.success('Interest withdrawn.');
      },
      error: (error: unknown) => {
        this.withdrawingId.set(null);
        this.toastService.error(extractErrorMessage(error));
      },
    });
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.interestsService.listMine().subscribe({
      next: (interests) => {
        this.interests.set(interests);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(extractErrorMessage(error, 'Could not load your interests.'));
        this.loading.set(false);
      },
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';
import { InterestsService } from '../../../core/services/interests.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import type { CommutePost } from '../../../core/models/post.model';
import type { Interest } from '../../../core/models/interest.model';
import { Card } from '../../../shared/ui/card/card';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, Card, Badge, Button, Spinner, ErrorState, ConfirmDialog],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly interestsService = inject(InterestsService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly post = signal<CommutePost | null>(null);
  readonly interestedUsers = signal<Interest[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly interestsLoading = signal(false);
  readonly interestError = signal<string | null>(null);
  readonly alreadyInterested = signal(false);
  readonly actionPending = signal(false);
  readonly deleteDialogOpen = signal(false);

  readonly isOwner = computed(() => {
    const post = this.post();
    const user = this.authService.currentUser();
    return !!post && !!user && post.ownerId === user.id;
  });

  readonly departureLabel = computed(() => {
    const post = this.post();
    if (!post) return '';
    return new Date(post.departureAt).toLocaleString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  });

  constructor() {
    this.fetch();
  }

  retry(): void {
    this.fetch();
  }

  retryInterests(): void {
    const post = this.post();
    if (post && !this.interestsLoading()) this.loadSecondaryData(post);
  }

  toggleInterest(): void {
    const post = this.post();
    if (
      !post ||
      this.isOwner() ||
      this.interestsLoading() ||
      this.interestError() ||
      this.actionPending()
    )
      return;

    this.actionPending.set(true);

    const onSuccess = () => {
      this.alreadyInterested.set(!this.alreadyInterested());
      this.actionPending.set(false);
      this.toastService.success(
        this.alreadyInterested() ? "You're interested in this commute." : 'Interest withdrawn.',
      );
    };
    const onError = (error: unknown) => {
      this.actionPending.set(false);
      this.toastService.error(extractErrorMessage(error));
    };

    if (this.alreadyInterested()) {
      this.interestsService.withdraw(post.id).subscribe({ next: onSuccess, error: onError });
    } else {
      this.interestsService.express(post.id).subscribe({ next: onSuccess, error: onError });
    }
  }

  confirmDelete(): void {
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
  }

  deletePost(): void {
    const post = this.post();
    if (!post || this.actionPending()) return;

    this.actionPending.set(true);
    this.postsService.remove(post.id).subscribe({
      next: () => {
        this.toastService.success('Post deleted.');
        this.router.navigate(['/posts']);
      },
      error: (error: unknown) => {
        this.actionPending.set(false);
        this.deleteDialogOpen.set(false);
        this.toastService.error(extractErrorMessage(error));
      },
    });
  }

  private fetch(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Post not found.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.postsService.getOne(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
        this.loadSecondaryData(post);
      },
      error: (error: unknown) => {
        this.error.set(extractErrorMessage(error, 'Could not load this post.'));
        this.loading.set(false);
      },
    });
  }

  private loadSecondaryData(post: CommutePost): void {
    this.interestsLoading.set(true);
    this.interestError.set(null);
    const currentUserId = this.authService.currentUser()?.id;
    const isOwner = currentUserId === post.ownerId;

    if (isOwner) {
      this.interestsService.listForPost(post.id).subscribe({
        next: (interests) => {
          this.interestedUsers.set(interests);
          this.interestsLoading.set(false);
        },
        error: () => {
          this.interestError.set('Could not load interested riders. Please try again.');
          this.interestsLoading.set(false);
        },
      });
      return;
    }

    this.interestsService.listMine().subscribe({
      next: (interests) => {
        this.alreadyInterested.set(interests.some((interest) => interest.postId === post.id));
        this.interestsLoading.set(false);
      },
      error: () => {
        this.interestError.set('Could not check your interest in this commute. Please try again.');
        this.interestsLoading.set(false);
      },
    });
  }
}

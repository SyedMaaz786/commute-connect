import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { PostsService } from '../../../core/services/posts.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import type { CommutePost, PostType } from '../../../core/models/post.model';
import { PostCard } from '../post-card/post-card';
import { FilterBar } from '../filter-bar/filter-bar';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { Pagination } from '../../../shared/ui/pagination/pagination';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-post-list',
  imports: [PostCard, FilterBar, Spinner, EmptyState, ErrorState, Pagination],
  templateUrl: './post-list.html',
  styleUrl: './post-list.scss',
})
export class PostList {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  readonly posts = signal<CommutePost[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  private filters: { origin?: string; destination?: string; type?: PostType } = {};

  constructor() {
    this.fetch();
  }

  onFiltersChange(filters: { origin?: string; destination?: string; type?: PostType }): void {
    this.filters = filters;
    this.page.set(1);
    this.fetch();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.fetch();
  }

  retry(): void {
    this.fetch();
  }

  private fetch(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.request = this.postsService
      .list({ page: this.page(), limit: PAGE_SIZE, ...this.filters })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.posts.set(result.data);
          this.totalPages.set(result.totalPages);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(extractErrorMessage(error, 'Could not load commute posts.'));
          this.loading.set(false);
        },
      });
  }
}

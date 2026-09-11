import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import type { CommutePost } from '../../../core/models/post.model';
import { PostCard } from '../../posts/post-card/post-card';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { Pagination } from '../../../shared/ui/pagination/pagination';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-my-posts',
  imports: [RouterLink, PostCard, Spinner, EmptyState, ErrorState, Pagination],
  templateUrl: './my-posts.html',
  styleUrl: './my-posts.scss',
})
export class MyPosts {
  private readonly postsService = inject(PostsService);

  readonly posts = signal<CommutePost[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  constructor() {
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
    this.loading.set(true);
    this.error.set(null);

    this.postsService.listMine({ page: this.page(), limit: PAGE_SIZE }).subscribe({
      next: (result) => {
        this.posts.set(result.data);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(extractErrorMessage(error, 'Could not load your posts.'));
        this.loading.set(false);
      },
    });
  }
}

import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '../../../shared/ui/card/card';
import { Badge } from '../../../shared/ui/badge/badge';
import type { CommutePost } from '../../../core/models/post.model';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, Card, Badge],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard {
  readonly post = input.required<CommutePost>();

  readonly departureLabel = computed(() =>
    new Date(this.post().departureAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  );
}

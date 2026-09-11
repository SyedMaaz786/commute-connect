import { Component, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import type { PostType, PostsQuery } from '../../../core/models/post.model';

@Component({
  selector: 'app-filter-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  private readonly destroyRef = inject(DestroyRef);

  readonly filtersChange = output<Omit<PostsQuery, 'page' | 'limit'>>();

  readonly form = new FormGroup({
    origin: new FormControl('', { nonNullable: true }),
    destination: new FormControl('', { nonNullable: true }),
    type: new FormControl<PostType | ''>('', { nonNullable: true }),
  });

  constructor() {
    this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.filtersChange.emit({
          origin: value.origin || undefined,
          destination: value.destination || undefined,
          type: value.type || undefined,
        });
      });
  }

  clear(): void {
    this.form.reset({ origin: '', destination: '', type: '' });
  }
}

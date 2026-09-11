import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostsService } from '../../../core/services/posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import { getValidationMessage } from '../../../shared/validators/validation-messages';
import { futureDateValidator } from '../../../shared/validators/custom-validators';
import type { PostType } from '../../../core/models/post.model';
import { FormField } from '../../../shared/ui/form-field/form-field';
import { Button } from '../../../shared/ui/button/button';
import { Spinner } from '../../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-post-form',
  imports: [ReactiveFormsModule, RouterLink, FormField, Button, Spinner],
  templateUrl: './post-form.html',
  styleUrl: './post-form.scss',
})
export class PostForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly postId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = !!this.postId;

  readonly loading = signal(this.isEditMode);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);

  readonly form = new FormGroup({
    type: new FormControl<PostType>('OFFERING', { nonNullable: true, validators: [Validators.required] }),
    origin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(160)],
    }),
    destination: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(160)],
    }),
    departureAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, futureDateValidator()],
    }),
    seatsAvailable: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(8)],
    }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  constructor() {
    if (this.isEditMode && this.postId) {
      this.postsService.getOne(this.postId).subscribe({
        next: (post) => {
          if (post.ownerId !== this.authService.currentUser()?.id) {
            this.loadError.set('You can only edit your own posts.');
            this.loading.set(false);
            return;
          }
          this.form.patchValue({
            type: post.type,
            origin: post.origin,
            destination: post.destination,
            departureAt: this.toDatetimeLocal(post.departureAt),
            seatsAvailable: post.seatsAvailable,
            notes: post.notes ?? '',
          });
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loadError.set(extractErrorMessage(error, 'Could not load this post.'));
          this.loading.set(false);
        },
      });
    }
  }

  fieldError(name: keyof typeof this.form.controls): string | null {
    const labels: Record<string, string> = {
      type: 'Type',
      origin: 'Origin',
      destination: 'Destination',
      departureAt: 'Departure date/time',
      seatsAvailable: 'Seats available',
      notes: 'Notes',
    };
    return getValidationMessage(this.form.get(name), labels[name]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const value = this.form.getRawValue();
    const payload = {
      ...value,
      departureAt: new Date(value.departureAt).toISOString(),
      notes: value.notes || undefined,
    };

    const request =
      this.isEditMode && this.postId
        ? this.postsService.update(this.postId, payload)
        : this.postsService.create(payload);

    request.subscribe({
      next: (post) => {
        this.toastService.success(this.isEditMode ? 'Post updated.' : 'Post created.');
        this.router.navigate(['/posts', post.id]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(extractErrorMessage(error, 'Could not save this post.'));
      },
    });
  }

  private toDatetimeLocal(iso: string): string {
    const date = new Date(iso);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
}

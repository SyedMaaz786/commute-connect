import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import { getValidationMessage } from '../../../shared/validators/validation-messages';
import { FormField } from '../../../shared/ui/form-field/form-field';
import { Button } from '../../../shared/ui/button/button';
import { BrandMark } from '../../../shared/ui/brand-mark/brand-mark';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FormField, Button, BrandMark],
  templateUrl: './login.html',
  styleUrl: '../auth.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  fieldError(name: 'email' | 'password'): string | null {
    return getValidationMessage(this.form.get(name), name === 'email' ? 'Email' : 'Password');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/posts']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(extractErrorMessage(error, 'Could not log in. Please try again.'));
      },
    });
  }
}

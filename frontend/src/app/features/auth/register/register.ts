import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { extractErrorMessage } from '../../../core/utils/extract-error-message';
import { getValidationMessage } from '../../../shared/validators/validation-messages';
import {
  passwordStrengthValidator,
  passwordsMatchValidator,
} from '../../../shared/validators/custom-validators';
import { FormField } from '../../../shared/ui/form-field/form-field';
import { Button } from '../../../shared/ui/button/button';
import { BrandMark } from '../../../shared/ui/brand-mark/brand-mark';
import { AuthIntro } from '../auth-intro';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FormField, Button, BrandMark, AuthIntro],
  templateUrl: './register.html',
  styleUrl: '../auth.scss',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), passwordStrengthValidator()],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatchValidator('password', 'confirmPassword') },
  );

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  fieldError(name: 'name' | 'email' | 'password' | 'confirmPassword'): string | null {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
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

    const { name, email, password } = this.form.getRawValue();

    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.router.navigate(['/posts']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(
          extractErrorMessage(error, 'Could not create your account. Please try again.'),
        );
      },
    });
  }
}

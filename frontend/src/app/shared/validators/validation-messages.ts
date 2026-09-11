import type { AbstractControl } from '@angular/forms';

export function getValidationMessage(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.errors || (!control.touched && !control.dirty)) {
    return null;
  }

  const errors = control.errors;

  if (errors['required']) return `${label} is required`;
  if (errors['email']) return 'Enter a valid email address';
  if (errors['minlength']) {
    const { requiredLength } = errors['minlength'];
    return `${label} must be at least ${requiredLength} characters long`;
  }
  if (errors['maxlength']) {
    const { requiredLength } = errors['maxlength'];
    return `${label} must be shorter than ${requiredLength} characters`;
  }
  if (errors['min']) return `${label} must be at least ${errors['min'].min}`;
  if (errors['max']) return `${label} must be at most ${errors['max'].max}`;
  if (errors['passwordStrength']) return 'Password must contain at least one letter and one number';
  if (errors['futureDate']) return `${label} must be in the future`;
  if (errors['passwordMismatch']) return 'Passwords do not match';

  return `${label} is invalid`;
}

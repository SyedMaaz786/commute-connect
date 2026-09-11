import { FormControl, FormGroup } from '@angular/forms';
import { futureDateValidator, passwordStrengthValidator, passwordsMatchValidator } from './custom-validators';

describe('passwordStrengthValidator', () => {
  const validator = passwordStrengthValidator();

  it('accepts a password with letters and numbers', () => {
    expect(validator(new FormControl('abc12345'))).toBeNull();
  });

  it('rejects a password with only letters', () => {
    expect(validator(new FormControl('abcdefgh'))).toEqual({ passwordStrength: true });
  });

  it('rejects a password with only numbers', () => {
    expect(validator(new FormControl('12345678'))).toEqual({ passwordStrength: true });
  });
});

describe('futureDateValidator', () => {
  const validator = futureDateValidator();

  it('accepts a date in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(validator(new FormControl(future))).toBeNull();
  });

  it('rejects a date in the past', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(validator(new FormControl(past))).toEqual({ futureDate: true });
  });
});

describe('passwordsMatchValidator', () => {
  it('flags the confirm field when passwords differ', () => {
    const group = new FormGroup({
      password: new FormControl('secret123'),
      confirmPassword: new FormControl('different'),
    });

    passwordsMatchValidator('password', 'confirmPassword')(group);

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(true);
  });

  it('clears the mismatch error once passwords match', () => {
    const group = new FormGroup({
      password: new FormControl('secret123'),
      confirmPassword: new FormControl('secret123'),
    });
    group.get('confirmPassword')?.setErrors({ passwordMismatch: true });

    passwordsMatchValidator('password', 'confirmPassword')(group);

    expect(group.get('confirmPassword')?.hasError('passwordMismatch')).toBe(false);
  });
});

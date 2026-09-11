import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
})
export class FormField {
  readonly label = input<string>('');
  readonly for = input<string>('');
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
}

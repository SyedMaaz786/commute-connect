import { Component, input, output } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-error-state',
  imports: [Button],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  readonly message = input('Something went wrong. Please try again.');
  readonly retry = output<void>();
}

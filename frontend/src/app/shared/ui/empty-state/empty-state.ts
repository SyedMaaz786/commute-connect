import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly title = input('Nothing here yet');
  readonly message = input<string>('');
  readonly icon = input('🧭');
}

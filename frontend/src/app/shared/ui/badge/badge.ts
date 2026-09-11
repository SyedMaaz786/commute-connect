import { Component, input } from '@angular/core';

export type BadgeTone = 'primary' | 'accent' | 'success' | 'danger' | 'neutral';

@Component({
  selector: 'app-badge',
  template: `<span class="badge" [class]="'badge--' + tone()"><ng-content></ng-content></span>`,
  styleUrl: './badge.scss',
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}

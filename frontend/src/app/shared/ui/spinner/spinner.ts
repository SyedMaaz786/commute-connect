import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div class="spinner-wrap" role="status" [attr.aria-label]="label()">
      <span class="spinner" [style.width.px]="size()" [style.height.px]="size()"></span>
      @if (label()) {
        <span class="spinner-wrap__label">{{ label() }}</span>
      }
    </div>
  `,
  styleUrl: './spinner.scss',
})
export class Spinner {
  readonly size = input(28);
  readonly label = input<string>('');
}

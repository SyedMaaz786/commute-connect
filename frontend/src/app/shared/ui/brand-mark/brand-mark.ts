import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#3454D1" />
      <path
        d="M9.5 22C9.5 15.5 14 11.5 20.5 11.5"
        stroke="#FFFFFF"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-dasharray="0.5 4"
      />
      <circle cx="9.5" cy="22" r="3.25" fill="#FF9F1C" />
      <circle cx="20.5" cy="11.5" r="3.25" fill="#FFFFFF" />
    </svg>
  `,
})
export class BrandMark {
  readonly size = input(28);
}

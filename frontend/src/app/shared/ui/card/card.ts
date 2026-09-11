import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `<div class="card"><ng-content></ng-content></div>`,
  styleUrl: './card.scss',
})
export class Card {}

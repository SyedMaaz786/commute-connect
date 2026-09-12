import { Component } from '@angular/core';
import { BrandMark } from '../../shared/ui/brand-mark/brand-mark';

@Component({
  selector: 'app-auth-intro',
  imports: [BrandMark],
  template: `
    <div class="identity"><app-brand-mark [size]="38" /> CommuteConnect</div>
    <p class="eyebrow">A BETTER WAY TO GET THERE</p>
    <h2>Your daily route.<br /><span>A little more together.</span></h2>
    <p class="description">
      Find people going your way. Offer a seat, discover a ride, and make your everyday commute a
      shared journey.
    </p>
    <div class="journey" aria-hidden="true">
      <span class="dot"></span><span>Your neighborhood</span><span class="line"></span
      ><span class="dot destination"></span><span>Your destination</span>
    </div>
    <div class="steps">
      <span><b>01</b> Find a route</span><span><b>02</b> Connect with riders</span
      ><span><b>03</b> Share the journey</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 520px;
    }
    .identity {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 750;
      font-size: 22px;
      letter-spacing: -0.6px;
      margin-bottom: 70px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 750;
      letter-spacing: 2px;
      color: var(--color-primary);
      margin-bottom: 20px;
    }
    h2 {
      font-size: clamp(34px, 3.7vw, 52px);
      line-height: 1.12;
      letter-spacing: -2px;
      font-weight: 750;
    }
    h2 span {
      color: var(--color-primary);
    }
    .description {
      font-size: 17px;
      line-height: 1.75;
      color: var(--color-text-muted);
      max-width: 44ch;
      margin-top: 24px;
    }
    .journey {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 34px 0;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted);
      padding: 20px 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .dot {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      border: 2px solid var(--color-primary);
      border-radius: 50%;
    }
    .destination {
      background: var(--color-primary);
    }
    .line {
      height: 1px;
      flex: 1;
      min-width: 20px;
      border-top: 1px dashed #aab8d9;
    }
    .steps {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 12px;
      color: var(--color-text-muted);
    }
    .steps b {
      display: block;
      font-size: 11px;
      color: var(--color-primary);
      margin-bottom: 7px;
    }
    @media (max-width: 900px) {
      :host {
        display: none;
      }
    }
  `,
})
export class AuthIntro {}

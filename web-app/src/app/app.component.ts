import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavComponent } from './shared/nav/nav.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, FooterComponent],
  animations: [
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
  template: `
    <app-nav />
    <main [@routeFade]="routeKey" [@.disabled]="reduceMotion">
      <router-outlet (activate)="onActivate()" />
    </main>
    <app-footer />
  `,
  styles: [`:host { display: block; padding-top: 64px; }`],
})
export class AppComponent {
  /** Bumped on each route activation so the fade trigger re-fires. */
  routeKey = 0;

  readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  onActivate(): void {
    this.routeKey++;
  }
}

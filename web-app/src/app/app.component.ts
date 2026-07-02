import { Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavComponent } from './shared/nav/nav.component';
import { FooterComponent } from './shared/footer/footer.component';
import { SeoService, SeoData } from './core/services/seo.service';

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
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  /** Bumped on each route activation so the fade trigger re-fires. */
  routeKey = 0;

  readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  constructor() {
    // Apply per-route SEO defaults on each navigation. Detail pages may still
    // override with dynamic data (e.g. a specific hotel) via SeoService.setTag().
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => this.deepestRouteData()),
        takeUntilDestroyed(),
      )
      .subscribe(seo => this.seo.setTag(seo));
  }

  onActivate(): void {
    this.routeKey++;
  }

  /** Walk to the deepest activated child and read its `data.seo`, if any. */
  private deepestRouteData(): SeoData {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return (route.snapshot.data['seo'] as SeoData) ?? {};
  }
}

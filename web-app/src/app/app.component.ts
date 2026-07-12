import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavComponent } from './shared/nav/nav.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ImpersonationBannerComponent } from './shared/impersonation-banner/impersonation-banner.component';
import { SeoService, SeoData } from './core/services/seo.service';
import { AuthService } from './core/services/auth.service';

/** Landing area for admins — the only surface they are allowed to see. */
const ADMIN_HOME = '/admin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent, FooterComponent, ImpersonationBannerComponent],
  animations: [
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
  host: { '[class.app--chromeless]': 'chromeless()' },
  template: `
    @if (!chromeless()) {
      <app-impersonation-banner />
      <app-nav />
    }
    <main [@routeFade]="routeKey" [@.disabled]="reduceMotion">
      <router-outlet (activate)="onActivate()" />
    </main>
    @if (!chromeless()) { <app-footer /> }
  `,
  styles: [`
    :host { display: block; padding-top: 64px; }
    :host(.app--chromeless) { padding-top: 0; }
  `],
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly auth = inject(AuthService);

  /** Bumped on each route activation so the fade trigger re-fires. */
  routeKey = 0;

  /** Admin runs full-screen: the public nav/footer are hidden under /admin. */
  readonly chromeless = signal(this.router.url.startsWith('/admin'));

  /** Current URL, kept in a signal so the admin-lock effect can react to it. */
  private readonly currentUrl = signal(this.router.url);

  readonly reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  constructor() {
    // Apply per-route SEO defaults on each navigation. Detail pages may still
    // override with dynamic data (e.g. a specific hotel) via SeoService.setTag().
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(e => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.chromeless.set(e.urlAfterRedirects.startsWith('/admin'));
        this.seo.setTag(this.deepestRouteData());
      });

    // Admins are confined to the admin panel: whenever a signed-in ADMIN lands
    // on any public surface (fresh page load, in-place login via the modal, or
    // direct navigation) we bounce them back to /admin. Reacts to both the URL
    // and the auth state because an in-place login changes the role without a
    // navigation event of its own.
    effect(() => {
      if (this.auth.isAdmin() && !this.currentUrl().startsWith(ADMIN_HOME)) {
        this.router.navigateByUrl(ADMIN_HOME);
      }
    });
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

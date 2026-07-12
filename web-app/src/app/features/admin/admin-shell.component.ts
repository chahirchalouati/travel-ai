import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { ADMIN_NAV, ADMIN_NAV_FLAT } from './admin-nav';
import { AdminToastComponent } from './ui/admin-toast.component';
import { AdminConfirmComponent } from './ui/admin-confirm.component';
import { AdminCommandPaletteComponent } from './ui/admin-command-palette.component';

/**
 * Admin shell: the dark "control room" frame. A grouped rail + top bar wrap a
 * <router-outlet> that renders the active section. Hosts the ⌘K palette, the
 * toast queue and the confirm dialog once for the whole surface.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule,
    AdminToastComponent, AdminConfirmComponent, AdminCommandPaletteComponent,
  ],
  styleUrls: ['./admin-shell.component.scss'],
  template: `
    <div class="admin-root admin-shell" [class.admin-shell--rail]="railOpen()">
      <aside class="ash-rail">
        <div class="ash-brand">
          <span class="ash-brand__mark ad-ms">shield_person</span>
          <span class="ash-brand__txt">Travel<b>AI</b></span>
          <span class="ash-brand__tag ad-mono">ADMIN</span>
        </div>

        <button type="button" class="ash-cmdk" (click)="openPalette()">
          <span class="ad-ms">search</span>
          <span class="ash-cmdk__lbl">{{ 'admin.cmdOpen' | transloco }}</span>
          <kbd class="ad-mono">⌘K</kbd>
        </button>

        <nav class="ash-nav">
          @for (g of nav; track g.labelKey) {
            <div class="ash-nav__grp ad-mono">{{ g.labelKey | transloco }}</div>
            @for (it of g.items; track it.path) {
              <a class="ash-nav__item" [routerLink]="it.path" routerLinkActive="ash-nav__item--on"
                 (click)="railOpen.set(false)">
                <span class="ad-ms">{{ it.icon }}</span>
                <span class="ash-nav__lbl">{{ it.labelKey | transloco }}</span>
              </a>
            }
          }
        </nav>

        <button type="button" class="ash-exit" (click)="exit()">
          <span class="ad-ms">logout</span> {{ 'admin.backToApp' | transloco }}
        </button>
      </aside>

      <div class="ash-body">
        <header class="ash-top">
          <button type="button" class="ash-burger" (click)="railOpen.set(!railOpen())" aria-label="Menu">
            <span class="ad-ms">menu</span>
          </button>
          <div class="ash-crumb">
            <span class="ad-mono ash-crumb__root">ADMIN</span>
            <span class="ash-crumb__sep">/</span>
            <span class="ash-crumb__cur">{{ currentLabel() | transloco }}</span>
          </div>
          <div class="ash-top__right">
            <button type="button" class="ash-search" (click)="openPalette()">
              <span class="ad-ms">search</span>
              <span class="ash-search__hint">{{ 'admin.globalSearchPlaceholder' | transloco }}</span>
              <kbd class="ad-mono">⌘K</kbd>
            </button>
            <div class="ash-id">
              <span class="ash-id__av ad-mono">{{ adminInitials() }}</span>
              <span class="ash-id__name">{{ adminName() }}</span>
            </div>
          </div>
        </header>

        <main class="ash-content"><router-outlet></router-outlet></main>
      </div>

      @if (railOpen()) { <div class="ash-scrim" (click)="railOpen.set(false)"></div> }

      <admin-toast />
      <admin-confirm />
      @if (paletteOpen()) { <admin-command-palette (close)="paletteOpen.set(false)" /> }
    </div>
  `,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nav = ADMIN_NAV;
  readonly railOpen = signal(false);
  readonly paletteOpen = signal(false);
  readonly currentLabel = signal('admin.navOverview');

  constructor() {
    this.syncLabel(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(e => this.syncLabel(e.urlAfterRedirects));
  }

  private syncLabel(url: string): void {
    const seg = url.split('?')[0].split('/').filter(Boolean);
    const path = seg[seg.indexOf('admin') + 1] ?? 'overview';
    const item = ADMIN_NAV_FLAT.find(n => n.path === path);
    this.currentLabel.set(item?.labelKey ?? 'admin.navOverview');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.paletteOpen.update(v => !v);
    }
  }

  openPalette(): void { this.paletteOpen.set(true); }

  adminName(): string {
    const u = this.auth.currentUser();
    return u ? (`${u.firstName} ${u.lastName}`.trim() || u.email) : 'admin';
  }
  adminInitials(): string {
    const u = this.auth.currentUser();
    if (!u) return 'A';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase();
  }

  exit(): void { this.router.navigate(['/']); }
}

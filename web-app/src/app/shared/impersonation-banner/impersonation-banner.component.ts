import { Component, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

const ADMIN_TOKEN_KEY = 'ai_admin_token';
const IMPERSONATING_KEY = 'ai_impersonating';
const TOKEN_KEY = 'ai_access_token';

/**
 * Fixed banner shown while an admin is impersonating a user. Reads the backup admin
 * token stored at impersonation time; "Exit" restores it and returns to /admin.
 */
@Component({
  selector: 'app-impersonation-banner',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    @if (label(); as who) {
      <div class="imp-banner" role="status">
        <span class="ms">visibility</span>
        <span class="imp-text">{{ 'admin.impersonatingBanner' | transloco:{ who } }}</span>
        <button class="imp-exit" (click)="exit()">{{ 'admin.impersonateExit' | transloco }}</button>
      </div>
    }
  `,
  styles: [`
    .imp-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.55rem 1rem; background: #241C15; color: #fff;
      font-size: 0.88rem; font-weight: 600;
    }
    .imp-banner .ms { font-size: 18px; }
    .imp-text { flex: 1; }
    .imp-exit {
      border: 1px solid rgba(255,255,255,0.5); background: transparent; color: #fff;
      border-radius: 3px; padding: 0.3rem 0.8rem; font-family: inherit; font-weight: 700;
      font-size: 0.82rem; cursor: pointer;
    }
    .imp-exit:hover { background: rgba(255,255,255,0.15); }
  `],
})
export class ImpersonationBannerComponent {
  readonly label = signal<string | null>(
    typeof localStorage !== 'undefined' && localStorage.getItem(ADMIN_TOKEN_KEY)
      ? localStorage.getItem(IMPERSONATING_KEY)
      : null,
  );

  exit(): void {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (adminToken) localStorage.setItem(TOKEN_KEY, adminToken);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATING_KEY);
    window.location.href = '/admin';
  }
}

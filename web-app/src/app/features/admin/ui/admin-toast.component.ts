import { Component, inject } from '@angular/core';
import { AdminToastService } from './admin-toast.service';

/** Renders the admin toast stack. Mounted once, in the shell. */
@Component({
  selector: 'admin-toast',
  standalone: true,
  template: `
    <div class="ad-toasts" role="status" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <button type="button" class="ad-toast" [attr.data-tone]="t.tone" (click)="toasts.dismiss(t.id)">
          <span class="ad-toast__dot"></span>
          <span class="ad-toast__text">{{ t.text }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .ad-toasts {
      position: fixed; bottom: var(--ad-sp-6); right: var(--ad-sp-6);
      display: flex; flex-direction: column; gap: var(--ad-sp-2);
      z-index: 200; pointer-events: none; max-width: min(92vw, 420px);
    }
    .ad-toast {
      pointer-events: auto; cursor: pointer; text-align: left;
      display: flex; align-items: center; gap: var(--ad-sp-3);
      padding: var(--ad-sp-3) var(--ad-sp-4);
      background: var(--ad-surface-2); color: var(--ad-text);
      border: 1px solid var(--ad-line); border-left: 3px solid var(--tone, var(--ad-info));
      border-radius: var(--ad-r-sm); box-shadow: var(--ad-shadow-2);
      font-size: var(--ad-fx-sm); font-family: var(--ad-font);
      animation: ad-toast-in var(--ad-dur) var(--ad-ease-out);
    }
    .ad-toast[data-tone="ok"]     { --tone: var(--ad-ok); }
    .ad-toast[data-tone="danger"] { --tone: var(--ad-danger); }
    .ad-toast[data-tone="info"]   { --tone: var(--ad-info); }
    .ad-toast__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tone); flex: none; }
    .ad-toast__text { line-height: 1.35; }
    @keyframes ad-toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class AdminToastComponent {
  readonly toasts = inject(AdminToastService);
}

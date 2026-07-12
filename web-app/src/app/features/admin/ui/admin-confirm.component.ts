import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminConfirmService } from './admin-confirm.service';

/** Renders the active confirm dialog. Mounted once, in the shell. */
@Component({
  selector: 'admin-confirm',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (svc.current(); as req) {
      <div class="ad-cf-scrim" (click)="cancel()">
        <div class="ad-cf" role="alertdialog" aria-modal="true" [attr.aria-label]="req.title"
             (click)="$event.stopPropagation()" (keydown.escape)="cancel()">
          <h2 class="ad-cf__title">{{ req.title }}</h2>
          <p class="ad-cf__msg">{{ req.message }}</p>

          @if (req.confirmPhrase) {
            <label class="ad-cf__field">
              <span class="ad-cf__hint">{{ req.phraseHint }}</span>
              <input class="ad-mono" type="text" [(ngModel)]="typed" autocomplete="off"
                     spellcheck="false" [attr.placeholder]="req.confirmPhrase" autofocus />
            </label>
          }

          <div class="ad-cf__actions">
            <button type="button" class="ad-cf__btn ad-cf__btn--ghost" (click)="cancel()">{{ req.cancelLabel }}</button>
            <button type="button" class="ad-cf__btn ad-cf__btn--go" [attr.data-tone]="req.tone || 'danger'"
                    [disabled]="!ready()" (click)="confirm()">{{ req.confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .ad-cf-scrim {
      position: fixed; inset: 0; z-index: 220;
      background: var(--ad-scrim); backdrop-filter: blur(3px);
      display: grid; place-items: center; padding: var(--ad-sp-4);
      animation: ad-fade var(--ad-dur) var(--ad-ease);
    }
    .ad-cf {
      width: min(440px, 100%); background: var(--ad-surface-2);
      border: 1px solid var(--ad-line-strong); border-radius: var(--ad-r-md);
      box-shadow: var(--ad-shadow-pop); padding: var(--ad-sp-6);
      animation: ad-pop var(--ad-dur) var(--ad-ease-out);
    }
    .ad-cf__title { font-size: var(--ad-fx-lg); font-weight: 700; margin: 0 0 var(--ad-sp-2); letter-spacing: -0.01em; }
    .ad-cf__msg { color: var(--ad-text-dim); margin: 0 0 var(--ad-sp-5); line-height: 1.5; font-size: var(--ad-fx-base); }
    .ad-cf__field { display: block; margin-bottom: var(--ad-sp-5); }
    .ad-cf__hint { display: block; font-size: var(--ad-fx-xs); color: var(--ad-text-faint); margin-bottom: var(--ad-sp-2); }
    .ad-cf__field input {
      width: 100%; padding: var(--ad-sp-3); background: var(--ad-inset);
      border: 1px solid var(--ad-line); border-radius: var(--ad-r-sm); color: var(--ad-text);
      font-size: var(--ad-fx-base);
    }
    .ad-cf__actions { display: flex; justify-content: flex-end; gap: var(--ad-sp-3); }
    .ad-cf__btn {
      padding: var(--ad-sp-2) var(--ad-sp-5); border-radius: var(--ad-r-sm); cursor: pointer;
      font-family: var(--ad-font); font-size: var(--ad-fx-base); font-weight: 600;
      border: 1px solid transparent; transition: background var(--ad-dur-fast) var(--ad-ease), opacity var(--ad-dur-fast);
    }
    .ad-cf__btn--ghost { background: transparent; border-color: var(--ad-line-strong); color: var(--ad-text-dim); }
    .ad-cf__btn--ghost:hover { background: var(--ad-surface-3); color: var(--ad-text); }
    .ad-cf__btn--go { color: #fff; background: var(--ad-danger); }
    .ad-cf__btn--go[data-tone="accent"] { background: var(--ad-accent); }
    .ad-cf__btn--go:hover:not(:disabled) { filter: brightness(1.08); }
    .ad-cf__btn--go:disabled { opacity: 0.4; cursor: not-allowed; }
    @keyframes ad-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ad-pop { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
  `],
})
export class AdminConfirmComponent {
  readonly svc = inject(AdminConfirmService);
  readonly typed = signal('');

  readonly ready = computed(() => {
    const req = this.svc.current();
    if (!req) return false;
    if (!req.confirmPhrase) return true;
    return this.typed().trim() === req.confirmPhrase;
  });

  constructor() {
    // Reset the typed phrase whenever a new dialog opens.
    effect(() => { this.svc.current(); this.typed.set(''); });
  }

  confirm(): void { if (this.ready()) this.svc.resolve(true); }
  cancel(): void { this.svc.resolve(false); }
}

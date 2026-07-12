import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Right-hand slide-over. Animates on transform/opacity only. Project header
 * actions into [slot=actions] and body content as default. Emits `closed`.
 */
@Component({
  selector: 'admin-drawer',
  standalone: true,
  template: `
    @if (open) {
      <div class="ad-dw-scrim" (click)="closed.emit()">
        <aside class="ad-dw" role="dialog" aria-modal="true" [attr.aria-label]="title"
               [style.width.px]="width" (click)="$event.stopPropagation()" (keydown.escape)="closed.emit()">
          <header class="ad-dw__head">
            <div class="ad-dw__titles">
              @if (eyebrow) { <span class="ad-dw__eyebrow ad-mono">{{ eyebrow }}</span> }
              <h2 class="ad-dw__title">{{ title }}</h2>
            </div>
            <div class="ad-dw__head-right">
              <ng-content select="[slot=actions]"></ng-content>
              <button type="button" class="ad-dw__close" (click)="closed.emit()" aria-label="Close">✕</button>
            </div>
          </header>
          <div class="ad-dw__body">
            <ng-content></ng-content>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    .ad-dw-scrim {
      position: fixed; inset: 0; z-index: 210;
      background: var(--ad-scrim); backdrop-filter: blur(2px);
      display: flex; justify-content: flex-end;
      animation: ad-scrim-in var(--ad-dur) var(--ad-ease);
    }
    .ad-dw {
      height: 100%; max-width: 100vw; background: var(--ad-surface);
      border-left: 1px solid var(--ad-line-strong); box-shadow: var(--ad-shadow-pop);
      display: flex; flex-direction: column;
      animation: ad-dw-in var(--ad-dur-slow) var(--ad-ease-out);
      will-change: transform;
    }
    .ad-dw__head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ad-sp-4);
      padding: var(--ad-sp-5) var(--ad-sp-6); border-bottom: 1px solid var(--ad-line);
      position: sticky; top: 0; background: var(--ad-surface); z-index: 1;
    }
    .ad-dw__eyebrow { display: block; font-size: var(--ad-fx-micro); letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--ad-text-faint); margin-bottom: 2px; }
    .ad-dw__title { font-size: var(--ad-fx-h2); font-weight: 700; margin: 0; letter-spacing: -0.01em; }
    .ad-dw__head-right { display: flex; align-items: center; gap: var(--ad-sp-3); flex: none; }
    .ad-dw__close {
      width: 30px; height: 30px; display: grid; place-items: center; cursor: pointer;
      background: transparent; border: 1px solid var(--ad-line); border-radius: var(--ad-r-sm);
      color: var(--ad-text-dim); font-size: 13px; transition: all var(--ad-dur-fast) var(--ad-ease);
    }
    .ad-dw__close:hover { background: var(--ad-surface-3); color: var(--ad-text); }
    .ad-dw__body { padding: var(--ad-sp-6); overflow-y: auto; flex: 1; }
    @keyframes ad-scrim-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ad-dw-in { from { transform: translateX(24px); opacity: 0.4; } to { transform: none; opacity: 1; } }
  `],
})
export class AdminDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() width = 480;
  @Output() closed = new EventEmitter<void>();
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

export type SectionState = 'ready' | 'loading' | 'empty' | 'error';

/**
 * Standard section frame: an editorial header (mono eyebrow + big title + count
 * + right-aligned toolbar slot) over a body that renders one of four honest
 * states. Sections project their toolbar into [slot=toolbar] and content by
 * default; the frame only shows content when `state === 'ready'`.
 */
@Component({
  selector: 'admin-section',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <header class="ad-sec__head">
      <div class="ad-sec__titles">
        @if (eyebrow) { <span class="ad-sec__eyebrow ad-mono">{{ eyebrow }}</span> }
        <div class="ad-sec__title-row">
          <h1 class="ad-sec__title">{{ title }}</h1>
          @if (count !== null && count !== undefined) {
            <span class="ad-sec__count ad-mono">{{ count }}</span>
          }
        </div>
      </div>
      <div class="ad-sec__tools"><ng-content select="[slot=toolbar]"></ng-content></div>
    </header>

    @switch (state) {
      @case ('loading') {
        <div class="ad-sec__skeleton" aria-busy="true" aria-live="polite">
          @for (r of skeletonRows; track r) { <div class="ad-sk"></div> }
        </div>
      }
      @case ('error') {
        <div class="ad-sec__state">
          <span class="ad-sec__state-mark" data-tone="danger">!</span>
          <p class="ad-sec__state-msg">{{ errorMessage || ('admin.stateError' | transloco) }}</p>
          <button type="button" class="ad-sec__retry" (click)="retry.emit()">{{ 'admin.retry' | transloco }}</button>
        </div>
      }
      @case ('empty') {
        <div class="ad-sec__state">
          <span class="ad-sec__state-mark" data-tone="neutral">∅</span>
          <p class="ad-sec__state-msg">{{ emptyMessage || ('admin.stateEmpty' | transloco) }}</p>
        </div>
      }
      @default { <ng-content></ng-content> }
    }
  `,
  styles: [`
    :host { display: block; }
    .ad-sec__head {
      display: flex; align-items: flex-end; justify-content: space-between; gap: var(--ad-sp-4);
      flex-wrap: wrap; margin-bottom: var(--ad-sp-6);
    }
    .ad-sec__eyebrow { font-size: var(--ad-fx-micro); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ad-text-faint); }
    .ad-sec__title-row { display: flex; align-items: baseline; gap: var(--ad-sp-3); margin-top: 4px; }
    .ad-sec__title { font-size: var(--ad-fx-h1); font-weight: 800; letter-spacing: -0.02em; margin: 0; }
    .ad-sec__count {
      font-size: var(--ad-fx-sm); color: var(--ad-text-dim); background: var(--ad-surface-2);
      border: 1px solid var(--ad-line); border-radius: var(--ad-r-pill); padding: 2px 10px;
    }
    .ad-sec__tools { display: flex; align-items: center; gap: var(--ad-sp-3); flex-wrap: wrap; }
    .ad-sec__skeleton { display: flex; flex-direction: column; gap: var(--ad-sp-2); }
    .ad-sk {
      height: 44px; border-radius: var(--ad-r-sm);
      background: linear-gradient(90deg, var(--ad-surface) 0%, var(--ad-surface-3) 50%, var(--ad-surface) 100%);
      background-size: 200% 100%; animation: ad-shimmer 1.3s var(--ad-ease) infinite;
    }
    @keyframes ad-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    .ad-sec__state {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ad-sp-4);
      padding: var(--ad-sp-16) var(--ad-sp-6); text-align: center;
      border: 1px dashed var(--ad-line-strong); border-radius: var(--ad-r-md); background: var(--ad-surface);
    }
    .ad-sec__state-mark {
      width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%;
      font-size: 24px; font-weight: 700;
    }
    .ad-sec__state-mark[data-tone="danger"] { color: var(--ad-danger); background: var(--ad-danger-ghost); }
    .ad-sec__state-mark[data-tone="neutral"] { color: var(--ad-text-faint); background: var(--ad-neutral-ghost); }
    .ad-sec__state-msg { color: var(--ad-text-dim); margin: 0; max-width: 42ch; }
    .ad-sec__retry {
      padding: var(--ad-sp-2) var(--ad-sp-5); border-radius: var(--ad-r-sm); cursor: pointer;
      background: var(--ad-surface-3); border: 1px solid var(--ad-line-strong); color: var(--ad-text);
      font-family: var(--ad-font); font-size: var(--ad-fx-base); font-weight: 600;
      transition: background var(--ad-dur-fast) var(--ad-ease);
    }
    .ad-sec__retry:hover { background: var(--ad-surface-4); }
  `],
})
export class AdminSectionComponent {
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() count: number | null = null;
  @Input() state: SectionState = 'ready';
  @Input() emptyMessage = '';
  @Input() errorMessage = '';
  @Output() retry = new EventEmitter<void>();

  readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6, 7];
}

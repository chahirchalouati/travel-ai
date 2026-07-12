import { Component, Input } from '@angular/core';

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'pending' | 'neutral' | 'accent';

/** Semantic status pill. Tone drives color; a dot signals state at a glance. */
@Component({
  selector: 'admin-status-badge',
  standalone: true,
  template: `
    <span class="ad-badge" [attr.data-tone]="tone">
      @if (dot) { <span class="ad-badge__dot"></span> }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .ad-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 9px; border-radius: var(--ad-r-pill);
      font-size: var(--ad-fx-micro); font-weight: 600; letter-spacing: 0.04em;
      text-transform: uppercase; line-height: 1.5; white-space: nowrap;
      color: var(--tone-fg); background: var(--tone-bg);
      border: 1px solid color-mix(in oklch, var(--tone-fg) 26%, transparent);
    }
    .ad-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tone-fg); flex: none; }
    .ad-badge[data-tone="ok"]      { --tone-fg: var(--ad-ok);      --tone-bg: var(--ad-ok-ghost); }
    .ad-badge[data-tone="warn"]    { --tone-fg: var(--ad-warn);    --tone-bg: var(--ad-warn-ghost); }
    .ad-badge[data-tone="danger"]  { --tone-fg: var(--ad-danger);  --tone-bg: var(--ad-danger-ghost); }
    .ad-badge[data-tone="info"]    { --tone-fg: var(--ad-info);    --tone-bg: var(--ad-info-ghost); }
    .ad-badge[data-tone="pending"] { --tone-fg: var(--ad-pending); --tone-bg: var(--ad-pending-ghost); }
    .ad-badge[data-tone="accent"]  { --tone-fg: var(--ad-accent);  --tone-bg: var(--ad-accent-ghost); }
    .ad-badge[data-tone="neutral"] { --tone-fg: var(--ad-text-dim); --tone-bg: var(--ad-neutral-ghost); }
  `],
})
export class AdminStatusBadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
  @Input() dot = true;
}

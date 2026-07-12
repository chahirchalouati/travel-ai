import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * A KPI tile: tiny mono label up top, a huge mono numeral, optional trend and
 * hint. Set [clickable] to make it a drill-in surface. Project a chart into
 * [slot=viz] for a sparkline/bar strip.
 */
@Component({
  selector: 'admin-stat-tile',
  standalone: true,
  template: `
    <div class="ad-tile" [class.ad-tile--click]="clickable" [attr.role]="clickable ? 'button' : null"
         [attr.tabindex]="clickable ? 0 : null" (click)="clickable && act.emit()"
         (keydown.enter)="clickable && act.emit()" (keydown.space)="clickable && act.emit()">
      <div class="ad-tile__top">
        <span class="ad-tile__label ad-mono">{{ label }}</span>
        @if (trend !== null && trend !== undefined) {
          <span class="ad-tile__trend ad-mono" [attr.data-dir]="trend >= 0 ? 'up' : 'down'">
            {{ trend >= 0 ? '▲' : '▼' }} {{ absTrend }}%
          </span>
        }
      </div>
      <div class="ad-tile__value ad-mono" [attr.data-tone]="tone">{{ value }}@if (unit) {<span class="ad-tile__unit">{{ unit }}</span>}</div>
      @if (hint) { <div class="ad-tile__hint">{{ hint }}</div> }
      <ng-content select="[slot=viz]"></ng-content>
      @if (clickable) { <span class="ad-tile__go" aria-hidden="true">→</span> }
    </div>
  `,
  styles: [`
    .ad-tile {
      position: relative; padding: var(--ad-sp-5); background: var(--ad-surface);
      border: 1px solid var(--ad-line); border-radius: var(--ad-r-md);
      display: flex; flex-direction: column; gap: var(--ad-sp-2); min-height: 118px;
      transition: border-color var(--ad-dur) var(--ad-ease), transform var(--ad-dur) var(--ad-ease), background var(--ad-dur);
    }
    .ad-tile--click { cursor: pointer; }
    .ad-tile--click:hover { border-color: var(--ad-line-strong); transform: translateY(-2px); background: var(--ad-surface-2); }
    .ad-tile--click:hover .ad-tile__go { opacity: 1; transform: translateX(0); }
    .ad-tile__top { display: flex; align-items: center; justify-content: space-between; gap: var(--ad-sp-2); }
    .ad-tile__label { font-size: var(--ad-fx-micro); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ad-text-faint); }
    .ad-tile__trend { font-size: var(--ad-fx-xs); font-weight: 600; }
    .ad-tile__trend[data-dir="up"]   { color: var(--ad-ok); }
    .ad-tile__trend[data-dir="down"] { color: var(--ad-danger); }
    .ad-tile__value {
      font-size: var(--ad-fx-kpi); font-weight: 600; line-height: 1; letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums; color: var(--ad-text);
    }
    .ad-tile__value[data-tone="accent"] { color: var(--ad-accent); }
    .ad-tile__value[data-tone="ok"]     { color: var(--ad-ok); }
    .ad-tile__value[data-tone="warn"]   { color: var(--ad-warn); }
    .ad-tile__unit { font-size: 0.42em; color: var(--ad-text-faint); margin-left: 4px; letter-spacing: 0; }
    .ad-tile__hint { font-size: var(--ad-fx-xs); color: var(--ad-text-dim); }
    .ad-tile__go {
      position: absolute; top: var(--ad-sp-5); right: var(--ad-sp-5); color: var(--ad-accent);
      opacity: 0; transform: translateX(-4px); transition: all var(--ad-dur) var(--ad-ease); font-size: 15px;
    }
  `],
})
export class AdminStatTileComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() unit = '';
  @Input() hint = '';
  @Input() tone: 'default' | 'accent' | 'ok' | 'warn' = 'default';
  @Input() trend: number | null = null;
  @Input() clickable = false;
  @Output() act = new EventEmitter<void>();

  get absTrend(): number { return Math.abs(Math.round((this.trend ?? 0) * 10) / 10); }
}

import { Component, computed, input } from '@angular/core';

export type UiAvatarShape = 'circle' | 'square';

/**
 * Avatar with an image or generated initials on a red field. `shape` defaults
 * to a circle; `square` gives the Swiss-grid variant.
 */
@Component({
  selector: 'app-ui-avatar',
  standalone: true,
  template: `
    <span
      class="ui-avatar"
      [class.ui-avatar--square]="shape() === 'square'"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.font-size.px]="size() * 0.4"
    >
      @if (src()) {
        <img class="ui-avatar__img" [src]="src()" [alt]="name()" />
      } @else {
        <span class="ui-avatar__initials">{{ initials() }}</span>
      }
    </span>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .ui-avatar {
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: 50%;
        background: var(--color-red);
        color: #fff;
        font-family: var(--font-body); font-weight: 700; line-height: 1;
        overflow: hidden; flex: 0 0 auto;
      }
      .ui-avatar--square { border-radius: var(--radius-sm); }
      .ui-avatar__img { width: 100%; height: 100%; object-fit: cover; display: block; }
    `,
  ],
})
export class UiAvatarComponent {
  readonly name = input<string>('');
  readonly src = input<string>('');
  readonly size = input<number>(40);
  readonly shape = input<UiAvatarShape>('circle');

  readonly initials = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
  );
}

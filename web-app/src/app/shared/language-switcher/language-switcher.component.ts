import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';

interface Lang {
  code: string;
  label: string;
  flag: string;
}

const LANGS: Lang[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lang-wrap" [class.open]="open()">
      <button class="globe-btn" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="Change language">
        <span class="ms" style="font-size:20px">language</span>
        <span class="lang-code">{{ currentLang().code.toUpperCase() }}</span>
        <span class="ms" style="font-size:14px; transition:transform 150ms ease"
              [style.transform]="open() ? 'rotate(180deg)' : 'rotate(0)'">
          expand_more
        </span>
      </button>

      @if (open()) {
        <ul class="lang-dropdown" role="listbox">
          @for (lang of langs; track lang.code) {
            <li>
              <button
                role="option"
                [attr.aria-selected]="lang.code === currentLang().code"
                class="lang-option"
                [class.lang-option--active]="lang.code === currentLang().code"
                (click)="select(lang)"
              >
                <span class="lang-flag">{{ lang.flag }}</span>
                <span class="lang-name">{{ lang.label }}</span>
                @if (lang.code === currentLang().code) {
                  <span class="ms" style="font-size:16px; margin-left:auto; color:#00856A">check</span>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-block; }

    .lang-wrap { position: relative; }

    .globe-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 7px 10px; cursor: pointer;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 12px; font-weight: 600; color: #1a1a1a;
      transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
      white-space: nowrap; line-height: 1;
    }
    .globe-btn:hover { border-color: #1a1a1a; }

    .lang-code { font-weight: 700; letter-spacing: 0.5px; font-size: 12px; }

    .lang-dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border: 1px solid #e8e8e8; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.14);
      list-style: none; margin: 0; padding: 6px;
      min-width: 160px; z-index: 2000;
    }

    .lang-option {
      display: flex; align-items: center; gap: 10px;
      width: 100%; background: none; border: none;
      border-radius: 8px; padding: 9px 12px;
      font-family: 'Hanken Grotesk', system-ui, sans-serif;
      font-size: 14px; font-weight: 500; color: #1a1a1a;
      cursor: pointer; transition: background 100ms ease;
      text-align: left;
    }
    .lang-option:hover { background: #f5f5f5; }
    .lang-option--active { font-weight: 700; }

    .lang-flag { font-size: 18px; line-height: 1; }
    .lang-name { flex: 1; }
  `],
})
export class LanguageSwitcherComponent {
  private readonly transloco = inject(TranslocoService);

  readonly langs = LANGS;
  readonly open = signal(false);

  get currentLang(): () => Lang {
    return () => LANGS.find(l => l.code === this.transloco.getActiveLang()) ?? LANGS[0];
  }

  toggle(): void { this.open.update(v => !v); }

  select(lang: Lang): void {
    this.transloco.setActiveLang(lang.code);
    this.open.set(false);
  }
}

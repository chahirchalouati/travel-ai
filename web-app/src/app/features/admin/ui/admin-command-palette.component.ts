import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, of, Subject, debounceTime, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService, AdminSearchResult } from '../../../core/services/admin.service';
import { ADMIN_NAV_FLAT } from '../admin-nav';

interface PaletteAction {
  kind: 'nav' | 'user' | 'booking' | 'partner';
  label: string;
  sub: string;
  icon: string;
  run: () => void;
}

/** ⌘K command palette: jump to any section, or search users/bookings/partners live. */
@Component({
  selector: 'admin-command-palette',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  template: `
    <div class="ad-cmd-scrim" (click)="close.emit()">
      <div class="ad-cmd" role="dialog" aria-modal="true" aria-label="Command palette"
           (click)="$event.stopPropagation()" (keydown)="onKey($event)">
        <div class="ad-cmd__search">
          <span class="ad-ms">search</span>
          <input #box type="text" [ngModel]="query()" (ngModelChange)="onQuery($event)" autocomplete="off"
                 spellcheck="false" [placeholder]="'admin.cmdPlaceholder' | transloco" />
          <kbd class="ad-cmd__esc">ESC</kbd>
        </div>

        <div class="ad-cmd__results">
          @if (navMatches().length) {
            <div class="ad-cmd__group ad-mono">{{ 'admin.cmdSections' | transloco }}</div>
            @for (a of navMatches(); track a.label; let i = $index) {
              <button type="button" class="ad-cmd__item" [class.ad-cmd__item--on]="flatIndex('nav', i) === active()"
                      (mouseenter)="active.set(flatIndex('nav', i))" (click)="a.run()">
                <span class="ad-ms ad-cmd__ic">{{ a.icon }}</span>
                <span class="ad-cmd__label">{{ a.label }}</span>
              </button>
            }
          }

          @if (loading()) { <div class="ad-cmd__hint">{{ 'admin.loading' | transloco }}</div> }

          @for (grp of entityGroups(); track grp.key) {
            @if (grp.items.length) {
              <div class="ad-cmd__group ad-mono">{{ grp.titleKey | transloco }}</div>
              @for (a of grp.items; track a.label; let i = $index) {
                <button type="button" class="ad-cmd__item" [class.ad-cmd__item--on]="a === activeAction()"
                        (mouseenter)="setActiveAction(a)" (click)="a.run()">
                  <span class="ad-ms ad-cmd__ic">{{ a.icon }}</span>
                  <span class="ad-cmd__label">{{ a.label }}</span>
                  @if (a.sub) { <span class="ad-cmd__sub">{{ a.sub }}</span> }
                </button>
              }
            }
          }

          @if (query() && !loading() && flat().length === 0) {
            <div class="ad-cmd__hint">{{ 'admin.gsNoResults' | transloco }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-command-palette.component.scss'],
})
export class AdminCommandPaletteComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private readonly router = inject(Router);
  private readonly admin = inject(AdminService);
  private readonly transloco = inject(TranslocoService);

  readonly query = signal('');
  readonly active = signal(0);
  readonly loading = signal(false);
  private readonly results = signal<AdminSearchResult | null>(null);
  private readonly search$ = new Subject<string>();

  private readonly navActions = ADMIN_NAV_FLAT.map(n => ({
    kind: 'nav' as const,
    label: this.transloco.translate(n.labelKey),
    sub: '',
    icon: n.icon,
    run: () => this.goSection(n.path),
  }));

  readonly navMatches = computed<PaletteAction[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.navActions;
    return this.navActions.filter(a => a.label.toLowerCase().includes(q));
  });

  readonly entityGroups = computed(() => {
    const r = this.results();
    return [
      { key: 'users', titleKey: 'admin.navUsers', items: (r?.users ?? []).map(h => this.entityAction('user', 'person', h.primary, h.secondary, () => this.goEntity('users', h.secondary || h.primary))) },
      { key: 'bookings', titleKey: 'admin.navBookings', items: (r?.bookings ?? []).map(h => this.entityAction('booking', 'confirmation_number', h.primary, h.secondary, () => this.openBooking(h.id))) },
      { key: 'partners', titleKey: 'admin.navPartners', items: (r?.partners ?? []).map(h => this.entityAction('partner', 'store', h.primary, h.secondary, () => this.goEntity('partners', h.primary))) },
    ];
  });

  /** Flattened, ordered action list for keyboard navigation. */
  readonly flat = computed<PaletteAction[]>(() => [
    ...this.navMatches(),
    ...this.entityGroups().flatMap(g => g.items),
  ]);

  readonly activeAction = computed(() => this.flat()[this.active()] ?? null);

  constructor() {
    this.search$.pipe(
      debounceTime(220),
      switchMap(q => {
        if (!q.trim()) { this.loading.set(false); return of<AdminSearchResult | null>(null); }
        this.loading.set(true);
        return this.admin.search(q).pipe(catchError(() => of<AdminSearchResult | null>(null)));
      }),
      takeUntilDestroyed(),
    ).subscribe(r => { this.results.set(r); this.loading.set(false); this.active.set(0); });
  }

  ngOnInit(): void {
    queueMicrotask(() => (document.querySelector('.ad-cmd__search input') as HTMLInputElement | null)?.focus());
  }

  onQuery(q: string): void {
    this.query.set(q);
    this.active.set(0);
    this.search$.next(q);
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') { this.close.emit(); return; }
    const items = this.flat();
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.set((this.active() + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set((this.active() - 1 + items.length) % items.length); }
    else if (e.key === 'Enter') { e.preventDefault(); this.activeAction()?.run(); }
  }

  flatIndex(_kind: 'nav', i: number): number { return i; }
  setActiveAction(a: PaletteAction): void { const idx = this.flat().indexOf(a); if (idx >= 0) this.active.set(idx); }

  private entityAction(kind: PaletteAction['kind'], icon: string, primary: string, secondary: string | null, run: () => void): PaletteAction {
    return { kind, icon, label: primary || secondary || '—', sub: secondary && primary ? secondary : '', run };
  }

  private goSection(path: string): void { this.router.navigate(['/admin', path]); this.close.emit(); }
  private goEntity(path: string, q: string): void { this.router.navigate(['/admin', path], { queryParams: { q } }); this.close.emit(); }
  private openBooking(id: string): void { this.router.navigate(['/admin', 'bookings'], { queryParams: { open: id } }); this.close.emit(); }
}

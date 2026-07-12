import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslocoModule } from '@jsverse/transloco';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AuthService } from '../../core/services/auth.service';

interface NavTab {
  key: string;
  route: string;
}

/** Gap between inline tab items (`.nav-tabs` `gap: 0.25rem`). */
const TAB_GAP = 4;
/** Gaps flanking the tab region inside `.nav-inner` (`gap: 1.25rem`, two of them). */
const INNER_GAP = 20;

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule, LanguageSwitcherComponent, UserMenuComponent, AuthModalComponent],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements AfterViewInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  scrolled = signal(false);
  mobileOpen = signal(false);
  authOpen = signal(false);
  moreOpen = signal(false);

  /** Width available to the tab region, and the intrinsic width of every tab + the More button. */
  private availWidth = signal(0);
  private tabWidths = signal<number[]>([]);
  private moreWidth = signal(0);
  private currentUrl = signal(this.router.url);

  @ViewChild('navInner') private navInner?: ElementRef<HTMLElement>;
  @ViewChild('navLogo') private navLogo?: ElementRef<HTMLElement>;
  @ViewChild('navActions') private navActions?: ElementRef<HTMLElement>;
  @ViewChild('measureList') private measureList?: ElementRef<HTMLElement>;
  @ViewChild('moreHost') private moreHost?: ElementRef<HTMLElement>;
  @ViewChildren('measureTab') private measureTabs?: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('measureMore') private measureMore?: ElementRef<HTMLElement>;

  tabs: NavTab[] = [
    { key: 'nav.tabs.discover', route: '/' },
    { key: 'nav.tabs.hotels', route: '/hotels' },
    { key: 'nav.tabs.restaurants', route: '/restaurants' },
    { key: 'nav.tabs.cruises', route: '/cruises' },
    { key: 'nav.tabs.flights', route: '/flights' },
    { key: 'nav.tabs.thingsToDo', route: '/attractions' },
    { key: 'nav.tabs.aiPlanner', route: '/planner' },
    { key: 'nav.tabs.community', route: '/forum' },
    { key: 'nav.tabs.chat', route: '/chat' },
  ];

  /** How many tabs render inline before the rest collapse into the More dropdown. */
  private visibleCount = computed(() => {
    const widths = this.tabWidths();
    const avail = this.availWidth();
    const total = this.tabs.length;
    if (widths.length !== total || avail <= 0) return total;

    const fullRow = widths.reduce((sum, w) => sum + w, 0) + TAB_GAP * (total - 1);
    if (fullRow <= avail) return total;

    const reserveMore = TAB_GAP + (this.moreWidth() || 84);
    let used = 0;
    let count = 0;
    for (const w of widths) {
      const next = w + (count > 0 ? TAB_GAP : 0);
      if (used + next + reserveMore <= avail) {
        used += next;
        count += 1;
      } else {
        break;
      }
    }
    return Math.max(count, 1);
  });

  visibleTabs = computed(() => this.tabs.slice(0, this.visibleCount()));
  overflowTabs = computed(() => this.tabs.slice(this.visibleCount()));
  moreActive = computed(() => {
    const url = this.currentUrl();
    return this.overflowTabs().some((tab) => this.isRouteActive(tab.route, url));
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        this.closeMore();
      });
  }

  ngAfterViewInit(): void {
    this.measure();

    // Recompute when the bar resizes or when translated labels change width (language switch).
    const inner = this.navInner?.nativeElement;
    const list = this.measureList?.nativeElement;
    if (typeof ResizeObserver === 'undefined' || !inner) return;

    const ro = new ResizeObserver(() => this.measure());
    ro.observe(inner);
    if (list) ro.observe(list);
    this.destroyRef.onDestroy(() => ro.disconnect());
  }

  private measure(): void {
    const inner = this.navInner?.nativeElement;
    if (!inner) return;

    const cs = getComputedStyle(inner);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const logoW = this.navLogo?.nativeElement.getBoundingClientRect().width ?? 0;
    const actionsW = this.navActions?.nativeElement.getBoundingClientRect().width ?? 0;
    const content = inner.clientWidth - padX;
    this.availWidth.set(Math.max(0, content - logoW - actionsW - INNER_GAP * 2));

    const widths = (this.measureTabs?.toArray() ?? []).map((ref) =>
      ref.nativeElement.getBoundingClientRect().width
    );
    this.tabWidths.set(widths);
    this.moreWidth.set(this.measureMore?.nativeElement.getBoundingClientRect().width ?? 0);
  }

  private isRouteActive(route: string, url: string): boolean {
    if (route === '/') return url === '/';
    return url === route || url.startsWith(route + '/');
  }

  openAuth(): void {
    this.mobileOpen.set(false);
    document.body.style.overflow = '';
    this.authOpen.set(true);
  }

  closeAuth(): void {
    this.authOpen.set(false);
  }

  toggleMore(): void { this.moreOpen.update((open) => !open); }
  closeMore(): void { this.moreOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.moreOpen()) return;
    const host = this.moreHost?.nativeElement;
    if (host && !host.contains(event.target as Node)) this.closeMore();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeMore(); }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  openMenu(): void { this.mobileOpen.set(true); document.body.style.overflow = 'hidden'; }
  closeMenu(): void { this.mobileOpen.set(false); document.body.style.overflow = ''; }
}

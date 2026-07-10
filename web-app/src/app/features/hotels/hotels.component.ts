import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import type { HotelSearchQuery } from '../../core/services/catalog.service';
import type { HotelSearchResult } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { UiSelectComponent, UiCheckboxComponent, UiAutocompleteComponent, UiDatepickerComponent } from '../../shared/ui';
import { SuggestService } from '../../core/services/suggest.service';
import { GUEST_COUNT_OPTIONS } from '../catalog/catalog-options';
import { CompareService } from '../compare/compare.service';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslocoModule, InfiniteScrollDirective, RevealDirective, UiSelectComponent, UiCheckboxComponent, UiAutocompleteComponent, UiDatepickerComponent],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">hotel</span> {{ 'catalog.hotels.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.hotels.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.hotels.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <!-- Primary search group -->
        <div class="field field--primary">
          <label>{{ 'catalog.fields.city' | transloco }}</label>
          <app-ui-autocomplete [(ngModel)]="city" name="city" icon="location_on"
                               [fetch]="citySuggest" (selected)="runSearch()"
                               [ariaLabel]="'catalog.fields.city' | transloco"
                               [placeholder]="'catalog.fields.cityPlaceholder' | transloco" />
        </div>

        <span class="filter-bar__divider"></span>

        <!-- Dates group -->
        <div class="field">
          <label>{{ 'catalog.fields.checkIn' | transloco }}</label>
          <app-ui-datepicker [(ngModel)]="checkIn" name="checkIn"
                             [ariaLabel]="'catalog.fields.checkIn' | transloco" />
        </div>
        <div class="field">
          <label>{{ 'catalog.fields.checkOut' | transloco }}</label>
          <app-ui-datepicker [(ngModel)]="checkOut" name="checkOut"
                             [ariaLabel]="'catalog.fields.checkOut' | transloco" />
        </div>

        <span class="filter-bar__divider"></span>

        <!-- Options group -->
        <div class="field field--compact">
          <label>{{ 'catalog.fields.guests' | transloco }}</label>
          <app-ui-select [(ngModel)]="guests" name="guests" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.guests' | transloco"
                         [options]="GUEST_OPTIONS" />
        </div>

        <span class="filter-bar__break"></span>

        <div class="field">
          <label>{{ 'catalog.fields.maxBudget' | transloco }}</label>
          <app-ui-select [(ngModel)]="maxBudget" name="maxBudget" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.maxBudget' | transloco"
                         [options]="[
                           { value: undefined, label: ('catalog.fields.anyPrice' | transloco) },
                           { value: 50, label: '≤ €50' },
                           { value: 100, label: '≤ €100' },
                           { value: 150, label: '≤ €150' },
                           { value: 200, label: '≤ €200' },
                           { value: 300, label: '≤ €300' },
                           { value: 500, label: '≤ €500' },
                           { value: 750, label: '≤ €750' },
                           { value: 1000, label: '≤ €1000' },
                           { value: 1500, label: '≤ €1500' },
                           { value: 2000, label: '≤ €2000' }
                         ]" />
        </div>
        <div class="field">
          <label>{{ 'catalog.fields.minStars' | transloco }}</label>
          <app-ui-select [(ngModel)]="minStars" name="minStars" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.minStars' | transloco"
                         [options]="[
                           { value: undefined, label: ('catalog.fields.anyStars' | transloco) },
                           { value: 3, label: '3+ ★' },
                           { value: 4, label: '4+ ★' },
                           { value: 5, label: '5 ★' }
                         ]" />
        </div>
        <div class="field">
          <label>{{ 'catalog.fields.sort' | transloco }}</label>
          <app-ui-select [(ngModel)]="sort" name="sort" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.sort' | transloco"
                         [options]="[
                           { value: '', label: ('catalog.sort.relevance' | transloco) },
                           { value: 'price_asc', label: ('catalog.sort.priceAsc' | transloco) },
                           { value: 'price_desc', label: ('catalog.sort.priceDesc' | transloco) },
                           { value: 'stars_desc', label: ('catalog.sort.starsDesc' | transloco) }
                         ]" />
        </div>
        <button class="search-submit" type="submit"><span class="ms">search</span>{{ 'catalog.search' | transloco }}</button>
      </form>

      <!-- Amenity checkboxes -->
      <div class="filter-checks">
        @for (a of AMENITIES; track a.value) {
          <app-ui-checkbox [label]="a.labelKey | transloco"
                           [checked]="isAmenityOn(a.value)"
                           (checkedChange)="toggleAmenity(a.value)" />
        }
      </div>

      <!-- Active filter tags -->
      @if (activeFilterTags().length > 0) {
        <div class="active-filters">
          <span class="active-filters__label"><span class="ms">filter_list</span> {{ 'catalog.activeFilters' | transloco }}</span>
          @for (tag of activeFilterTags(); track tag.key) {
            <span class="filter-tag">
              {{ tag.label }}
              <button class="filter-tag__remove" (click)="removeFilter(tag.key)"><span class="ms">close</span></button>
            </span>
          }
          <button class="clear-all-btn" type="button" (click)="clearAll()">
            <span class="ms">delete_sweep</span> {{ 'catalog.clearAll' | transloco }}
          </button>
        </div>
      }
    </header>

    <section class="results">
      @if (loading()) {
        <div class="skeleton-grid">
          @for (s of [1,2,3,4,5,6]; track s) {
            <div class="skeleton"><div class="skeleton__img"></div><div class="skeleton__line"></div><div class="skeleton__line" style="width:60%"></div></div>
          }
        </div>
      } @else if (results().length === 0) {
        <div class="state">
          <span class="ms">search_off</span>
          <h3>{{ 'catalog.empty.title' | transloco }}</h3>
          <p>{{ 'catalog.empty.subtitle' | transloco }}</p>
        </div>
      } @else {
        <div class="results-head">
          <p class="results-count">{{ total() }} <span>{{ 'catalog.hotels.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (h of results(); track h.id) {
            <article class="card" appReveal [appRevealDelay]="($index % 8) * 50" tabindex="0" (click)="open(h.id)" (keydown.enter)="open(h.id)">
              <div class="card__img-wrap">
                <img class="card__img" [src]="h.imageUrl" [alt]="h.name" loading="lazy" />
                @if (h.stars) { <span class="card__badge"><span class="stars">{{ starString(h.stars) }}</span></span> }
                @if (!h.available) { <span class="card__badge card__badge--teal" style="left:auto;right:10px;background:#888">{{ 'catalog.soldOut' | transloco }}</span> }
                <button type="button" class="card__compare"
                        [class.card__compare--on]="compare.has(h.id)"
                        [disabled]="!compare.has(h.id) && compare.isFull()"
                        (click)="$event.stopPropagation(); compare.toggle(h)"
                        [attr.aria-pressed]="compare.has(h.id)"
                        [attr.aria-label]="'catalog.compare.add' | transloco">
                  <span class="ms" style="font-size:15px">{{ compare.has(h.id) ? 'check' : 'balance' }}</span>
                  <span class="card__compare-txt">{{ 'catalog.compare.add' | transloco }}</span>
                </button>
              </div>
              <div class="card__body">
                <h3 class="card__title">{{ h.name }}</h3>
                <p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ h.city }}</p>
                <p class="card__desc">{{ h.description }}</p>
                <div class="card__tags">
                  @if (h.seaProximity) { <span class="tag-pill">{{ 'catalog.amenities.sea' | transloco }}</span> }
                  @if (h.familyFriendly) { <span class="tag-pill">{{ 'catalog.amenities.family' | transloco }}</span> }
                  @if (h.petFriendly) { <span class="tag-pill">{{ 'catalog.amenities.pet' | transloco }}</span> }
                  @if (h.accessible) { <span class="tag-pill">{{ 'catalog.amenities.accessible' | transloco }}</span> }
                </div>
                <div class="card__foot">
                  <span class="card__price">{{ h.pricePerNight | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perNight' | transloco }}</small></span>
                  <span class="card__cta">{{ 'catalog.view' | transloco }} <span class="ms" style="font-size:16px">arrow_forward</span></span>
                </div>
              </div>
            </article>
          }
        </div>
        @if (hasMore()) {
          <div class="infinite-sentinel" appInfiniteScroll
               [scrollDisabled]="loadingMore()" (scrolled)="loadMore()"></div>
        }
        @if (loadingMore()) {
          <div class="loading-more"><span class="loading-more__spinner"></span>{{ 'catalog.loadingMore' | transloco }}</div>
        }
      }
    </section>

    @if (compare.count() > 0) {
      <div class="compare-tray" role="region" [attr.aria-label]="'catalog.compare.title' | transloco">
        <div class="compare-tray__items">
          @for (h of compare.items(); track h.id) {
            <span class="compare-tray__chip">
              {{ h.name }}
              <button type="button" (click)="compare.remove(h.id)" [attr.aria-label]="'catalog.clearAll' | transloco"><span class="ms" style="font-size:14px">close</span></button>
            </span>
          }
        </div>
        <div class="compare-tray__actions">
          <button type="button" class="compare-tray__clear" (click)="compare.clear()">{{ 'catalog.clearAll' | transloco }}</button>
          <button type="button" class="compare-tray__go" [disabled]="compare.count() < 2" (click)="goCompare()">
            {{ 'catalog.compare.cta' | transloco }} ({{ compare.count() }})
            <span class="ms" style="font-size:18px">arrow_forward</span>
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: '../catalog/catalog-shared.scss',
})
export class HotelsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly suggest = inject(SuggestService);
  readonly compare = inject(CompareService);

  goCompare(): void {
    if (this.compare.count() >= 2) this.router.navigateByUrl('/compare');
  }

  /** Live city suggestions for the destination field. */
  readonly citySuggest = (q: string) => this.suggest.hotelCities(q);

  readonly headerImg = HEADER_IMG;
  readonly GUEST_OPTIONS = GUEST_COUNT_OPTIONS;
  readonly results = signal<HotelSearchResult[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = computed(() => this.results().length < this.total());
  private page = 0;

  readonly AMENITIES: ReadonlyArray<{ value: string; labelKey: string }> = [
    { value: 'sea', labelKey: 'catalog.amenities.sea' },
    { value: 'family', labelKey: 'catalog.amenities.family' },
    { value: 'pets', labelKey: 'catalog.amenities.pet' },
    { value: 'accessible', labelKey: 'catalog.amenities.accessible' },
  ];

  city = '';
  checkIn = '';
  checkOut = '';
  guests = 2;
  maxBudget?: number;
  minStars?: number;
  sort = '';
  private readonly amenities = signal<ReadonlySet<string>>(new Set());

  /** Compute active filter tags for the summary strip. */
  readonly activeFilterTags = computed(() => {
    const tags: { key: string; label: string }[] = [];
    if (this.city.trim()) {
      tags.push({ key: 'city', label: this.city });
    }
    if (this.checkIn) {
      tags.push({ key: 'checkIn', label: `From: ${this.checkIn}` });
    }
    if (this.checkOut) {
      tags.push({ key: 'checkOut', label: `To: ${this.checkOut}` });
    }
    if (this.maxBudget !== undefined) {
      tags.push({ key: 'maxBudget', label: `≤ €${this.maxBudget}` });
    }
    if (this.minStars !== undefined) {
      tags.push({ key: 'minStars', label: `${this.minStars}+ ★` });
    }
    for (const a of this.amenities()) {
      const def = this.AMENITIES.find(am => am.value === a);
      if (def) {
        tags.push({ key: `amenity:${a}`, label: a });
      }
    }
    return tags;
  });

  isAmenityOn(value: string): boolean {
    return this.amenities().has(value);
  }

  toggleAmenity(value: string): void {
    const next = new Set(this.amenities());
    next.has(value) ? next.delete(value) : next.add(value);
    this.amenities.set(next);
    this.runSearch();
  }

  removeFilter(key: string): void {
    if (key === 'city') { this.city = ''; }
    else if (key === 'checkIn') { this.checkIn = ''; }
    else if (key === 'checkOut') { this.checkOut = ''; }
    else if (key === 'maxBudget') { this.maxBudget = undefined; }
    else if (key === 'minStars') { this.minStars = undefined; }
    else if (key.startsWith('amenity:')) {
      const v = key.replace('amenity:', '');
      const next = new Set(this.amenities());
      next.delete(v);
      this.amenities.set(next);
    }
    this.runSearch();
  }

  clearAll(): void {
    this.city = '';
    this.checkIn = '';
    this.checkOut = '';
    this.guests = 2;
    this.maxBudget = undefined;
    this.minStars = undefined;
    this.sort = '';
    this.amenities.set(new Set());
    this.runSearch();
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('city') ?? this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.city = q;
    }
    this.runSearch();
  }

  runSearch(): void {
    this.page = 0;
    this.loading.set(true);
    this.catalog
      .searchHotels(this.buildQuery(), 0)
      .pipe(catchError(() => of(emptyPage<HotelSearchResult>())))
      .subscribe(res => {
        this.results.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    this.loadingMore.set(true);
    this.catalog
      .searchHotels(this.buildQuery(), this.page + 1)
      .pipe(catchError(() => of(emptyPage<HotelSearchResult>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  private buildQuery(): HotelSearchQuery {
    return {
      city: this.city.trim() || undefined,
      checkIn: this.checkIn || undefined,
      checkOut: this.checkOut || undefined,
      guests: this.guests || 1,
      maxBudget: this.maxBudget,
      minStars: this.minStars,
      constraints: this.amenities().size ? [...this.amenities()] : undefined,
      sort: this.sort || undefined,
    };
  }

  starString(stars: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, stars)));
  }

  open(id: string): void {
    this.router.navigate(['/hotels', id]);
  }
}

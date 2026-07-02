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
import { UiSelectComponent, UiCheckboxComponent, UiRangeComponent } from '../../shared/ui';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslocoModule, InfiniteScrollDirective, RevealDirective, UiSelectComponent, UiCheckboxComponent, UiRangeComponent],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">hotel</span> {{ 'catalog.hotels.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.hotels.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.hotels.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="h-city">{{ 'catalog.fields.city' | transloco }}</label>
          <input id="h-city" type="text" [(ngModel)]="city" name="city"
                 [placeholder]="'catalog.fields.cityPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="h-in">{{ 'catalog.fields.checkIn' | transloco }}</label>
          <input id="h-in" type="date" [(ngModel)]="checkIn" name="checkIn" />
        </div>
        <div class="field">
          <label for="h-out">{{ 'catalog.fields.checkOut' | transloco }}</label>
          <input id="h-out" type="date" [(ngModel)]="checkOut" name="checkOut" />
        </div>
        <div class="field">
          <label for="h-guests">{{ 'catalog.fields.guests' | transloco }}</label>
          <input id="h-guests" type="number" min="1" [(ngModel)]="guests" name="guests" />
        </div>
        <div class="field field--range">
          <label>{{ 'catalog.fields.maxBudget' | transloco }}</label>
          <app-ui-range [(ngModel)]="maxBudget" name="maxBudget" [max]="2000" [step]="50"
                        [ariaLabel]="'catalog.fields.maxBudget' | transloco"
                        [anyLabel]="'catalog.fields.anyPrice' | transloco" />
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
        <button class="search-submit" type="submit">{{ 'catalog.search' | transloco }}</button>
      </form>

      <div class="filter-checks">
        @for (a of AMENITIES; track a.value) {
          <app-ui-checkbox [label]="a.labelKey | transloco"
                           [checked]="isAmenityOn(a.value)"
                           (checkedChange)="toggleAmenity(a.value)" />
        }
      </div>
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
  `,
  styleUrl: '../catalog/catalog-shared.scss',
})
export class HotelsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
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

  isAmenityOn(value: string): boolean {
    return this.amenities().has(value);
  }

  toggleAmenity(value: string): void {
    const next = new Set(this.amenities());
    next.has(value) ? next.delete(value) : next.add(value);
    this.amenities.set(next);
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

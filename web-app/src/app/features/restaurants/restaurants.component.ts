import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import type { RestaurantSearchQuery } from '../../core/services/catalog.service';
import type { RestaurantSearchResult } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80';

@Component({
  selector: 'app-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, InfiniteScrollDirective, RevealDirective],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">restaurant</span> {{ 'catalog.restaurants.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.restaurants.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.restaurants.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="r-city">{{ 'catalog.fields.city' | transloco }}</label>
          <input id="r-city" type="text" [(ngModel)]="city" name="city"
                 [placeholder]="'catalog.fields.cityPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="r-cuisine">{{ 'catalog.fields.cuisine' | transloco }}</label>
          <input id="r-cuisine" type="text" [(ngModel)]="cuisineType" name="cuisine"
                 [placeholder]="'catalog.fields.cuisinePlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="r-date">{{ 'catalog.fields.date' | transloco }}</label>
          <input id="r-date" type="date" [(ngModel)]="date" name="date" />
        </div>
        <div class="field">
          <label for="r-covers">{{ 'catalog.fields.covers' | transloco }}</label>
          <input id="r-covers" type="number" min="1" [(ngModel)]="covers" name="covers" />
        </div>
        <div class="field">
          <label for="r-budget">{{ 'catalog.fields.maxPerPerson' | transloco }}</label>
          <input id="r-budget" type="number" min="0" [(ngModel)]="maxBudgetPerPerson" name="budget" placeholder="€" />
        </div>
        <div class="field">
          <label for="r-sort">{{ 'catalog.fields.sort' | transloco }}</label>
          <select id="r-sort" [(ngModel)]="sort" name="sort" (change)="runSearch()">
            <option value="">{{ 'catalog.sort.relevance' | transloco }}</option>
            <option value="price_asc">{{ 'catalog.sort.priceAsc' | transloco }}</option>
            <option value="price_desc">{{ 'catalog.sort.priceDesc' | transloco }}</option>
            <option value="name_asc">{{ 'catalog.sort.nameAsc' | transloco }}</option>
          </select>
        </div>
        <button class="search-submit" type="submit">{{ 'catalog.search' | transloco }}</button>
      </form>
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
          <span class="ms">no_meals</span>
          <h3>{{ 'catalog.empty.title' | transloco }}</h3>
          <p>{{ 'catalog.empty.subtitle' | transloco }}</p>
        </div>
      } @else {
        <div class="results-head">
          <p class="results-count">{{ total() }} <span>{{ 'catalog.restaurants.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (r of results(); track r.id) {
            <article class="card" appReveal [appRevealDelay]="($index % 8) * 50" tabindex="0" (click)="open(r.id)" (keydown.enter)="open(r.id)">
              <div class="card__img-wrap">
                <img class="card__img" [src]="r.imageUrl" [alt]="r.name" loading="lazy" />
                <span class="card__badge">{{ priceTier(r.priceTier) }}</span>
              </div>
              <div class="card__body">
                <h3 class="card__title">{{ r.name }}</h3>
                <p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ r.city }} · {{ r.cuisineType }}</p>
                <p class="card__desc">{{ r.description }}</p>
                <div class="card__tags">
                  @if (r.petFriendly) { <span class="tag-pill">{{ 'catalog.amenities.pet' | transloco }}</span> }
                  @if (r.accessible) { <span class="tag-pill">{{ 'catalog.amenities.accessible' | transloco }}</span> }
                  <span class="tag-pill">{{ r.available ? ('catalog.restaurants.available' | transloco) : ('catalog.restaurants.fullyBooked' | transloco) }}</span>
                </div>
                <div class="card__foot">
                  <span class="card__sub" style="font-weight:600;color:var(--teal)">{{ r.cuisineType }}</span>
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
export class RestaurantsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
  readonly results = signal<RestaurantSearchResult[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = computed(() => this.results().length < this.total());
  private page = 0;

  city = '';
  cuisineType = '';
  date = '';
  covers = 2;
  maxBudgetPerPerson?: number;
  sort = '';

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
      .searchRestaurants(this.buildQuery(), 0)
      .pipe(catchError(() => of(emptyPage<RestaurantSearchResult>())))
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
      .searchRestaurants(this.buildQuery(), this.page + 1)
      .pipe(catchError(() => of(emptyPage<RestaurantSearchResult>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  private buildQuery(): RestaurantSearchQuery {
    return {
      city: this.city.trim() || undefined,
      cuisineType: this.cuisineType.trim() || undefined,
      date: this.date || undefined,
      covers: this.covers || 1,
      maxBudgetPerPerson: this.maxBudgetPerPerson,
      sort: this.sort || undefined,
    };
  }

  priceTier(tier: number): string {
    return '€'.repeat(Math.max(1, Math.min(4, tier || 1)));
  }

  open(id: string): void {
    this.router.navigate(['/restaurants', id]);
  }
}

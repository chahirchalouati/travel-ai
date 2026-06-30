import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { AttractionService } from '../../core/services/attraction.service';
import type { AttractionSearchQuery } from '../../core/services/attraction.service';
import { emptyPage } from '../../core/services/catalog.service';
import type { AttractionResponse } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';
import { RevealDirective } from '../../shared/reveal/reveal.directive';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1920&q=80';

@Component({
  selector: 'app-attractions',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslocoModule, InfiniteScrollDirective, RevealDirective],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">attractions</span> {{ 'attractions.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'attractions.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'attractions.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="a-city">{{ 'catalog.fields.city' | transloco }}</label>
          <input id="a-city" type="text" [(ngModel)]="city" name="city"
                 [placeholder]="'catalog.fields.cityPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="a-sort">{{ 'catalog.fields.sort' | transloco }}</label>
          <select id="a-sort" [(ngModel)]="sort" name="sort" (change)="runSearch()">
            <option value="">{{ 'catalog.sort.relevance' | transloco }}</option>
            <option value="popularity_desc">{{ 'catalog.sort.popularity' | transloco }}</option>
            <option value="price_asc">{{ 'catalog.sort.priceAsc' | transloco }}</option>
            <option value="price_desc">{{ 'catalog.sort.priceDesc' | transloco }}</option>
            <option value="name_asc">{{ 'catalog.sort.nameAsc' | transloco }}</option>
          </select>
        </div>
        <button class="search-submit" type="submit">{{ 'catalog.search' | transloco }}</button>
      </form>

      @if (categories().length > 0) {
        <div class="chip-row">
          <button class="chip" [class.chip--active]="!activeCategory()" (click)="selectCategory(null)">
            {{ 'attractions.allCategories' | transloco }}
          </button>
          @for (cat of categories(); track cat) {
            <button class="chip" [class.chip--active]="activeCategory() === cat" (click)="selectCategory(cat)">
              {{ 'attractions.categories.' + cat | transloco }}
            </button>
          }
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
          <p class="results-count">{{ total() }} <span>{{ 'attractions.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (a of results(); track a.id) {
            <article class="card" appReveal [appRevealDelay]="($index % 8) * 50" tabindex="0" (click)="open(a.id)" (keydown.enter)="open(a.id)">
              <div class="card__img-wrap">
                <img class="card__img" [src]="a.imageUrl" [alt]="a.name" loading="lazy" />
                <span class="card__badge card__badge--teal">{{ 'attractions.categories.' + a.category | transloco }}</span>
                @if (a.bookable) { <span class="card__badge" style="left:auto;right:10px">{{ 'attractions.bookable' | transloco }}</span> }
              </div>
              <div class="card__body">
                <h3 class="card__title">{{ a.name }}</h3>
                <p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ a.city }}@if (a.country) {, {{ a.country }}}</p>
                <p class="card__desc">{{ a.description }}</p>
                <div class="card__tags">
                  @if (a.durationMinutes) { <span class="tag-pill">{{ formatDuration(a.durationMinutes) }}</span> }
                  @for (t of a.tags.slice(0, 2); track t) { <span class="tag-pill">{{ t }}</span> }
                </div>
                <div class="card__foot">
                  @if (a.bookable && a.basePrice) {
                    <span class="card__price">{{ 'attractions.from' | transloco }} {{ a.basePrice | currency:'EUR':'symbol':'1.0-0' }}</span>
                  } @else {
                    <span class="card__price">{{ 'attractions.priceLevel.' + a.priceLevel | transloco }}</span>
                  }
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
export class AttractionsComponent implements OnInit {
  private readonly attractions = inject(AttractionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
  readonly results = signal<AttractionResponse[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly categories = signal<string[]>([]);
  readonly activeCategory = signal<string | null>(null);
  readonly hasMore = computed(() => this.results().length < this.total());
  private page = 0;

  city = '';
  sort = '';

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('city') ?? this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.city = q;
    }
    this.attractions.getCategories()
      .pipe(catchError(() => of([] as string[])))
      .subscribe(cats => this.categories.set(cats));
    this.runSearch();
  }

  selectCategory(category: string | null): void {
    this.activeCategory.set(category);
    this.runSearch();
  }

  runSearch(): void {
    this.page = 0;
    this.loading.set(true);
    this.attractions
      .search(this.buildQuery(), 0)
      .pipe(catchError(() => of(emptyPage<AttractionResponse>())))
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
    this.attractions
      .search(this.buildQuery(), this.page + 1)
      .pipe(catchError(() => of(emptyPage<AttractionResponse>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  private buildQuery(): AttractionSearchQuery {
    return {
      city: this.city.trim() || undefined,
      category: this.activeCategory() ?? undefined,
      sort: this.sort || undefined,
    };
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }

  open(id: string): void {
    this.router.navigate(['/attractions', id]);
  }
}

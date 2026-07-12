import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, forkJoin, of } from 'rxjs';
import { UiInputComponent } from '../../shared/ui/ui-input.component';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import { DestinationService } from '../../core/services/destination.service';
import type {
  HotelSearchResult,
  RestaurantSearchResult,
  CruiseSearchResult,
  DestinationResponse,
} from '../../core/models/api.models';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80';

type SearchType = 'all' | 'destinations' | 'hotels' | 'restaurants' | 'cruises';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslocoModule, UiInputComponent],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">search</span> {{ 'catalog.search' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.searchResults.title' | transloco }}</h1>

      <form class="filter-bar" (ngSubmit)="runSearch()" style="max-width:620px">
        <div style="flex:1 1 auto">
          <app-ui-input inputId="q" variant="search" icon="search" type="text"
                        [label]="'catalog.searchResults.query' | transloco"
                        [(ngModel)]="query" name="q"
                        [placeholder]="'explore.search.placeholder' | transloco" />
        </div>
        <button class="search-submit" type="submit">{{ 'catalog.search' | transloco }}</button>
      </form>

      <div class="chip-row" style="max-width:620px;margin:0 auto">
        @for (t of TYPES; track t.id) {
          <button type="button" class="chip" [class.chip--active]="activeType() === t.id"
                  (click)="activeType.set(t.id)">
            {{ t.labelKey | transloco }}{{ countFor(t.id) ? ' · ' + countFor(t.id) : '' }}
          </button>
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
      } @else if (visibleCount() === 0) {
        <div class="state">
          <span class="ms">travel_explore</span>
          <h3>{{ 'catalog.searchResults.noneTitle' | transloco }}</h3>
          <p>{{ 'catalog.searchResults.noneSubtitle' | transloco }}</p>
        </div>
      } @else {
        <p class="results-count" style="margin-bottom:1.5rem">{{ totalCount() }} <span>{{ 'catalog.searchResults.matches' | transloco }} "{{ activeQuery() }}"</span></p>

        @if (destinations().length && show('destinations')) {
          <h2 class="group-title">{{ 'catalog.searchResults.destinations' | transloco }}</h2>
          <div class="card-grid" style="margin-bottom:2.5rem">
            @for (d of destinations(); track d.id) {
              <article class="card" tabindex="0" (click)="go(['/destination', d.id])" (keydown.enter)="go(['/destination', d.id])">
                <div class="card__img-wrap"><img class="card__img" [src]="d.imageUrl" [alt]="d.name" loading="lazy" /><span class="card__badge">{{ 'catalog.searchResults.destination' | transloco }}</span></div>
                <div class="card__body"><h3 class="card__title">{{ d.name }}</h3><p class="card__sub"><span class="ms" style="font-size:14px">public</span>{{ d.country }}</p><p class="card__desc">{{ d.description }}</p></div>
              </article>
            }
          </div>
        }

        @if (hotels().length && show('hotels')) {
          <h2 class="group-title">{{ 'catalog.hotels.title' | transloco }}</h2>
          <div class="card-grid" style="margin-bottom:2.5rem">
            @for (h of hotels(); track h.id) {
              <article class="card" tabindex="0" (click)="go(['/hotels', h.id])" (keydown.enter)="go(['/hotels', h.id])">
                <div class="card__img-wrap"><img class="card__img" [src]="h.imageUrl" [alt]="h.name" loading="lazy" /><span class="card__badge card__badge--teal">{{ 'catalog.searchResults.hotel' | transloco }}</span></div>
                <div class="card__body"><h3 class="card__title">{{ h.name }}</h3><p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ h.city }}</p>
                  <div class="card__foot"><span class="card__price">{{ h.pricePerNight | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perNight' | transloco }}</small></span><span class="card__cta">{{ 'catalog.view' | transloco }} →</span></div>
                </div>
              </article>
            }
          </div>
        }

        @if (restaurants().length && show('restaurants')) {
          <h2 class="group-title">{{ 'catalog.restaurants.title' | transloco }}</h2>
          <div class="card-grid" style="margin-bottom:2.5rem">
            @for (r of restaurants(); track r.id) {
              <article class="card" tabindex="0" (click)="go(['/restaurants', r.id])" (keydown.enter)="go(['/restaurants', r.id])">
                <div class="card__img-wrap"><img class="card__img" [src]="r.imageUrl" [alt]="r.name" loading="lazy" /><span class="card__badge card__badge--teal">{{ 'catalog.searchResults.restaurant' | transloco }}</span></div>
                <div class="card__body"><h3 class="card__title">{{ r.name }}</h3><p class="card__sub"><span class="ms" style="font-size:14px">location_on</span>{{ r.city }} · {{ r.cuisineType }}</p><p class="card__desc">{{ r.description }}</p></div>
              </article>
            }
          </div>
        }

        @if (cruises().length && show('cruises')) {
          <h2 class="group-title">{{ 'catalog.cruises.title' | transloco }}</h2>
          <div class="card-grid">
            @for (c of cruises(); track c.id) {
              <article class="card" tabindex="0" (click)="go(['/cruises', c.id])" (keydown.enter)="go(['/cruises', c.id])">
                <div class="card__img-wrap"><img class="card__img" [src]="c.imageUrl" [alt]="c.name" loading="lazy" /><span class="card__badge card__badge--teal">{{ 'catalog.searchResults.cruise' | transloco }}</span></div>
                <div class="card__body"><h3 class="card__title">{{ c.name }}</h3><p class="card__sub"><span class="ms" style="font-size:14px">route</span>{{ c.departurePort }} → {{ c.arrivalPort }}</p>
                  <div class="card__foot"><span class="card__price">{{ c.pricePerPerson | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perPerson' | transloco }}</small></span><span class="card__cta">{{ 'catalog.view' | transloco }} →</span></div>
                </div>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .group-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.02em; }
  `],
  styleUrls: ['../catalog/catalog-shared.scss'],
})
export class SearchComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly destinationService = inject(DestinationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
  readonly loading = signal(true);
  readonly hotels = signal<HotelSearchResult[]>([]);
  readonly restaurants = signal<RestaurantSearchResult[]>([]);
  readonly cruises = signal<CruiseSearchResult[]>([]);
  readonly destinations = signal<DestinationResponse[]>([]);
  readonly activeQuery = signal('');
  readonly activeType = signal<SearchType>('all');

  readonly TYPES: ReadonlyArray<{ id: SearchType; labelKey: string }> = [
    { id: 'all', labelKey: 'catalog.searchResults.allTypes' },
    { id: 'destinations', labelKey: 'catalog.searchResults.destinations' },
    { id: 'hotels', labelKey: 'catalog.hotels.title' },
    { id: 'restaurants', labelKey: 'catalog.restaurants.title' },
    { id: 'cruises', labelKey: 'catalog.cruises.title' },
  ];

  query = '';

  show(type: SearchType): boolean {
    return this.activeType() === 'all' || this.activeType() === type;
  }

  countFor(type: SearchType): number {
    switch (type) {
      case 'destinations': return this.destinations().length;
      case 'hotels': return this.hotels().length;
      case 'restaurants': return this.restaurants().length;
      case 'cruises': return this.cruises().length;
      case 'all': return this.totalCount();
    }
  }

  visibleCount(): number {
    return this.activeType() === 'all' ? this.totalCount() : this.countFor(this.activeType());
  }

  totalCount(): number {
    return (
      this.hotels().length +
      this.restaurants().length +
      this.cruises().length +
      this.destinations().length
    );
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.query = params.get('q') ?? '';
      this.runSearch();
    });
  }

  runSearch(): void {
    const q = this.query.trim();
    this.activeQuery.set(q);
    this.loading.set(true);

    // The catalog endpoints require a party-size param to bind their request records,
    // so always send a sensible default alongside the optional location filter.
    const PREVIEW_SIZE = 8;
    forkJoin({
      hotels: this.catalog.searchHotels({ city: q || undefined, guests: 2 }, 0, PREVIEW_SIZE)
        .pipe(catchError(() => of(emptyPage<HotelSearchResult>()))),
      restaurants: this.catalog.searchRestaurants({ city: q || undefined, covers: 2 }, 0, PREVIEW_SIZE)
        .pipe(catchError(() => of(emptyPage<RestaurantSearchResult>()))),
      cruises: this.catalog.searchCruises({ departurePort: q || undefined, passengers: 2 }, 0, PREVIEW_SIZE)
        .pipe(catchError(() => of(emptyPage<CruiseSearchResult>()))),
      destinations: this.destinationService.search(q).pipe(catchError(() => of([]))),
    }).subscribe(res => {
      this.hotels.set(res.hotels.items);
      this.restaurants.set(res.restaurants.items);
      this.cruises.set(res.cruises.items);
      this.destinations.set(res.destinations.slice(0, 8));
      this.loading.set(false);
    });
  }

  go(commands: unknown[]): void {
    this.router.navigate(commands as string[]);
  }
}

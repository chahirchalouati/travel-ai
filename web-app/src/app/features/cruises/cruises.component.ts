import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import type { CruiseSearchQuery } from '../../core/services/catalog.service';
import type { CruiseSearchResult } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';
import { RevealDirective } from '../../shared/reveal/reveal.directive';
import { TripContextService } from '../../core/services/trip-context.service';
import { UiRangeComponent } from '../../shared/ui';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=1920&q=80';

@Component({
  selector: 'app-cruises',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, InfiniteScrollDirective, RevealDirective, UiRangeComponent],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">directions_boat</span> {{ 'catalog.cruises.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.cruises.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.cruises.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="c-port">{{ 'catalog.fields.departurePort' | transloco }}</label>
          <input id="c-port" type="text" [(ngModel)]="departurePort" name="port"
                 [placeholder]="'catalog.fields.portPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="c-type">{{ 'catalog.fields.cruiseType' | transloco }}</label>
          <input id="c-type" type="text" [(ngModel)]="cruiseType" name="type"
                 [placeholder]="'catalog.fields.cruiseTypePlaceholder' | transloco" />
        </div>
        <div class="field">
          <label for="c-date">{{ 'catalog.fields.departure' | transloco }}</label>
          <input id="c-date" type="date" [(ngModel)]="departureDate" name="date" />
        </div>
        <div class="field">
          <label for="c-pax">{{ 'catalog.fields.passengers' | transloco }}</label>
          <input id="c-pax" type="number" min="1" [(ngModel)]="passengers" name="pax" />
        </div>
        <div class="field field--range">
          <label>{{ 'catalog.fields.maxPrice' | transloco }}</label>
          <app-ui-range [(ngModel)]="maxPrice" name="maxPrice" [max]="10000" [step]="250"
                        [ariaLabel]="'catalog.fields.maxPrice' | transloco"
                        [anyLabel]="'catalog.fields.anyPrice' | transloco" />
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
          <span class="ms">sailing</span>
          <h3>{{ 'catalog.empty.title' | transloco }}</h3>
          <p>{{ 'catalog.empty.subtitle' | transloco }}</p>
        </div>
      } @else {
        <div class="results-head">
          <p class="results-count">{{ total() }} <span>{{ 'catalog.cruises.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (c of results(); track c.id) {
            <article class="card" appReveal [appRevealDelay]="($index % 8) * 50" tabindex="0" (click)="open(c.id)" (keydown.enter)="open(c.id)">
              <div class="card__img-wrap">
                <img class="card__img" [src]="c.imageUrl" [alt]="c.name" loading="lazy" />
                <span class="card__badge">{{ c.durationNights }} {{ 'catalog.cruises.nights' | transloco }}</span>
                @if (c.allInclusive) { <span class="card__badge card__badge--teal" style="left:auto;right:10px">{{ 'catalog.cruises.allInclusive' | transloco }}</span> }
              </div>
              <div class="card__body">
                <h3 class="card__title">{{ c.name }}</h3>
                <p class="card__sub"><span class="ms" style="font-size:14px">directions_boat</span>{{ c.operator }} · {{ c.shipName }}</p>
                <p class="card__sub"><span class="ms" style="font-size:14px">route</span>{{ c.departurePort }} → {{ c.arrivalPort }}</p>
                <p class="card__sub"><span class="ms" style="font-size:14px">calendar_today</span>{{ c.departureDate | date:'dd MMM yyyy' }}</p>
                <div class="card__tags">
                  <span class="tag-pill">{{ c.cruiseType }}</span>
                  <span class="tag-pill">{{ c.cabinsAvailable }} {{ 'catalog.cruises.cabins' | transloco }}</span>
                  @if (tripFit(c); as place) { <span class="tag-pill tag-pill--ai"><span class="ms" style="font-size:13px;vertical-align:middle">auto_awesome</span> {{ 'common.fitsTrip' | transloco:{ place: place } }}</span> }
                </div>
                <div class="card__foot">
                  <span class="card__price">{{ c.pricePerPerson | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perPerson' | transloco }}</small></span>
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
export class CruisesComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tripContext = inject(TripContextService);

  readonly headerImg = HEADER_IMG;

  tripFit(c: CruiseSearchResult): string | null {
    return this.tripContext.match(c.arrivalPort) ?? this.tripContext.match(c.departurePort);
  }
  readonly results = signal<CruiseSearchResult[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = computed(() => this.results().length < this.total());
  private page = 0;

  departurePort = '';
  cruiseType = '';
  departureDate = '';
  passengers = 2;
  maxPrice?: number;

  ngOnInit(): void {
    this.tripContext.ensureLoaded();
    const q = this.route.snapshot.queryParamMap.get('port') ?? this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.departurePort = q;
    }
    this.runSearch();
  }

  runSearch(): void {
    this.page = 0;
    this.loading.set(true);
    this.catalog
      .searchCruises(this.buildQuery(), 0)
      .pipe(catchError(() => of(emptyPage<CruiseSearchResult>())))
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
      .searchCruises(this.buildQuery(), this.page + 1)
      .pipe(catchError(() => of(emptyPage<CruiseSearchResult>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  private buildQuery(): CruiseSearchQuery {
    return {
      departurePort: this.departurePort.trim() || undefined,
      cruiseType: this.cruiseType.trim() || undefined,
      departureDate: this.departureDate || undefined,
      passengers: this.passengers || 1,
      maxPrice: this.maxPrice,
    };
  }

  open(id: string): void {
    this.router.navigate(['/cruises', id]);
  }
}

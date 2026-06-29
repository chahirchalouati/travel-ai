import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, of } from 'rxjs';
import { CatalogService, emptyPage } from '../../core/services/catalog.service';
import type { FlightSearchQuery } from '../../core/services/catalog.service';
import type { FlightSearchResult } from '../../core/models/api.models';
import { InfiniteScrollDirective } from '../../shared/infinite-scroll/infinite-scroll.directive';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80';

@Component({
  selector: 'app-flights',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, InfiniteScrollDirective],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">flight</span> {{ 'catalog.flights.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.flights.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.flights.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field">
          <label for="f-from">{{ 'catalog.fields.from' | transloco }}</label>
          <input id="f-from" type="text" maxlength="3" [(ngModel)]="originIata" name="origin"
                 placeholder="LHR" style="text-transform:uppercase" />
        </div>
        <div class="field">
          <label for="f-to">{{ 'catalog.fields.to' | transloco }}</label>
          <input id="f-to" type="text" maxlength="3" [(ngModel)]="destIata" name="dest"
                 placeholder="JFK" style="text-transform:uppercase" />
        </div>
        <div class="field">
          <label for="f-date">{{ 'catalog.fields.departure' | transloco }}</label>
          <input id="f-date" type="date" [(ngModel)]="departureDate" name="date" />
        </div>
        <div class="field">
          <label for="f-pax">{{ 'catalog.fields.passengers' | transloco }}</label>
          <input id="f-pax" type="number" min="1" [(ngModel)]="passengers" name="pax" />
        </div>
        <div class="field">
          <label for="f-price">{{ 'catalog.fields.maxPrice' | transloco }}</label>
          <input id="f-price" type="number" min="0" [(ngModel)]="maxPrice" name="maxPrice" placeholder="€" />
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
          <span class="ms">flight_takeoff</span>
          <h3>{{ 'catalog.empty.title' | transloco }}</h3>
          <p>{{ 'catalog.empty.subtitle' | transloco }}</p>
        </div>
      } @else {
        <div class="results-head">
          <p class="results-count">{{ total() }} <span>{{ 'catalog.flights.found' | transloco }}</span></p>
        </div>
        <div class="card-grid">
          @for (f of results(); track f.id) {
            <article class="card" tabindex="0" (click)="open(f.id)" (keydown.enter)="open(f.id)" style="cursor:pointer">
              <div class="card__body" style="padding-top:18px">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <h3 class="card__title">{{ f.airline }}</h3>
                  <span class="tag-pill">{{ f.flightNumber }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin:8px 0">
                  <div style="text-align:center">
                    <div style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em">{{ f.originIata }}</div>
                    <div style="font-size:0.74rem;color:var(--text-tertiary)">{{ f.departureAt | date:'HH:mm' }}</div>
                  </div>
                  <div style="flex:1;height:1px;background:var(--border);position:relative">
                    <span class="ms" style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-size:18px;color:var(--brand);background:var(--bg-primary);padding:0 4px">flight</span>
                  </div>
                  <div style="text-align:center">
                    <div style="font-size:1.4rem;font-weight:800;letter-spacing:-0.02em">{{ f.destIata }}</div>
                    <div style="font-size:0.74rem;color:var(--text-tertiary)">{{ f.arrivalAt | date:'HH:mm' }}</div>
                  </div>
                </div>
                <p class="card__sub"><span class="ms" style="font-size:14px">calendar_today</span>{{ f.departureAt | date:'EEE, dd MMM yyyy' }}</p>
                <div class="card__tags">
                  <span class="tag-pill">{{ f.baggageIncluded ? ('catalog.flights.baggageYes' | transloco) : ('catalog.flights.baggageNo' | transloco) }}</span>
                  <span class="tag-pill">{{ f.seatsAvailable }} {{ 'catalog.flights.seats' | transloco }}</span>
                </div>
                <div class="card__foot">
                  <span class="card__price">{{ f.price | currency:'EUR':'symbol':'1.0-0' }} <small>/ {{ 'catalog.perPerson' | transloco }}</small></span>
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
export class FlightsComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly headerImg = HEADER_IMG;
  readonly results = signal<FlightSearchResult[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = computed(() => this.results().length < this.total());
  private page = 0;

  originIata = '';
  destIata = '';
  departureDate = '';
  passengers = 1;
  maxPrice?: number;

  ngOnInit(): void {
    const dest = this.route.snapshot.queryParamMap.get('to');
    if (dest) {
      this.destIata = dest.toUpperCase();
    }
    if (!this.departureDate) {
      this.departureDate = new Date().toISOString().slice(0, 10);
    }
    this.runSearch();
  }

  runSearch(): void {
    this.page = 0;
    this.loading.set(true);
    this.catalog
      .searchFlights(this.buildQuery(), 0)
      .pipe(catchError(() => of(emptyPage<FlightSearchResult>())))
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
      .searchFlights(this.buildQuery(), this.page + 1)
      .pipe(catchError(() => of(emptyPage<FlightSearchResult>(this.page, this.total()))))
      .subscribe(res => {
        this.page = res.page;
        this.total.set(res.total);
        this.results.update(current => [...current, ...res.items]);
        this.loadingMore.set(false);
      });
  }

  private buildQuery(): FlightSearchQuery {
    return {
      originIata: this.originIata.trim().toUpperCase() || undefined,
      destIata: this.destIata.trim().toUpperCase() || undefined,
      departureDate: this.departureDate || new Date().toISOString().slice(0, 10),
      passengers: this.passengers || 1,
      maxPrice: this.maxPrice,
    };
  }

  open(id: string): void {
    this.router.navigate(['/flights', id]);
  }
}

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
import { UiSelectComponent, UiAutocompleteComponent, UiDatepickerComponent } from '../../shared/ui';
import { SuggestService } from '../../core/services/suggest.service';
import { GUEST_COUNT_OPTIONS } from '../catalog/catalog-options';

const HEADER_IMG =
  'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=1920&q=80';

@Component({
  selector: 'app-cruises',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TranslocoModule, InfiniteScrollDirective, RevealDirective, UiSelectComponent, UiAutocompleteComponent, UiDatepickerComponent],
  template: `
    <header class="catalog-header">
      <div class="catalog-header__bg" [style.background-image]="'url(' + headerImg + ')'"></div>
      <div class="catalog-header__scrim"></div>
      <span class="catalog-eyebrow"><span class="ms" style="font-size:15px">directions_boat</span> {{ 'catalog.cruises.eyebrow' | transloco }}</span>
      <h1 class="catalog-title">{{ 'catalog.cruises.title' | transloco }}</h1>
      <p class="catalog-subtitle">{{ 'catalog.cruises.subtitle' | transloco }}</p>

      <form class="filter-bar" (ngSubmit)="runSearch()">
        <div class="field field--primary">
          <label>{{ 'catalog.fields.departurePort' | transloco }}</label>
          <app-ui-autocomplete [(ngModel)]="departurePort" name="port" icon="anchor"
                               optionIcon="directions_boat" [fetch]="portSuggest" (selected)="runSearch()"
                               [ariaLabel]="'catalog.fields.departurePort' | transloco"
                               [placeholder]="'catalog.fields.portPlaceholder' | transloco" />
        </div>
        <div class="field">
          <label>{{ 'catalog.fields.cruiseType' | transloco }}</label>
          <app-ui-autocomplete [(ngModel)]="cruiseType" name="type" icon="sailing"
                               optionIcon="sailing" [fetch]="typeSuggest"
                               [ariaLabel]="'catalog.fields.cruiseType' | transloco"
                               [placeholder]="'catalog.fields.cruiseTypePlaceholder' | transloco" />
        </div>

        <span class="filter-bar__divider"></span>

        <div class="field">
          <label>{{ 'catalog.fields.departure' | transloco }}</label>
          <app-ui-datepicker [(ngModel)]="departureDate" name="date"
                             [ariaLabel]="'catalog.fields.departure' | transloco" />
        </div>
        <div class="field field--compact">
          <label>{{ 'catalog.fields.passengers' | transloco }}</label>
          <app-ui-select [(ngModel)]="passengers" name="pax" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.passengers' | transloco"
                         [options]="GUEST_OPTIONS" />
        </div>

        <span class="filter-bar__break"></span>

        <div class="field">
          <label>{{ 'catalog.fields.maxPrice' | transloco }}</label>
          <app-ui-select [(ngModel)]="maxPrice" name="maxPrice" (ngModelChange)="runSearch()"
                         [ariaLabel]="'catalog.fields.maxPrice' | transloco"
                         [options]="[
                           { value: undefined, label: ('catalog.fields.anyPrice' | transloco) },
                           { value: 500, label: '≤ €500' },
                           { value: 1000, label: '≤ €1000' },
                           { value: 1500, label: '≤ €1500' },
                           { value: 2000, label: '≤ €2000' },
                           { value: 3000, label: '≤ €3000' },
                           { value: 5000, label: '≤ €5000' },
                           { value: 7500, label: '≤ €7500' },
                           { value: 10000, label: '≤ €10000' }
                         ]" />
        </div>
        <button class="search-submit" type="submit"><span class="ms">search</span>{{ 'catalog.search' | transloco }}</button>
      </form>

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
  private readonly suggest = inject(SuggestService);

  readonly portSuggest = (q: string) => this.suggest.cruisePorts(q);
  readonly typeSuggest = (q: string) => this.suggest.cruiseTypes(q);

  readonly headerImg = HEADER_IMG;
  readonly GUEST_OPTIONS = GUEST_COUNT_OPTIONS;

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

  readonly activeFilterTags = computed(() => {
    const tags: { key: string; label: string }[] = [];
    if (this.departurePort.trim()) {
      tags.push({ key: 'port', label: this.departurePort });
    }
    if (this.cruiseType.trim()) {
      tags.push({ key: 'type', label: this.cruiseType });
    }
    if (this.departureDate) {
      tags.push({ key: 'date', label: this.departureDate });
    }
    if (this.maxPrice !== undefined) {
      tags.push({ key: 'maxPrice', label: `≤ €${this.maxPrice.toLocaleString()}` });
    }
    return tags;
  });

  removeFilter(key: string): void {
    if (key === 'port') { this.departurePort = ''; }
    else if (key === 'type') { this.cruiseType = ''; }
    else if (key === 'date') { this.departureDate = ''; }
    else if (key === 'maxPrice') { this.maxPrice = undefined; }
    this.runSearch();
  }

  clearAll(): void {
    this.departurePort = '';
    this.cruiseType = '';
    this.departureDate = '';
    this.passengers = 2;
    this.maxPrice = undefined;
    this.runSearch();
  }

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
